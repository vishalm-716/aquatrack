# AquaTrack — India Coral Reef Conservation Operations Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-0E7C86.svg)](#)
[![Geospatial](https://img.shields.io/badge/Workspace-Leaflet%20India%20Reef%20Map-0B2E3D.svg)](#)
[![Role-Based](https://img.shields.io/badge/Security-JWT%20RBAC-E8734A.svg)](#)

AquaTrack is an enterprise-grade full-stack marine conservation operations management platform built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js). Tailored specifically for Indian coral reef ecosystems, marine biology teams, scientific diving stations, and Marine Protected Area (MPA) managers, it unifies fragmented field transects, thermal bleaching tracking, benthic biodiversity sightings, and coral nursery outplant survival metrics into a centralized geographic operations workspace.

> **Illustrative Demo Data Notice**:
> The seeded dataset across Gulf of Mannar, Gulf of Kachchh, Lakshadweep, and Andaman & Nicobar contains synthetic demonstration records for system validation and conservation workflow planning. It does not represent official government or marine agency observations. Bleaching visualization thresholds (<10% teal, 10–30% amber, ≥30% coral-orange) are demo interface categorizations, not official scientific risk classifications.

---

## Core Geographic Scope & Indian Reef Stations

AquaTrack features persistent, stable site records across all major Indian coral reef regions:
1. **Gulf of Mannar (Tamil Nadu)**: Mandapam Reef, Shingle Island Reef, Krusadai Island.
2. **Gulf of Kachchh (Gujarat)**: Pirotan Island Marine National Park, Narara Reef Flat.
3. **Lakshadweep Archipelago**: Kavaratti Island Atoll, Bangaram Atoll & Lagoon, Kadmat Island Reef.
4. **Andaman & Nicobar Islands**: North Bay Reef (Port Blair), Havelock Island (Swaraj Dweep — Elephant Beach), Neil Island (Shaheed Dweep — Bharatpur Reef), Great Nicobar Biosphere (Campbell Bay).

---

## Key Features

### 1. Interactive India Reef Map (`/map`)
- Built with **React Leaflet + Leaflet** and OpenStreetMap tiles with visible attribution.
- Initial bounds cover mainland India and both offshore island chains (Lakshadweep and Andaman & Nicobar).
- Markers color-coded by latest recorded bleaching:
  - **Teal**: Recorded bleaching < 10% (Low stress)
  - **Amber**: Recorded bleaching 10% to < 30% (Moderate stress)
  - **Coral-Orange**: Recorded bleaching ≥ 30% (High stress alert)
- Dynamic marker popups and direct inspection modal showing site coordinates, MPA status, survey history, species count, and restoration plots.
- Unified filter bar: Region, bleaching tier, restoration presence, and search keyword.
- Seamless **Tabular Directory fallback** for low-bandwidth or offline environments with unmapped records tracking.

### 2. Operational Analytics & Monitoring Dashboard (`/`)
- Server-side MongoDB aggregation pipelines with honest metric definitions:
  - **Mean Recorded Coral Cover (%)**: Real aggregated mean across transect records.
  - **Mean Recorded Bleaching (%)**: Real thermal bleaching percentage.
  - **Bleaching Alerts (≥30%)**: Count of records exceeding demo threshold.
  - **Mapped Sites vs Unmapped Records**: Clear count of geo-located stations and historical unmapped surveys.
- Interactive **Recharts** visualizations:
  - **Coral Cover % by Site**: Bar chart with mean coral cover and sample size (`n` surveys).
  - **Thermal Bleaching Trajectory**: Longitudinal time-series with monthly aggregation and contributing sample sizes.
  - **Restoration Survivorship**: Comparative plot of verified nursery survival percentages.
  - **Logged Biodiversity by Category**: Documented sightings across Scleractinia, Ichthyofauna, and Benthic Invertebrates.
- Unified filter bar (Region, Date range, Restoration presence) that updates cards and charts in unison.

### 3. Integrated Site Detail View & Activity Timeline
- Comprehensive modal drawer linking surveys, species sightings, and restoration activities in chronological order.
- Direct drill-down from both the India Map and the Surveys Logbook.
- Photographic evidence lightbox for transect photos and nursery before/after comparisons.

### 4. End-to-End Vertical Slice
- Submitting a new survey (e.g. from Mandapam Reef or a new Indian coordinate) automatically associates or creates the `Site`, persists in MongoDB, and immediately reflects on the India Reef Map and Dashboard aggregations upon refetch.

---

## Database Architecture (5 Collections)

### 1. `Site`
- `name`: Unique station designation.
- `region`: Enum `['Gulf of Mannar', 'Gulf of Kachchh', 'Lakshadweep', 'Andaman & Nicobar Islands', 'Other']`.
- `stateOrUT`: State / Union Territory.
- `coordinates`: `{ lat, lng }` validated WGS 84 GPS decimal coordinates.
- `depthRange`: `{ min, max }` in meters.
- `isMarineProtectedArea`: Boolean flag.
- `isRestrictedCoordinates`: Boolean (enables coordinate privacy redaction for public viewers).

### 2. `Survey`
- `siteId`: Reference to `Site` (stable identifier).
- `location`: Freeform site description (backwards-compatible).
- `region`: Geographic region name.
- `gpsLat` / `gpsLng`: Validated decimal coordinates (-90 to +90, -180 to +180).
- `depth`: Depth in meters (≥ 0).
- `coralCoverPercent`: Live substratum coral cover (0 to 100%).
- `bleachingPercent`: Substrate bleaching percentage (0 to 100%).
- `photoUrl`: Multipart photographic transect upload.
- `surveyedBy`: Linked field researcher (User ObjectId).
- `date`: Survey timestamp.
- `status`: Enum `['pending', 'verified', 'rejected']`.

### 3. `Species`
- `name`: Taxon scientific or common name.
- `type`: Enum `['coral', 'fish', 'invertebrate']`.
- `siteId`: Associated `Site`.
- `location`: Location name.
- `count`: Integer observed count (≥ 1).
- `sightingDate`: Observation timestamp.
- `linkedSurvey`: Optional reference to transect `Survey`.

### 4. `Restoration`
- `siteName`: Nursery or outplant plot designation.
- `siteId`: Associated `Site`.
- `coralSpecies`: Outplanted scleractinian coral taxon.
- `datePlanted`: Outplant timestamp.
- `survivalRatePercent`: Verified survival percentage (0 to 100%).
- `beforePhotoUrl`: Baseline T₀ photo.
- `afterPhotoUrl`: Progression T₁ photo.
- `loggedBy`: Linked researcher or marine officer.

### 5. `User`
- `name`, `email`, `password` (bcrypt salted), `role` (`'admin'`, `'researcher'`, `'public'`).

---

## Role-Based Access Control (RBAC) & Privacy Policy

| Capability | Agency Admin | Field Researcher | Public Viewer |
|---|:---:|:---:|:---:|
| View Dashboard & Analytics |  |  |  |
| Inspect Interactive India Map |  |  |  |
| Filter Surveys & Species Register |  |  |  |
| View Site Timeline & Records |  |  |  |
| Log New Reef Transect Survey |  |  | ❌ |
| Register Specimen Sighting |  |  | ❌ |
| Register Restoration Plot |  |  | ❌ |
| Update Survival Rates |  |  | ❌ |
| View Restricted Coordinates (Exact) |  |  | ❌ *(Rounded ~10km)* |
| View Surveyor Contact Emails |  |  | ❌ *(Redacted)* |
| Administer User Accounts |  | ❌ | ❌ |

---

## Default Seed Credentials

The database seed is **100% idempotent**—it verifies records by unique keys and never deletes or overwrites existing user data:

| Role | Email | Password |
|---|---|---|
| **Agency Admin** | `admin@aquatrack.org` | `admin123` |
| **Field Researcher** | `arun@aquatrack.org` | `researcher123` |
| **Field Researcher** | `priya@aquatrack.org` | `researcher123` |
| **Public Viewer** | `guest@aquatrack.org` | `guest123` |

---

## Running the Application Locally

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally at `mongodb://127.0.0.1:27017`

### 1. Backend Service
```bash
cd server
npm install
node seed.js    # Run idempotent India conservation seed
npm start       # Launches Express on port 5000
```

### 2. Frontend Application
```bash
cd client
npm install
npm run build   # Validates Vite production bundle
npm run dev     # Starts Vite dev server on http://localhost:5173
```

Navigate to `http://localhost:5173` to access the platform.
