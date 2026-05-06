import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DRIVERS } from '../data/mockData';

const STATUS_FILTERS = ['all', 'available', 'blocked'];

function HealthBar({ value, max = 100 }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px', overflow: 'hidden', width: '80px' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
    </div>
  );
}

export default function Drivers() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all' ? DRIVERS : DRIVERS.filter(d => {
    if (statusFilter === 'blocked') return d.health === 'critical';
    if (statusFilter === 'available') return d.status === 'available';
    return true;
  });

  const availableCount = DRIVERS.filter(d => d.status === 'available').length;
  const atRiskCount = DRIVERS.filter(d => d.health === 'warning').length;
  const criticalCount = DRIVERS.filter(d => d.health === 'critical').length;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px' }}>
        <h2>Driver Roster</h2>
        <p>Full fleet driver overview with safety scores and HOS status</p>
      </div>

      <div className="stat-row">
        <div className="stat-card"><h3>Total Drivers</h3><div className="val" style={{color:'var(--blue)'}}>{DRIVERS.length}</div></div>
        <div className="stat-card"><h3>Available</h3><div className="val" style={{color:'var(--green)'}}>{availableCount}</div></div>
        <div className="stat-card"><h3>At Risk</h3><div className="val" style={{color:'var(--amber)'}}>{atRiskCount}</div></div>
        <div className="stat-card"><h3>Critical</h3><div className="val" style={{color:'var(--red)'}}>{criticalCount}</div></div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {STATUS_FILTERS.map(s => (
          <button key={s} className={`btn ${statusFilter === s ? '' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'capitalize' }}
            onClick={() => setStatusFilter(s)}>
            {s === 'all' ? `All (${DRIVERS.length})` : s === 'available' ? `On Duty (${availableCount})` : `At Risk / Blocked (${criticalCount + atRiskCount})`}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filtered.map(driver => (
          <div key={driver.id} className="glass-card" style={{ padding: '24px', borderLeft: driver.health === 'critical' ? '4px solid var(--red)' : driver.health === 'warning' ? '4px solid var(--amber)' : '4px solid var(--green)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onClick={() => navigate(`/drivers/${driver.id}`)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(57,171,212,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            {/* Driver header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: '#000', flexShrink: 0 }}>
                {driver.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '800', fontSize: '16px' }}>{driver.name}</div>
                <div className="small" style={{ color: 'var(--muted)' }}>{driver.location} · {driver.truck}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: driver.score >= 80 ? 'var(--green)' : driver.score >= 50 ? 'var(--amber)' : 'var(--red)' }}>{driver.score}</div>
                <div className="small" style={{ color: 'var(--muted)' }}>Score</div>
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div className="small" style={{ color: 'var(--muted)', marginBottom: '4px' }}>HOS Remaining</div>
                <div style={{ fontWeight: '700', color: driver.hos < 2 ? 'var(--red)' : driver.hos < 4 ? 'var(--amber)' : 'var(--text)' }}>
                  {driver.hos} hrs
                </div>
              </div>
              <div>
                <div className="small" style={{ color: 'var(--muted)', marginBottom: '4px' }}>On-Time %</div>
                <div style={{ fontWeight: '700', color: 'var(--green)' }}>{driver.onTime}%</div>
              </div>
              <div>
                <div className="small" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Last Inspection</div>
                <div style={{ fontWeight: '700', color: driver.inspection > 30 ? 'var(--red)' : driver.inspection > 14 ? 'var(--amber)' : 'var(--text)' }}>
                  {driver.inspection}d ago
                </div>
              </div>
              <div>
                <div className="small" style={{ color: 'var(--muted)', marginBottom: '4px' }}>Fatigue</div>
                <div style={{ fontWeight: '700', color: driver.fatigue === 'high' ? 'var(--red)' : driver.fatigue === 'medium' ? 'var(--amber)' : 'var(--green)', textTransform: 'capitalize' }}>
                  {driver.fatigue}
                </div>
              </div>
            </div>

            {/* Health score bar */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="small" style={{ color: 'var(--muted)' }}>Health Score</span>
                <span className="small" style={{ color: 'var(--muted)' }}>{driver.score}/100</span>
              </div>
              <HealthBar value={driver.score} />
            </div>

            {/* Warnings */}
            {driver.warnings && driver.warnings.length > 0 && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                {driver.warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: '12px', color: 'var(--red)', marginBottom: i < driver.warnings.length - 1 ? '4px' : 0 }}>{w}</p>
                ))}
              </div>
            )}

            {/* Action button */}
            <button
              className="btn secondary"
              style={{ width: '100%', fontSize: '12px' }}
              onClick={(e) => { e.stopPropagation(); navigate(`/fleet-twin?truck=${driver.truck}`); }}
            >
              View in Digital Twin →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
