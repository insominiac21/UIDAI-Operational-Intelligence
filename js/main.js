/**
 * UIDAI Operational Intelligence - Data Orchestration Layer
 * Core State & Decision Logic
 */

const CONFIG = {
    DATA_PATH: './data/',
    MAP_GEOJSON: 'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/district/india_district.json'
};

const State = {
    districts: [],
    clusters: [],
    loading: true,
    filters: {
        state: '',
        cluster: '',
        opiRange: [0, 100]
    }
};

/**
 * Tactical Reasoning Engine
 * Dynamically explains the OPI priority for a district.
 */
function calculateTacticalReason(d) {
    const reasons = [];
    const coverageGap = parseFloat(d.coverage_gap) || 0;
    const youthPct = parseFloat(d.youth_pct) || 0;
    const updateLoad = parseFloat(d.log_update_load) || 0;
    const bioStress = parseFloat(d.log_bio_stress) || 0;

    if (coverageGap > 0.6) reasons.push("Critical Coverage Deficiency");
    else if (coverageGap > 0.3) reasons.push("High Enrollment Potential");

    if (youthPct > 40) reasons.push("Extreme Youth Influx");
    else if (youthPct > 25) reasons.push("Rising School-Age Demand");

    if (bioStress > 10.5) reasons.push("Biometric Infrastructure Stress");
    if (updateLoad > 4.5) reasons.push("Operational Update Pressure");

    if (reasons.length === 0) return "General Maintenance Tier";
    return reasons.slice(0, 2).join(" + ");
}

/**
 * Promise-based CSV Loader
 */
async function loadCSV(filename) {
    return new Promise((resolve, reject) => {
        Papa.parse(`${CONFIG.DATA_PATH}${filename}`, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}

/**
 * Universal Intelligence Init
 */
async function initDashboard() {
    try {
        console.log("Orchestrating Decision Intelligence Layer...");
        
        const [rawDistricts, rawClusters] = await Promise.all([
            loadCSV('uidai_district_model_table.csv'),
            loadCSV('uidai_cluster_summary.csv')
        ]);

        // Standardize & Enhance Data
        State.districts = rawDistricts.filter(d => d.district).map(d => ({
            ...d,
            OPI: parseFloat(d.OPI) || 0,
            x: parseFloat(d.x) || 0,
            y: parseFloat(d.y) || 0,
            coverage_gap: parseFloat(d.coverage_gap) || 0,
            youth_pct: parseFloat(d.youth_pct) || 0,
            tactical_reason: calculateTacticalReason(d)
        }));

        State.clusters = rawClusters;
        State.loading = false;

        console.log(`Knowledge Base Initialized: ${State.districts.length} Nodes Loaded.`);

        // Notify Listeners
        if (window.onDashboardDataLoaded) {
            window.onDashboardDataLoaded();
        }

        setupGlobalSearch();
    } catch (error) {
        console.error("Critical Failure in Data Pipeline:", error);
    }
}

/**
 * Global Discovery Hub (Search)
 */
function setupGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    searchInput.parentNode.appendChild(resultsContainer);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const matches = State.districts.filter(d => 
            d.district.toLowerCase().includes(query) || 
            (d.state_clean && d.state_clean.toLowerCase().includes(query))
        ).slice(0, 8);

        renderSearchResults(matches, resultsContainer);
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target)) resultsContainer.style.display = 'none';
    });
}

function renderSearchResults(matches, container) {
    if (matches.length === 0) {
        container.innerHTML = '<div class="search-item">No records found</div>';
    } else {
        container.innerHTML = matches.map(m => `
            <div class="search-item" onclick="navigateToDistrict('${m.district}')">
                <div style="font-weight:700">${capitalize(m.district)}</div>
                <div style="font-size:0.7rem; opacity:0.7">${capitalize(m.state_clean)} • OPI ${Math.round(m.OPI)}</div>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}

function navigateToDistrict(name) {
    window.location.href = `district.html?district=${encodeURIComponent(name)}`;
}

/**
 * Formatters
 */
function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatNum(n) {
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

// Global Launcher
document.addEventListener('DOMContentLoaded', initDashboard);
