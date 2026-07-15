import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Plus, ArrowRight } from 'lucide-react';
import { DRIVERS, INITIAL_LOADS, TRUCK_GVWR } from '../data/mockData';
import { useFleetState } from '../hooks/useFleetState';
import LoadCreationDrawer from '../components/LoadCreationDrawer';

function DriverPill({ d, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
      background: selected ? 'var(--amber-dim)' : 'rgba(255,255,255,0.03)',
      border: selected ? '1px solid var(--amber-border)' : '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#000', flexShrink: 0 }}>{d.initials}</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '13px', color: selected ? 'var(--amber)' : 'var(--text)' }}>{d.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>Score {d.score} · {d.hos}h HOS</div>
        </div>
      </div>
    </div>
  );
}

function ReturnBar({ prob }) {
  const color = prob > 60 ? 'var(--green)' : prob > 40 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Return Load Probability</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color }}>{prob}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${prob}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

/** Shows a compact backhaul capacity indicator for assigned loads */
function BackhaulBadge({ load, driver }) {
  const truck = driver?.truck;
  const gvwr = TRUCK_GVWR[truck];
  if (!gvwr || !load.weight) return null;
  const utilizationPct = Math.round((load.weight / gvwr) * 100);
  if (utilizationPct >= 80) return null; // full enough — no backhaul opportunity

  const remainingPct = 100 - utilizationPct;
  const remainingLbs = gvwr - load.weight;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(245,158,11,0.06)',
      border: '1px solid rgba(245,158,11,0.2)',
      borderRadius: '10px',
      padding: '10px 14px',
      marginTop: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Mini capacity bar */}
        <div style={{ width: 80, height: 6, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ width: `${utilizationPct}%`, height: '100%', background: 'var(--amber)', borderRadius: 100 }} />
        </div>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>
            {utilizationPct}% loaded
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>
            {remainingLbs.toLocaleString()} lbs · {remainingPct}% space open
          </span>
        </div>
        <span className="badge amber" style={{ fontSize: 9, letterSpacing: '1px' }}>BACKHAUL ACTIVE</span>
      </div>
      <Link
        to="/marketplace"
        style={{ textDecoration: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="btn" style={{ padding: '5px 12px', fontSize: '10px', flexShrink: 0 }}>
          View Bids →
        </button>
      </Link>
    </div>
  );
}

const STATUS_BORDER = { blocked: 'var(--red)', needs_input: 'var(--amber)', ready: 'var(--green)', assigned: 'var(--green)' };
const STATUS_BG     = { blocked: 'rgba(239,68,68,0.06)', needs_input: 'rgba(245,158,11,0.04)', ready: 'rgba(16,185,129,0.04)', assigned: 'rgba(16,185,129,0.04)' };

