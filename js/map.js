/**
 * map.js - Geospatial Engine v24 (Reference Parity)
 * --------------------------------------------------
 * Mirrors the reference_repo/app.js .then() pattern exactly.
 * GeoJSON served from project ROOT to bypass Vercel routing rewrites.
 * Data is joined inside the .then() callback — zero race conditions.
 */

let currentFilter = 'OPI';
let mapG = null; // Global ref for filter updates (ref repo pattern)

/**
 * Primary Map Init — mirrors reference repo's initIndiaMap exactly.
 * Uses .then() so the map only renders AFTER GeoJSON is fully parsed.
 */
function initIndiaMap() {
    const container = document.getElementById('india-map');
    if (!container) return;

    // Use fixed dimensions — reference repo pattern.
    // clientWidth/clientHeight is unreliable before flex layout settles
    // and causes fitSize() to produce degenerate projections where every
    // district fills the entire SVG container.
    const width = 800;
    const height = 600;

    // Reset SVG (clean slate on re-init)
    d3.select('#india-map').selectAll('svg').remove();

    const svg = d3.select('#india-map')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    window.mapSvg = svg;
    mapG = svg.append('g');

    // ROOT-LEVEL fetch (mirrors reference repo — bypasses Vercel routing)
    d3.json('india_district.json').then(function(india) {
        window.indiaGeoJSON = india; // Save for filter updates

        const projection = d3.geoMercator().fitSize([width, height], india);
        window.mapProjection = projection;
        const path = d3.geoPath().projection(projection);

        // Join GeoJSON features with CSV data and draw paths
        mapG.selectAll('.district-path')
            .data(india.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'district-path')
            .attr('fill', function(d) { return getColorForDistrict(d, currentFilter); })
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                const dName = getDistrictName(d).toLowerCase();
                d3.select(this)
                    .transition().duration(150)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('filter', 'brightness(1.2)');
                updateMapStats(dName);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition().duration(200)
                    .attr('stroke', '#0f172a')
                    .attr('stroke-width', 0.5)
                    .style('filter', 'brightness(1)');
                updateMapStats('India');
            })
            .on('click', function(event, d) {
                const dName = getDistrictName(d);
                navigateToDistrict(dName);
            });

        // Zoom (ref repo pattern)
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on('zoom', function(event) {
                mapG.attr('transform', event.transform);
            });

        svg.call(zoom);

        console.log('Geospatial Hub: ' + india.features.length + ' district nodes rendered.');

    }).catch(function(error) {
        console.error('Geospatial Engine: GeoJSON load failed —', error);
        container.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;color:white;">
                <i class="fa-solid fa-triangle-exclamation fa-2x" style="color:#ef4444"></i>
                <p style="font-weight:700;">Map data unavailable</p>
                <p style="font-size:0.75rem;opacity:0.5;">india_district.json not found at root</p>
            </div>`;
    });
}

/**
 * Resolve district name from GeoJSON feature properties.
 * GeoJSON uses 'District' (capital D) — verified from india_district.json.
 */
function getDistrictName(d) {
    return d.properties.District    // ← actual key in our GeoJSON
        || d.properties.district
        || d.properties.DISTRICT
        || d.properties.dtname
        || d.properties.NAME_2
        || '';
}

/**
 * Color scaling — threshold-based, mirrors reference repo pattern.
 */
function getColorForDistrict(d, filter) {
    const dName = getDistrictName(d).toLowerCase();
    const csvData = State.districts.find(function(sd) {
        return (sd.district || '').toLowerCase() === dName;
    });
    if (!csvData) return '#1e293b'; // Dark slate for unmatched districts

    const val = parseFloat(csvData[filter]) || 0;

    let colorScale;
    if (filter === 'OPI') {
        colorScale = d3.scaleThreshold()
            .domain([25, 50, 75])
            .range(['#3b82f6', '#8b5cf6', '#f59e0b', '#dc2626']);
    } else if (filter === 'coverage_gap') {
        colorScale = d3.scaleThreshold()
            .domain([0.3, 0.5, 0.7])
            .range(['#10b981', '#f59e0b', '#ef4444', '#dc2626']);
    } else if (filter === 'youth_pct') {
        colorScale = d3.scaleThreshold()
            .domain([15, 25, 40])
            .range(['#6366f1', '#8b5cf6', '#a855f7', '#d946ef']);
    } else {
        colorScale = d3.scaleThreshold()
            .domain([2, 3, 4])
            .range(['#3b82f6', '#f59e0b', '#ef4444', '#dc2626']);
    }

    return colorScale(val);
}

/**
 * Update filter colors — mirrors reference repo's updateMapColors()
 */
function updateMapColors() {
    d3.selectAll('.district-path')
        .transition().duration(500)
        .attr('fill', function(d) { return getColorForDistrict(d, currentFilter); });
    updateMapStats('India');
}

/**
 * Side panel telemetry update
 */
function updateMapStats(dName) {
    if (dName === 'India') {
        document.getElementById('selected-state').textContent = 'India Hub';
        if (document.getElementById('metric-value')) document.getElementById('metric-value').textContent = '--';
        if (document.getElementById('metric-label')) document.getElementById('metric-label').textContent = 'Hover a district';
        document.getElementById('priority-level').textContent = 'Standard';
        document.getElementById('priority-level').style.color = 'var(--primary)';
        return;
    }

    const csvData = State.districts.find(function(sd) {
        return (sd.district || '').toLowerCase() === dName;
    });
    if (!csvData) return;

    const labels = {
        'OPI': 'Priority Hub Score',
        'youth_pct': 'Youth Opportunity %',
        'coverage_gap': 'Coverage Gap',
        'log_update_load': 'Update Load (Log)'
    };

    let val = parseFloat(csvData[currentFilter]) || 0;
    let displayVal = val.toFixed(1);
    let priority = 'Standard';

    if (currentFilter === 'OPI') {
        if (val > 75) priority = 'Critical';
        else if (val > 50) priority = 'High';
        else if (val > 25) priority = 'Medium';
    } else if (currentFilter === 'coverage_gap') {
        displayVal = (val * 100).toFixed(1) + '%';
        if (val > 0.6) priority = 'Critical';
        else if (val > 0.4) priority = 'High';
        else if (val > 0.2) priority = 'Medium';
    }

    document.getElementById('selected-state').textContent = csvData.district;
    if (document.getElementById('metric-value')) document.getElementById('metric-value').textContent = displayVal;
    if (document.getElementById('metric-label')) document.getElementById('metric-label').textContent = labels[currentFilter] || currentFilter;
    document.getElementById('priority-level').textContent = priority;

    const color = priority === 'Critical' ? '#dc2626' : priority === 'High' ? '#f59e0b' : 'var(--primary)';
    document.getElementById('priority-level').style.color = color;
}

/**
 * Filter button binding
 */
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterButtons.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            updateMapColors();
        });
    });
}

function setupExpansion() {
    const expandBtn = document.getElementById('zoom-expand');
    if (!expandBtn) return;
    expandBtn.onclick = function() {
        const wrapper = document.getElementById('map-wrapper-main');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            wrapper.requestFullscreen();
        }
    };
}


// -------------------------------------------------------
// Lifecycle (Reference Parity):
// 1. Geometry draws immediately on DOMContentLoaded (no CSV dependency)
// 2. Colors + filters apply once CSV data is ready
// -------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    initIndiaMap();   // draw shapes immediately — neutral fill until data arrives
    setupExpansion();
});

// Called by main.js after CSV loads — recolors existing paths, no re-render
window.onDashboardDataLoaded = function() {
    updateMapColors();
    initFilters();
};

