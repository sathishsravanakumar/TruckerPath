# TruckerPath — Fleet Operations & Intelligence Platform

TruckerPath is a full-stack fleet management SaaS platform built for modern logistics teams. It combines a marketing landing page, role-based login flows, a fully featured admin operations dashboard, a backhaul load marketplace, and a customer shipment portal — all in a premium amber-accented dark UI.

---

## Features

### Landing Page
- Animated US freight network map (10 hub cities, 17 freight corridors, live truck simulation)
- Feature highlights, pricing tiers with monthly/annual toggle, and FAQ section
- Calls-to-action routing to admin (fleet manager) and driver/customer login flows

### Authentication
- **Login Chooser** — role selector screen (Admin / Driver & Shipper)
- **Admin Login** — fleet manager login with credentials (`admin@truckerpath.com` / `admin123`)
- **Driver / Customer Login & Signup** — separate portal entry (`user@company.com` / `user123`)

### Admin Dashboard — Fleet Command Center

#### Smart Dispatch
- AI-scored load assignments based on HOS, proximity, and return-load probability
- Driver candidate comparison with safety scores and availability
- HOS relay detection with smart relay-point recommendations
- Bulk "Assign All Ready" action and status filter bar (Ready / Needs Input / Blocked / Assigned)

#### Driver Management
- Full roster with safety scores, HOS status, and fatigue health bars
- Per-driver profile page: KPIs, load history, compliance documents
- Status filters: All / On Duty / At Risk / Blocked
- Deep-link to 3D Digital Twin from any driver card

#### 3D Digital Twin
- Interactive Three.js truck model with per-component fault highlighting
- Live telemetry: tire PSI, brake pad life, fuel level, HOS remaining
- Bloom and ambient occlusion post-processing (N8AO)
- Export diagnostics as JSON

#### Live Alert Feed
- Critical fleet alerts with AI-recommended actions
- Severity filter tabs: All / Critical / Warning / Info
- OSM tactical map overlay via Leaflet showing relay intercept paths

#### Backhaul Load Marketplace
- Broadcast available backhaul capacity on active truck routes
- AI-ranked carrier bids evaluated through a 4-gate eligibility pipeline:
  - **G1** Commodity compatibility matrix (8 cargo types)
  - **G2** GVWR headroom (primary + backhaul weight ≤ truck GVWR)
  - **G3** LIFO route sequencing (drop stop must precede next primary stop)
  - **G4** Volumetric trailer capacity (combined load volume ≤ trailer volume)
- Net value ranking: `bid_price − detour_cost`, tie-broken by lowest detour
- Matching runs server-side (FastAPI) with automatic browser fallback if backend is unavailable
- Award flow updates fleet state and logs the winning bid reason

#### Billing Pipeline
- Document upload (BOL, POD, Fuel Receipt) with drag-and-drop
- Simulated AI OCR extraction with live terminal output
- Invoice approval workflow with margin tracking
- Full billing history ledger

#### Cost Intelligence
- Date range selector: This Week / Last Week / This Month
- Per-driver cost breakdown: miles, fuel spend, deadhead, margin
- Revenue vs. cost bar charts with net margin KPIs

### Customer Portal (User Dashboard)
- Shipment booking form with commodity type, weight, trailer type, and pickup window
- 8 commodity types: General, Reefer, Hazmat, Pharma, Automotive, Agriculture, Industrial, Retail
- Booking confirmation with shipment reference ID

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| State | React Context API (`useFleetState`) |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom, N8AO) |
| Maps | Leaflet via `react-leaflet` (OpenStreetMap / CartoDB) |
| Icons | `lucide-react` |
| Fonts | Syne (display) + DM Sans (body) via Google Fonts |
| Styling | Custom CSS variables — amber premium dark theme |
| Backend | FastAPI + uvicorn (Python) |
| Data validation | Pydantic v2 |
| Database | SQLite 3 (`backend/marketplace.db`) |
| Testing | Vitest + `@testing-library/react` + `fast-check` (property-based) |

---

## Project Structure

