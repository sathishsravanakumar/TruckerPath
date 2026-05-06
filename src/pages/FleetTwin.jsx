import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing';
import TruckModel from '../components/TruckModel';
import { TRUCK_DB as TRUCK_DB_INITIAL } from '../data/mockData';

export default function FleetTwin() {
  const [searchParams] = useSearchParams();
  const initialTruckId = searchParams.get('truck') || 'TRUCK-007';

  const [TRUCK_DB, setTruckDB] = useState(TRUCK_DB_INITIAL);
  const [activeTruck, setActiveTruck] = useState(initialTruckId);
  const [truckData, setTruckData] = useState(TRUCK_DB[initialTruckId] || TRUCK_DB['TRUCK-007']);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const id = searchParams.get('truck') || 'TRUCK-007';
    setActiveTruck(id);
    setTruckData(TRUCK_DB[id] || TRUCK_DB['TRUCK-007']);
  }, [searchParams]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleReroute = () => {
    setTruckDB(prev => ({ ...prev, 'TRUCK-007': { ...prev['TRUCK-007'], tireRL: 90 } }));
    setTruckData(prev => ({ ...prev, tireRL: 90 }));
    showToast('✓ TRUCK-007 rerouted to Pilot TA #224 for emergency tire service. Dispatch board updated.');
  };

  const handleExportDiagnostics = () => {
    const blob = new Blob([JSON.stringify(truckData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${truckData.id}-diagnostics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tireStatus = truckData.tireRL < 75 ? 'critical' : truckData.tireRL < 85 ? 'warning' : 'ok';
  const hosStatus = truckData.hos < 2 ? 'critical' : truckData.hos < 4 ? 'warning' : 'ok';
  const fuelStatus = truckData.fuel < 30 ? 'critical' : truckData.fuel < 50 ? 'warning' : 'ok';
  const brakeStatus = truckData.brakes < 50 ? 'critical' : truckData.brakes < 80 ? 'warning' : 'ok';

  const statusIcon = (s) => s === 'critical' ? '🔴' : s === 'warning' ? '🟡' : '✅';
  const statusLabel = (s) => s === 'critical' ? 'FAIL' : s === 'warning' ? 'WARN' : 'OK';
  const statusColor = (s) => s === 'critical' ? 'var(--red)' : s === 'warning' ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="twin-layout animate-fade" style={{ height: 'calc(100vh - 100px)' }}>
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: 'var(--card)', border: '1px solid var(--green)', borderLeft: '4px solid var(--green)', backdropFilter: 'blur(20px)', padding: '20px 24px', borderRadius: '12px', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'fadeUp 0.3s ease' }}>
          <p style={{ fontSize: '13px', fontWeight: '600' }}>{toast}</p>
        </div>
      )}

      <div
        className="canvas-wrapper"
        onWheelCapture={(e) => { if (!e.ctrlKey) e.stopPropagation(); }}
      >
        <Canvas camera={{ position: [8, 4, 10], fov: 45 }}>
          <Environment preset="city" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <TruckModel truckData={truckData} />
          <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={20} blur={2} />
          <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
          <EffectComposer>
            <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} intensity={0.6} />
            <N8AO aoRadius={2} intensity={1.5} />
          </EffectComposer>
        </Canvas>
        {truckData.tireRL < 75 && (
          <div style={{ position: 'absolute', top: '32px', left: '32px', width: '320px' }} className="glass-card">
            <h4 style={{ color: 'var(--red)', marginBottom: '8px' }}>⚠️ CRITICAL TIRE EVENT</h4>
            <p style={{ fontWeight: '600' }}>TRUCK-007 · Rear Right Inner Dual</p>
            <p style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.5' }}>Tire pressure dropped to <strong>{truckData.tireRL} PSI</strong>. Blowout probability HIGH at highway speeds. Immediate reroute to nearest service center recommended.</p>
            <button className="btn" style={{ background: 'var(--red)', color: '#fff', width: '100%', marginTop: '16px' }} onClick={handleReroute}>
              REROUTE TO SERVICE
            </button>
          </div>
        )}
      </div>

      <div className="telemetry-side">
        <h2 style={{ marginBottom: '8px' }}>Unit Diagnostics</h2>
        <p className="small" style={{ marginBottom: '16px' }}>{truckData.id} · {truckData.driver}</p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {Object.keys(TRUCK_DB).map(tid => (
            <button key={tid} className={`btn ${tid === activeTruck ? '' : 'secondary'}`}
              style={{ padding: '6px 12px', fontSize: '10px', ...(tid === activeTruck && truckData.tireRL < 75 ? { background: 'var(--red)', color: '#fff' } : {}) }}
              onClick={() => { setActiveTruck(tid); setTruckData(TRUCK_DB[tid]); }}>
              {tid} {TRUCK_DB[tid].tireRL < 75 ? '🔴' : ''}
            </button>
          ))}
        </div>

        <div className="tm-row">
          <span className="tm-label">Rear Left Tire</span>
          <span className="tm-val">{truckData.tireRL} PSI</span>
          <span style={{ color: statusColor(tireStatus), fontSize: '12px', fontWeight: 700 }}>{statusIcon(tireStatus)} {statusLabel(tireStatus)}</span>
        </div>
        <div className="tm-row">
          <span className="tm-label">Engine Health</span>
          <span className="tm-val">{truckData.engine}</span>
          <span style={{ color: 'var(--green)', fontSize: '12px', fontWeight: 700 }}>✅ OK</span>
        </div>
        <div className="tm-row">
          <span className="tm-label">HOS Remaining</span>
          <span className="tm-val">{truckData.hos} hrs</span>
          <span style={{ color: statusColor(hosStatus), fontSize: '12px', fontWeight: 700 }}>{statusIcon(hosStatus)} {statusLabel(hosStatus)}</span>
        </div>
        <div className="tm-row">
          <span className="tm-label">Fuel Level</span>
          <span className="tm-val">{truckData.fuel}%</span>
          <span style={{ color: statusColor(fuelStatus), fontSize: '12px', fontWeight: 700 }}>{statusIcon(fuelStatus)} {statusLabel(fuelStatus)}</span>
        </div>
        <div className="tm-row">
          <span className="tm-label">Brake Pad Life</span>
          <span className="tm-val">{truckData.brakes}%</span>
          <span style={{ color: statusColor(brakeStatus), fontSize: '12px', fontWeight: 700 }}>{statusIcon(brakeStatus)} {statusLabel(brakeStatus)}</span>
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn secondary" style={{ width: '100%', fontSize: '11px' }} onClick={handleExportDiagnostics}>
            ↓ Export Diagnostics JSON
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn" style={{ background: 'var(--red)', color: '#fff', flex: 1 }} onClick={() => setTruckData(prev => ({...prev, tireRL: 67}))}>Simulate Fault</button>
            <button className="btn secondary" style={{ flex: 1 }} onClick={() => {
              setTruckDB(TRUCK_DB_INITIAL);
              setTruckData(TRUCK_DB_INITIAL[activeTruck]);
            }}>Reset Fleet</button>
          </div>
        </div>
      </div>
    </div>
  );
}
