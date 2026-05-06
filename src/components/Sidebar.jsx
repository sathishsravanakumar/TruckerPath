import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, FileText, TrendingUp, Truck, Users } from 'lucide-react';
import { useFleetState } from '../hooks/useFleetState';

const NAV_ITEMS = [
  { path: '/dispatch',  label: 'Smart Dispatch',    icon: LayoutDashboard },
  { path: '/drivers',   label: 'Drivers',           icon: Users },
  { path: '/fleet-twin',label: '3D Digital Twin',   icon: Truck },
  { path: '/alerts',    label: 'Live Alerts',       icon: AlertCircle, showBadge: true },
  { path: '/billing',   label: 'Billing Pipeline',  icon: FileText },
  { path: '/cost',      label: 'Cost Intelligence', icon: TrendingUp },
];

export default function Sidebar() {
  const { alerts } = useFleetState();

  return (
    <div className="sidebar">
      <div className="brand">
        <h1>TruckerPath</h1>
        <p className="small" style={{ color: 'var(--green)' }}>● FLEET OS</p>
      </div>
      <nav>
        {NAV_ITEMS.map(({ path, label, icon: Icon, showBadge }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={18} />
              {label}
            </div>
            {showBadge && alerts.length > 0 && (
              <span className="badge red">{alerts.length}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
