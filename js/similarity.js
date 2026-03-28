/**
 * similarity.js - District Similarity Engine
 * Provides functions to fetch and process the similarity table.
 */

let SimilarityTable = [];

async function loadSimilarityData() {
    try {
        SimilarityTable = await loadCSV('district_similarity.csv');
        console.log("Similarity engine ready.");
    } catch (error) {
        console.error("Error loading similarity table:", error);
    }
}

/**
 * Returns the top 5 similar districts for a given district name.
 */
function getSimilarDistricts(districtName) {
    if (!SimilarityTable.length) return [];
    
    const row = SimilarityTable.find(s => s.district.toLowerCase() === districtName.toLowerCase());
    if (!row) return [];

    return [
        parseNeighbor(row.sim1),
        parseNeighbor(row.sim2),
        parseNeighbor(row.sim3),
        parseNeighbor(row.sim4),
        parseNeighbor(row.sim5)
    ];
}

function parseNeighbor(neighborString) {
    if (!neighborString) return null;
    const [name, state] = neighborString.split(' (');
    return {
        name: name,
        state: state.replace(')', '')
    };
}
