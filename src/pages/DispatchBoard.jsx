import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus } from 'lucide-react';
import { DRIVERS, INITIAL_LOADS } from '../data/mockData';
import { useFleetState } from '../hooks/useFleetState';
import LoadCreationDrawer from '../components/LoadCreationDrawer';

function DriverCard({ d, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      flex: 1, padding: '14px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
      background: selected ? 'rgba(57, 171, 212, 0.15)' : 'rgba(255,255,255,0.03)',
      border: selected ? '2px solid var(--blue)' : '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', color: '#000' }}>{d.initials}</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>{d.name}</div>
          <div className="small" style={{ color: 'var(--muted)' }}>Score {d.score}</div>
        </div>
      </div>
    </div>
  );
}

function ReturnBar({ prob }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <p className="small" style={{ marginBottom: '6px' }}>{prob}% return load probability</p>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${prob}%`, height: '100%', background: prob > 60 ? 'var(--green)' : prob > 40 ? 'var(--amber)' : 'var(--red)', borderRadius: '4px' }} />
      </div>
    </div>
  );
}

export default function DispatchBoard() {
  const { loads, handleConfirmLoad } = useFleetState();
  const navigate = useNavigate();
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [showingAlt, setShowingAlt] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const readyCount = loads.filter(l => ['ready', 'needs_input'].includes(l.status)).length;
  const blockedCount = loads.filter(l => l.status === 'blocked').length;
  const assignedCount = loads.filter(l => l.status === 'assigned').length;
  const liveCount = 5 + (INITIAL_LOADS.length - loads.filter(l => l.status !== 'assigned').length);

  const handleViewTwin = (truckId) => {
    navigate(`/fleet-twin?truck=${truckId}`);
  };

  const handleAssignAllReady = () => {
    loads.filter(l => l.status === 'ready').forEach(l => handleConfirmLoad(l.id));
  };

  const pendingLoads = loads.filter(l => l.status !== 'assigned');
  const filtered = filterStatus === 'all' ? pendingLoads : pendingLoads.filter(l => l.status === filterStatus);

  return (
    <div className="animate-fade">
      <LoadCreationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2>Morning Dispatch Queue</h2>
          <p>AI-scored load assignments based on 48hr predictive routing</p>
        </div>
        <button className="btn" onClick={() => setDrawerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
          <Plus size={15} /> New Load
        </button>
      </div>
      <div className="stat-row">
        <div className="stat-card"><h3>Live Loads</h3><div className="val" style={{color:'var(--blue)'}}>{liveCount}</div></div>
        <div className="stat-card"><h3>Ready</h3><div className="val" style={{color:'var(--green)'}}>{readyCount}</div></div>
        <div className="stat-card"><h3>At Risk</h3><div className="val" style={{color:'var(--amber)'}}>1</div></div>
        <div className="stat-card"><h3>Blocked</h3><div className="val" style={{color:'var(--red)'}}>{blockedCount}</div></div>
      </div>

      {/* Filter + Bulk Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['all', 'needs_input', 'blocked', 'ready'].map(s => (
          <button key={s} className={`btn ${filterStatus === s ? '' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '11px', textTransform: 'capitalize' }}
            onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'All' : s === 'needs_input' ? 'Needs Input' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {readyCount > 0 && (
          <button className="btn" style={{ marginLeft: 'auto', background: 'var(--green)', color: '#000', fontSize: '11px', padding: '6px 16px' }} onClick={handleAssignAllReady}>
            ✓ Assign All Ready ({readyCount})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎉</div>
          <h3>All Loads Assigned</h3>
          <p className="small">No pending loads in the dispatch queue.</p>
        </div>
      ) : (
        filtered.map(load => {
          const driver = load.driverId ? DRIVERS.find(d => d.id === load.driverId) : null;
          return (
            <div key={load.id} className="glass-card" style={{ padding: '24px', borderLeft: load.status === 'blocked' ? '4px solid var(--red)' : '' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>Load #{load.id}</span>
                  <span className={`badge ${load.priority === 'high' ? 'red' : 'amber'}`}>{load.priority}</span>
                  {load.tag && <span className={`badge ${load.status === 'blocked' ? 'red' : load.status === 'needs_input' ? 'amber' : 'green'}`}>{load.tag}</span>}
                </div>
                <div className="val" style={{ fontSize: '22px', color: 'var(--green)' }}>${load.rate.toLocaleString()}</div>
              </div>
              <h3 style={{ marginBottom: '4px' }}>{load.pickup} ➔ {load.delivery}</h3>
              <p className="small" style={{ marginBottom: '16px' }}>{load.cargo} · {load.weight.toLocaleString()} lbs · {load.miles} mi · {load.deadline}</p>

              <ReturnBar prob={load.returnProb} />

              {load.status === 'needs_input' && (
                <>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    {load.candidates.map(cid => {
                      const cd = DRIVERS.find(d => d.id === cid);
                      return <DriverCard key={cid} d={cd} selected={selectedDrivers[load.id] === cid} onClick={() => setSelectedDrivers(prev => ({...prev, [load.id]: cid}))} />;
                    })}
                  </div>
                  <button className="btn" disabled={!selectedDrivers[load.id]} onClick={() => handleConfirmLoad(load.id)}>
                    Confirm Selection
                  </button>
                </>
              )}

              {load.status === 'blocked' && (
                <>
                  <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '16px', fontWeight: '600' }}>{load.blockReason}</p>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button className="btn" style={{ background: 'var(--red)', color: '#fff' }} onClick={() => handleViewTwin(DRIVERS.find(d => d.id === load.driverId)?.truck || 'TRUCK-007')}>
                      View in Digital Twin →
                    </button>
                    <button className="btn secondary" onClick={() => setShowingAlt(prev => ({...prev, [load.id]: !prev[load.id]}))}>
                      Find Alternative Driver
                    </button>
                  </div>
                  {showingAlt[load.id] && (
                    <div style={{ background: 'rgba(57, 171, 212, 0.05)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <Zap size={18} color="var(--blue)" />
                        <h4 style={{ color: 'var(--blue)', fontSize: '12px' }}>AI ALTERNATIVE — Predictive Dispatch Engine</h4>
                      </div>
                      {DRIVERS.filter(d => d.status === 'available' && d.id !== load.driverId).map(alt => (
                        <div key={alt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: alt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', color: '#000' }}>{alt.initials}</div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '13px' }}>{alt.name}</div>
                              <div className="small">HOS {alt.hos}hrs · {alt.truck} · Score {alt.score}</div>
                            </div>
                          </div>
                          <button className="btn" style={{ padding: '6px 14px', fontSize: '10px' }} onClick={() => handleConfirmLoad(load.id)}>Reassign</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {load.status === 'ready' && driver && (
                <div className="ai-insight">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Zap size={20} color="var(--blue)" />
                    <h4 style={{ color: 'var(--blue)', fontSize: '12px' }}>AI RECOMMENDATION — Predictive Dispatch Engine</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: driver.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#000' }}>{driver.initials}</div>
                    <div>
                      <div style={{ fontWeight: '700' }}>{driver.name}</div>
                      <p className="small">{driver.location} — Denver 52% return load probability</p>
                    </div>
                  </div>
                  <ul style={{ fontSize: '12px', color: 'var(--green)', paddingLeft: '16px', marginBottom: '12px' }}>
                    {driver.reasons.map((r, i) => <li key={i} style={{ marginBottom: '2px' }}>{r}</li>)}
                  </ul>
                  {load.hosWarning && (
                    <div style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
                      <p style={{ color: 'var(--amber)', fontSize: '12px', fontWeight: '600' }}>
                        ⚠️ Insufficient HOS — 9.1hrs, need 10.0hrs. Relay recommended at Flagstaff.
                      </p>
                    </div>
                  )}
                  <button className="btn" onClick={() => handleConfirmLoad(load.id)}>Confirm Assignment</button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Live Fleet Inventory Table */}
      <div style={{ marginTop: '48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2>Live Fleet Inventory</h2>
          <span className="badge green" style={{ fontSize: '11px' }}>{assignedCount} ACTIVE UNITS</span>
        </div>
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 20px' }}>Driver</th>
                <th style={{ padding: '16px' }}>Truck</th>
                <th style={{ padding: '16px' }}>Type</th>
                <th style={{ padding: '16px' }}>Weight</th>
                <th style={{ padding: '16px' }}>Pickup ➔ Delivery</th>
                <th style={{ padding: '16px' }}>ETA / Arrival</th>
              </tr>
            </thead>
            <tbody>
              {loads.filter(l => l.status === 'assigned').map(load => {
                const d = DRIVERS.find(dr => dr.id === load.driverId);
                return (
                  <tr key={load.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: d?.color || 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '9px', color: '#000' }}>{d?.initials}</div>
                        <strong>{d?.name}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--blue)', fontWeight: '600' }}>{d?.truck || 'N/A'}</td>
                    <td style={{ padding: '16px' }}>{load.cargo}</td>
                    <td style={{ padding: '16px' }}>{load.weight.toLocaleString()} lbs</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: '500' }}>{load.pickup}</div>
                      <div className="small" style={{ color: 'var(--muted)' }}>➔ {load.delivery}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ color: 'var(--green)', fontWeight: '600' }}>{load.deadline}</div>
                      <div className="small" style={{ fontSize: '10px' }}>Tracking Active</div>
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
