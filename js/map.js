/**
 * map.js - Unified Geospatial Engine (v18 Restoration)
 * ---------------------------------------------------
 * Absolute Parity with Reference Repository 'app.js' logic.
 * Uses unified 'district_intelligence.json' for maximum performance.
 */

const MAP_CONFIG = {
    GEO_JSON: './data/district_intelligence.json', // Synthesized unified data
    TRANSITION: 200
};

let currentFilter = 'OPI';

/**
 * Hub Initialization (Restored from Scratch)
 */
async function initMapIntel() {
    const container = document.getElementById('map-container');
    const svg = d3.select('#map-svg');
    if (!container || !svg.node()) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    try {
        console.log("Synthesizing Unified Geospatial Engine (Ref Parity)...");
        const india = await d3.json(MAP_CONFIG.GEO_JSON);
        
        // RECONSTRUCTED: d3.geoMercator().fitSize() from ref repo
        const projection = d3.geoMercator().fitSize([width, height], india);
        const path = d3.geoPath().projection(projection);

        // Clear existing groups for re-init
        svg.selectAll('.map-g').remove();
        const g = svg.append('g').attr('class', 'map-g');

        // Render District Nodes (Direct property access for performance)
        g.selectAll('.district-path')
            .data(india.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'district-path')
            .style('fill', d => getColorForDistrict(d.properties[currentFilter], currentFilter))
            .style('stroke', 'rgba(15, 23, 42, 0.3)')
            .style('stroke-width', '0.5')
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition().duration(100)
                    .style('stroke', '#fff')
                    .style('stroke-width', '2')
                    .style('filter', 'brightness(1.15) drop-shadow(0 0 5px rgba(255,255,255,0.4))');
                
                updateSideIntel(d.properties);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition().duration(200)
                    .style('stroke', 'rgba(15, 23, 42, 0.3)')
                    .style('stroke-width', '0.5')
                    .style('filter', 'brightness(1)');
            })
            .on('click', function(event, d) {
                navigateToDistrict(d.properties.district);
            });

        // RECONSTRUCTED: Zoom Logic from ref repo
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .on('zoom', (event) => g.attr('transform', event.transform));
        
        svg.call(zoom);

        // Control Center Binding
        setupMapControls(svg, g, zoom);

    } catch (error) {
        console.error("Geospatial Sync Critical Failure:", error);
    }
}

/**
 * RECONSTRUCTED: getColorForDistrict using d3.scaleThreshold()
 */
function getColorForDistrict(val, filter) {
    if (!val || val === 0) return '#cbd5e1'; // No Data Detection

    let scale;
    if (filter === 'OPI') {
        scale = d3.scaleThreshold()
            .domain([25, 50, 75])
            .range(['#3b82f6', '#6366f1', '#8b5cf6', '#d946ef']);
    } else if (filter === 'coverage_gap') {
        scale = d3.scaleThreshold()
            .domain([0.3, 0.5, 0.7])
            .range(['#10b981', '#f59e0b', '#ef4444', '#991b1b']);
    } else {
        scale = d3.scaleThreshold()
            .domain([15, 25, 40])
            .range(['#6366f1', '#8b5cf6', '#a855f7', '#c026d3']);
    }

    return scale(val);
}

/**
 * Side Intel Orchestration (Direct Access)
 */
function updateSideIntel(props) {
    const panel = document.getElementById('map-intel-panel');
    if (!panel) return;

    const hasData = props.has_data;
    const alert = hasData ? '' : '<div style="background:#fef2f2; color:#b91c1c; padding:12px; border-radius:12px; font-weight:900; font-size:0.75rem; border:2px solid #ef4444; margin-bottom:15px; text-transform:uppercase;"><i class="fa-solid fa-triangle-exclamation"></i> Critical: Missing Data</div>';

    panel.innerHTML = `
        <div class="fade-in">
            ${alert}
            <div style="font-size:0.7rem; font-weight:900; color:var(--primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">Operational Intelligence Profile</div>
            <h2 style="font-size:2rem; font-weight:900; color:var(--text-main); line-height:1.1;">${props.district || 'Unidentified Node'}</h2>
            <p style="opacity:0.6; font-size:0.95rem; font-weight:700;">${props.state_clean || ''}</p>
            
            <div style="margin:25px 0; padding:24px; background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border:1px solid var(--border); border-radius:1.5rem; text-align:center;">
                <div style="font-size:0.75rem; color:var(--text-muted); font-weight:900; text-transform:uppercase; letter-spacing:1px;">Priority Index (OPI)</div>
                <div style="font-size:3.5rem; font-weight:900; color:var(--primary); margin:5px 0;">${Math.round(props.OPI || 0)}</div>
                <div class="reason-tag" style="margin-top:10px; display:inline-block; font-weight:700;">${props.tactical_reason || 'Baseline Monitoring Tier'}</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="stat-card-mini" style="background:white; border:1px solid var(--border); padding:15px; border-radius:1rem;">
                    <div style="font-size:0.65rem; font-weight:900; opacity:0.5; text-transform:uppercase;">Coverage Gap</div>
                    <div style="font-weight:900; font-size:1.1rem;">${((props.coverage_gap || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="stat-card-mini" style="background:white; border:1px solid var(--border); padding:15px; border-radius:1rem;">
                    <div style="font-size:0.65rem; font-weight:900; opacity:0.5; text-transform:uppercase;">Youth Segment</div>
                    <div style="font-weight:900; font-size:1.1rem;">${(props.youth_pct || 0).toFixed(1)}%</div>
                </div>
            </div>

            <button class="discovery-btn" onclick="navigateToDistrict('${props.district}')" style="width:100%; margin-top:25px; padding:18px; font-weight:900; background:var(--primary); color:white; border-radius:1rem;">Extract Complete Profile &rarr;</button>
        </div>
    `;
}

/**
 * Control Center (Expansion + Reset)
 */
function setupMapControls(svg, g, zoom) {
    const expandBtn = document.getElementById('zoom-expand');
    if (expandBtn) {
        expandBtn.onclick = () => {
            const wrapper = document.getElementById('map-wrapper-main');
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                wrapper.requestFullscreen();
            }
        };
    }

    // Auto-update scale on fullscreen change
    document.addEventListener('fullscreenchange', () => {
        setTimeout(initMapIntel, 200); // Re-initialize to fix fitSize dimensions
    });
}

// Global Lifecycle Orchestration
window.onDashboardDataLoaded = initMapIntel;
