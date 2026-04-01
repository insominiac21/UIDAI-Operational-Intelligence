/**
 * map.js - State-Level Geospatial Engine (v26)
 * ---------------------------------------------
 * Uses reference_repo's india-states.json (confirmed working with D3).
 * Aggregates district-level CSV metrics to state level for coloring.
 * Self-contained: loads GeoJSON + CSV in parallel via Promise.all.
 */

'use strict';

let currentFilter  = 'OPI';
let mapG           = null;
let stateMetrics   = {}; // { stateName_lower: { OPI, coverage_gap, youth_pct, log_update_load } }

const DISTRICT_CSV  = './data/uidai_district_model_table.csv';
const GEOJSON_URL   = 'india-states.json'; // reference repo file — confirmed working

// ─── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    bootMap();
    setupExpansion();
});

async function bootMap() {
    const container = document.getElementById('india-map');
    if (!container) return;

    let india, csvRows;
    try {
        [india, csvRows] = await Promise.all([
            d3.json(GEOJSON_URL),
            loadCSVLocal(DISTRICT_CSV)
        ]);
    } catch (err) {
        console.error('[Map] Data load failed:', err);
        container.innerHTML = errorHTML(err);
        return;
    }

    // Aggregate district metrics → state-level averages
    const stateAgg = {};
    csvRows.forEach(function (r) {
        const state = (r.state_clean || '').toLowerCase().trim();
        if (!state) return;
        if (!stateAgg[state]) stateAgg[state] = { count: 0, OPI: 0, coverage_gap: 0, youth_pct: 0, log_update_load: 0 };
        const s = stateAgg[state];
        s.count++;
        s.OPI            += parseFloat(r.OPI) || 0;
        s.coverage_gap   += parseFloat(r.coverage_gap) || 0;
        s.youth_pct      += parseFloat(r.youth_pct) || 0;
        s.log_update_load += parseFloat(r.log_update_load) || 0;
    });

    Object.keys(stateAgg).forEach(function (state) {
        const s = stateAgg[state];
        stateMetrics[state] = {
            OPI:             s.OPI / s.count,
            coverage_gap:    s.coverage_gap / s.count,
            youth_pct:       s.youth_pct / s.count,
            log_update_load: s.log_update_load / s.count
        };
    });

    console.log('[Map] Aggregated', Object.keys(stateMetrics).length, 'states from', csvRows.length, 'district rows');
    console.log('[Map] GeoJSON has', india.features.length, 'state features');
    console.log('[Map] Sample state names (GeoJSON):', india.features.slice(0,3).map(function(f){ return f.properties.ST_NM; }));
    console.log('[Map] Sample state names (CSV):', Object.keys(stateMetrics).slice(0,3));

    renderMap(container, india);
    initFilters();
}

// ─── Render ─────────────────────────────────────────────────────────────────
function renderMap(container, india) {
    const W = 800, H = 600;

    d3.select('#india-map').selectAll('svg').remove();

    const svg = d3.select('#india-map')
        .append('svg')
        .attr('width',  '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 ' + W + ' ' + H)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    mapG = svg.append('g');

    // Exact reference repo projection pattern
    const projection = d3.geoMercator().fitSize([W, H], india);
    const path       = d3.geoPath().projection(projection);

    mapG.selectAll('.state-path')
        .data(india.features)
        .enter()
        .append('path')
        .attr('class', 'district-path state-path')
        .attr('d',     path)
        .attr('fill',         function (d) { return colorFor(d); })
        .attr('stroke',       '#0f172a')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this)
                .transition().duration(150)
                .attr('stroke', '#fff')
                .attr('stroke-width', 3)
                .style('filter', 'brightness(1.3)');
            showStats(d.properties.ST_NM);
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition().duration(200)
                .attr('stroke', '#0f172a')
                .attr('stroke-width', 1.5)
                .style('filter', 'brightness(1)');
            showStats(null);
        });

    // Zoom — reference repo pattern
    svg.call(
        d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', function (event) { mapG.attr('transform', event.transform); })
    );

    console.log('[Map] Rendered', india.features.length, 'state paths.');
}

