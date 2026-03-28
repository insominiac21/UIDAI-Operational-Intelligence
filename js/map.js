/**
 * map.js - D3.js Aesthetic Recovery & Stabilization
 * ------------------------------------------------
 * Rebuilt for 100% visibility and Light-Theme Alignment.
 */

let Svg, Projection, Path, Zoom, G;
const INDIA_GEO_URL = 'https://raw.githubusercontent.com/lokesh005/Indian-States-And-Districts-GeoJSON/master/india_district.json';

// Original Scale: Blue -> Purple -> Magenta
const ColorScale = d3.scaleThreshold()
    .domain([25, 50, 75])
    .range(['#3B82F6', '#6366F1', '#8B5CF6', '#C026D3']); 

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace('district', '')
        .replace('and', '&')
        .replace('-', '');
}

async function initMapIntel() {
    console.log("Orchestrating Geospatial Stabilization Hub...");
    const container = d3.select('#map-container');
    const width = container.node().clientWidth || 800;
    const height = container.node().clientHeight || 600;

    // Loading State
    container.append('div')
        .attr('id', 'map-loader')
        .style('position', 'absolute')
        .style('top', '50%')
        .style('left', '50%')
        .style('transform', 'translate(-50%, -50%)')
        .style('text-align', 'center')
        .html('<i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p style="margin-top:10px; font-weight:700;">Synchronizing Regional Boundaries...</p>');

    Svg = d3.select('#map-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    G = Svg.append('g').attr('id', 'map-g');

    Projection = d3.geoMercator();
    Path = d3.geoPath().projection(Projection);

    Zoom = d3.zoom()
        .scaleExtent([1, 15])
        .on('zoom', (event) => G.attr('transform', event.transform));

    Svg.call(Zoom);

    // Zoom Controls
    d3.select('#zoom-in').on('click', () => Svg.transition().duration(300).call(Zoom.scaleBy, 1.5));
    d3.select('#zoom-out').on('click', () => Svg.transition().duration(300).call(Zoom.scaleBy, 0.6));
    d3.select('#zoom-reset').on('click', () => Svg.transition().duration(300).call(Zoom.transform, d3.zoomIdentity));

    try {
        const indiaData = await d3.json(INDIA_GEO_URL);
        container.select('#map-loader').remove();

        // Fit India to Viewport
        Projection.fitSize([width, height], indiaData);

        G.selectAll('.district-path')
            .data(indiaData.features)
            .enter()
            .append('path')
            .attr('d', Path)
            .attr('class', 'district-path')
            .style('fill', d => {
                const match = matchDistrict(d);
                return match ? ColorScale(match.OPI) : '#f1f5f9';
            })
            .style('stroke', '#0F172A')
            .style('stroke-width', '0.2px')
            .on('mouseover', function(event, d) {
                const match = matchDistrict(d);
                if (match) renderSideIntel(match);
                d3.select(this).raise().style('stroke-width', '1.5px');
            })
            .on('mouseout', function() {
                d3.select(this).style('stroke-width', '0.2px');
            })
            .on('click', (event, d) => {
                const match = matchDistrict(d);
                if (match) navigateToDistrict(match.district);
            });

        console.log("Geospatial Matrix Stabilized.");
    } catch (err) {
        console.error("Map Load Critical Failure:", err);
        container.select('#map-loader').html('<p style="color:var(--danger)">Geospatial Load Error. Please check network connection.</p>');
    }
}

function matchDistrict(d) {
    const geoName = normalizeName(d.properties.district || d.properties.dist_name || d.properties.DISTRICT || "");
    return State.districts.find(sd => normalizeName(sd.district) === geoName);
}

function renderSideIntel(data) {
    const panel = d3.select('#map-side-intel');
    
    panel.html(`
        <div class="intel-brief fade-in">
            <h2 style="color:var(--text-main); font-weight:900; margin-bottom:5px;">${data.district}</h2>
            <div style="color:var(--primary); font-weight:800; font-size:0.75rem; margin-bottom:20px; text-transform:uppercase;">
                ${data.state_clean} • Operational Node
            </div>

            <div class="kpi-card" style="border-left:4px solid ${ColorScale(data.OPI)}; margin-bottom:20px;">
                <div class="kpi-label">Priority Index</div>
                <div class="kpi-value" style="color:${ColorScale(data.OPI)}">${Math.round(data.OPI)}</div>
            </div>

            <div class="glass-panel" style="padding:1rem; margin-bottom:15px;">
                <div class="kpi-label">Archetype Intelligence</div>
                <div style="font-weight:700; font-size:1rem;">${data.cluster_label}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">${data.cluster_signature}</div>
            </div>

            <div style="background:#fffbeb; border:1px solid #fde68a; padding:15px; border-radius:10px; margin-bottom:15px;">
                <div class="kpi-label" style="color:#d97706;">Tactical Reason</div>
                <div style="font-weight:700; font-size:0.9rem; color:#92400e;">${data.tactical_reason}</div>
            </div>

            <button class="discovery-btn w-full" style="padding:15px;" onclick="navigateToDistrict('${data.district}')">
                Open Strategy Profile <i class="fa-solid fa-arrow-right" style="margin-left:10px;"></i>
            </button>
        </div>
    `);
}

// Global hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
