# AquaTrack — Enterprise Marine Conservation Management Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-0E7C86.svg)](#)
[![Design](https://img.shields.io/badge/Design-Field--Data%20Ops%20UI-0B2E3D.svg)](#)
[![Role-Based](https://img.shields.io/badge/Security-JWT%20RBAC-E8734A.svg)](#)

AquaTrack is a production-grade full-stack marine conservation management system built on the **MERN** stack (MongoDB, Express.js, React.js, Node.js). Designed specifically for marine biologists, scientific diving teams, and marine protected area (MPA) administrators, it consolidates fragmented field logs, substrate transects, biodiversity sightings, and coral nursery outplant metrics into an integrated enterprise dashboard.

---

## Architecture & Technology Stack

### Backend
- **Node.js & Express.js**: RESTful service architecture with modular routing and controllers.
- **MongoDB & Mongoose**: 4 core collections (`User`, `Survey`, `Species`, `Restoration`) with geospatial coordinates, aggregation pipelines, and indexing.
- **JWT & Bcrypt.js**: Secure token-based authentication with 3-tier Role-Based Access Control (`admin`, `researcher`, `public`).
- **Multer**: Multi-part photographic evidence uploads for transect surveys and nursery before/after tracking.
- **Express-Validator**: Strict server-side schema verification for GPS coordinates (-90/+90, -180/+180), depth ranges, and percentages (0-100%).

### Frontend
- **React (Vite)**: Clean Single Page Application with component modularity.
- **React Router v6**: Protected route guards and nested operational layout.
- **Context API**: Global session persistence and authorization states.
- **Axios Interceptors**: Transparent JWT bearer injection and automated 401 token refresh/redirect handling.
- **Recharts**: High-density interactive data visualizations (site comparison bar charts, longitudinal bleaching trends, species taxa metrics).
- **Domain Design System**: Tailored marine conservation palette (Deep Ocean Navy `#0B2E3D`, Teal `#0E7C86`, Coral Stress `#E8734A`, Sand `#F7F9F8`), dual typography (Source Serif 4 + Inter), dense tabular data views, skeleton loaders, and zero AI-slop aesthetics.

---

## Database Schema (4 Collections)

### 1. `User`
| Field | Type | Attributes |
|---|---|---|
| `_id` | ObjectId | Primary Key |
| `name` | String | Required, trimmed |
| `email` | String | Unique, validated |
| `password` | String | Hashed with bcrypt (12 rounds) |
| `role` | String | Enum: `['admin', 'researcher', 'public']` |
| `createdAt` | Date | Auto-timestamp |

### 2. `Survey`
| Field | Type | Attributes |
|---|---|---|
| `location` | String | Survey site or MPA name |
| `gpsLat` / `gpsLng` | Number | Geo-decimal coordinates |
| `depth` | Number | Transect depth in meters |
| `coralCoverPercent` | Number | 0 – 100% |
| `bleachingPercent` | Number | 0 – 100% |
| `photoUrl` | String | Photographic transect record |
| `surveyedBy` | ObjectId (User) | Linked field researcher |
| `status` | String | Enum: `['pending', 'verified', 'rejected']` |
| `date` | Date | Survey date |

### 3. `Species`
| Field | Type | Attributes |
|---|---|---|
| `name` | String | Scientific or common taxon |
| `type` | String | Enum: `['coral', 'fish', 'invertebrate']` |
| `location` | String | Sighting reef or lagoon |
| `count` | Number | Integer >= 1 |
| `sightingDate` | Date | Observation timestamp |
| `linkedSurvey` | ObjectId (Survey) | Optional linked transect |

### 4. `Restoration`
| Field | Type | Attributes |
|---|---|---|
| `siteName` | String | Nursery or outplant grid designation |
| `coralSpecies` | String | Propagated scleractinian taxon |
| `datePlanted` | Date | Outplant date |
| `survivalRatePercent`| Number | 0 – 100% |
| `beforePhotoUrl` | String | T₀ baseline photographic record |
| `afterPhotoUrl` | String | T₁ progression photographic record |
| `loggedBy` | ObjectId (User) | Responsible marine officer |

---

## Role-Based Access Control (RBAC)

| Feature | Agency Admin | Field Researcher | Public Viewer |
|---|:---:|:---:|:---:|
| View Dashboard & Telemetry Charts |  |  |  |
| Search & Filter Surveys |  |  |  |
| Inspect Biodiversity Register |  |  |  |
| Submit New Reef Survey + Photos |  |  | ❌ |
| Log Specimen Sighting |  |  | ❌ |
| Register Coral Nursery Plot |  |  | ❌ |
| Update Restoration Survival Rates |  |  | ❌ |
| Verify / Reject Pending Surveys |  | ❌ | ❌ |
| Manage User Roles & Purge Staff |  | ❌ | ❌ |

---

## Default Seed Credentials

The database comes pre-seeded with 10 international reef survey sites, 16 biodiversity sightings, and 5 coral nursery plots. Quick 1-click credential buttons are also embedded directly on the Login screen for instant testing:

| Role | Email | Password |
|---|---|---|
| **Agency Admin** | `admin@aquatrack.org` | `admin123` |
| **Field Researcher** | `james@aquatrack.org` | `researcher123` |
| **Field Researcher** | `priya@aquatrack.org` | `researcher123` |
| **Public Viewer** | `guest@aquatrack.org` | `guest123` |

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally at `mongodb://127.0.0.1:27017` (or remote MongoDB Atlas connection string)

### 1. Backend Setup
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/aquatrack
JWT_SECRET=aquatrack_jwt_secret_key_2024
NODE_ENV=development
```

### 2. Seed Realistic Marine Data
```bash
cd server
npm run seed
```
This populates 10 surveys across Great Barrier Reef, Raja Ampat, Maldives, Red Sea, Belize, etc., along with biological sightings and restoration survival plots.

### 3. Start Backend Server
```bash
cd server
npm start
# Server listens on http://localhost:5000
```

### 4. Frontend Setup & Launch
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## Verification & Academic Review Highlights
- **Real persistence loop**: Submitting a survey from the "Log New Survey" form immediately writes to MongoDB and reflects instantaneously in the aggregated Reef Health Index and Bar Charts.
- **Enterprise data layout**: Persistent left navigation, custom Source Serif 4 + Inter typography scale, asymmetric dashboard hierarchy, and non-generic color palette.
- **Resilience**: Designed empty states, shimmer skeleton loaders, error boundaries, and input constraints on all numerical bounds.
