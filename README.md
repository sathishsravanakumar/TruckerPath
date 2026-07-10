# TruckerPath — Fleet Operations & Intelligence Platform

TruckerPath is a full-stack fleet management SaaS platform built for modern logistics teams. It combines a marketing landing page, role-based login flows, a fully featured admin operations dashboard, and a customer shipment portal — all in a premium amber-accented dark UI.

---

## Features

### Landing Page
- Animated US freight network map (10 hub cities, 17 freight corridors, live truck simulation)
- Feature highlights, pricing tiers with monthly/annual toggle, and FAQ section
- Calls-to-action routing to admin (fleet manager) and driver/customer login flows

### Authentication
- **Login Chooser** — role selector screen (Admin / Driver & Shipper)
- **Admin Login** — fleet manager login with credentials
- **Driver / Customer Login & Signup** — separate portal entry

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
| Framework | React 19 + Vite 8 |
| Routing | React Router v7 |
| State | React Context API (`useFleetState`) |
| 3D | Three.js via `@react-three/fiber` + `@react-three/drei` |
| Post-processing | `@react-three/postprocessing` (Bloom, N8AO) |
| Maps | Leaflet via `react-leaflet` (OpenStreetMap / CartoDB) |
| Icons | `lucide-react` |
| Fonts | Syne (display) + DM Sans (body) via Google Fonts |
| Styling | Custom CSS variables — amber premium dark theme |

---

## Project Structure

```
src/
├── assets/
│   └── logo.png                  # TruckerPath logo
├── components/
│   ├── TpLogo.jsx                # Shared logo component
│   ├── Sidebar.jsx               # Admin nav sidebar
│   ├── NotificationPanel.jsx     # Header notification bell
│   ├── LoginChooser.jsx          # Role selector overlay
│   ├── AdminLogin.jsx            # Admin login form
│   └── UserLogin.jsx             # Driver/customer login & signup
├── data/
│   └── mockData.js               # DRIVERS, LOADS, ALERTS mock datasets
├── hooks/
│   └── useFleetState.jsx         # Global fleet state via React Context
├── pages/
│   ├── Landing.jsx               # Marketing landing page
│   ├── UserDashboard.jsx         # Customer shipment portal
│   ├── DispatchBoard.jsx         # Smart Dispatch
│   ├── Drivers.jsx               # Driver roster
│   ├── DriverProfile.jsx         # Per-driver detail page
│   ├── FleetTwin.jsx             # 3D Digital Twin
│   ├── AlertsFeed.jsx            # Live alerts + map
│   ├── BillingPipeline.jsx       # Invoice workflow
│   └── CostIntelligence.jsx      # P&L analytics
├── App.jsx                       # View state machine + admin panel layout
├── main.jsx                      # Entry point: BrowserRouter + FleetProvider
└── index.css                     # Design system & CSS variables
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

> Navigation between Landing → Login → Dashboard is managed via React `useState` view state machine in `App.jsx`. The admin sub-pages use React Router for client-side routing within the dashboard.

---

## Getting Started

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173/Load-Lorry/`

To run on a specific port:

```bash
npx vite --port 8001
```

### Other Commands

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint check
```

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
