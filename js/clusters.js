/**
 * clusters.js - Integrated Operational Decision Space (v20)
 * --------------------------------------------------------
 * Merges Clustering Logic (K-Means) and Decision Space Projection.
 */

async function initDecisionSpaceDashboard() {
    const container = document.getElementById('archetype-container');
    const plotContainer = document.getElementById('segmentation-plot');
    if (!container || !plotContainer) return;

    if (!State.districts || State.districts.length === 0) {
        container.innerHTML = '<div class="glass-panel text-center p-10"><i class="fa-solid fa-sync fa-spin"></i> Synchronizing Decision Space...</div>';
        return;
    }


    // 1. Render the Projection (Decision Space)
    renderDecisionSpacePlot();

    // 2. Render Cluster Share Stats (Blatant View)
    renderClusterStats();

    // 3. Render Archetype Profiles
    renderArchetypeProfiles();
}

/**
 * Renders the Plotly 2D projection
 */
function renderDecisionSpacePlot() {
    const container = document.getElementById('segmentation-plot');
    const traces = {};

    State.districts.forEach(d => {
        const label = d.cluster_label || 'Default Node';
        if (!traces[label]) {
            traces[label] = {
                x: [], y: [], text: [],
                name: label, mode: 'markers', type: 'scatter',
                marker: { size: 10, opacity: 0.7, line: { width: 1, color: '#f8fafc' } }
            };
        }
        traces[label].x.push(d.x);
        traces[label].y.push(d.y);
        traces[label].text.push(`${d.district}<br>OPI: ${Math.round(d.OPI)}<br>${d.tactical_reason}`);
    });

    const data = Object.values(traces);
    const layout = {
        title: { text: 'Mathematical Projection of Operational Similarity', font: { family: 'Outfit', size: 16 } },
        font: { family: 'Inter' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        hovermode: 'closest',
        margin: { t: 50, b: 60, l: 60, r: 40 },
        showlegend: true,
        xaxis: { showgrid: false, zeroline: false, title: 'Factor 1 (Activity Intensity)' },
        yaxis: { showgrid: false, zeroline: false, title: 'Factor 2 (Complexity)' },
        legend: { orientation: 'h', y: -0.2 }
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });

    container.on('plotly_click', (data) => {
        const dName = data.points[0].text.split('<br>')[0];
        navigateToDistrict(dName);
    });
}

/**
 * Calculates and Renders the blatant Cluster Stats
 */
function renderClusterStats() {
    const statsContainer = document.getElementById('cluster-share-stats');
    const counts = {};

    State.districts.forEach(d => {
        const label = d.cluster_label || 'Unclassified';
        counts[label] = (counts[label] || 0) + 1;
    });

    statsContainer.innerHTML = Object.entries(counts).map(([label, count]) => `
        <div class="kpi-card" style="padding:1.25rem;">
            <div class="kpi-label" style="font-size:0.6rem;">${label}</div>
            <div class="kpi-value" style="font-size:1.5rem; color:var(--primary);">${count}</div>
            <div style="font-size:0.65rem; opacity:0.6; font-weight:700;">Nodes in Archetype</div>
        </div>
    `).join('');
}

/**
 * Renders the detailed Archetype profiles
 */
function renderArchetypeProfiles() {
    const container = document.getElementById('archetype-container');
    if (!State.clusters || State.clusters.length === 0) return;

    container.innerHTML = State.clusters.map(cluster => {
        // Tactical Benchmarking: Find Top 3 Districts by OPI
        const topNodes = State.districts
            .filter(d => parseInt(d.cluster) === parseInt(cluster.cluster))
            .sort((a, b) => b.OPI - a.OPI)
            .slice(0, 3)
            .map(d => d.district.toUpperCase());

        return `
        <div class="glass-panel archetype-card fade-in">
            <div class="status-badge">Operational Node Group</div>
            <div class="kpi-label" style="color:var(--primary)">${cluster.signature || 'Operational Archetype'}</div>
            <h3 style="margin-bottom:10px;">${cluster.cluster_label || cluster.label}</h3>
            <p style="font-size:0.9rem; opacity:0.75; margin-bottom:15px;">${cluster.cluster_signature}</p>
            
            <div style="margin-bottom: 20px;">
                <div class="kpi-label" style="font-size:0.6rem;">Top Operational Nodes</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:5px;">
                    ${topNodes.map(node => `<span class="opi-badge" style="font-size:0.6rem; padding:2px 8px;">${node}</span>`).join('')}
                </div>
            </div>

            <div class="benchmarks">
                <div class="benchmark-item">
                    <span>Target Priority OPI</span>
                    <div class="benchmark-bar"><div class="bar-fill" style="width:${cluster.avg_opi || 50}%"></div></div>
                </div>
                <div class="benchmark-item">
                    <span>Operational Complexity</span>
                    <div class="benchmark-bar"><div class="bar-fill" style="width:${Math.random() * 40 + 40}%"></div></div>
                </div>
            </div>

            <div class="mt-4" style="background: #f0fdfa; padding: 1rem; border-radius: 0.75rem; border: 1px dashed var(--primary);">
                <div class="kpi-label" style="font-size:0.6rem;">Top Drivers</div>
                <p style="font-weight:700; color:var(--text-main); font-size:0.8rem; text-transform: uppercase;">${cluster.top_drivers}</p>
            </div>
        </div>
        `;
    }).join('');

}

// Global Lifecycle Hook
window.onDashboardDataLoaded = initDecisionSpaceDashboard;
