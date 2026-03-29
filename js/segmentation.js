/**
 * segmentation.js - Interactive Spatial Intelligence (v10 Stabilization)
 * -----------------------------------------------------------------
 * Renders the model's 2D projection for outlier discovery.
 */

function initSegmentationPlot() {
    const container = document.getElementById('segmentation-plot');
    if (!container) return;

    if (!State.districts || State.districts.length === 0) {
        container.innerHTML = '<div class="glass-panel text-center p-10"><i class="fa-solid fa-sync fa-spin"></i> Synchronizing Decision Space Nodes...</div>';
        return;
    }

    const traces = {};
    
    // Group by archetype for legend control
    State.districts.forEach(d => {
        const label = d.cluster_label || 'Unclassified operational units';
        if (!traces[label]) {
            traces[label] = {
                x: [], y: [], 
                text: [],
                name: label,
                mode: 'markers',
                type: 'scatter',
                marker: { 
                    size: 10, 
                    opacity: 0.7,
                    line: { width: 1, color: '#f8fafc' }
                }
            };
        }
        traces[label].x.push(d.x);
        traces[label].y.push(d.y);
        traces[label].text.push(`${capitalize(d.district)}<br>OPI Index: ${Math.round(d.OPI)}<br>${d.tactical_reason}`);
    });

    const data = Object.values(traces);

    const layout = {
        title: {
            text: 'Decision Space Projection (x, y)',
            font: { family: 'Outfit', size: 18, color: '#0f172a' }
        },
        font: { family: 'Inter' },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        hovermode: 'closest',
        margin: { t: 80, b: 60, l: 60, r: 40 },
        showlegend: true,
        xaxis: { showgrid: false, zeroline: false, title: 'Enrolment Intensity' },
        yaxis: { showgrid: false, zeroline: false, title: 'Operational Load Complexity' },
        legend: { orientation: 'h', y: -0.2 }
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot(container, data, layout, config);

    // Click Event Linking (RESTORED)
    container.on('plotly_click', function(data){
        const point = data.points[0];
        // The district name is the first line of the text property
        const dName = point.text.split('<br>')[0];
        navigateToDistrict(dName);
    });

    console.log("Decision Space Projection Online (Plotly).");
}

/**
 * Formatters
 */
function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Hook into data load
window.onDashboardDataLoaded = () => {
    initSegmentationPlot();
};
