/**
 * similarity.js - Real-time Peer Discovery Engine
 * Computes Euclidean distances in (x, y) spatial coordinates.
 */

/**
 * Finds the Top 5 similar districts based on spatial proximity.
 * This aligns with the model's high-dimensional projection.
 */
function getSimilarDistrictsEuclidean(targetDistrict, allDistricts, limit = 5) {
    if (!targetDistrict || !allDistricts.length) return [];

    const x1 = parseFloat(targetDistrict.x);
    const y1 = parseFloat(targetDistrict.y);

    const scored = allDistricts
        .filter(d => d.district.toLowerCase() !== targetDistrict.district.toLowerCase())
        .map(d => {
            const dx = parseFloat(d.x) - x1;
            const dy = parseFloat(d.y) - y1;
            const dist = Math.sqrt(dx*dx + dy*dy);
            return { ...d, distance: dist };
        });

    // Sort by distance (ascending)
    return scored.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

/**
 * Helper to generate a reason why two districts are peers.
 */
function getSimilaritySignature(d1, d2) {
    if (d1.cluster_label === d2.cluster_label) {
        return `Shared Archetype: ${d1.cluster_label}`;
    }
    return "Proximal Operational Profile";
}
