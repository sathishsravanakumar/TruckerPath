import { useState } from 'react';
import { INITIAL_HISTORY, LOAD_QUEUE } from '../data/mockData';
import { useFleetState } from '../hooks/useFleetState';

export default function BillingPipeline() {
  const { pushNotification, markInvoiced } = useFleetState();
  const [stage, setStage] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [currentLoadIdx, setCurrentLoadIdx] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState({ bol: false, pod: false, fuel: false });
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [totalInvoiced, setTotalInvoiced] = useState(23);

  const currentLoad = LOAD_QUEUE[currentLoadIdx] || LOAD_QUEUE[0];
  const allDone = currentLoadIdx >= LOAD_QUEUE.length;

  const loadCards = LOAD_QUEUE.map((lq, i) => {
    let status, color;
    if (i < currentLoadIdx) { status = 'INVOICED ✓'; color = 'var(--green)'; }
    else if (i === currentLoadIdx && stage !== 'idle') { status = 'PROCESSING'; color = 'var(--amber)'; }
    else if (i === currentLoadIdx) { status = 'AWAITING DOCS'; color = 'var(--amber)'; }
    else { status = 'QUEUED'; color = 'var(--muted)'; }
    return { id: lq.id, status, driver: lq.driver, color };
  });

  const handleFileClick = (docType) => () => {
    setUploadedDocs(prev => ({ ...prev, [docType]: true }));
  };

  const startScan = () => {
    setStage('scanning');
    setProgress(0);
    setOcrText('');
    const lines = currentLoad.ocrLines;
    let lineIdx = 0;
    const interval = setInterval(() => {
      if (lineIdx >= lines.length) { clearInterval(interval); setStage('extracted'); return; }
      setOcrText(prev => prev + lines[lineIdx] + '\n');
      setProgress(Math.min(100, Math.round(((lineIdx + 1) / lines.length) * 100)));
      lineIdx++;
    }, 120);
  };

  const runDemo = () => {
    setUploadedDocs({ bol: true, pod: true, fuel: true });
    setTimeout(() => startScan(), 300);
  };

  const finalize = () => {
    setHistory(prev => [{
      load: currentLoad.id, driver: currentLoad.driver.split(' ')[1] || currentLoad.driver,
      route: currentLoad.route, invoice: currentLoad.invoiceAmt, margin: currentLoad.marginAmt,
      status: 'SENT', time: 'Just now',
    }, ...prev]);
    setTotalInvoiced(prev => prev + 1);
    setStage('done');
    pushNotification({
      type: 'success',
      title: `Invoice Sent — Load ${currentLoad.id}`,
      message: `${currentLoad.invoiceAmt} invoice sent to billing for ${currentLoad.route}. Net-30.`,
    });
    // Mark the corresponding user shipment as invoiced
    // LOAD_QUEUE IDs like '#304' — map to load ids by stripping '#'
    const numericId = parseInt(currentLoad.id.replace('#', ''));
    if (!isNaN(numericId)) markInvoiced(numericId);
  };

  const processNext = () => {
    setCurrentLoadIdx(prev => prev + 1);
    setStage('idle');
    setUploadedDocs({ bol: false, pod: false, fuel: false });
    setOcrText('');
    setProgress(0);
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div className="s-tag">Revenue Operations</div>
          <h2>Billing & Documentation</h2>
          <p style={{ marginTop: '4px' }}>Document upload → AI extraction → Invoice in seconds</p>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 20px', fontSize: '12px', textAlign: 'right' }}>
          <span style={{ color: 'var(--muted)' }}>{totalInvoiced} loads invoiced · $67,340 revenue · $13,060 margin</span><br/>
          <span style={{ color: 'var(--muted)' }}>avg 12s invoice time</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {loadCards.map((lc, i) => (
          <div key={i} style={{ background: 'var(--card)', border: i === currentLoadIdx ? `2px solid ${lc.color}` : '1px solid var(--border)', borderRadius: '12px', padding: '16px', transition: 'all 0.2s', color: 'var(--text)' }}>
            <div style={{ fontSize: '16px', fontWeight: '700' }}>Load {lc.id}</div>
            <div style={{ fontSize: '11px', color: lc.color, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px', marginTop: '4px' }}>{lc.status}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{lc.driver}</div>
          </div>
        ))}
      </div>

      {stage === 'idle' && !allDone && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {[
              { key: 'bol', label: 'Bill of Lading', icon: '📋' },
              { key: 'pod', label: 'Proof of Delivery', icon: '📦' },
              { key: 'fuel', label: 'Fuel Receipt', icon: '⛽' },
            ].map(doc => (
              <div key={doc.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setUploadedDocs(prev => ({...prev, [doc.key]: true})); }}
                onClick={handleFileClick(doc.key)}
                style={{ border: uploadedDocs[doc.key] ? '2px solid var(--green)' : '2px dashed rgba(0,0,0,0.3)', borderRadius: '12px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer', background: uploadedDocs[doc.key] ? 'rgba(74,222,128,0.05)' : 'transparent', transition: 'all 0.3s' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{uploadedDocs[doc.key] ? '✅' : doc.icon}</div>
                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{doc.label}</div>
                <div style={{ fontSize: '11px', color: uploadedDocs[doc.key] ? 'var(--green)' : '#1c293a' }}>{uploadedDocs[doc.key] ? 'Uploaded' : 'Drop or click'}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <button className="btn" onClick={startScan}>⇒ Process Documents with AI</button>
            <button className="btn secondary" onClick={runDemo}>▶ Run Demo (skip upload)</button>
          </div>
        </>
      )}

      {stage === 'idle' && allDone && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
          <h3 style={{ color: 'var(--green)', marginBottom: '8px' }}>All Loads Processed</h3>
          <p>All queued loads have been invoiced.</p>
        </div>
      )}

      {stage === 'scanning' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', height: '6px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--amber)', transition: 'width 0.1s linear', borderRadius: '8px' }} />
          </div>
          <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '20px', fontFamily: "'Courier New', monospace", fontSize: '12px', color: 'var(--green)', lineHeight: '1.8', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
            {ocrText}<span style={{ opacity: progress < 100 ? 1 : 0 }}>▌</span>
          </div>
        </div>
      )}

      {stage === 'extracted' && (
        <div className="glass-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3>OCR Extraction Complete — Invoice #INV-2026-{currentLoad.id.replace('#','0')}</h3>
            <span className="badge green">READY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[{ l: 'Load', v: currentLoad.id }, { l: 'Route', v: currentLoad.route }, { l: 'Invoice', v: currentLoad.invoiceAmt, c: 'var(--green)' }, { l: 'Margin', v: currentLoad.marginAmt, c: 'var(--green)' }].map((f, i) => (
              <div key={i} className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                <span className="tm-label">{f.l}</span>
                <span className="tm-val" style={{ color: f.c || '#fff' }}>{f.v}</span>
              </div>
            ))}
          </div>
          <button className="btn" onClick={finalize}>Approve & Send Invoice</button>
        </div>
      )}

      {stage === 'done' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>✓</div>
          <h3 style={{ color: 'var(--green)', marginBottom: '8px' }}>Invoice Sent — Load {currentLoad.id}</h3>
          <p className="small" style={{ marginBottom: '20px' }}>{currentLoad.invoiceAmt} → billing sent · Net-30</p>
          <button className="btn" onClick={processNext}>
            {currentLoadIdx < LOAD_QUEUE.length - 1 ? 'Process Next Load →' : 'Finish Queue'}
          </button>
        </div>
      )}

      <h3 style={{ marginBottom: '16px' }}>Billing History</h3>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', color: 'var(--text)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
              {['LOAD', 'DRIVER', 'ROUTE', 'INVOICE', 'MARGIN', 'STATUS', 'TIME'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '1px', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: row.time === 'Just now' ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
                <td style={{ padding: '14px 16px', fontWeight: '700' }}>{row.load}</td>
                <td style={{ padding: '14px 16px' }}>{row.driver}</td>
                <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px' }}>{row.route}</td>
                <td style={{ padding: '14px 16px', fontWeight: '600' }}>{row.invoice}</td>
                <td style={{ padding: '14px 16px', color: 'var(--green)' }}>{row.margin}</td>
                <td style={{ padding: '14px 16px' }}><span style={{ color: row.status.includes('PAID') ? 'var(--green)' : row.time === 'Just now' ? 'var(--amber)' : 'var(--muted)', fontWeight: '600', fontSize: '12px' }}>{row.status}</span></td>
                <td style={{ padding: '14px 16px', color: row.time === 'Just now' ? 'var(--amber)' : 'var(--muted)', fontSize: '12px', fontWeight: row.time === 'Just now' ? '700' : '400' }}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
