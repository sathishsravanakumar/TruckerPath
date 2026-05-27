import { NavLink } from 'react-router-dom';
import { useFleetState } from '../hooks/useFleetState';
import TpLogo from './TpLogo';

const SVG = {
  dispatch: <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  drivers:  <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  twin:     <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 3l9 5 9-5M1 3v13l9 5 9-5V3"/><path d="M10 8l9-5"/></svg>,
  alerts:   <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  billing:  <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  cost:     <svg className="dbs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

const FLEET = [
  { path: '/dispatch',   label: 'Smart Dispatch',  icon: SVG.dispatch },
  { path: '/drivers',    label: 'Drivers',          icon: SVG.drivers },
  { path: '/fleet-twin', label: '3D Digital Twin',  icon: SVG.twin },
  { path: '/alerts',     label: 'Live Alerts',      icon: SVG.alerts, badge: true },
];
const FINANCE = [
  { path: '/billing', label: 'Billing Pipeline',  icon: SVG.billing },
  { path: '/cost',    label: 'Cost Intelligence', icon: SVG.cost },
];

export default function Sidebar({ onLogout }) {
  const { alerts } = useFleetState();

  return (
    <div id="db-sidebar">
      {/* Brand in topbar area — shown inline as topbar handles branding */}
      <div className="dbs-section">Fleet Command</div>
      {FLEET.map(({ path, label, icon, badge }) => (
        <NavLink key={path} to={path} className={({ isActive }) => `dbs-item${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {icon}
          {label}
          {badge && alerts.length > 0 && <div className="dbs-badge" style={{ marginLeft: 'auto' }}>{alerts.length}</div>}
        </NavLink>
      ))}
      <div className="dbs-section">Finance</div>
      {FINANCE.map(({ path, label, icon }) => (
        <NavLink key={path} to={path} className={({ isActive }) => `dbs-item${isActive ? ' active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          {icon}
          {label}
        </NavLink>
      ))}
      <div className="dbs-bottom">
        <div className="dbs-user">
          <div className="dbs-avatar">JD</div>
          <div>
            <div className="dbs-name">James Dispatch</div>
            <div className="dbs-role">Fleet Manager</div>
          </div>
          <div className="dbs-online" />
        </div>
      </div>
    </div>
  );
}
