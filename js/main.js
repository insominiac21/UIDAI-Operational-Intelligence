/**
 * UIDAI Operational Intelligence Dashboard - Main Core
 * Handles shared data loading, search, and navigation.
 */

const CONFIG = {
    DATA_PATH: './data/',
    MAP_GEOJSON: 'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/district/india_district.json'
};

const State = {
    districts: [],
    clusters: [],
    priorityDistricts: [],
    loading: true
};

/**
 * Standard CSV loader helper
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
 * Initialize Dashboard Data
 */
async function initDashboard() {
    try {
        console.log("Loading operational intelligence data...");
        State.districts = await loadCSV('uidai_district_model_table.csv');
        State.clusters = await loadCSV('uidai_cluster_summary.csv');
        State.priorityDistricts = await loadCSV('uidai_top_priority_districts.csv');
        
        State.loading = false;
        console.log(`Initialized: ${State.districts.length} districts, ${State.clusters.length} clusters.`);
        
        // Trigger page-specific init if exists
        if (window.onDashboardDataLoaded) {
            window.onDashboardDataLoaded();
        }

        setupSearch();
    } catch (error) {
        console.error("Dashboard initialization failed:", error);
    }
}

/**
 * Global Search Implementation
 */
function setupSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput) return;

    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results';
    resultsContainer.style.display = 'none';
    searchInput.parentNode.appendChild(resultsContainer);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }

        const matches = State.districts.filter(d => 
            d.district.toLowerCase().includes(query) || 
            d.state_clean.toLowerCase().includes(query)
        ).slice(0, 10);

        renderSearchResults(matches, resultsContainer);
    });

    // Hide search when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = 'none';
        }
    });
}

function renderSearchResults(matches, container) {
    if (matches.length === 0) {
        container.innerHTML = '<div class="search-item">No districts found</div>';
    } else {
        container.innerHTML = matches.map(m => `
            <div class="search-item" onclick="navigateToDistrict('${m.district}')">
                <strong>${capitalize(m.district)}</strong>
                <span>${capitalize(m.state_clean)} • ${m.cluster_label}</span>
            </div>
        `).join('');
    }
    container.style.display = 'block';
}

function navigateToDistrict(name) {
    window.location.href = `district.html?district=${encodeURIComponent(name)}`;
}

/**
 * Utility: Capitalize String
 */
function capitalize(str) {
    if (!str) return '';
    return str.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
}

/**
 * Utility: Format Numbers
 */
function formatNum(num) {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
}

// Start Initialization
document.addEventListener('DOMContentLoaded', initDashboard);
