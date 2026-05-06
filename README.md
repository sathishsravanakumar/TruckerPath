# TruckerPath — Fleet Operations & Intelligence Dashboard

TruckerPath is a high-fidelity fleet management platform that unifies dispatching, driver management, diagnostics, and billing into a single glassmorphism interface. Built for modern logistics teams with AI-driven load matching, 3D digital twinning, and automated billing workflows.

## Modules

### Smart Dispatch
- AI-scored load assignments based on HOS, proximity, and return-load probability
- Driver candidate comparison with performance scores and safety ratings
- HOS relay detection with smart relay-point recommendations
- Bulk "Assign All Ready" action and status filter bar

### Driver Management
- Full driver roster with safety scores, HOS status, and fatigue levels
- Per-driver profile page: KPIs, health score, load history, compliance documents
- Status filters: All / On Duty / At Risk / Blocked
- Deep-link to Digital Twin from any driver card

### 3D Digital Twin
- Interactive Three.js truck model with per-component fault highlighting
- Live telemetry: tire PSI, brake pad life, fuel level, HOS remaining
- URL deep-linking (`/fleet-twin?truck=TRUCK-007`)
- Export Diagnostics as JSON

### Live Alert Feed
- Critical fleet alerts with AI-recommended actions
- Severity filter tabs: All / Critical / Warning / Info
- OSM tactical map overlay via Leaflet showing relay intercept paths

### Billing Pipeline
- Document upload (BOL, POD, Fuel Receipt) with drag-and-drop
- Simulated AI OCR extraction with live terminal output
- Invoice approval workflow with auto-notification on send
- Full billing history ledger with margin tracking

### Cost Intelligence
- Date range selector: This Week / Last Week / This Month
- Per-driver cost breakdown table
- Revenue, fuel, maintenance, and margin analysis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Routing | React Router v6 |
| State | React Context API |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom, N8AO) |
| Maps | Leaflet via `react-leaflet` (OpenStreetMap / CartoDB) |
| Icons | `lucide-react` |
| Styling | Custom CSS variables — glassmorphism dark theme |

---

## Project Structure

```
src/
├── assets/          # Background imagery
├── components/      # Shared UI components
│   ├── Sidebar.jsx
│   ├── NotificationPanel.jsx
│   └── TruckModel.jsx
├── data/
│   └── mockData.js  # All mock data (DRIVERS, LOADS, ALERTS, etc.)
├── hooks/
│   └── useFleetState.jsx  # Global fleet state via React Context
├── pages/           # One file per route
│   ├── DispatchBoard.jsx
│   ├── Drivers.jsx
│   ├── DriverProfile.jsx
│   ├── FleetTwin.jsx
│   ├── AlertsFeed.jsx
│   ├── BillingPipeline.jsx
│   └── CostIntelligence.jsx
├── App.jsx          # Router shell + layout
├── main.jsx         # Entry point with BrowserRouter + FleetProvider
└── index.css        # Design system & CSS variables
```

## Routes

| Path | Page |
|------|------|
| `/dispatch` | Smart Dispatch Board |
| `/drivers` | Driver Roster |
| `/drivers/:id` | Driver Profile |
| `/fleet-twin` | 3D Digital Twin |
| `/alerts` | Live Alert Feed |
| `/billing` | Billing Pipeline |
| `/cost` | Cost Intelligence |

---

## Getting Started

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`.

---

## License

Internal project — for demonstration purposes only.
