import { createContext, useContext, useState, useCallback } from 'react';
import { INITIAL_LOADS, ALERTS, DRIVERS } from '../data/mockData';

const FleetContext = createContext(null);

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'critical', title: 'Tire Pressure Critical', message: 'TRUCK-007 rear tire at 67 PSI — blowout risk on highway.', time: '2 min ago', read: false },
  { id: 2, type: 'warning',  title: 'HOS Expiring Soon',     message: 'Frank Chen hits HOS limit in 47 min. Relay recommended.', time: '3 min ago', read: false },
  { id: 3, type: 'info',     title: 'Load #303 Dispatched',  message: 'Raj Patel assigned Phoenix → Dallas. ETA: Today 8:00 PM.', time: '18 min ago', read: true },
  { id: 4, type: 'success',  title: 'Invoice Sent',          message: 'Invoice #INV-2026-0303 for $3,650 sent to Phoenix Industrial.', time: '2 hrs ago', read: true },
  { id: 5, type: 'info',     title: 'Load #302 Dispatched',  message: 'Lisa Rodriguez assigned Tucson → El Paso.', time: '2 hrs ago', read: true },
];

let nextNotifId = INITIAL_NOTIFICATIONS.length + 1;

export function FleetProvider({ children }) {
  const [loads, setLoads] = useState(INITIAL_LOADS);
  const [alerts, setAlerts] = useState(ALERTS);
  const [showMap, setShowMap] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const pushNotification = useCallback(({ type, title, message }) => {
    setNotifications(prev => [{
      id: nextNotifId++,
      type,
      title,
      message,
      time: 'Just now',
      read: false,
    }, ...prev]);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleConfirmLoad = useCallback((id) => {
    setLoads(prev => prev.map(l => {
      if (l.id !== id) return l;
      const driver = DRIVERS.find(d => d.id === l.driverId || (l.candidates && l.candidates[0] === d.id));
      pushNotification({
        type: 'success',
        title: `Load #${id} Assigned`,
        message: `${driver ? driver.name : 'Driver'} dispatched ${l.pickup} → ${l.delivery}.`,
      });
      return { ...l, status: 'assigned' };
    }));
  }, [pushNotification]);

  const handleDismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    pushNotification({ type: 'info', title: 'Alert Resolved', message: 'Fleet alert has been dismissed.' });
  }, [pushNotification]);

  const addLoad = useCallback((newLoad) => {
    setLoads(prev => {
      const nextId = Math.max(...prev.map(l => l.id)) + 1;
      const load = { ...newLoad, id: nextId };
      pushNotification({
        type: 'success',
        title: `Load #${nextId} Created`,
        message: `${load.pickup} → ${load.delivery} · ${load.cargo} · $${load.rate.toLocaleString()}`,
      });
      return [load, ...prev];
    });
  }, [pushNotification]);

  return (
    <FleetContext.Provider value={{
      loads, alerts, showMap, setShowMap,
      notifications, pushNotification, markAllRead, dismissNotification, clearAllNotifications,
      handleConfirmLoad, handleDismissAlert, addLoad,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleetState() {
  return useContext(FleetContext);
}