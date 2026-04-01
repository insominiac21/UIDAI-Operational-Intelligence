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
let nationalAvg    = {}; // national averages per metric
let quantileScales = {}; // data-driven color scales

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

    // Compute national averages
    const allMetrics = ['OPI', 'coverage_gap', 'youth_pct', 'log_update_load'];
    allMetrics.forEach(function (m) {
        const vals = Object.values(stateMetrics).map(function (s) { return s[m]; }).filter(function(v){ return v > 0; });
        nationalAvg[m] = vals.length ? vals.reduce(function(a,b){return a+b;},0) / vals.length : 0;
    });

    // Build data-driven quantile thresholds for richer colors
    allMetrics.forEach(function (m) {
        const vals = Object.values(stateMetrics).map(function (s) { return s[m]; }).filter(function(v){ return v > 0; }).sort(function(a,b){return a-b;});
        const q = function(p) { return vals[Math.floor(p * (vals.length - 1))]; };
        quantileScales[m] = d3.scaleThreshold()
            .domain([q(0.25), q(0.5), q(0.75)])
            .range(['#3b82f6', '#6366f1', '#f59e0b', '#dc2626']);
    });
    // Coverage gap gets a green→red scale
    const cvVals = Object.values(stateMetrics).map(function(s){return s.coverage_gap;}).filter(function(v){return v>0;}).sort(function(a,b){return a-b;});
    const qCv = function(p) { return cvVals[Math.floor(p*(cvVals.length-1))]; };
    quantileScales['coverage_gap'] = d3.scaleThreshold()
        .domain([qCv(0.25), qCv(0.5), qCv(0.75)])
        .range(['#10b981', '#f59e0b', '#ef4444', '#dc2626']);

    updateNationalAvgDisplay();
    updateLegend();

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
    if (!data) return '#475569';

    const scale = quantileScales[currentFilter];
    return scale ? scale(data[currentFilter] || 0) : '#475569';
}

function recolor() {
    if (!mapG) return;
    d3.selectAll('.state-path')
        .transition().duration(400)
        .attr('fill', colorFor);
    updateNationalAvgDisplay();
}

function updateNationalAvgDisplay() {
    const avgEl  = document.getElementById('national-avg-value');
    const lblEl  = document.getElementById('national-avg-label');
    if (!avgEl || !nationalAvg[currentFilter] == null) return;

    const labels = {
        'OPI':             'National Avg OPI',
        'youth_pct':       'National Avg Youth %',
        'coverage_gap':    'National Avg Gap',
        'log_update_load': 'National Avg Load'
    };

    let val = nationalAvg[currentFilter] || 0;
    let display = currentFilter === 'coverage_gap' ? (val * 100).toFixed(1) + '%' : val.toFixed(1);
    avgEl.textContent = display;
    if (lblEl) lblEl.textContent = labels[currentFilter] || 'National Avg';
}

function updateLegend() {
    const el = document.getElementById('map-legend');
    if (!el) return;
    const scale = quantileScales[currentFilter];
    if (!scale) return;

    const isCov = currentFilter === 'coverage_gap';
    const fmt   = function (v) { return isCov ? (v * 100).toFixed(0) + '%' : parseFloat(v).toFixed(1); };
    const domain = scale.domain();  // [Q25, Q50, Q75]
    const range  = scale.range();   // 4 colors

    const labelMap = {
        'OPI':             ['Low Priority', 'Moderate', 'High', 'Critical'],
        'youth_pct':       ['Low Youth',    'Moderate', 'High Youth', 'Extreme'],
        'coverage_gap':    ['Well Covered', 'Moderate Gap', 'High Gap', 'Critical'],
        'log_update_load': ['Low Load',     'Moderate', 'High Load', 'Peak']
    };
    const lbl = labelMap[currentFilter] || ['Low', 'Medium', 'High', 'Critical'];

    const bounds = [
        { color: range[0], label: lbl[0], range: '< '      + fmt(domain[0]) },
        { color: range[1], label: lbl[1], range: fmt(domain[0]) + ' \u2013 ' + fmt(domain[1]) },
        { color: range[2], label: lbl[2], range: fmt(domain[1]) + ' \u2013 ' + fmt(domain[2]) },
        { color: range[3], label: lbl[3], range: '> '      + fmt(domain[2]) }
    ];

    const header = '<div style="font-size:0.6rem;font-weight:800;opacity:0.6;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Legend</div>';
    el.innerHTML = header + bounds.map(function (b) {
        return '<div class="legend-item" style="margin-bottom:5px;">' +
            '<div class="legend-color" style="background:' + b.color + ';border-radius:3px;"></div>' +
            '<div><div style="font-size:0.68rem;font-weight:700;">' + b.label + '</div>' +
            '<div style="font-size:0.58rem;opacity:0.65;">' + b.range + '</div></div></div>';
    }).join('');
}

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

    // vs national avg badge
    const vsEl = document.getElementById('vs-national');
    if (vsEl && data && nationalAvg[currentFilter]) {
        const diff = val - nationalAvg[currentFilter];
        const pct  = ((diff / nationalAvg[currentFilter]) * 100).toFixed(1);
        const arrow = diff >= 0 ? '▲' : '▼';
        const color = diff >= 0 ? '#dc2626' : '#10b981';
        vsEl.style.display = 'block';
        vsEl.style.color   = color;
        vsEl.textContent   = arrow + ' ' + Math.abs(parseFloat(pct)) + '% vs national avg (' + (nationalAvg[currentFilter] || 0).toFixed(1) + ')';
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
            updateLegend();
            showStats(null);
            const vsEl = document.getElementById('vs-national');
            if (vsEl) vsEl.style.display = 'none';
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
