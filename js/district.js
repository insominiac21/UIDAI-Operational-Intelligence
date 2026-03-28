/**
 * district.js - Intelligence Profile Logic
 * Manages deep-dives and similarity benchmarking.
 */

let CurrentDistrict = null;

async function initDistrictProfile() {
    const params = new URLSearchParams(window.location.search);
    const dName = params.get('district');

    if (!dName) {
        window.location.href = 'index.html';
        return;
    }

    CurrentDistrict = State.districts.find(d => d.district.toLowerCase() === dName.toLowerCase());
    
    if (!CurrentDistrict) {
        document.querySelector('.main-content').innerHTML = `
            <div class="glass-panel text-center p-10 mt-10">
                <h2>Node Identity Not Reconciled</h2>
                <p>The district "${dName}" could not be mapped to the operational dataset.</p>
                <button class="map-btn mt-5" onclick="window.location.href='index.html'">Return to Hub</button>
            </div>
        `;
        return;
    }

    renderProfileData();
    renderSimilaritybenchmarks();
}

function renderProfileData() {
    const d = CurrentDistrict;
    
    // Header
    document.getElementById('district-title').innerText = capitalize(d.district);
    document.getElementById('state-sub').innerText = `${capitalize(d.state_clean)} • Unit Intelligence`;
    
    // OPI Hero
    document.getElementById('opi-value').innerText = Math.round(d.OPI);
    document.getElementById('opi-hero').style.background = getTierColorForProfile(d.OPI);
    
    // Reasoning
    document.getElementById('archetype-label').innerText = d.cluster_label;
    document.getElementById('tactical-reason-text').innerText = d.tactical_reason;

    // Metrics
    document.getElementById('val-gap').innerText = `${(d.coverage_gap * 100).toFixed(1)}%`;
    document.getElementById('val-youth').innerText = `${d.youth_pct.toFixed(1)}%`;
    document.getElementById('val-update').innerText = d.log_update_load.toFixed(2);
    document.getElementById('val-bio').innerText = d.log_bio_stress.toFixed(2);
}

function renderSimilaritybenchmarks() {
    const peers = getSimilarDistrictsEuclidean(CurrentDistrict, State.districts);
    const container = document.getElementById('similarity-grid');

    if (peers.length === 0) {
        container.innerHTML = '<p>No strategic peers found in the current feature space.</p>';
        return;
    }

    container.innerHTML = peers.map(p => `
        <div class="peer-card" onclick="window.location.href='district.html?district=${encodeURIComponent(p.district)}'">
            <div class="peer-header">
                <strong>${capitalize(p.district)}</strong>
                <small>${capitalize(p.state_clean)}</small>
            </div>
            <div class="peer-body">
                <div class="peer-opi">OPI: ${Math.round(p.OPI)}</div>
                <div class="peer-archetype">${p.cluster_label}</div>
            </div>
            <div class="peer-footer">View Peer Intel &rarr;</div>
        </div>
    `).join('');
}

// Reuse color logic from map if possible, or define local
function getTierColorForProfile(val) {
    if (val > 75) return '#d946ef';
    if (val > 50) return '#8b5cf6';
    if (val > 25) return '#06b6d4';
    return '#0d9488';
}

// Trigger on load
window.onDashboardDataLoaded = () => {
    initDistrictProfile();
};