export default function DispatchBoard() {
  const { loads, handleConfirmLoad, markDelivered } = useFleetState();
  const navigate = useNavigate();
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [showingAlt, setShowingAlt] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const readyCount   = loads.filter(l => ['ready', 'needs_input'].includes(l.status)).length;
  const blockedCount = loads.filter(l => l.status === 'blocked').length;
  const assignedCount= loads.filter(l => l.status === 'assigned').length;
  const liveCount    = 5 + (INITIAL_LOADS.length - loads.filter(l => l.status !== 'assigned').length);

  const pendingLoads = loads.filter(l => l.status !== 'assigned' && l.status !== 'delivered');
  const filtered = filterStatus === 'all' ? pendingLoads : pendingLoads.filter(l => l.status === filterStatus);

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'needs_input', label: 'Needs Input' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'ready', label: 'Ready' },
  ];

  return (
    <div className="animate-fade">
      <LoadCreationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div className="s-tag">Smart Dispatch</div>
          <h2>Morning Dispatch Queue</h2>
          <p style={{ marginTop: '4px' }}>AI-scored load assignments based on 48hr predictive routing</p>
        </div>
        <button className="btn" onClick={() => setDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '4px', flexShrink: 0 }}>
          <Plus size={14} /> New Load
        </button>
      </div>

      {/* KPI row */}
      <div className="stat-row">
        <div className="stat-card">
          <h3>Live Loads</h3>
          <div className="val" style={{ color: 'var(--amber)' }}>{liveCount}</div>
        </div>
        <div className="stat-card">
          <h3>Ready</h3>
          <div className="val" style={{ color: 'var(--green)' }}>{readyCount}</div>
        </div>
        <div className="stat-card">
          <h3>At Risk</h3>
          <div className="val" style={{ color: 'var(--amber)' }}>1</div>
        </div>
        <div className="stat-card">
          <h3>Blocked</h3>
          <div className="val" style={{ color: 'var(--red)' }}>{blockedCount}</div>
        </div>
      </div>

      {/* Filter + bulk action bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(({ key, label }) => (
          <button key={key} className={`btn ${filterStatus === key ? '' : 'secondary'}`}
            style={{ padding: '7px 16px', fontSize: '11px', textTransform: 'capitalize' }}
            onClick={() => setFilterStatus(key)}>
            {label}
          </button>
        ))}
        {readyCount > 0 && (
          <button className="btn" style={{ marginLeft: 'auto', background: 'var(--green)', fontSize: '11px', padding: '7px 16px' }}
            onClick={() => loads.filter(l => l.status === 'ready').forEach(l => handleConfirmLoad(l.id, null))}>
            ✓ Assign All Ready ({readyCount})
          </button>
        )}
      </div>

      {/* Load cards */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎉</div>
          <h3>All Loads Assigned</h3>
          <p style={{ marginTop: '6px' }}>No pending loads in the dispatch queue.</p>
        </div>
      ) : (
        filtered.map(load => {
          const driver = load.driverId ? DRIVERS.find(d => d.id === load.driverId) : null;
          const borderColor = STATUS_BORDER[load.status] || 'var(--border2)';
          const headerBg    = STATUS_BG[load.status]    || 'transparent';

          return (
            <div key={load.id} className="load-card" style={{ borderLeft: `3px solid ${borderColor}` }}>
              {/* Card header */}
              <div style={{ padding: '16px 22px', background: headerBg, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '15px' }}>Load #{load.id}</span>
                  <span className={`badge ${load.priority === 'high' ? 'red' : 'amber'}`}>{load.priority}</span>
                  {load.tag && <span className={`badge ${load.status === 'blocked' ? 'red' : load.status === 'needs_input' ? 'amber' : 'green'}`}>{load.tag}</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: 'var(--green)' }}>${load.rate.toLocaleString()}</div>
              </div>

              {/* Card body */}
              <div style={{ padding: '18px 22px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px' }}>{load.pickup}</span>
                    <ArrowRight size={14} color="var(--amber)" />
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '15px' }}>{load.delivery}</span>
                  </div>
                  <p style={{ fontSize: '12px' }}>{load.cargo} · {load.weight.toLocaleString()} lbs · {load.miles} mi · {load.deadline}</p>
                </div>

                <ReturnBar prob={load.returnProb} />

                {load.status === 'needs_input' && (
                  <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                      {load.candidates.map(cid => {
                        const cd = DRIVERS.find(d => d.id === cid);
                        return <DriverPill key={cid} d={cd} selected={selectedDrivers[load.id] === cid} onClick={() => setSelectedDrivers(prev => ({...prev, [load.id]: cid}))} />;
                      })}
                    </div>
                    <button className="btn" disabled={!selectedDrivers[load.id]} onClick={() => handleConfirmLoad(load.id, selectedDrivers[load.id])}>
                      Confirm Selection
                    </button>
                  </>
                )}

                {load.status === 'blocked' && (
                  <>
                    <div style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                      <p style={{ color: 'var(--red)', fontSize: '12px', fontWeight: '600' }}>{load.blockReason}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn" style={{ background: 'var(--red)', color: '#fff' }}
                        onClick={() => navigate(`/fleet-twin?truck=${DRIVERS.find(d => d.id === load.driverId)?.truck || 'TRUCK-007'}`)}>
                        View in Digital Twin →
                      </button>
                      <button className="btn secondary" onClick={() => setShowingAlt(prev => ({...prev, [load.id]: !prev[load.id]}))}>
                        Find Alternative Driver
                      </button>
                    </div>
                    {showingAlt[load.id] && (
                      <div className="ai-insight" style={{ marginTop: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                          <Zap size={16} color="var(--amber)" />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--amber)', letterSpacing: '1px', textTransform: 'uppercase' }}>AI Alternative — Predictive Dispatch Engine</span>
                        </div>
                        {DRIVERS.filter(d => d.status === 'available' && d.id !== load.driverId).map(alt => (
                          <div key={alt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: alt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '10px', color: '#000' }}>{alt.initials}</div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '13px' }}>{alt.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--faint)' }}>HOS {alt.hos}hrs · {alt.truck} · Score {alt.score}</div>
                              </div>
                            </div>
                            <button className="btn" style={{ padding: '6px 14px', fontSize: '10px' }} onClick={() => handleConfirmLoad(load.id, alt.id)}>Reassign</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {load.status === 'ready' && driver && (
                  <div className="ai-insight">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <Zap size={16} color="var(--amber)" />
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--amber)', letterSpacing: '1px', textTransform: 'uppercase' }}>AI Recommendation — Predictive Dispatch Engine</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', color: '#000', flexShrink: 0 }}>{driver.initials}</div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{driver.name}</div>
                        <p style={{ fontSize: '12px', marginTop: '1px' }}>{driver.location} — Denver 52% return load probability</p>
                      </div>
                    </div>
                    <ul style={{ fontSize: '12px', color: 'var(--green)', paddingLeft: '16px', marginBottom: '14px', lineHeight: '1.8' }}>
                      {driver.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                    {load.hosWarning && (
                      <div style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                        <p style={{ color: 'var(--amber)', fontSize: '12px', fontWeight: '600' }}>
                          ⚠ Insufficient HOS — 9.1hrs, need 10.0hrs. Relay recommended at Flagstaff.
                        </p>
                      </div>
                    )}
                    <button className="btn" onClick={() => handleConfirmLoad(load.id, load.driverId)}>Confirm Assignment</button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Active / Assigned Loads */}
      {loads.filter(l => l.status === 'assigned' || l.status === 'delivered').length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Active & Completed Loads
          </div>
          {loads.filter(l => l.status === 'assigned' || l.status === 'delivered').map(load => {
            const driver = DRIVERS.find(d => d.id === load.driverId);
            return (
              <div key={load.id} className="load-card" style={{ borderLeft: `3px solid ${load.status === 'delivered' ? 'var(--muted)' : 'var(--green)'}`, opacity: load.status === 'delivered' ? 0.6 : 1 }}>
                <div style={{ padding: '14px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '15px' }}>Load #{load.id}</span>
                        <span className={`badge green`}>{load.status === 'delivered' ? 'DELIVERED' : 'IN TRANSIT'}</span>
                        {load.tag === 'NEW ORDER' && <span className="badge amber">CUSTOMER ORDER</span>}
                      </div>
                      <div style={{ fontSize: '13px' }}>
                        <strong>{load.pickup}</strong> → <strong>{load.delivery}</strong>
                        {driver && <span style={{ color: 'var(--muted)', marginLeft: '10px' }}>· {driver.name} · {driver.truck}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px' }}>
                        {load.rate > 0 ? `$${load.rate.toLocaleString()}` : 'Rate TBD'}
                      </span>
                      {load.status === 'assigned' && (
                        <button className="btn" style={{ background: 'var(--green)', color: '#000', fontSize: '12px', padding: '7px 14px' }}
                          onClick={() => markDelivered(load.id)}>
                          ✓ Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                  {load.status === 'assigned' && (
                    <BackhaulBadge load={load} driver={driver} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Live Fleet Inventory */}
      <div style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div className="s-tag">Live Tracking</div>
            <h2 style={{ fontSize: '20px' }}>Fleet Inventory</h2>
          </div>
          <span className="badge green">{assignedCount} ACTIVE UNITS</span>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                {['Driver','Truck','Type','Weight','Capacity','Route','ETA'].map(h => (
                  <th key={h} style={{ padding: '13px 18px', fontSize: '10px', fontWeight: '700', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loads.filter(l => l.status === 'assigned').map(load => {
                const d = DRIVERS.find(dr => dr.id === load.driverId);
                return (
                  <tr key={load.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: d?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '9px', color: '#000', flexShrink: 0 }}>{d?.initials}</div>
                        <strong style={{ fontSize: '13px' }}>{d?.name}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--amber)', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{d?.truck || 'N/A'}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>{load.cargo}</td>
                    <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>{load.weight.toLocaleString()} lbs</td>
                    <td style={{ padding: '14px 18px' }}>
                      {(() => {
                        const truckId = DRIVERS.find(dr => dr.id === load.driverId)?.truck;
                        const gvwr = TRUCK_GVWR[truckId];
                        if (!gvwr || !load.weight) return <span style={{ color: 'var(--muted)' }}>—</span>;
                        const pct = Math.round((load.weight / gvwr) * 100);
                        const color = pct >= 80 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : 'var(--green)';
                        return (
                          <div>
                            <div style={{ width: 60, height: 4, borderRadius: 100, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 4 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100 }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color }}>{pct}%</span>
                            {pct < 80 && (
                              <Link to="/marketplace" style={{ textDecoration: 'none', display: 'block', marginTop: 2 }}>
                                <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Backhaul open ↗</span>
                              </Link>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{load.pickup}</div>
                      <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '2px' }}>→ {load.delivery}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ color: 'var(--green)', fontWeight: '600' }}>{load.deadline}</div>
                      <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tracking Active</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
