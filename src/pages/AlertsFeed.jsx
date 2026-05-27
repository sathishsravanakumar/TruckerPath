import { useState } from 'react';
import { Zap } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useFleetState } from '../hooks/useFleetState';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const SEVERITY_FILTERS = ['all', 'critical', 'warning', 'info'];

export default function AlertsFeed() {
  const { alerts, handleDismissAlert } = useFleetState();
  const [showMap, setShowMap] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = severityFilter === 'all' ? alerts : alerts.filter(a => a.severity === severityFilter);

  const handleDismissAll = () => {
    alerts.forEach(a => handleDismissAlert(a.id));
  };

  return (
    <div className="animate-fade">
      {showMap && (
        <div className="animate-fade" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '900px', height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--blue)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: 'var(--blue)' }}>Tactical Relay Overview</h3>
                <p className="small">Visualizing Relay Point: I-10 Exit 202 · Tucson, AZ</p>
              </div>
              <button className="btn secondary" onClick={() => setShowMap(false)}>Close Map</button>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a' }}>
              <MapContainer center={[32.5, -109.5]} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[33.4484, -112.0740]}><Popup>Phoenix: Unit-12 (Raj Patel)</Popup></Marker>
                <Marker position={[31.7619, -106.4850]}><Popup>El Paso: Unit-09 (Lisa Rodriguez)</Popup></Marker>
                <Marker position={[32.2226, -110.9747]}><Popup><strong>RELAY POINT: TUCSON</strong><br/>Unit-07 (Frank Chen)</Popup></Marker>
              </MapContainer>
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 500, background: 'rgba(0,0,0,0.8)', padding: '12px', borderRadius: '8px', border: '1px solid var(--blue)' }}>
                <p className="small" style={{ color: 'var(--amber)' }}>● LIVE OSM FEED ACTIVE</p>
                <p className="small" style={{ color: 'var(--muted)' }}>Region: SW - US (AZ/TX)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="s-tag">Live Monitoring</div>
          <h2>Alert Feed</h2>
          {alerts.length > 0 && <span className="badge red" style={{ fontSize: '11px', marginTop: '6px', display: 'inline-block' }}>{alerts.length} UNRESOLVED</span>}
        </div>
        {alerts.length > 0 && (
          <button className="btn secondary" style={{ fontSize: '11px' }} onClick={handleDismissAll}>
            Mark All Resolved
          </button>
        )}
      </div>

      {/* Severity filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {SEVERITY_FILTERS.map(s => (
          <button key={s} className={`btn ${severityFilter === s ? '' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'capitalize' }}
            onClick={() => setSeverityFilter(s)}>
            {s === 'all' ? `All (${alerts.length})` : s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🛡️</div>
          <h3>All Systems Clear</h3>
          <p className="small">No active alerts matching the selected filter.</p>
        </div>
      ) : (
        filtered.map(a => (
          <div key={a.id} className="glass-card" style={{ borderLeft: '4px solid var(--red)', padding: '24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span className="badge red" style={{ letterSpacing: '1px' }}>{a.severity.toUpperCase()}</span>
              <span className="small" style={{ color: 'var(--muted)' }}>3 min ago</span>
            </div>
            <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>{a.title}</h3>
            <p style={{ marginBottom: '16px', color: 'rgba(208, 221, 231, 0.8)' }}>{a.message}</p>

            <div className="ai-insight" style={{ marginBottom: '20px', background: 'rgba(57, 171, 212, 0.05)', borderColor: 'var(--blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Zap size={16} color="var(--blue)" />
                <strong style={{ fontSize: '11px', color: 'var(--blue)', letterSpacing: '0.5px' }}>AI RECOMMENDED ACTION</strong>
              </div>
              <p style={{ fontSize: '13px' }}>{a.action}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn" style={{ background: 'var(--green)', color: '#000' }} onClick={() => {
                alert('Relay Approved: Dispatching Raj Patel to Exit 202 Tucson.');
                handleDismissAlert(a.id);
              }}>Approve Relay & Reroute</button>
              <button className="btn secondary" onClick={() => handleDismissAlert(a.id)}>Dismiss Alert</button>
              <button className="btn secondary" style={{ border: 'none', background: 'transparent' }} onClick={() => setShowMap(true)}>View Logistics Map →</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
