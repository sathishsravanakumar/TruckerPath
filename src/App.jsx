import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NotificationPanel from './components/NotificationPanel';
import DispatchBoard from './pages/DispatchBoard';
import FleetTwin from './pages/FleetTwin';
import AlertsFeed from './pages/AlertsFeed';
import BillingPipeline from './pages/BillingPipeline';
import DriverProfile from './pages/DriverProfile';
import CostIntelligence from './pages/CostIntelligence';
import Drivers from './pages/Drivers';
import bgImage from './assets/logistics_bg.png';

export default function App() {
  useEffect(() => {
    document.body.style.backgroundImage = `url(${bgImage})`;
  }, []);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div className="stat-card" style={{ flex: 'none', padding: '14px 24px', margin: 0 }}>
            <h3 style={{ marginBottom: '6px' }}>Operations Console</h3>
            <div className="val" style={{ fontSize: '18px' }}>{new Date().toDateString()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NotificationPanel />
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)' }}>
              <User size={20} />
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/dispatch" replace />} />
          <Route path="/dispatch" element={<DispatchBoard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/drivers/:id" element={<DriverProfile />} />
          <Route path="/fleet-twin" element={<FleetTwin />} />
          <Route path="/alerts" element={<AlertsFeed />} />
          <Route path="/billing" element={<BillingPipeline />} />
          <Route path="/cost" element={<CostIntelligence />} />
        </Routes>
      </main>
    </div>
  );
}
