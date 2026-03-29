/**
 * district.js - Intelligence Profile Logic (v14 Stabilization)
 * ----------------------------------------------------------
 * Manages deep-dives, missing data alerts, and similarity benchmarking.
 */

let CurrentDistrict = null;

async function initDistrictProfile() {
    console.log("Synthesizing District Node Intelligence...");
    
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
                <i class="fa-solid fa-satellite-dish" style="font-size:3rem; opacity:0.1; margin-bottom:20px;"></i>
                <h2 style="font-weight:900;">Node Identity Not Reconciled</h2>
                <p style="opacity:0.6; margin-top:10px;">The district node identification sequence "${dName}" could not be mapped to the operational dataset.</p>
                <button class="discovery-btn mt-5" onclick="window.location.href='index.html'" style="padding:15px 30px;">Return to Intelligence Hub</button>
            </div>
        `;
        return;
    }

    renderProfileData();
    renderSimilaritybenchmarks();
}

/**
 * Data Quality & Metric Rendering
 */
function renderProfileData() {
    const d = CurrentDistrict;
    
    // Check for Missing Data (0-value indicators)
    const metrics = [d.OPI, d.coverage_gap, d.youth_pct, d.log_update_load];
    const isMissingData = metrics.some(m => m === 0 || m === null || m === undefined);

    if (isMissingData) {
        const alertBox = document.getElementById('data-quality-alert');
        if (alertBox) {
            alertBox.innerHTML = `
                <div style="background:#fef2f2; border:2px solid #dc2626; color:#dc2626; padding:20px; border-radius:1.5rem; display:flex; align-items:center; gap:20px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;"></i>
                    <div>
                        <div style="font-weight:900; font-size:1.1rem; text-transform:uppercase; letter-spacing:1px;">Critical: Lack of Available Data</div>
                        <div style="font-size:0.9rem; opacity:0.8; font-weight:700; margin-top:4px;">Our sensors have detected zero-value metrics for this node. Operational strategy recommendations may be baseline-only until telemetry is restored.</div>
                    </div>
                </div>
            `;
            alertBox.style.display = 'block';
        }
    }

    // Header
    document.getElementById('district-title').innerText = capitalize(d.district);
    document.getElementById('state-sub').innerText = `${capitalize(d.state_clean || '')} • Tactical Operational Profile`;
    
    // OPI Hero
    document.getElementById('opi-value').innerText = Math.round(d.OPI);
    document.getElementById('opi-hero').style.background = getTierColorForProfile(d.OPI);
    
    // Reasoning
    document.getElementById('archetype-label').innerText = d.cluster_label || 'Unclassified Node';
    document.getElementById('tactical_reason_text') ? document.getElementById('tactical_reason_text').innerText = d.tactical_reason : null;
    if (document.getElementById('tactical-reason-text')) document.getElementById('tactical-reason-text').innerText = d.tactical_reason;

    // Metrics
    document.getElementById('val-gap').innerText = `${(d.coverage_gap * 100).toFixed(1)}%`;
    document.getElementById('val-youth').innerText = `${d.youth_pct.toFixed(1)}%`;
    document.getElementById('val-update').innerText = d.log_update_load ? d.log_update_load.toFixed(2) : '0.00';
    document.getElementById('val-bio').innerText = d.log_bio_stress ? d.log_bio_stress.toFixed(2) : '0.00';
}

/**
 * Peer Discovery Logic
 */
function renderSimilaritybenchmarks() {
    const peers = getSimilarDistrictsEuclidean(CurrentDistrict, State.districts, 6);
    const container = document.getElementById('similarity-grid');

    if (!container) return;
    if (!peers || peers.length === 0) {
        container.innerHTML = '<p>No strategic peers found in the current feature space.</p>';
        return;
    }

    container.innerHTML = peers.map(p => `
        <div class="peer-card" style="background:white; border:1px solid var(--border); border-radius:1.25rem; padding:1.5rem; cursor:pointer; transition:0.2s;" onclick="navigateToDistrict('${p.district}')">
            <div class="peer-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div>
                    <div style="font-weight:900; color:var(--text-main); font-size:1.1rem;">${capitalize(p.district)}</div>
                    <div style="font-size:0.7rem; font-weight:700; opacity:0.6; text-transform:uppercase;">${capitalize(p.state_clean)}</div>
                </div>
                <div style="background:${getTierColorForProfile(p.OPI)}1a; color:${getTierColorForProfile(p.OPI)}; font-weight:900; font-size:0.8rem; padding:4px 8px; border-radius:6px;">${Math.round(p.OPI)}</div>
            </div>
            <div class="peer-archetype" style="font-size:0.7rem; font-weight:800; color:var(--primary); text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">${p.cluster_label}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); line-height:1.4;">Strategic benchmarking candidate for policy transfer &rarr;</div>
        </div>
    `).join('');
}

/**
 * Aesthetic Tier Mapping
 */
function getTierColorForProfile(val) {
    if (val > 75) return '#d946ef';
    if (val > 50) return '#8b5cf6';
    if (val > 25) return '#06b6d4';
    return '#0d9488';
}

function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Global Orchestration Hook
window.onDashboardDataLoaded = () => {
    initDistrictProfile();
};
