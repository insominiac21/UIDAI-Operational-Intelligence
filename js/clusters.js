/**
 * clusters.js - Operational Decision Space (v24)
 * -----------------------------------------------
 * Merges K-Means Clustering Intelligence and Decision Space Projection.
 * Clean sync pattern — no async/await, no D3 calls here.
 */

function initDecisionSpaceDashboard() {
    const container = document.getElementById('archetype-container');
    const plotContainer = document.getElementById('segmentation-plot');
    if (!container || !plotContainer) return;

    if (!State.districts || State.districts.length === 0) {
        container.innerHTML = '<div class="glass-panel" style="padding:3rem;text-align:center;"><i class="fa-solid fa-sync fa-spin"></i> Synchronizing Decision Space...</div>';
        return;
    }

    renderDecisionSpacePlot();
    renderClusterStats();
    renderArchetypeProfiles();
}

/**
 * Plotly 2D scatter projection
 */
function renderDecisionSpacePlot() {
    const container = document.getElementById('segmentation-plot');
    const traces = {};

    State.districts.forEach(function(d) {
        const label = d.cluster_label || 'Default Node';
        if (!traces[label]) {
            traces[label] = {
                x: [], y: [], text: [],
                name: label,
                mode: 'markers',
                type: 'scatter',
                marker: { size: 8, opacity: 0.75, line: { width: 0.5, color: '#f8fafc' } }
            };
        }
        traces[label].x.push(parseFloat(d.x) || 0);
        traces[label].y.push(parseFloat(d.y) || 0);
        traces[label].text.push(d.district + '<br>OPI: ' + Math.round(d.OPI) + '<br>' + (d.cluster_signature || ''));
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
        legend: { orientation: 'h', y: -0.25 }
    };

    Plotly.newPlot(container, data, layout, { responsive: true, displayModeBar: false });

    container.on('plotly_click', function(data) {
        const dName = data.points[0].text.split('<br>')[0];
        navigateToDistrict(dName);
    });
}

/**
 * Cluster district count stats
 */
function renderClusterStats() {
    const statsContainer = document.getElementById('cluster-share-stats');
    if (!statsContainer) return;

    const counts = {};
    State.districts.forEach(function(d) {
        const label = d.cluster_label || 'Unclassified';
        counts[label] = (counts[label] || 0) + 1;
    });

    statsContainer.innerHTML = Object.entries(counts).map(function(entry) {
        const label = entry[0];
        const count = entry[1];
        return '<div class="kpi-card" style="padding:1.25rem;">' +
            '<div class="kpi-label" style="font-size:0.6rem;">' + label + '</div>' +
            '<div class="kpi-value" style="font-size:1.5rem; color:var(--primary);">' + count + '</div>' +
            '<div style="font-size:0.65rem; opacity:0.6; font-weight:700; margin-top:4px;">districts</div>' +
            '</div>';
    }).join('');
}

/**
 * Archetype Deep-Intel cards with Top 3 Operational Nodes
 */
function renderArchetypeProfiles() {
    const container = document.getElementById('archetype-container');
    if (!State.clusters || State.clusters.length === 0) return;

    container.innerHTML = State.clusters.map(function(cluster) {
        // Top 3 districts by OPI within this cluster
        const topNodes = State.districts
            .filter(function(d) { return parseInt(d.cluster) === parseInt(cluster.cluster); })
            .sort(function(a, b) { return parseFloat(b.OPI) - parseFloat(a.OPI); })
            .slice(0, 3)
            .map(function(d) { return d.district; });

        const topNodeBadges = topNodes.map(function(name) {
            return '<span class="opi-badge" style="font-size:0.65rem; cursor:pointer;" onclick="navigateToDistrict(\'' + name.replace(/'/g, "\\'") + '\')">' + name + '</span>';
        }).join('');

        const opiWidth = Math.min(parseFloat(cluster.avg_opi) || 50, 100);

        return '<div class="glass-panel archetype-card fade-in">' +
            '<div class="status-badge">Operational Node Group</div>' +
            '<div class="kpi-label" style="color:var(--primary); margin-bottom:4px;">' + (cluster.signature || 'Archetype') + '</div>' +
            '<h3 style="margin-bottom:8px;">' + (cluster.cluster_label || 'Cluster ' + cluster.cluster) + '</h3>' +
            '<p style="font-size:0.9rem; opacity:0.7; margin-bottom:16px;">' + (cluster.cluster_signature || '') + '</p>' +

            '<div class="benchmarks">' +
                '<div class="benchmark-item">' +
                    '<span>Priority OPI Score</span>' +
                    '<div class="benchmark-bar"><div class="bar-fill" style="width:' + opiWidth + '%"></div></div>' +
                '</div>' +
            '</div>' +

            '<div style="margin-top:18px;">' +
                '<div class="kpi-label" style="font-size:0.6rem; margin-bottom:8px;">Top 3 Operational Nodes</div>' +
                '<div style="display:flex; flex-wrap:wrap; gap:6px;">' + topNodeBadges + '</div>' +
            '</div>' +

            '<div class="mt-4" style="background:#f0fdfa; padding:1rem; border-radius:0.75rem; border:1px dashed var(--primary);">' +
                '<div class="kpi-label" style="font-size:0.6rem;">Top Drivers</div>' +
                '<p style="font-weight:700; color:var(--text-main); font-size:0.8rem; text-transform:uppercase;">' + (cluster.top_drivers || 'N/A') + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}

// Global lifecycle hook
window.onDashboardDataLoaded = initDecisionSpaceDashboard;
