/**
 * segmentation.js - Interactive Spatial Intelligence
 * Renders the model's 2D projection for outlier discovery.
 */

function initSegmentationPlot() {
    const container = document.getElementById('segmentation-plot');
    if (!container) return;

    const traces = {};
    
    // Group by archetype for legend control
    State.districts.forEach(d => {
        if (!traces[d.cluster_label]) {
            traces[d.cluster_label] = {
                x: [], y: [], 
                text: [],
                name: d.cluster_label,
                mode: 'markers',
                type: 'scatter',
                marker: { size: 10, opacity: 0.7 }
            };
        }
        traces[d.cluster_label].x.push(d.x);
        traces[d.cluster_label].y.push(d.y);
        traces[d.cluster_label].text.push(`${capitalize(d.district)}<br>OPI: ${Math.round(d.OPI)}`);
    });

    const data = Object.values(traces);

    const layout = {
        title: {
            text: 'Decision Space Projection (x, y)',
            font: { family: 'Inter', size: 16, color: '#0f172a' }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        hovermode: 'closest',
        margin: { t: 50, b: 40, l: 40, r: 40 },
        xaxis: { showgrid: false, zeroline: false },
        yaxis: { showgrid: false, zeroline: false },
        legend: { orientation: 'h', y: -0.2 }
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot(container, data, layout, config);

    // Click Event Linking
    container.on('plotly_click', function(data){
        const point = data.points[0];
        // Find district by name in hover text
        const dName = point.text.split('<br>')[0];
        navigateToDistrict(dName);
    });
}

// Hook into data load
window.onDashboardDataLoaded = () => {
    initSegmentationPlot();
};