// ─── Color ──────────────────────────────────────────────────────────────────
function colorFor(d) {
    const stName = (d.properties.ST_NM || '').toLowerCase().trim();
    const data   = stateMetrics[stName];
    if (!data) return '#475569'; // visible grey for no-data states

    const val = data[currentFilter] || 0;

    const scales = {
        'OPI': d3.scaleThreshold()
            .domain([25, 50, 75])
            .range(['#3b82f6', '#6366f1', '#f59e0b', '#dc2626']),
        'coverage_gap': d3.scaleThreshold()
            .domain([0.3, 0.5, 0.7])
            .range(['#10b981', '#f59e0b', '#ef4444', '#dc2626']),
        'youth_pct': d3.scaleThreshold()
            .domain([15, 25, 40])
            .range(['#6366f1', '#8b5cf6', '#a855f7', '#d946ef']),
        'log_update_load': d3.scaleThreshold()
            .domain([2, 3, 4])
            .range(['#3b82f6', '#f59e0b', '#ef4444', '#dc2626'])
    };

    const scale = scales[currentFilter] || scales['OPI'];
    return scale(val);
}

function recolor() {
    if (!mapG) return;
    d3.selectAll('.state-path')
        .transition().duration(400)
        .attr('fill', colorFor);
}

// ─── Stats Panel ────────────────────────────────────────────────────────────
function showStats(stName) {
    const selEl = document.getElementById('selected-state');
    const valEl = document.getElementById('metric-value');
    const lblEl = document.getElementById('metric-label');
    const priEl = document.getElementById('priority-level');
    if (!selEl) return;

    if (!stName) {
        selEl.textContent = 'India Hub';
        if (valEl) valEl.textContent = '--';
        if (lblEl) lblEl.textContent = 'Hover a state';
        if (priEl) { priEl.textContent = 'Standard'; priEl.style.color = 'var(--primary)'; }
        return;
    }

    const key  = stName.toLowerCase().trim();
    const data = stateMetrics[key];

    const labels = {
        'OPI':             'Priority Hub Score (Avg)',
        'youth_pct':       'Youth Opportunity % (Avg)',
        'coverage_gap':    'Coverage Gap (Avg)',
        'log_update_load': 'Update Load (Avg)'
    };

    let val      = data ? (data[currentFilter] || 0) : 0;
    let display  = val.toFixed(1);
    let priority = 'Standard';

    if (currentFilter === 'OPI') {
        if (val > 75) priority = 'Critical';
        else if (val > 50) priority = 'High';
        else if (val > 25) priority = 'Medium';
    } else if (currentFilter === 'coverage_gap') {
        display = (val * 100).toFixed(1) + '%';
        if (val > 0.6) priority = 'Critical';
        else if (val > 0.4) priority = 'High';
        else if (val > 0.2) priority = 'Medium';
    }

    selEl.textContent = stName;
    if (valEl) valEl.textContent = data ? display : '--';
    if (lblEl) lblEl.textContent = labels[currentFilter] || currentFilter;
    if (priEl) {
        priEl.textContent = priority;
        priEl.style.color = priority === 'Critical' ? '#dc2626' : priority === 'High' ? '#f59e0b' : 'var(--primary)';
    }
}

// ─── Filters ────────────────────────────────────────────────────────────────
function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            recolor();
            showStats(null);
        });
    });
}

function setupExpansion() {
    const btn = document.getElementById('zoom-expand');
    if (!btn) return;
    btn.onclick = function () {
        const w = document.getElementById('map-wrapper-main');
        if (document.fullscreenElement) document.exitFullscreen();
        else if (w) w.requestFullscreen();
    };
}

// ─── CSV Loader ─────────────────────────────────────────────────────────────
function loadCSVLocal(url) {
    return new Promise(function (resolve, reject) {
        Papa.parse(url, {
            download:        true,
            header:          true,
            dynamicTyping:   true,
            skipEmptyLines:  true,
            complete:  function (r) { resolve(r.data); },
            error:     function (e) { reject(e); }
        });
    });
}

function errorHTML(err) {
    return '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:white;">' +
        '<i class="fa-solid fa-triangle-exclamation fa-2x" style="color:#ef4444"></i>' +
        '<p style="font-weight:700;">Map data unavailable</p>' +
        '<p style="font-size:0.75rem;opacity:0.5;">' + String(err) + '</p></div>';
}

// Compatibility stub
window.onDashboardDataLoaded = function () {};
