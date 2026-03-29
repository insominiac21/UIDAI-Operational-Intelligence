/**
 * clusters.js - Intelligence Archetype Profiling (v12 Stabilization)
 * -------------------------------------------------------------
 * Translates model clusters into actionable operational archetypes.
 */

function initArchetypeView() {
    console.log("Initializing Archetype Strategy Views...");
    renderArchetypeProfiles();
}

function renderArchetypeProfiles() {
    const container = document.getElementById('archetype-container');
    if (!container) return;

    // DEFENSIVE CHECK: Ensure State.clusters is an array before mapping
    if (!State.clusters || !Array.isArray(State.clusters) || State.clusters.length === 0) {
        console.warn("Archetype dataset syncing... (Retrying)");
        container.innerHTML = '<div class="glass-panel text-center p-10"><i class="fa-solid fa-sync fa-spin"></i> Synchronizing Archetype Centroids...</div>';
        return;
    }

    container.innerHTML = State.clusters.map(c => `
        <div class="glass-panel archetype-card fade-in" id="${encodeURIComponent(c.cluster_label)}">
            <div class="archetype-header">
                <div>
                    <h3 style="color:var(--primary); font-size:1.4rem;">${c.cluster_label}</h3>
                    <div style="font-size:0.8rem; opacity:0.6; margin-top:5px;">${c.n_districts || '...'} Managed Operational Nodes</div>
                </div>
                <div class="tier-badge">Tier ${parseInt(c.cluster) + 1}</div>
            </div>

            <div class="archetype-stats">
                <div class="sig-pill"><strong>Signature:</strong> ${c.cluster_signature}</div>
            </div>

            <div class="archetype-content">
                <div class="strategy-box" style="background:#f8fafc; border:1px solid var(--border); border-radius:15px; padding:20px; margin-top:20px;">
                    <h4 style="margin-bottom:10px;"><i class="fa-solid fa-bullseye"></i> Recommended Strategy</h4>
                    <p style="font-size:0.9rem; line-height:1.6; color:var(--text-main);">
                        ${getRecommendedStrategy(c.cluster_label)}
                    </p>
                </div>

                <div class="representative-nodes" style="margin-top:25px;">
                    <h4 style="margin-bottom:10px; font-size:0.85rem; opacity:0.7;">Archetype Benchmarks (Scale)</h4>
                    <div class="benchmark-grid" style="display:flex; flex-wrap:wrap; gap:10px;">
                        ${renderBenchmarks(c.cluster)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    console.log(`Archetype Grid Synthesized: ${State.clusters.length} Profiles Online.`);
}

function getRecommendedStrategy(label) {
    const strategies = {
        "High Stress Urban Systems": "Prioritize high-capacity biometric hardware upgrades and multi-operator enrollment centers to absorb peak transactional load in dense zones.",
        "Extreme Youth Gap Districts": "Launch aggressive mobile registration units focused on secondary schools and decentralized community health centers to bridge the enrollment deficit.",
        "High Volume Infrastructure Hubs": "Maintain existing resource levels while implementing throughput monitoring to ensure sustained operational stability.",
        "Stress Anomaly Districts": "Perform immediate operational audit. Disproportionately high stress relative to volume suggests equipment failure or training deficiencies.",
        "Youth + Emerging Load Districts": "Deployment of flexible 'pop-up' centers for targeted seasonal enrollment drives aligned with academic calendars.",
        "Mixed Operational Districts": "Secondary priority. Perform quarterly monitoring for metric drift toward high-stress or high-gap archetypes."
    };
    return strategies[label] || "Perform site-specific operational review to determine resource requirements.";
}

function renderBenchmarks(clusterId) {
    if (!State.districts || State.districts.length === 0) return '...Synchronizing Districts';
    
    // Pick 3 stable districts for this cluster
    const matches = State.districts.filter(d => parseInt(d.cluster) === parseInt(clusterId)).slice(0, 3);
    
    if (matches.length === 0) return '<small style="opacity:0.5;">No active benchmark units loaded.</small>';

    return matches.map(m => `
        <div class="benchmark-chip" style="background:white; border:1px solid var(--border); padding:8px 12px; border-radius:10px; font-size:0.8rem; font-weight:700; cursor:pointer;" onclick="navigateToDistrict('${m.district}')">
            ${capitalize(m.district)} <i class="fa-solid fa-chevron-right" style="font-size:0.6rem; margin-left:5px; opacity:0.3;"></i>
        </div>
    `).join('');
}

// Hook into data load
window.onDashboardDataLoaded = () => {
    initArchetypeView();
};
