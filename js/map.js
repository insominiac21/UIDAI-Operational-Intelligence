/**
 * map.js - D3.js Geospatial Engine (Stabilized v10)
 * -----------------------------------------------
 * Updated for Local Fallback and 100% Reliability.
 */

let Svg, Projection, Path, Zoom, G;
const LOCAL_GEO_JSON = 'data/india_district.json';

const ColorScale = d3.scaleThreshold()
    .domain([25, 50, 75])
    .range(['#3B82F6', '#6366F1', '#8B5CF6', '#C026D3']); // Blue -> Indigo -> Violet -> Magenta

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace('district', '')
        .replace('and', '&')
        .replace('-', '');
}

async function initMapIntel() {
    console.log("Synchronizing Local Geospatial Boundaries...");
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
        .style('z-index', '100')
        .html(`
            <i class="fa-solid fa-satellite-dish fa-spin" style="font-size: 2.5rem; color: var(--primary);"></i>
            <p style="margin-top:12px; font-weight:700; color:var(--text-main);">Calibrating Regional Nodes...</p>
        `);

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

    // Controls
    d3.select('#zoom-in').on('click', () => Svg.transition().call(Zoom.scaleBy, 1.5));
    d3.select('#zoom-out').on('click', () => Svg.transition().call(Zoom.scaleBy, 0.6));
    d3.select('#zoom-reset').on('click', () => Svg.transition().call(Zoom.transform, d3.zoomIdentity));

    try {
        const indiaData = await d3.json(LOCAL_GEO_JSON);
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
                d3.select(this).raise().style('stroke-width', '1.5px').style('filter', 'brightness(1.1)');
            })
            .on('mouseout', function() {
                d3.select(this).style('stroke-width', '0.2px').style('filter', 'none');
            })
            .on('click', (event, d) => {
                const match = matchDistrict(d);
                if (match) navigateToDistrict(match.district);
            });

        console.log("Geospatial Matrix Online (Local Source).");
    } catch (err) {
        console.error("Map Load Critical Failure (Local):", err);
        container.select('#map-loader').html('<p style="color:var(--danger)">Geospatial Load Error. Contact Administrator.</p>');
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
            <h2 style="font-weight:900; margin-bottom:5px; color:var(--text-main);">${data.district}</h2>
            <div style="color:var(--primary); font-weight:800; font-size:0.75rem; margin-bottom:20px; text-transform:uppercase;">
                ${data.state_clean} • SECTOR Node
            </div>

            <div class="kpi-card" style="border-left:5px solid ${ColorScale(data.OPI)}; background:#fff; margin-bottom:20px;">
                <div class="kpi-label">Priority Index</div>
                <div class="kpi-value" style="color:${ColorScale(data.OPI)}">${Math.round(data.OPI)}</div>
            </div>

            <div class="glass-panel" style="background:#fff; padding:1rem; margin-bottom:15px;">
                <div class="kpi-label">Operational Archetype</div>
                <div style="font-weight:700; font-size:1.1rem;">${data.cluster_label}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">${data.cluster_signature}</div>
            </div>

            <div style="background:#f0fdfa; border:1px solid var(--primary); padding:15px; border-radius:12px; margin-bottom:15px;">
                <div class="kpi-label">Tactical Reasoning</div>
                <div style="font-weight:700; font-size:0.9rem; color:var(--primary);">${data.tactical_reason}</div>
            </div>

            <button class="discovery-btn w-full mt-4" style="padding:15px;" onclick="navigateToDistrict('${data.district}')">
                Open Full Strategy Profile <i class="fa-solid fa-arrow-right" style="margin-left:10px;"></i>
            </button>
        </div>
    `);
}

// Global hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
