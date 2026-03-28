/**
 * priority.js - Priority Engine Logic
 * Handles sorting, filtering, and pagination of the OPI table.
 */

let filteredDistricts = [];
const filters = {
    state: '',
    cluster: '',
    minOpi: 0
};

function initPriorityView() {
    filteredDistricts = [...State.districts].sort((a, b) => (b.OPI || 0) - (a.OPI || 0));
    
    populateFilters();
    renderPriorityTable();
}

function populateFilters() {
    const stateFilter = document.getElementById('filter-state');
    const clusterFilter = document.getElementById('filter-cluster');

    const states = [...new Set(State.districts.map(d => d.state_clean))].sort();
    const clusters = [...new Set(State.districts.map(d => d.cluster_label))].sort();

    stateFilter.innerHTML += states.map(s => `<option value="${s}">${capitalize(s)}</option>`).join('');
    clusterFilter.innerHTML += clusters.map(c => `<option value="${c}">${c}</option>`).join('');
}

function applyFilters() {
    filters.state = document.getElementById('filter-state').value;
    filters.cluster = document.getElementById('filter-cluster').value;
    filters.minOpi = parseInt(document.getElementById('filter-opi').value) || 0;

    filteredDistricts = State.districts.filter(d => {
        const matchState = !filters.state || d.state_clean === filters.state;
        const matchCluster = !filters.cluster || d.cluster_label === filters.cluster;
        const matchOpi = (d.OPI || 0) >= filters.minOpi;
        const isActionable = !d.data_issue;
        return matchState && matchCluster && matchOpi && isActionable;
    });

    // Re-sort by OPI
    filteredDistricts.sort((a, b) => (b.OPI || 0) - (a.OPI || 0));
    
    renderPriorityTable();
}

function renderPriorityTable() {
    const tbody = document.getElementById('priority-tbody');
    const countEl = document.getElementById('result-count');
    
    countEl.innerText = filteredDistricts.length;

    if (filteredDistricts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 3rem; color: #94a3b8;">No actionable districts match these filters</td></tr>';
        return;
    }

    tbody.innerHTML = filteredDistricts.slice(0, 100).map((d, index) => `
        <tr>
            <td style="font-weight:700; color:var(--primary)">#${index + 1}</td>
            <td>
                <div style="font-weight:700;">${capitalize(d.district)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted)">${capitalize(d.state_clean)}</div>
            </td>
            <td><span class="badge ${getClusterClass(d.cluster)}">${d.cluster_label}</span></td>
            <td>${(d.coverage_gap * 100).toFixed(1)}%</td>
            <td><strong>${Math.round(d.OPI)}</strong></td>
            <td style="text-align:right">
                <button onclick="navigateToDistrict('${d.district}')" class="map-btn" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">View Intel</button>
            </td>
        </tr>
    `).join('');
}

function getClusterClass(clusterId) {
    // Shared classes or logic for color coding badges
    return 'badge-mid'; // Simplified for now
}

// Hook into main.js init
window.onDashboardDataLoaded = () => {
    initPriorityView();
};
