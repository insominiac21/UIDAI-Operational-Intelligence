/**
 * map.js - Advanced Geospatial Intelligence
 * Implements Tiered Threshold Coloring & India District Mapping
 */

let Map;
let GeoLayer;
const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_BOUNDS = [[6.5, 68.0], [35.5, 97.5]];

// Threshold Scale Definitions
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

function initMapIntel() {
    Map = L.map('map', {
        zoomSnap: 0.5,
        maxBounds: INDIA_BOUNDS,
        maxBoundsViscosity: 1.0
    }).setView(INDIA_CENTER, 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(Map);

    loadMapData();
}

async function loadMapData() {
    try {
        const response = await fetch(CONFIG.MAP_GEOJSON);
        const geojson = await response.json();
        
        GeoLayer = L.geoJSON(geojson, {
            style: districtStyle,
            onEachFeature: onDistrictTouch
        }).addTo(Map);

    } catch (error) {
        console.error("Geospatial Load Error:", error);
        document.getElementById('map').innerHTML += `<div class="error-overlay">Failed to load boundary data. Using point-intelligence fallback.</div>`;
    }
}

function districtStyle(feature) {
    // Normalize naming between GeoJSON and State Model
    const dName = feature.properties.district || feature.properties.dist_name || "";
    const districtData = State.districts.find(d => 
        d.district.toLowerCase() === dName.toLowerCase().replace(' district', '')
    );

    const opiVal = districtData ? districtData.OPI : 0;
    
    return {
        fillColor: getTierColor(opiVal),
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: districtData ? 0.8 : 0.1
    };
}

function onDistrictTouch(feature, layer) {
    layer.on({
        mouseover: (e) => {
            const l = e.target;
            l.setStyle({ weight: 3, color: '#f8fafc', fillOpacity: 1 });
            updateSidebar(feature);
        },
        mouseout: (e) => {
            GeoLayer.resetStyle(e.target);
        },
        click: (e) => {
            const dName = feature.properties.district || feature.properties.dist_name || "";
            navigateToDistrict(dName);
        }
    });
}

function updateSidebar(feature) {
    const dName = feature.properties.district || feature.properties.dist_name || "Unknown";
    const data = State.districts.find(d => 
        d.district.toLowerCase() === dName.toLowerCase().replace(' district', '')
    );
    
    const panel = document.getElementById('map-side-intel');
    if (!panel) return;

    if (!data) {
        panel.innerHTML = `<div class="p-4"><h4>${capitalize(dName)}</h4><p>No operational data available for this node.</p></div>`;
        return;
    }

    panel.innerHTML = `
        <div class="intel-brief fade-in">
            <h3>${capitalize(data.district)}</h3>
            <p class="state-sub">${capitalize(data.state_clean)}</p>
            
            <div class="opi-hero" style="background:${getTierColor(data.OPI)}">
                <div class="hero-label">Priority Index</div>
                <div class="hero-val">${Math.round(data.OPI)}</div>
            </div>

            <div class="archetype-tag">${data.cluster_label}</div>
            
            <div class="reason-box">
                <strong>Why Important:</strong><br>
                ${data.tactical_reason}
            </div>

            <div class="metric-mini-grid">
                <div class="mini-stat">
                    <span>Gap</span>
                    <strong>${(data.coverage_gap * 100).toFixed(1)}%</strong>
                </div>
                <div class="mini-stat">
                    <span>Youth</span>
                    <strong>${data.youth_pct.toFixed(0)}%</strong>
                </div>
            </div>

            <button class="map-btn w-full mt-4" onclick="navigateToDistrict('${data.district}')">Open Detail Profile</button>
        </div>
    `;
}

// Global filter hook
window.onDashboardDataLoaded = () => {
    initMapIntel();
};
