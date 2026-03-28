/**
 * map.js - D3.js Premium Geospatial Engine
 * ---------------------------------------
 * Rebuilt for 100% reliability and High-Density Aesthetics.
 */

let Svg, Projection, Path, Zoom, G;
const INDIA_JSON_SRCS = [
    'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/district/india_district.json',
    'https://raw.githubusercontent.com/lokesh005/Indian-States-And-Districts-GeoJSON/master/india_district.json'
];

const ColorScale = d3.scaleThreshold()
    .domain([25, 50, 75])
    .range(['#0d9488', '#06b6d4', '#8b5cf6', '#d946ef']); // Teal -> Cyan -> Purple -> Magenta

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase().trim()
        .replace(/\s+/g, '')
        .replace('district', '')
        .replace('and', '&')
        .replace('-', '');
}

async function initMapIntel() {
    console.log("Initializing Geospatial Intelligence Hub...");
    const container = d3.select('#map-container');
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;

    // Show Loading Overlay
    container.append('div')
        .attr('id', 'map-loader')
        .attr('class', 'intel-placeholder')
        .html('<i class="fa-solid fa-gear fa-spin" style="font-size: 2rem; color: var(--primary);"></i><p>Synchronizing Regional Nodes...</p>');

    Svg = d3.select('#map-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    G = Svg.append('g');

    Projection = d3.geoMercator();
    Path = d3.geoPath().projection(Projection);

    // Zoom kinetics
    Zoom = d3.zoom()
        .scaleExtent([1, 15])
        .on('zoom', (event) => G.attr('transform', event.transform));

    Svg.call(Zoom);

    // Controls
    d3.select('#zoom-in').on('click', () => Svg.transition().duration(400).call(Zoom.scaleBy, 1.6));
    d3.select('#zoom-out').on('click', () => Svg.transition().duration(400).call(Zoom.scaleBy, 0.6));
    d3.select('#zoom-reset').on('click', () => Svg.transition().duration(400).call(Zoom.transform, d3.zoomIdentity));

    // Try multiple sources for resilience
    let indiaData = null;
    for (const src of INDIA_JSON_SRCS) {
        try {
            indiaData = await d3.json(src);
            if (indiaData) break;
        } catch (e) {
            console.warn(`Source failed: ${src}`);
        }
    }

    if (!indiaData) {
        container.select('#map-loader').html('<p style="color:var(--danger)">Geospatial Fetch Failure. Check connection.</p>');
        return;
    }

    // Remove Loader
    container.select('#map-loader').remove();

    // Auto-fit India
    Projection.fitSize([width, height], indiaData);

    // Render Districts
    G.selectAll('.district-path')
        .data(indiaData.features)
        .enter()
        .append('path')
        .attr('d', Path)
        .attr('class', 'district-path')
        .style('fill', d => {
            const match = matchDistrict(d);
            return match ? ColorScale(match.OPI) : 'rgba(255, 255, 255, 0.05)';
        })
        .style('stroke', 'rgba(255, 255, 255, 0.1)')
        .style('stroke-width', '0.5px')
        .on('mouseover', function(event, d) {
            const match = matchDistrict(d);
            if (match) renderSideIntel(match);
            d3.select(this).raise().transition().duration(200).style('stroke-opacity', 1);
        })
        .on('click', (event, d) => {
            const match = matchDistrict(d);
            if (match) navigateToDistrict(match.district);
        });

    console.log("Geospatial Matrix Online.");
}

function matchDistrict(d) {
    const geoName = normalizeName(d.properties.district || d.properties.dist_name || d.properties.DISTRICT || "");
    return State.districts.find(sd => normalizeName(sd.district) === geoName);
}

function renderSideIntel(data) {
    const panel = d3.select('#map-side-intel');
    
    panel.html(`
        <div class="intel-brief fade-in">
            <h2 style="font-size: 2.2rem; font-weight: 900; margin-bottom: 5px;">${data.district.toUpperCase()}</h2>
            <div style="color: var(--primary); font-weight: 800; font-size: 0.8rem; margin-bottom: 25px; letter-spacing: 1px;">
                ${data.state_clean.toUpperCase()} • TACTICAL SECTOR
            </div>

            <div class="kpi-card kpi-card-hero" style="border-radius: 1.5rem; margin-bottom: 25px; padding: 1.5rem;">
                <div class="kpi-label">Priority Index (OPI)</div>
                <div class="kpi-value" style="color: ${ColorScale(data.OPI)}">${Math.round(data.OPI)}</div>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 1.25rem; padding: 1.5rem;">
                <div class="kpi-label">Operational Archetype</div>
                <div style="font-weight: 700; font-size: 1.1rem; margin-bottom: 8px;">${data.cluster_label}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted);">${data.cluster_signature}</div>
            </div>

            <div style="margin-top: 20px; background: rgba(6, 182, 212, 0.1); border: 1px solid var(--primary); border-radius: 1rem; padding: 1.25rem;">
                <div class="kpi-label" style="color: var(--primary)">Tactical Reasoning</div>
                <div style="font-weight: 600; font-size: 1rem;">${data.tactical_reason}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 20px;">
                <div class="glass-panel" style="padding: 1rem; text-align: center;">
                    <div class="kpi-label">Deficit</div>
                    <div style="font-weight: 900; font-size: 1.4rem;">${(data.coverage_gap * 100).toFixed(1)}%</div>
                </div>
                <div class="glass-panel" style="padding: 1rem; text-align: center;">
                    <div class="kpi-label">Youth %</div>
                    <div style="font-weight: 900; font-size: 1.4rem;">${data.youth_pct.toFixed(0)}%</div>
                </div>
            </div>

            <button class="discovery-btn w-full mt-4" style="padding: 1.25rem;" onclick="navigateToDistrict('${data.district}')">
                DETAILED STRATEGY HUB <i class="fa-solid fa-arrow-right-long" style="margin-left: 10px;"></i>
            </button>
        </div>
    `);
}

// Global data hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
