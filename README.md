# UIDAI 2026: Operational Intelligence Dashboard

A production-grade, district-level decision-support system designed to optimize UIDAI enrollment-center deployments and equipment allocation strategies across India.

**Live Platform**: [https://uidai-operational-intelligence.vercel.app/](https://uidai-operational-intelligence.vercel.app/)

## 🚀 Overview
The **UIDAI Operational Intelligence Dashboard** transforms raw administrative and performance data into actionable regional archetypes. It enables national authorities to:
- **Prioritize Deployments**: Use the 0-100 OPI (Operational Priority Index) score to identify districts in need of immediate hardware or personnel intervention.
- **Segment Strategy**: Apply tailored policies based on six distinct operational archetypes (e.g., "High Stress Urban" vs "Extreme Youth Gap").
- **Benchmark Performance**: Use feature-space similarity retrieval to find peer districts and transplant successful strategies across state lines.

## 🛠 Tech Stack
- **Architecture**: Static Web Product (Multi-page).
- **Core**: HTML5, Vanilla JavaScript (ES6+), CSS3.
- **Geospatial**: Leaflet.js with simplified district GeoJSON layers.
- **Data Engine**: PapaParse for high-performance client-side CSV processing.
- **Analysis Source**: Python/K-Means Clustering via the `uidai-operational-intelligence-district-clustering.ipynb` analysis pipeline.

## 📂 Project Structure
```text
/UIDAI-2026-Dashboard
├── index.html          # National Overview & KPIs
├── map.html            # Geospatial Exploration Layer
├── district.html       # District-specific Intelligence Drill-down
├── clusters.html       # Operational Archetype Profiles
├── priority.html       # Tactically Ranked Deployment Queue
├── methodology.html    # Model Logic & Data Quality Audit
├── /css
│   └── styles.css      # Vibrant Teal Design System
├── /js
│   ├── main.js         # Core Data Orchestration
│   ├── map.js          # Leaflet Integration
│   ├── district.js     # Detail View & Similarity Logic
│   ├── clusters.js     # Archetype Rendering
│   └── priority.js     # Filterable Priority Table
└── /data               # Precomputed CSV Assets
    ├── uidai_district_model_table.csv
    ├── uidai_cluster_summary.csv
    └── district_similarity.csv
```

## 📊 Key Operational Metrics
- **OPI (Operational Priority Index)**: A composite weighted score:
  - 45% Coverage Gap
  - 30% Youth Percentage
  - 25% Update Load Pressure
- **Biometric Stress**: The rate of biometric failures relative to enrollment volume.
- **Youth Concentration**: Targeting districts where school-age enrollment can yield high return-on-investment.

## 🌐 Deployment
This dashboard is designed as a zero-dependency static site. It can be deployed instantly to **Vercel**, **GitHub Pages**, or **Netlify**.

1. Clone this repository.
2. Ensure the `/data` folder contains the necessary CSV exports.
3. Open `index.html` or host via a local static server.

---
*Developed for UIDAI Operational Intelligence Division • 2026 Dashboard Release*
