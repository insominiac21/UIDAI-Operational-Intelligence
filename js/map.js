/**
 * map.js - D3.js High-Performance Geospatial Engine (v12)
 * -----------------------------------------------------
 * Source: maneetgoyal Gist (2MB Simplified)
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
    console.log("Synchronizing Performance-Optimized Boundaries...");
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
            <p style="margin-top:12px; font-weight:700; color:var(--text-main);">Optimizing Regional Visualization...</p>
        `);

    Svg = d3.select('#map-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    G = Svg.append('g').attr('id', 'map-g');

    Projection = d3.geoMercator();
    Path = d3.geoPath().projection(Projection);

    Zoom = d3.zoom()
        .scaleExtent([1, 20])
        .on('zoom', (event) => G.attr('transform', event.transform));

    Svg.call(Zoom);

    // Expansion Control logic (Browser Fullscreen API)
    d3.select('#zoom-expand').on('click', () => toggleFullscreen());

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
            .style('transition', 'fill 0.2s')
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

        console.log("Geospatial Matrix Online (Simplified Source).");
    } catch (err) {
        console.error("Map Load Failure (Optimized):", err);
        container.select('#map-loader').html('<p style="color:var(--danger)">Performance Load Error. Data corrupted.</p>');
    }
}

function toggleFullscreen() {
    const elem = document.getElementById('map-wrapper-main');
    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
        document.getElementById('zoom-expand').innerHTML = '<i class="fa-solid fa-compress"></i>';
    } else {
        document.exitFullscreen();
        document.getElementById('zoom-expand').innerHTML = '<i class="fa-solid fa-expand"></i>';
    }
}

function matchDistrict(d) {
    // Handling property names from manejgoyal source: 'District', 'STATE'
    const geoName = normalizeName(d.properties.District || d.properties.DISTRICT || "");
    const geoState = normalizeName(d.properties.STATE || d.properties.state || "");
    
    return State.districts.find(sd => 
        normalizeName(sd.district) === geoName && 
        normalizeName(sd.state_clean) === geoState
    );
}

function renderSideIntel(data) {
    const panel = d3.select('#map-intel-panel');
    
    // UI logic for Lack of Data notice (BOLD RED)
    const hasData = data.OPI > 0;
    const dataNotice = hasData ? '' : '<div style="background:#fef2f2; color:#dc2626; padding:12px; border-radius:12px; font-size:0.8rem; font-weight:900; margin-bottom:20px; border:2px solid #dc2626; text-transform:uppercase;"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL DATA DISCLAIMER: DIVERGENCE DUE TO LACK OF AVAILABLE DATA</div>';

    panel.html(`
        <div class="intel-brief fade-in">
            <h2 style="font-weight:900; margin-bottom:5px; color:var(--text-main); font-size:1.75rem;">${data.district}</h2>
            <div style="color:var(--primary); font-weight:800; font-size:0.8rem; margin-bottom:20px; text-transform:uppercase; letter-spacing:1px;">
                ${data.state_clean} • SECTOR CLUSTER
            </div>

            ${dataNotice}

            <div class="kpi-card" style="border-left:5px solid ${ColorScale(data.OPI)}; background:#fff; margin-bottom:25px; box-shadow:var(--shadow-soft);">
                <div class="kpi-label">Operational Priority Index</div>
                <div class="kpi-value" style="color:${ColorScale(data.OPI)}">${Math.round(data.OPI)}</div>
            </div>

            <div class="glass-panel" style="background:#fff; padding:1.25rem; margin-bottom:20px; cursor:pointer; border:1px solid var(--border);" onclick="window.location.href='clusters.html#${encodeURIComponent(data.cluster_label)}'">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div class="kpi-label">Intelligence Archetype</div>
                        <div style="font-weight:800; font-size:1.1rem; color:var(--text-main);">${data.cluster_label}</div>
                    </div>
                    <i class="fa-solid fa-square-poll-vertical" style="opacity:0.3; font-size:1.2rem;"></i>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:5px; line-height:1.4;">${data.cluster_signature}</div>
            </div>

            <div style="background:#f0fdfa; border:1px solid var(--primary); padding:18px; border-radius:16px; margin-bottom:20px;">
                <div class="kpi-label">Tactical Logistics Reasoning</div>
                <div style="font-weight:700; font-size:0.9rem; color:var(--primary); line-height:1.5;">${data.tactical_reason}</div>
            </div>

            <button class="discovery-btn w-full mt-4" style="padding:18px; font-weight:900; letter-spacing:1px;" onclick="navigateToDistrict('${data.district}')">
                ACTIVATE NODE STRATEGY <i class="fa-solid fa-chevron-right" style="margin-left:12px;"></i>
            </button>
        </div>
    `);
}

// Global hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
