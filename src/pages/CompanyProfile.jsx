import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COMPANIES } from '../data/mockData';
import OrderDetailPanel from '../components/OrderDetailPanel';

const TYPE_COLORS = {
  RET: { bg: 'var(--blue-dim)', fg: '#60A5FA' },
  TRA: { bg: 'rgba(139,92,246,0.12)', fg: '#A78BFA' },
  AM: { bg: 'var(--amber-dim)', fg: 'var(--amber)' },
};
const typeColor = (t) => TYPE_COLORS[t] || { bg: 'rgba(255,255,255,0.06)', fg: 'var(--muted)' };

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const INVOICE_BADGE = { Paid: 'green', Outstanding: 'amber', Overdue: 'red', Pending: 'amber' };
const orderStatusColor = (s) => s === 'Delivered' ? 'var(--green)' : s === 'In Transit' ? 'var(--blue)' : s === 'Blocked' ? 'var(--red)' : 'var(--amber)';

export default function CompanyProfile() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const company = COMPANIES.find(c => c.Code === code);

  if (!company) {
    return (
      <div className="animate-fade" style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>🚫</div>
        <h3 style={{ marginBottom: '8px' }}>Account Not Found</h3>
        <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>No company with code "{code}" exists.</p>
        <button className="btn" onClick={() => navigate('/companies')}>← Back to Companies</button>
      </div>
    );
  }

  const totalRevenue = company.orders.reduce((s, o) => s + o.invoiceAmount, 0);
  const avgOrderValue = company.orders.length ? totalRevenue / company.orders.length : 0;
  const status = company.onHold
    ? { label: 'On Hold', cls: 'red', border: 'var(--red)' }
    : !company['Rec-Status']
      ? { label: 'Inactive', cls: 'amber', border: 'var(--amber)' }
      : { label: 'Active', cls: 'green', border: 'var(--green)' };
  const tc = typeColor(company.Type);

  const monthly = {};
  company.orders.forEach(o => {
    const m = o.pickupDate.slice(0, 7);
    monthly[m] = (monthly[m] || 0) + o.invoiceAmount;
  });
  const monthKeys = Object.keys(monthly).sort();
  const maxMonthly = Math.max(...monthKeys.map(k => monthly[k]), 1);

  return (
    <div className="animate-fade">
      <button className="btn secondary" style={{ marginBottom: '24px', fontSize: '12px', padding: '6px 14px' }} onClick={() => navigate('/companies')}>
        ← Back to Companies
      </button>

      {/* Hero header */}
      <div className="glass-card" style={{ marginBottom: '20px', borderLeft: `4px solid ${status.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--amber)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '20px', flexShrink: 0 }}>
            {initials(company.Name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>{company.Name}</h2>
              <span className="lb-tag" style={{ background: tc.bg, color: tc.fg }}>{company.Type}</span>
              <span className={`badge ${status.cls}`}>{status.label.toUpperCase()}</span>
            </div>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{company.Address}, {company.City}, {company.Province} {company.Postal}{company.Country ? ` · ${company.Country}` : ''}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="small" style={{ color: 'var(--muted)' }}>Customer Since</div>
            <div style={{ fontWeight: 700 }}>{company.Strdat}</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-row" style={{ marginBottom: '20px' }}>
        <div className="stat-card"><h3>Order Count</h3><div className="val" style={{ color: 'var(--amber)' }}>{company.orders.length}</div></div>
        <div className="stat-card"><h3>Order Revenue</h3><div className="val" style={{ color: 'var(--green)', fontSize: '28px' }}>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="stat-card"><h3>Avg Order Value</h3><div className="val" style={{ color: 'var(--amber)', fontSize: '28px' }}>${Math.round(avgOrderValue).toLocaleString()}</div></div>
        <div className="stat-card"><h3>Last Ship Date</h3><div className="val" style={{ fontSize: '18px' }}>{company.LastShipDate || '—'}</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Account / financial */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Account & Financial</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">AR Balance</span>
              <span className="tm-val" style={{ color: company.Balance > 0 ? 'var(--red)' : 'var(--green)' }}>${company.Balance.toLocaleString()}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Credit Limit</span>
              <span className="tm-val">${company.Crlimit.toLocaleString()}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Payment Terms</span>
              <span className="tm-val">{company.Termcode || '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Account Class</span>
              <span className="tm-val">{company.acctClass || '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Annual Sales</span>
              <span className="tm-val">{company.annSales ? `$${company.annSales.toLocaleString()}` : '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Employees</span>
              <span className="tm-val">{company.numEmployees || '—'}</span>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Contact & Sales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Contact</span>
              <span className="tm-val">{company.Contact || '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Phone</span>
              <span className="tm-val">{company.Phone || '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Email</span>
              <span className="tm-val">{company.Email || '—'}</span>
            </div>
            <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
              <span className="tm-label">Sales Rep</span>
              <span className="tm-val">{company.Salesrep || '—'}</span>
            </div>
            {company.onHold && (
              <div className="tm-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', gridColumn: '1 / -1', borderLeft: '3px solid var(--red)' }}>
                <span className="tm-label">Hold Reason</span>
                <span className="tm-val" style={{ color: 'var(--red)' }}>{company.holdReason || 'Not specified'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revenue trend */}
      {monthKeys.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Revenue Trend</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '160px', padding: '0 8px' }}>
            {monthKeys.map(m => (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '40%', height: `${(monthly[m] / maxMonthly) * 120}px`, background: 'var(--amber)', borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
                <span className="small">{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <h3 style={{ padding: '20px 20px 0' }}>Order History</h3>
        {company.orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
            <p>No orders on file for this account.</p>
          </div>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                {['Order', 'Route', 'Commodity', 'Weight', 'Rate', 'Pickup', 'Delivery', 'Status', 'Invoice'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {company.orders.map(o => (
                <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                  <td style={{ fontWeight: 700 }}>{o.id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.route}</td>
                  <td style={{ color: 'var(--muted)' }}>{o.commodity}</td>
                  <td style={{ color: 'var(--muted)' }}>{o.weight}</td>
                  <td style={{ fontWeight: 600 }}>${o.rate.toLocaleString()}</td>
                  <td style={{ color: 'var(--muted)' }}>{o.pickupDate}</td>
                  <td style={{ color: 'var(--muted)' }}>{o.deliveryDate}</td>
                  <td><span style={{ color: orderStatusColor(o.status), fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>{o.status}</span></td>
                  <td><span className={`badge ${INVOICE_BADGE[o.invoiceStatus] || 'amber'}`}>{o.invoiceStatus.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailPanel order={selectedOrder} company={company} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