```
├── backend/
│   ├── __init__.py
│   ├── main.py               # FastAPI app — POST /marketplace/match
│   ├── models.py             # Pydantic request/response models
│   ├── matching.py           # Eligibility filter + net value ranking
│   ├── database.py           # SQLite connection + table creation
│   ├── seed.py               # Demo opportunity + bids seeder
│   ├── requirements.txt
│   └── marketplace.db        # Created on first run (gitignored)
├── src/
│   ├── components/
│   │   ├── TpLogo.jsx
│   │   ├── Sidebar.jsx
│   │   ├── NotificationPanel.jsx
│   │   ├── LoginChooser.jsx
│   │   ├── AdminLogin.jsx
│   │   └── UserLogin.jsx
│   ├── data/
│   │   └── mockData.js       # DRIVERS, LOADS, ALERTS, BACKHAUL_OPPORTUNITIES, TRUCK_GVWR
│   ├── hooks/
│   │   └── useFleetState.jsx # Global fleet state via React Context
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── DispatchBoard.jsx
│   │   ├── Drivers.jsx
│   │   ├── DriverProfile.jsx
│   │   ├── FleetTwin.jsx
│   │   ├── AlertsFeed.jsx
│   │   ├── BillingPipeline.jsx
│   │   ├── CostIntelligence.jsx
│   │   └── LoadMarketplace.jsx  # Backhaul marketplace — calls FastAPI or JS fallback
│   ├── test/
│   │   └── setup.js
│   ├── utils/
│   │   ├── marketplace.js       # Browser-side matching algorithm (fallback)
│   │   └── marketplace.test.js  # Vitest unit + property-based tests
│   ├── App.jsx                  # View state machine + admin panel layout
│   ├── main.jsx                 # Entry point: BrowserRouter + FleetProvider
│   └── index.css                # Design system & CSS variables
├── orders.csv                   # Sample freight order data
└── vite.config.js               # Vite + Vitest config
```

---

## Routes

| Path | Page |
|---|---|
| *(state: landing)* | Marketing Landing Page |
| *(state: chooser)* | Login Role Chooser |
| *(state: admin-login)* | Admin Login |
| *(state: user-login / user-signup)* | Customer Login / Signup |
| *(state: user-dash)* | Customer Dashboard |
| `/dispatch` | Smart Dispatch Board |
| `/drivers` | Driver Roster |
| `/drivers/:id` | Driver Profile |
| `/fleet-twin` | 3D Digital Twin |
| `/alerts` | Live Alert Feed |
| `/billing` | Billing Pipeline |
| `/cost` | Cost Intelligence |
| `/marketplace` | Backhaul Load Marketplace |

> Navigation between Landing → Login → Dashboard is managed via a React `useState` view state machine in `App.jsx`. Admin sub-pages use React Router for client-side routing within the dashboard.

---

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173/Load-Lorry/`

### Backend

```bash
cd backend
pip install -r requirements.txt

# Seed the demo opportunity and bids (run once)
python -m backend.seed

# Start the API server
uvicorn backend.main:app --reload --port 8000
```

The marketplace page calls `http://localhost:8000/marketplace/match` directly (CORS is enabled for `localhost:5173`). If the backend is not running, the page falls back automatically to the browser-side JavaScript implementation — same algorithm, same results, with a `Demo mode` indicator.

### Other Commands

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build
npm run lint     # ESLint check
npm test         # Run Vitest unit + property-based tests
```

---

## Backend API

### `POST /marketplace/match`

Accepts a `MatchRequest` payload, runs the 4-gate eligibility filter and net value ranking, and returns a `MatchResponse`.

**Request body (excerpt)**

```json
{
  "truck_id": "TRUCK-012",
  "primary_load_weight": 56000,
  "truck_gvwr": 80000,
  "primary_cargo_type": "General",
  "truck_certified_commodities": ["General", "Reefer"],
  "next_stop_index": 2,
  "primary_load_volume_cuft": 2660,
  "truck_trailer_volume_cuft": 3800,
  "bids": [...]
}
```

**Response**

```json
{
  "eligible_bids": [...],
  "ineligible_bids": [...],
  "recommended_bid_id": "BID-002"
}
```

### `GET /health`

Returns `{ "status": "ok", "service": "backhaul-marketplace" }`.

---

## Database Schema

SQLite database at `backend/marketplace.db` — created automatically on first startup.

| Table | Purpose |
|---|---|
| `opportunities` | Backhaul broadcast events — truck, capacity, primary load |
| `bids` | Carrier bids with eligibility status, net value, and rank |
| `awards` | Winning bid records with reason and timestamp |

---

## Design System

The UI uses a custom CSS variable system defined in `src/index.css`:

| Token | Value | Usage |
|---|---|---|
| `--amber` | `#F59E0B` | Primary accent, buttons, active nav |
| `--bg` | `#05080F` | Page background |
| `--card` | `#0F1525` | Card / panel surfaces |
| `--green` | `#10B981` | Success, available status |
| `--red` | `#EF4444` | Alerts, critical status |
| `--font-display` | Syne | Headings, stat values |
| `--font-body` | DM Sans | Body text, labels |

---

## License

Internal project — for demonstration purposes only.
