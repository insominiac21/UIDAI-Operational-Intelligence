/**
 * map.js - Absolute Engine Restoration (v19)
 * -----------------------------------------
 * Ported directly from reference_repo/app.js aesthetic.
 * Adapted for 700+ District Nodes & Dynamic CSV Joins.
 */

let currentFilter = 'OPI'; 

/**
 * Restoration Init
 */
async function initIndiaMap() {
    const container = document.getElementById('india-map');
    if (!container) return;

    const width = container.clientWidth;
    const height = 600;

    // Reset SVG
    d3.select('#india-map').selectAll('svg').remove();
    const svg = d3.select('#india-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g');

    try {
        console.log("Restoring Geospatial Engine from Reference Source...");
        const india = await d3.json('./data/india_district.json');
        
        // Exact Parity: d3.geoMercator().fitSize()
        const projection = d3.geoMercator().fitSize([width, height], india);
        const path = d3.geoPath().projection(projection);

        // Render District Nodes
        g.selectAll('.district-path')
            .data(india.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'district-path')
            .attr('fill', d => getColorForDistrict(d, currentFilter))
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', function (event, d) {
                const dName = (d.properties.district || d.properties.DISTRICT || d.properties.dtname || "").toLowerCase();
                d3.select(this)
                    .transition().duration(200)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2)
                    .style('filter', 'brightness(1.2)');

                updateMapStats(dName);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .transition().duration(200)
                    .attr('stroke', '#0f172a')
                    .attr('stroke-width', 0.5)
                    .style('filter', 'brightness(1)');

                updateMapStats('India');
            })
            .on('click', function (event, d) {
                const dName = (d.properties.district || d.properties.DISTRICT || d.properties.dtname || "");
                navigateToDistrict(dName);
            });

        // Exact Parity: Zoom Behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 8])
            .on('zoom', (event) => g.attr('transform', event.transform));
        
        svg.call(zoom);

    } catch (error) {
        console.error("Geospatial Restoration Failure:", error);
    }
}

/**
 * Exact Parity: Dynamic Color Scaling
 */
function getColorForDistrict(d, filter) {
    const props = d.properties;
    const dName = (props.district || props.DISTRICT || props.dtname || "").toLowerCase();
    
    // Join with State data in memory (Fixes 404 issues)
    const csvData = State.districts.find(sd => (sd.district || "").toLowerCase() === dName);
    if (!csvData) return '#cbd5e1'; // Missing Data Light Grey

    const val = parseFloat(csvData[filter]) || 0;
    if (val === 0) return '#cbd5e1';

    let colorScale;
    if (filter === 'OPI') {
        colorScale = d3.scaleThreshold()
            .domain([25, 50, 75])
            .range(['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef']); // Vibrant Spectrum
    } else if (filter === 'coverage_gap') {
        colorScale = d3.scaleThreshold()
            .domain([0.3, 0.5, 0.7])
            .range(['#10b981', '#f59e0b', '#ef4444', '#dc2626']); // Risk Intensity
    } else {
        colorScale = d3.scaleThreshold()
            .domain([15, 25, 40])
            .range(['#3b82f6', '#8b5cf6', '#a855f7', '#c026d3']); // General Metric
    }

    return colorScale(val);
}

/**
 * Exact Parity: Map Stats Panel Updates
 */
function updateMapStats(dName) {
    if (dName === 'India') {
        document.getElementById('selected-state').textContent = 'India Hub';
        document.getElementById('metric-value').textContent = '--';
        document.getElementById('metric-label').textContent = 'Select Node';
        document.getElementById('priority-level').textContent = 'Standard';
        document.getElementById('priority-level').style.color = 'var(--primary)';
        return;
    }

    const csvData = State.districts.find(sd => (sd.district || "").toLowerCase() === dName);
    if (!csvData) return;

    let priority = 'Standard';
    let val = parseFloat(csvData[currentFilter]) || 0;
    let label = currentFilter.replace('_', ' ').toUpperCase();
    let displayVal = val.toFixed(1);

    if (currentFilter === 'OPI') {
        if (val > 75) priority = 'Critical';
        else if (val > 50) priority = 'High';
        else if (val > 25) priority = 'Medium';
    } else if (currentFilter === 'coverage_gap') {
        displayVal = (val * 100).toFixed(1) + '%';
        if (val > 0.6) priority = 'Critical';
        else if (val > 0.4) priority = 'High';
    }

    document.getElementById('selected-state').textContent = csvData.district;
    document.getElementById('metric-value').textContent = displayVal;
    document.getElementById('metric-label').textContent = label;
    document.getElementById('priority-level').textContent = priority;

    // Aesthetic Priority Color Mapping
    const color = (priority === 'Critical') ? '#dc2626' : (priority === 'High' ? '#f59e0b' : 'var(--primary)');
    document.getElementById('priority-level').style.color = color;

    // Trigger Animations
    document.querySelectorAll('.stat-card').forEach(card => {
        card.style.animation = 'none';
        setTimeout(() => card.style.animation = 'fadeInUp 0.5s ease-out', 10);
    });
}

/**
 * Filter Control Initialization
 */
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            
            // Re-render map colors
            d3.selectAll('.district-path')
                .transition().duration(500)
                .attr('fill', d => getColorForDistrict(d, currentFilter));
            
            updateMapStats('India');
        });
    });
}

/**
 * Fullscreen Expansion (Restored from Scratch)
 */
function setupExpansion() {
    const expandBtn = document.getElementById('zoom-expand');
    if (!expandBtn) return;
    
    expandBtn.onclick = () => {
        const wrapper = document.getElementById('map-wrapper-main');
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            wrapper.requestFullscreen();
        }
    };
}

// Hook into the dynamic data load event
window.onDashboardDataLoaded = () => {
    initIndiaMap();
    initFilters();
    setupExpansion();
};
