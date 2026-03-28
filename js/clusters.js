/**
 * clusters.js - Cluster Intelligence Logic
 * Handles rendering of cluster archetypes and representative districts.
 */

async function initClustersView() {
    const representatives = await loadCSV('uidai_cluster_representatives.csv');
    renderClusters(representatives);
}

function renderClusters(reps) {
    const container = document.getElementById('clusters-container');
    
    container.innerHTML = State.clusters.map(cluster => {
        // Find top 3 representatives for this cluster
        const clusterReps = reps.filter(r => r.cluster_label === cluster.cluster_label).slice(0, 3);
        
        return `
            <div class="glass-panel" style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="color: var(--dark); font-size: 1.5rem;">${cluster.cluster_label}</h3>
                        <p style="color: var(--primary); font-weight: 600; font-size: 0.9rem;">${cluster.signature}</p>
                    </div>
                    <div style="text-align: right;">
                        <div class="kpi-label">Node count</div>
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--dark);">${cluster.size}</div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
                    <div>
                        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Primary Drivers</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            ${getClusterBadges(cluster.cluster_label)}
                        </div>
                    </div>
                    <div>
                        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 1rem;">Representative Districts</h4>
                        <div style="display: flex; gap: 1rem;">
                            ${clusterReps.map(r => `
                                <div onclick="navigateToDistrict('${r.district}')" style="background: white; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); cursor: pointer; flex: 1;">
                                    <div style="font-weight: 700; font-size: 0.9rem">${capitalize(r.district)}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-muted)">${capitalize(r.state_clean)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getClusterBadges(label) {
    const tags = {
        "High Stress Urban Systems": ["Volume", "Update Pressure", "Bio Stress"],
        "Extreme Youth Gap Districts": ["Youth Potential", "Coverage Gap"],
        "High Volume Infrastructure Hubs": ["Efficiency", "Throughput"],
        "Stress Anomaly Districts": ["Bio Error", "Audit Required"],
        "Youth + Emerging Load Districts": ["Growth", "Service Transition"],
        "Mixed Operational Districts": ["Standard", "Balanced"]
    };
    return (tags[label] || ["Standard"]).map(t => `<span class="badge badge-mid">${t}</span>`).join('');
}

// Hook into main.js init
window.onDashboardDataLoaded = () => {
    initClustersView();
};
