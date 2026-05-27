import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { DRIVERS } from '../data/mockData';

const WEEK_DATA = {
  'This Week': [
    { label: 'Mon', revenue: 12400, cost: 9800 },
    { label: 'Tue', revenue: 15200, cost: 11200 },
    { label: 'Wed', revenue: 11800, cost: 10400 },
    { label: 'Thu', revenue: 14600, cost: 11000 },
    { label: 'Fri', revenue: 13340, cost: 10900 },
  ],
  'Last Week': [
    { label: 'Mon', revenue: 13100, cost: 9400 },
    { label: 'Tue', revenue: 14800, cost: 10900 },
    { label: 'Wed', revenue: 13200, cost: 9800 },
    { label: 'Thu', revenue: 15400, cost: 11200 },
    { label: 'Fri', revenue: 13900, cost: 10100 },
  ],
  'This Month': [
    { label: 'W1', revenue: 67340, cost: 53280 },
    { label: 'W2', revenue: 70400, cost: 54620 },
    { label: 'W3', revenue: 65200, cost: 52100 },
    { label: 'W4', revenue: 71800, cost: 55300 },
  ],
};

const DRIVER_COSTS = [
  { name: 'Raj Patel', miles: 1067, fuel: '$312', deadhead: '0 mi', margin: '$841' },
  { name: 'Lisa Rodriguez', miles: 544, fuel: '$253', deadhead: '12 mi', margin: '$287' },
  { name: 'Marcus Johnson', miles: 601, fuel: '$345', deadhead: '0 mi', margin: '$398' },
  { name: 'Frank Chen', miles: 1178, fuel: '$421', deadhead: '94 mi', margin: '$241' },
];

export default function CostIntelligence() {
  const [dateRange, setDateRange] = useState('This Week');
  const weekData = WEEK_DATA[dateRange];
  const maxVal = Math.max(...weekData.map(d => d.revenue));

  const totalRevenue = weekData.reduce((s, d) => s + d.revenue, 0);
  const totalCost = weekData.reduce((s, d) => s + d.cost, 0);
  const netMargin = totalRevenue - totalCost;
  const marginPct = ((netMargin / totalRevenue) * 100).toFixed(1);

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="s-tag">Financial Intelligence</div>
          <h2>Cost Intelligence</h2>
          <p style={{ marginTop: '4px' }}>Automated 3-way P&L reconciliation with AI narrative</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {Object.keys(WEEK_DATA).map(range => (
            <button key={range} className={`btn ${dateRange === range ? '' : 'secondary'}`}
              style={{ padding: '6px 14px', fontSize: '11px' }}
              onClick={() => setDateRange(range)}>
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card"><h3>Total Revenue</h3><div className="val" style={{color:'var(--green)'}}>${totalRevenue.toLocaleString()}</div></div>
        <div className="stat-card"><h3>Net Margin</h3><div className="val" style={{color:'var(--green)'}}>${netMargin.toLocaleString()}</div></div>
        <div className="stat-card"><h3>Margin %</h3><div className="val" style={{color:'var(--amber)'}}>{marginPct}%</div></div>
        <div className="stat-card"><h3>vs Last Week</h3><div className="val" style={{color:'var(--red)'}}>-$2,340</div></div>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: '20px' }}>Weekly Revenue vs Cost</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', padding: '0 8px' }}>
          {weekData.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', width: '100%', justifyContent: 'center', height: '150px' }}>
                <div style={{ width: '35%', height: `${(d.revenue / maxVal) * 140}px`, background: 'var(--amber)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <div style={{ width: '35%', height: `${(d.cost / maxVal) * 140}px`, background: 'rgba(208,221,231,0.3)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
              </div>
              <span className="small">{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--amber)' }} /><span className="small">Revenue</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(208,221,231,0.3)' }} /><span className="small">Cost</span></div>
        </div>
      </div>

      {/* Per-driver cost breakdown */}
      <div style={{ marginTop: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Per-Driver Cost Breakdown</h3>
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
                {['Driver', 'Miles', 'Fuel Cost', 'Deadhead', 'Net Margin'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '10px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '1px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DRIVER_COSTS.map((row, i) => {
                const driver = DRIVERS.find(d => d.name === row.name);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: driver?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '8px', color: '#000' }}>{driver?.initials}</div>
                        <span style={{ fontWeight: '600' }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>{row.miles.toLocaleString()} mi</td>
                    <td style={{ padding: '14px 16px', color: 'var(--amber)' }}>{row.fuel}</td>
                    <td style={{ padding: '14px 16px', color: row.deadhead !== '0 mi' ? 'var(--red)' : 'var(--muted)' }}>{row.deadhead}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--green)', fontWeight: '600' }}>{row.margin}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ai-insight" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <TrendingUp size={20} color="var(--amber)" />
          <h4 style={{ color: 'var(--amber)' }}>AI PROFITABILITY ANALYSIS — Week of April 14–18</h4>
        </div>
        <p style={{ lineHeight: '1.7', marginBottom: '16px' }}>
          This week: <strong>23 loads completed</strong>. Net margin <strong>${netMargin.toLocaleString()}</strong> — down <strong style={{ color: 'var(--red)' }}>$2,340</strong> from last week.
        </p>
        <p style={{ lineHeight: '1.7', marginBottom: '16px' }}>
          <strong>Primary driver:</strong> 3 loads on the Phoenix–Flagstaff corridor ran 18% over baseline fuel cost due to unplanned stops.
          <strong> Secondary:</strong> Driver Chen's HOS rest stops on I-40 added 94 unnecessary deadhead miles.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderLeft: '3px solid var(--red)' }}>
            <span className="badge red">#1 CAUSE — 68% OF DROP</span>
            <p style={{ fontSize: '13px' }}><strong>Phoenix–Flagstaff corridor</strong> — 3 loads, $890 excess fuel</p>
            <p style={{ fontSize: '12px', color: 'var(--green)' }}>✓ Fix: Pre-plan fuel at Pilot TA #224 → saves $71/run ($852/mo)</p>
          </div>
          <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', borderLeft: '3px solid var(--amber)' }}>
            <span className="badge amber">#2 CAUSE — 32% OF DROP</span>
            <p style={{ fontSize: '13px' }}><strong>Driver Chen I-40 stops</strong> — 94 deadhead miles, $127 excess</p>
            <p style={{ fontSize: '12px', color: 'var(--green)' }}>✓ Fix: Pre-plan rest at Kingman TA → saves $508/mo</p>
          </div>
        </div>
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(74,222,128,0.08)', borderRadius: '10px', border: '1px solid rgba(74,222,128,0.2)' }}>
          <p style={{ color: 'var(--green)', fontWeight: '700' }}>Projected recovery if both fixes implemented: <strong>$1,360/week ($5,440/month)</strong></p>
        </div>
      </div>
    </div>
  );
}
