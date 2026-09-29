import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMPANIES } from '../data/mockData';

const TYPE_COLORS = {
  RET: { bg: 'var(--blue-dim)', fg: '#60A5FA' },
  TRA: { bg: 'rgba(139,92,246,0.12)', fg: '#A78BFA' },
  AM: { bg: 'var(--amber-dim)', fg: 'var(--amber)' },
};
const typeColor = (t) => TYPE_COLORS[t] || { bg: 'rgba(255,255,255,0.06)', fg: 'var(--muted)' };

function initials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function orderRevenue(company) {
  return company.orders.reduce((s, o) => s + o.invoiceAmount, 0);
}

function accountStatus(company) {
  if (company.onHold) return { label: 'On Hold', cls: 'red' };
  if (!company['Rec-Status']) return { label: 'Inactive', cls: 'amber' };
  return { label: 'Active', cls: 'green' };
}

export default function Companies() {
  const navigate = useNavigate();
  const types = ['all', ...new Set(COMPANIES.map(c => c.Type))];
  const [typeFilter, setTypeFilter] = useState('all');
  const [onHoldOnly, setOnHoldOnly] = useState(false);

  const filtered = COMPANIES.filter(c => {
    if (typeFilter !== 'all' && c.Type !== typeFilter) return false;
    if (onHoldOnly && !c.onHold) return false;
    return true;
  });

  const totalAccounts = COMPANIES.length;
  const totalBalance = COMPANIES.reduce((s, c) => s + c.Balance, 0);
  const onHoldCount = COMPANIES.filter(c => c.onHold).length;
  const totalOrderRevenue = COMPANIES.reduce((s, c) => s + orderRevenue(c), 0);

  const leaderboard = [...COMPANIES].sort((a, b) => orderRevenue(b) - orderRevenue(a));
  const maxRevenue = Math.max(...leaderboard.map(orderRevenue), 1);

  const attention = [...COMPANIES].sort((a, b) => {
    const risk = c => c.onHold ? 1 : (c.Crlimit > 0 ? c.Balance / c.Crlimit : 0);
    return risk(b) - risk(a);
  })[0];

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px' }}>
        <div className="s-tag">Customer Intelligence</div>
        <h2>Company Analytics</h2>
        <p style={{ marginTop: '4px' }}>Account performance, order history, and revenue across every company on file</p>
      </div>

      <div className="stat-row">
        <div className="stat-card"><h3>Total Accounts</h3><div className="val" style={{ color: 'var(--amber)' }}>{totalAccounts}</div></div>
        <div className="stat-card"><h3>Total AR Balance</h3><div className="val" style={{ color: 'var(--red)', fontSize: '26px' }}>${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
        <div className="stat-card"><h3>Accounts On Hold</h3><div className="val" style={{ color: onHoldCount > 0 ? 'var(--red)' : 'var(--green)' }}>{onHoldCount}</div></div>
        <div className="stat-card"><h3>Order Revenue</h3><div className="val" style={{ color: 'var(--green)', fontSize: '26px' }}>${totalOrderRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {types.map(t => (
          <button key={t} className={`btn ${typeFilter === t ? '' : 'secondary'}`}
            style={{ padding: '6px 14px', fontSize: '11px' }}
            onClick={() => setTypeFilter(t)}>
            {t === 'all' ? `All (${COMPANIES.length})` : `${t} (${COMPANIES.filter(c => c.Type === t).length})`}
          </button>
        ))}
        <button className={`btn ${onHoldOnly ? '' : 'secondary'}`}
          style={{ padding: '6px 14px', fontSize: '11px', marginLeft: 'auto' }}
          onClick={() => setOnHoldOnly(o => !o)}>
          On Hold Only {onHoldOnly ? '✓' : ''}
        </button>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '20px' }}>Revenue Leaderboard</h3>
        {leaderboard.map(c => {
          const rev = orderRevenue(c);
          return (
            <div key={c.Code} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{c.Name}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>${rev.toLocaleString()}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${(rev / maxRevenue) * 100}%`, height: '100%', background: 'var(--amber)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <table className="lb-table">
          <thead>
            <tr>
              {['Company', 'Code', 'Type', 'Location', 'Contact', 'Balance', 'Credit Limit', 'Terms', 'Status', 'Orders'].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const status = accountStatus(c);
              const tc = typeColor(c.Type);
              return (
                <tr key={c.Code} style={{ cursor: 'pointer' }} onClick={() => navigate(`/companies/${c.Code}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--amber)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '11px', flexShrink: 0 }}>{initials(c.Name)}</div>
                      <span style={{ fontWeight: 700 }}>{c.Name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted)' }}>{c.Code}</td>
                  <td><span className="lb-tag" style={{ background: tc.bg, color: tc.fg }}>{c.Type}</span></td>
                  <td style={{ color: 'var(--muted)' }}>{c.City}, {c.Province}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.Contact || '—'}</td>
                  <td style={{ fontWeight: 600 }}>${c.Balance.toLocaleString()}</td>
                  <td style={{ color: 'var(--muted)' }}>${c.Crlimit.toLocaleString()}</td>
                  <td style={{ color: 'var(--muted)' }}>{c.Termcode || '—'}</td>
                  <td><span className={`badge ${status.cls}`}>{status.label.toUpperCase()}</span></td>
                  <td>{c.orders.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="ai-insight">
        <h4 style={{ color: 'var(--amber)', marginBottom: '12px' }}>⚠️ ACCOUNT NEEDING ATTENTION</h4>
        <p style={{ lineHeight: '1.7' }}>
          <strong>{attention.Name}</strong> ({attention.Code}) {attention.onHold
            ? <>is currently <strong style={{ color: 'var(--red)' }}>on hold</strong> — {attention.holdReason || 'reason not on file'}.</>
            : <>carries a balance of <strong>${attention.Balance.toLocaleString()}</strong> against a ${attention.Crlimit.toLocaleString()} credit limit ({attention.Crlimit > 0 ? Math.round((attention.Balance / attention.Crlimit) * 100) : 0}% utilized).</>
          }
        </p>
      </div>
    </div>
  );
}
