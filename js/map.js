/**
 * map.js - Self-Contained Geospatial Engine (v25)
 * ------------------------------------------------
 * Loads GeoJSON + CSV in parallel via Promise.all.
 * Zero dependency on main.js lifecycle or State timing.
 * Based exactly on reference_repo/app.js pattern.
 */

'use strict';

let currentFilter = 'OPI';
let mapG = null;
let mapDistricts = []; // local copy, independent of State

const DISTRICT_CSV = './data/uidai_district_model_table.csv';
const GEOJSON_URL  = 'india_district.json'; // served from project root

// ─── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    bootMap();
    setupExpansion();
});

async function bootMap() {
    const container = document.getElementById('india-map');
    if (!container) return;

    // Load GeoJSON + CSV in parallel — no race condition possible
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

    mapDistricts = csvRows.filter(function (r) { return r.district; });
    console.log('[Map] Loaded', india.features.length, 'GeoJSON features +', mapDistricts.length, 'CSV rows');

    renderMap(container, india);
    initFilters();
}

// ─── Render ─────────────────────────────────────────────────────────────────
function renderMap(container, india) {
    const W = 800, H = 600; // fixed logical size — same as reference repo

    d3.select('#india-map').selectAll('svg').remove();

    const svg = d3.select('#india-map')
        .append('svg')
        .attr('width',  '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 ' + W + ' ' + H)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    mapG = svg.append('g');

    const projection = d3.geoMercator().fitSize([W, H], india);
    const path       = d3.geoPath().projection(projection);

    mapG.selectAll('.district-path')
        .data(india.features)
        .enter()
        .append('path')
        .attr('class', 'district-path')
        .attr('d', path)
        .attr('fill',         function (d) { return colorFor(d); })
        .attr('stroke',       '#ffffff')
        .attr('stroke-width', 0.3)
        .style('cursor', 'pointer')
        .on('mouseover', function (event, d) {
            d3.select(this)
                .transition().duration(120)
                .attr('stroke-width', 1.5)
                .attr('stroke', '#fff')
                .style('filter', 'brightness(1.25)');
            showStats(districtName(d).toLowerCase());
        })
        .on('mouseout', function () {
            d3.select(this)
                .transition().duration(200)
                .attr('stroke-width', 0.3)
                .attr('stroke', '#ffffff')
                .style('filter', 'brightness(1)');
            showStats(null);
        })
        .on('click', function (event, d) {
            navigateToDistrict(districtName(d));
        });

    // Zoom (reference repo pattern)
    svg.call(
        d3.zoom()
            .scaleExtent([1, 10])
            .on('zoom', function (event) { mapG.attr('transform', event.transform); })
    );

    console.log('[Map] Rendered', india.features.length, 'district paths.');
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function districtName(d) {
    // GeoJSON uses 'District' (capital D) — verified from file
    return d.properties.District
        || d.properties.district
        || d.properties.dtname
        || d.properties.NAME_2
        || '';
}

function colorFor(d) {
    const name = districtName(d).toLowerCase().trim();
    const row  = mapDistricts.find(function (r) {
        return (r.district || '').toLowerCase().trim() === name;
    });
    if (!row) return '#475569'; // visible grey for no-data districts

    const val = parseFloat(row[currentFilter]) || 0;

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
    d3.selectAll('.district-path')
        .transition().duration(400)
        .attr('fill', function (d) { return colorFor(d); });
}

function showStats(dName) {
    const selEl  = document.getElementById('selected-state');
    const valEl  = document.getElementById('metric-value');
    const lblEl  = document.getElementById('metric-label');
    const priEl  = document.getElementById('priority-level');

    if (!selEl) return;

    if (!dName) {
        selEl.textContent = 'India Hub';
        if (valEl) valEl.textContent = '--';
        if (lblEl) lblEl.textContent = 'Hover a district';
        if (priEl) { priEl.textContent = 'Standard'; priEl.style.color = 'var(--primary)'; }
        return;
    }

    const row = mapDistricts.find(function (r) {
        return (r.district || '').toLowerCase().trim() === dName;
    });
    if (!row) return;

    const labels = {
        'OPI':             'Priority Hub Score',
        'youth_pct':       'Youth Opportunity %',
        'coverage_gap':    'Coverage Gap',
        'log_update_load': 'Update Load (Log)'
    };

    let val      = parseFloat(row[currentFilter]) || 0;
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

    selEl.textContent = row.district;
    if (valEl) valEl.textContent = display;
    if (lblEl) lblEl.textContent = labels[currentFilter] || currentFilter;
    if (priEl) {
        priEl.textContent  = priority;
        priEl.style.color  = priority === 'Critical' ? '#dc2626' : priority === 'High' ? '#f59e0b' : 'var(--primary)';
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
            download:     true,
            header:       true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function (r) { resolve(r.data); },
            error:    function (e) { reject(e); }
        });
    });
}

// ─── Error UI ───────────────────────────────────────────────────────────────
function errorHTML(err) {
    return '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:white;">' +
        '<i class="fa-solid fa-triangle-exclamation fa-2x" style="color:#ef4444"></i>' +
        '<p style="font-weight:700;">Map data unavailable</p>' +
        '<p style="font-size:0.75rem;opacity:0.5;">' + String(err) + '</p>' +
        '</div>';
}

// ─── Compatibility: main.js lifecycle hook (no-op — map is self-contained) ──
window.onDashboardDataLoaded = function () { /* intentionally empty */ };
