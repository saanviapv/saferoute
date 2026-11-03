# SAFEWAY — Smart Road Safety & Risk Intelligence Platform

> **"Choose The Safest Route, Not Just The Shortest."**

An enterprise-grade, intelligent, responsive road safety platform combining geospatial mapping, multi-route risk optimization, real-time weather & waterlogging prediction, computer vision hazard verification, density heat maps, and community peer consensus.

---

## 🌟 Core System Modules (Full Specification Breakdown)

### 1. Smart Safety Route Map (Module 1)
- **Multi-Route Engine**: Calculates and visually compares multiple driving routes (e.g. *Outer Bypass Highway [Safest]* vs *Central Underpass Corridor [Critical]* vs *River Boulevard [Alternate]*).
- **Segment Risk Color Coding**:
  - 🟢 **GREEN (0–25)** — Low Risk
  - 🟡 **YELLOW (26–45)** — Moderate Risk
  - 🟠 **ORANGE (46–70)** — High Risk
  - 🔴 **RED (71–100)** — Critical Risk
- **Interactive Segment Inspector**: Clicking any road segment displays:
  - Exact Risk Score (0–100) & Category
  - Identified physical hazards (potholes, waterlogging depth, sightline deficits)
  - Live weather conditions and rainfall rate
  - Community peer confirmations
  - Last updated timestamp
- **View Modes**: Switch between Standard Vector Map, Dark Safety Risk Map, and Hazard Density Heat Map.

---

### 2. Intelligent Road Risk Assessment Engine (Module 2)
- Multi-factor weighted dynamic algorithm evaluating:
  - Historical accident blackspots (20% weight)
  - Severe road damage & potholes (15% weight)
  - Waterlogging and flash flood risk (18% weight)
  - Unsafe junctions & blind turns (12% weight)
  - Community-submitted verified reports (15% weight)
  - Poor lighting, traffic congestion, and slippery surface friction (20% combined weight)
- Dynamic score scale (0–25 Low, 26–45 Moderate, 46–70 High, 71–100 Critical).
- Detailed risk attribution explaining *why* a road received its score.

---

### 3. Weather-Based Road Safety & Waterlogging Forecast (Module 3)
- Live weather parameters: rainfall intensity (mm/h), precipitation probability (%), atmospheric visibility (km), flood advisories.
- **Waterlogging Prediction Model**: Synthesizes radar rainfall, terrain elevation (DEM), drainage capacity, and historical underpass flooding data to forecast flooded roads before water accumulates.
- Displays estimated water depths and alternative bypass flyovers.

---

### 4. Smart Hazard Verification System & AI Vision (Module 4)
- 7-Stage Verification Pipeline:
  1. User Report Submission
  2. Spatial Category & GPS Verification
  3. AI-Assisted Vision Scan (detects potholes, submerged pavement, tree obstructions)
  4. Deduplication clustering within 150m
  5. Community peer verification
  6. Moderator review status
  7. Dynamic score influence on live map segments
- AI predictions are labeled as assistive estimates to preserve integrity.

---

### 5. Road Danger Heat Map (Module 5)
- Interactive spatial density heat map powered by `Leaflet.heat`.
- 4 Switchable Heat Modes:
  - Overall Cumulative Risk
  - Accident-Prone Blackspots
  - Waterlogging & Flood Hotspots
  - Road Damage & Pothole Clusters
- Time window filters: Past 24 Hours, 7 Days, 30 Days, All-Time.

---

### 6. Photo Evidence Upload Interface (Module 6)
- Drag-and-drop file upload + direct mobile camera capture.
- Live image preview with simulated AI bounding box computer vision overlay.
- Automatic GPS tagging via W3C Geolocation.
- Simulated Supabase Storage upload progress bar (0–100%).
- Unique tracking Report ID generation (e.g. `RPT-2026-8942`).

---

### 7. Road Safety Analytics Dashboard (Module 7)
- Built with Chart.js:
  - Key Performance Indicators (Total reports, Verified, Pending, Critical locations, Flood hotspots, Resolved).
  - Risk Category Distribution (Doughnut Chart).
  - Hazard Category Frequency (Bar Chart).
  - Weekly and Monthly Incident vs Resolution Trend (Line Chart).
  - Weather vs Waterlogging Correlation (Dual-axis Bar Chart).

---

### 8. Community Verification Hub (Module 8)
- Peer review cards with live statuses: `[Community Verified]`, `[Pending Review]`, `[Resolved]`.
- Upvote/Confirm (+1) button increasing report credibility index.
- Resolution tracking ("Mark Resolved").
- Anti-spam protection preventing repeated duplicate submissions.

---

### 9. Smart Nearby Proximity Alert Radar (Module 9)
- Automated 2 km GPS geofence radar.
- Web Audio API synthesized warning tone.
- In-app floating HUD warning banner with live distance countdown.
- Native browser push notification integration.

---

### 10. Original 10-Slide Presentation Deck Viewer
- Accessible directly from top navigation (`View Slide Deck`).
- Allows presenting the original 10-slide PPT with keyboard arrows (`←` / `→` / `Esc`).

---

## 🛠️ Technology Stack
- **Frontend**: HTML5, CSS3, Tailwind CSS (Dark Cyber-Slate & High-Contrast Safety Neons).
- **Geospatial & Mapping**: Leaflet.js (1.9.4), Leaflet.heat (0.2.0), OpenStreetMap, Nominatim Geocoding, OSRM Routing.
- **Analytics & Data Visualizations**: Chart.js.
- **Icons & Effects**: Lucide Icons, Canvas-Confetti, Web Audio API.
- **Backend & Cloud Architecture**: Prepared for Supabase Realtime Database & Supabase Storage.

---

## 🚀 How to Run Locally

1. Open a terminal or file explorer:
   ```bash
   cd C:\Users\saanv\.gemini\antigravity\scratch\saferoute-ai
   ```
2. Double click or open `index.html` in any browser:
   ```bash
   start index.html
   ```
