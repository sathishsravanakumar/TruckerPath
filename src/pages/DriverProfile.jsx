import { useParams, useNavigate } from 'react-router-dom';
import { DRIVERS, INITIAL_LOADS, DRIVER_DOCS } from '../data/mockData';

function HealthBar({ value, max = 100, height = 8, width = '100%' }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '6px', height, overflow: 'hidden', width }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '6px', transition: 'width 0.5s ease' }} />
    </div>
  );
}

const STATUS_COLOR = { valid: 'var(--green)', expiring: 'var(--amber)', expired: 'var(--red)' };
const STATUS_BG    = { valid: 'rgba(74,222,128,0.1)', expiring: 'rgba(251,191,36,0.1)', expired: 'rgba(248,113,113,0.1)' };

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const driver = DRIVERS.find(d => d.id === Number(id));

  if (!driver) {
    return (
      <div className="animate-fade" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ marginBottom: '8px' }}>Driver Not Found</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>No driver with ID #{id} exists.</p>
        <button className="btn" onClick={() => navigate('/drivers')}>← Back to Roster</button>
      </div>
    );
  }

  const driverLoads = INITIAL_LOADS.filter(l =>
    l.driverId === driver.id || (l.candidates && l.candidates.includes(driver.id))
  );
  const docs = DRIVER_DOCS[driver.id] || [];

  const healthLabel = driver.score >= 80 ? 'Excellent' : driver.score >= 60 ? 'Good' : driver.score >= 40 ? 'At Risk' : 'Critical';
  const healthBorder = driver.health === 'critical' ? 'var(--red)' : driver.health === 'warning' ? 'var(--amber)' : 'var(--green)';
  const hosColor = driver.hos < 2 ? 'var(--red)' : driver.hos < 4 ? 'var(--amber)' : 'var(--green)';
  const fatigueColor = driver.fatigue === 'high' ? 'var(--red)' : driver.fatigue === 'medium' ? 'var(--amber)' : 'var(--green)';

  const loadStatusColor = (status) => {
    if (status === 'assigned') return 'var(--green)';
    if (status === 'blocked') return 'var(--red)';
    if (status === 'ready') return 'var(--blue)';
    return 'var(--amber)';
  };

  return (
    <div className="animate-fade">
      {/* Back nav */}
      <button
        className="btn secondary"
        style={{ marginBottom: '24px', fontSize: '12px', padding: '6px 14px' }}
        onClick={() => navigate('/drivers')}
      >
        ← Back to Roster
      </button>

      {/* Hero header */}
      <div className="glass-card" style={{ marginBottom: '20px', borderLeft: `4px solid ${healthBorder}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '20px', color: '#000', flexShrink: 0 }}>
            {driver.initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{driver.name}</h2>
              <span className={`badge ${driver.status === 'available' ? 'green' : 'red'}`}>
                {driver.status === 'available' ? 'AVAILABLE' : 'BLOCKED'}
              </span>
            </div>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{driver.location} · {driver.truck}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              className="btn secondary"
              style={{ fontSize: '12px' }}
              onClick={() => navigate(`/fleet-twin?truck=${driver.truck}`)}
            >
              View in Digital Twin →
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-row" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Safety Score</h3>
          <div className="val" style={{ color: driver.score >= 80 ? 'var(--green)' : driver.score >= 50 ? 'var(--amber)' : 'var(--red)' }}>
            {driver.score}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>/ 100</div>
        </div>
        <div className="stat-card">
          <h3>On-Time %</h3>
          <div className="val" style={{ color: 'var(--green)' }}>{driver.onTime}%</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>delivery rate</div>
        </div>
        <div className="stat-card">
          <h3>HOS Remaining</h3>
          <div className="val" style={{ color: hosColor }}>{driver.hos}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>hours</div>
        </div>
        <div className="stat-card">
          <h3>Fatigue Level</h3>
          <div className="val" style={{ color: fatigueColor, fontSize: '22px', textTransform: 'capitalize' }}>{driver.fatigue}</div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>current status</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Health score + performance */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Health Overview</h3>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Overall Health Score</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: healthBorder }}>{healthLabel}</span>
            </div>
            <HealthBar value={driver.score} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>0</span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{driver.score}/100</span>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>100</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Last Inspection</span>
              <span className="tm-val" style={{ color: driver.inspection > 30 ? 'var(--red)' : driver.inspection > 14 ? 'var(--amber)' : 'var(--text)' }}>{driver.inspection} days ago</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Fatigue</span>
              <span className="tm-val" style={{ color: fatigueColor, textTransform: 'capitalize' }}>{driver.fatigue}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">HOS Buffer</span>
              <span className="tm-val" style={{ color: hosColor }}>{driver.hos} hrs</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Truck</span>
              <span className="tm-val">{driver.truck}</span>
            </div>
          </div>
        </div>

        {/* Performance & achievements */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Performance & Notes</h3>
          {driver.reasons && driver.reasons.length > 0 && (
            <div style={{ marginBottom: driver.warnings && driver.warnings.length > 0 ? '16px' : 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Strengths</div>
              {driver.reasons.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '8px', marginBottom: '6px', fontSize: '12px', color: 'var(--green)' }}>
                  {r}
                </div>
              ))}
            </div>
          )}
          {driver.warnings && driver.warnings.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Warnings</div>
              {driver.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', marginBottom: '6px', fontSize: '12px', color: 'var(--red)' }}>
                  {w}
                </div>
              ))}
            </div>
          )}
          {(!driver.reasons || driver.reasons.length === 0) && (!driver.warnings || driver.warnings.length === 0) && (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>No performance notes available.</p>
          )}
        </div>
      </div>

      {/* Recent Loads */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>Active & Assigned Loads</h3>
        {driverLoads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
            <p>No active loads assigned to this driver.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                {['LOAD', 'ROUTE', 'CARGO', 'RATE', 'MILES', 'STATUS'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '1px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {driverLoads.map(load => (
                <tr key={load.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: '700' }}>#{load.id}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px' }}>{load.pickup} → {load.delivery}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{load.cargo}</td>
                  <td style={{ padding: '12px 14px', fontWeight: '600' }}>${load.rate.toLocaleString()}</td>
                  <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{load.miles} mi</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: loadStatusColor(load.status), fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>
                      {load.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Documents */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '20px' }}>Compliance Documents</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
          {docs.map((doc, i) => (
            <div key={i} style={{ background: STATUS_BG[doc.status], border: `1px solid ${STATUS_COLOR[doc.status]}30`, borderRadius: '12px', padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>{doc.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Expires: {doc.expiry}</div>
              </div>
              <span className={`badge ${doc.status === 'valid' ? 'green' : doc.status === 'expiring' ? 'amber' : 'red'}`}>
                {doc.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
