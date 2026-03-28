/**
 * map.js - Premium D3.js Geospatial Engine
 * Implements SVG-based framing, threshold scales, and smooth transitions.
 */

let Svg, Projection, Path, Zoom;
const INDIA_JSON = 'https://raw.githubusercontent.com/lokesh005/Indian-States-And-Districts-GeoJSON/master/india_district.json';

const ColorScale = {
    domain: [25, 50, 75],
    range: ['#0d9488', '#06b6d4', '#8b5cf6', '#d946ef'] // Teal -> Cyan -> Purple -> Magenta
};

function getTierColor(val) {
    if (val > ColorScale.domain[2]) return ColorScale.range[3];
    if (val > ColorScale.domain[1]) return ColorScale.range[2];
    if (val > ColorScale.domain[0]) return ColorScale.range[1];
    return ColorScale.range[0];
}

function normalizeName(name) {
    if (!name) return "";
    return name.toLowerCase().replace(' district', '').replace(/\s+/g, '').trim();
}

async function initMapIntel() {
    const container = document.getElementById('map-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    Svg = d3.select('#map-svg')
        .attr('width', width)
        .attr('height', height);

    const g = Svg.append('g').attr('id', 'map-g');

    Projection = d3.geoMercator();
    Path = d3.geoPath().projection(Projection);

    // Zoom setup
    Zoom = d3.zoom()
        .scaleExtent([1, 12])
        .on('zoom', (event) => g.attr('transform', event.transform));

    Svg.call(Zoom);

    // Zoom Controls
    d3.select('#zoom-in').on('click', () => Svg.transition().call(Zoom.scaleBy, 1.5));
    d3.select('#zoom-out').on('click', () => Svg.transition().call(Zoom.scaleBy, 0.6));
    d3.select('#zoom-reset').on('click', () => Svg.transition().call(Zoom.transform, d3.zoomIdentity));

    try {
        console.log("Fetching Master Geospatial Boundaries...");
        const india = await d3.json(INDIA_JSON);
        
        // Auto-frame India
        Projection.fitSize([width, height], india);

        g.selectAll('.district-path')
            .data(india.features)
            .enter()
            .append('path')
            .attr('d', Path)
            .attr('class', 'district-path')
            .style('fill', d => {
                const data = matchDistrict(d);
                return data ? getTierColor(data.OPI) : '#0f172a';
            })
            .on('mouseover', function(event, d) {
                const data = matchDistrict(d);
                if (data) renderSideIntel(data);
                d3.select(this).raise(); // Bring to front
            })
            .on('click', (event, d) => {
                const data = matchDistrict(d);
                if (data) navigateToDistrict(data.district);
            });

        console.log("Geospatial Hub Synchronized.");
    } catch (err) {
        console.error("D3 Hub Error:", err);
    }
}

function matchDistrict(d) {
    const dName = d.properties.district || d.properties.dist_name || "";
    const cleanGeoName = normalizeName(dName);

    return State.districts.find(sd => {
        const cleanDataName = normalizeName(sd.district);
        return cleanDataName === cleanGeoName;
    });
}

function renderSideIntel(data) {
    const panel = document.getElementById('map-side-intel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="intel-brief fade-in">
            <h2 style="font-size: 1.8rem; line-height: 1.1; margin-bottom: 5px;">${capitalize(data.district)}</h2>
            <p style="color:var(--primary); font-weight: 700; margin-bottom: 20px;">${capitalize(data.state_clean)} • REGIONAL NODE</p>
            
            <div class="opi-hero" style="background:${getTierColor(data.OPI)}; border-radius: 1rem; padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <div>
                    <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Priority Index</div>
                    <div style="font-size: 2.5rem; font-weight: 900;">${Math.round(data.OPI)}</div>
                </div>
                <div style="font-size: 1.5rem; opacity: 0.5;"><i class="fa-solid fa-bolt-lightning"></i></div>
            </div>

            <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 1rem; padding: 20px;">
                <div style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 15px;">Operational Archetype</div>
                <div style="font-size: 1.1rem; font-weight: 700; color: var(--dark); margin-bottom: 5px;">${data.cluster_label}</div>
                <div style="font-size: 0.85rem; opacity: 0.7;">${data.cluster_signature}</div>
            </div>

            <div class="reason-box" style="margin-top: 20px; padding: 15px; background: #fff7ed; border-radius: 0.75rem; border-left: 4px solid #f97316;">
                <strong style="color: #c2410c; font-size: 0.8rem;">TACTICAL REASON:</strong><br>
                <span style="font-weight: 600; font-size: 0.95rem;">${data.tactical_reason}</span>
            </div>

            <div class="mini-metrics" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px;">
                <div class="mini-stat-card" style="background: white; border: 1px solid var(--border); padding: 12px; border-radius: 0.75rem;">
                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">GAP</div>
                    <div style="font-size: 1.2rem; font-weight: 800;">${(data.coverage_gap * 100).toFixed(1)}%</div>
                </div>
                <div class="mini-stat-card" style="background: white; border: 1px solid var(--border); padding: 12px; border-radius: 0.75rem;">
                    <div style="font-size: 0.6rem; color: #64748b; font-weight: 800; text-transform: uppercase;">YOUTH</div>
                    <div style="font-size: 1.2rem; font-weight: 800;">${data.youth_pct.toFixed(0)}%</div>
                </div>
            </div>

            <button class="map-btn w-full mt-5" style="padding: 1rem; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(13, 148, 136, 0.2);" onclick="navigateToDistrict('${data.district}')">
                Open Deep-Intelligence Hub <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
            </button>
        </div>
    `;
}

// Global hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
