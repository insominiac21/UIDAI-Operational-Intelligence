/**
 * main.js - Dynamic Data Orchestration Layer (v14)
 * -----------------------------------------------
 * Core State & Technical Strategy Logic
 */

const CONFIG = {
    DATA_PATH: './data/',
    MODEL_TABLE: 'uidai_district_model_table.csv'
};

const State = {
    districts: [],
    loading: true,
    currentPage: 1,
    pageSize: 10,
    totalPages: 0
};

/**
 * Tactical Reasoning Engine
 */
function calculateTacticalReason(d) {
    const reasons = [];
    const coverageGap = parseFloat(d.coverage_gap) || 0;
    const youthPct = parseFloat(d.youth_pct) || 0;
    const updateLoad = parseFloat(d.log_update_load) || 0;

    if (coverageGap > 0.6) reasons.push("Critical Coverage Deficiency");
    else if (coverageGap > 0.3) reasons.push("High Enrollment Potential");

    if (youthPct > 40) reasons.push("Extreme Youth Influx");
    else if (youthPct > 25) reasons.push("Rising School-Age Demand");

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
 * Universal Intelligence Init (NO HARDCODING)
 */
async function initDashboard() {
    try {
        console.log("Synchronizing Dynamic Knowledge Base from CSV...");
        
        const rawDistricts = await loadCSV(CONFIG.MODEL_TABLE);

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

        State.totalPages = Math.ceil(State.districts.length / State.pageSize);
        State.loading = false;

        console.log(`Knowledge Base Initialized: ${State.districts.length} Nodes Synchronized.`);

        // Notify Listeners
        if (window.onDashboardDataLoaded) {
            window.onDashboardDataLoaded();
        }

    } catch (error) {
        console.error("Critical Failure in Data Pipeline:", error);
    }
}

/**
 * Navigation Utility
 */
function navigateToDistrict(name) {
    // If we have a district details page, navigate there. Otherwise, scroll to top or similar.
    // For this implementation, we focus on the pagination and map sync.
    console.log(`Navigating to District Node: ${name}`);
    // Optional: window.location.href = `profile.html?id=${encodeURIComponent(name)}`;
}

/**
 * Formatters
 */
function capitalize(str) {
    if (!str) return '';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Global Launcher
document.addEventListener('DOMContentLoaded', initDashboard);
