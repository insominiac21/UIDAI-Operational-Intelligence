/**
 * map.js - Dashboard Map Logic
 * Handles GeoJSON loading, color scaling, and interactive layers.
 */

let map;
let geojsonLayer;
let currentMetric = 'cluster';

const COLOR_SCALES = {
    opi: [
        { limit: 30, color: '#f0fdf4' },
        { limit: 40, color: '#bbf7d0' },
        { limit: 50, color: '#4ade80' },
        { limit: 60, color: '#16a34a' },
        { limit: 100, color: '#14532d' }
    ],
    cluster: [
        { val: 0, color: '#0d9488' }, // High Stress Urban
        { val: 1, color: '#06b6d4' }, // Extreme Youth Gap
        { val: 2, color: '#f59e0b' }, // High Volume Hubs
        { val: 3, color: '#6366f1' }, // Stress Anomaly
        { val: 4, color: '#ec4899' }, // Youth Emerging
        { val: 5, color: '#94a3b8' }  // Mixed
    ],
    gap: [
        { limit: 0.1, color: '#fff1f2' },
        { limit: 0.3, color: '#fecaca' },
        { limit: 0.5, color: '#f87171' },
        { limit: 0.7, color: '#dc2626' },
        { limit: 1.0, color: '#7f1d1d' }
    ]
};

function initMap() {
    map = L.map('india-map').setView([22.5, 80], 5);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    loadGeoJSON();
}

async function loadGeoJSON() {
    try {
        const response = await fetch(CONFIG.MAP_GEOJSON);
        const data = await response.json();
        
        geojsonLayer = L.geoJson(data, {
            style: styleFeature,
            onEachFeature: onEachFeature
        }).addTo(map);

        renderLegend();
    } catch (error) {
        console.error("Failed to load Map GeoJSON:", error);
    }
}

function styleFeature(feature) {
    const districtName = feature.properties.district.toLowerCase();
    const data = State.districts.find(d => d.district.toLowerCase() === districtName);
    
    let color = '#e2e8f0'; // Default gray
    
    if (data) {
        if (currentMetric === 'cluster') {
            const entry = COLOR_SCALES.cluster.find(c => c.val === data.cluster);
            color = entry ? entry.color : color;
        } else if (currentMetric === 'opi') {
            const entry = COLOR_SCALES.opi.find(c => data.OPI <= c.limit);
            color = entry ? entry.color : color;
        } else if (currentMetric === 'gap') {
            const entry = COLOR_SCALES.gap.find(c => data.coverage_gap <= c.limit);
            color = entry ? entry.color : color;
        }
    }

    return {
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.8
    };
}

function onEachFeature(feature, layer) {
    const districtName = feature.properties.district.toLowerCase();
    const data = State.districts.find(d => d.district.toLowerCase() === districtName);

    let popupContent = `<strong>${feature.properties.district}</strong><br>Data not available`;
    if (data) {
        popupContent = `
            <div class="map-tooltip">
                <h4 style="margin:0; border-bottom:1px solid #eee; padding-bottom:5px;">${capitalize(data.district)}</h4>
                <p style="margin:5px 0; font-size:0.8rem; color:#666;">${capitalize(data.state_clean)}</p>
                <div style="margin-top:8px;">
                    <span class="badge ${getOpiClass(data.OPI)}">OPI: ${Math.round(data.OPI)}</span>
                </div>
                <p style="margin-top:10px; font-size:0.75rem;"><strong>Cluster:</strong> ${data.cluster_label}</p>
                <button onclick="navigateToDistrict('${data.district}')" style="margin-top:10px; width:100%; border:none; background:var(--primary); color:white; padding:5px; border-radius:4px; font-weight:bold; cursor:pointer;">Explore Details</button>
            </div>
        `;
    }

    layer.bindPopup(popupContent);
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
    });
}

function highlightFeature(e) {
    const layer = e.target;
    layer.setStyle({
        weight: 2,
        color: '#666',
        fillOpacity: 0.9
    });
    layer.bringToFront();
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
}

function getOpiClass(opi) {
    if (opi > 60) return 'badge-high';
    if (opi > 40) return 'badge-mid';
    return 'badge-low';
}

function switchMapMetric(metric) {
    currentMetric = metric;
    
    // Update active button state
    document.querySelectorAll('.map-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-metric="${metric}"]`).classList.add('active');
    
    if (geojsonLayer) {
        geojsonLayer.setStyle(styleFeature);
    }
    renderLegend();
}

function renderLegend() {
    const legend = document.getElementById('map-legend');
    if (!legend) return;

    let items = [];
    if (currentMetric === 'cluster') {
        items = State.clusters.map(c => ({ color: COLOR_SCALES.cluster.find(sc => sc.val === c.cluster).color, label: c.cluster_label }));
    } else if (currentMetric === 'opi') {
        items = COLOR_SCALES.opi.map(c => ({ color: c.color, label: `< ${c.limit}` }));
    } else if (currentMetric === 'gap') {
        items = COLOR_SCALES.gap.map(c => ({ color: c.color, label: `< ${Math.round(c.limit*100)}%` }));
    }

    legend.innerHTML = items.map(i => `
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:5px; font-size:0.75rem;">
            <div style="width:12px; height:12px; border-radius:2px; background:${i.color};"></div>
            <span>${i.label}</span>
        </div>
    `).join('');
}

// Hook into main.js init
window.onDashboardDataLoaded = () => {
    initMap();
};
