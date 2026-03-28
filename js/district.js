/**
 * district.js - District Detail View Logic
 * Handles dynamic content population based on URL parameters.
 */

let currentDistrictData;
let similarityTable;

async function initDistrictView() {
    const params = new URLSearchParams(window.location.search);
    const districtName = params.get('district');

    if (!districtName) {
        window.location.href = 'index.html';
        return;
    }

    // SimilarityTable is now managed by similarity.js
    await loadSimilarityData();

    currentDistrictData = State.districts.find(d => d.district.toLowerCase() === districtName.toLowerCase());

    if (!currentDistrictData) {
        document.getElementById('district-header').innerText = "District Not Found";
        return;
    }

    renderDistrictDetails();
    renderSimilarDistricts();
}

function renderDistrictDetails() {
    const d = currentDistrictData;
    
    // Header
    document.getElementById('district-name').innerText = capitalize(d.district);
    document.getElementById('state-name').innerText = capitalize(d.state_clean);
    
    // OPI
    const opiEl = document.getElementById('opi-score');
    opiEl.innerText = Math.round(d.OPI || 0);
    opiEl.className = 'opi-value ' + getOpiClass(d.OPI);

    // Cluster Info
    document.getElementById('cluster-label').innerText = d.cluster_label;
    document.getElementById('cluster-signature').innerText = d.cluster_signature;

    // Metrics
    document.getElementById('val-enroll').innerText = formatNum(d.total_enrolments);
    document.getElementById('val-youth').innerText = (d.youth_pct || 0).toFixed(2) + '%';
    document.getElementById('val-gap').innerText = ((d.coverage_gap || 0) * 100).toFixed(2) + '%';
    document.getElementById('val-load').innerText = (d.update_load || 0).toFixed(2);
    document.getElementById('val-stress').innerText = formatNum(d.bio_stress || 0);

    // Explanation & Action
    document.getElementById('interpretation-text').innerText = getInterpretation(d);
    document.getElementById('action-text').innerText = getRecommendation(d);
}

function getOpiClass(opi) {
    if (opi > 60) return 'text-high';
    if (opi > 40) return 'text-mid';
    return 'text-low';
}

function getInterpretation(d) {
    const label = d.cluster_label;
    const interpretations = {
        "High Stress Urban Systems": "This district exhibits high enrollment volumes coupled with significant update pressure and biometric failures. It represents an established urban infrastructure that is currently over-taxed.",
        "Extreme Youth Gap Districts": "Critical gap found in youth enrollment. While general coverage may be stable, the school-age population is significantly under-served.",
        "High Volume Infrastructure Hubs": "A high-performance district with massive enrollment throughput. Requires continuous equipment maintenance to prevent bottlenecks.",
        "Stress Anomaly Districts": "Exhibits unusual biometric stress levels relative to volume. Suggested equipment audit to identify faulty sensors or local environmental factors.",
        "Youth + Emerging Load Districts": "High concentration of youth and growing update activity. Signals a transition from new enrollments to lifecycle maintenance.",
        "Mixed Operational Districts": "Displays balanced metrics across most categories. General oversight is recommended without immediate emergency intervention."
    };
    return interpretations[label] || "Data profile for this district suggests standard operational monitoring.";
}

function getRecommendation(d) {
    const label = d.cluster_label;
    const actions = {
        "High Stress Urban Systems": "Deploy additional high-speed biometric kits. Increase operator training for complex updates. Monitor peak-time load balancing.",
        "Extreme Youth Gap Districts": "Launch school-linked enrollment camps. Partner with local education authorities to verify youth data accuracy.",
        "High Volume Infrastructure Hubs": "Schedule proactive 6-month equipment maintenance. Upgrade server connectivity to handle throughput spikes.",
        "Stress Anomaly Districts": "Dispatch technical team to audit top 10 centers for sensor degradation. Replace older fingerprint scanners.",
        "Youth + Emerging Load Districts": "Establish permanent update centers near growth zones. Streamline youth-to-adult transition workflows.",
        "Mixed Operational Districts": "Maintain current deployment level. Focus on optimizing data quality at the point of enrollment."
    };
    return actions[label] || "Maintain standard operational protocols.";
}

function renderSimilarDistricts() {
    const d = currentDistrictData;
    const sims = getSimilarDistricts(d.district);
    const container = document.getElementById('similar-districts-grid');

    if (sims.length === 0) {
        container.innerHTML = '<p>No similarity data found.</p>';
        return;
    }

    container.innerHTML = sims.map(sim => {
        if (!sim) return '';
        return `
            <div class="kpi-card" onclick="window.location.href='district.html?district=${encodeURIComponent(sim.name)}'" style="cursor:pointer;">
                <div class="kpi-label">${capitalize(sim.state)}</div>
                <div style="font-weight: 700; color: var(--dark); font-size: 1rem; margin-top: 5px;">${capitalize(sim.name)}</div>
                <div style="font-size: 0.75rem; color: var(--primary); margin-top: 10px;">View Intelligence &rarr;</div>
            </div>
        `;
    }).join('');
}

// Hook into main.js init
window.onDashboardDataLoaded = () => {
    initDistrictView();
};
