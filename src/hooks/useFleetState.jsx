import { createContext, useContext, useState, useCallback } from 'react';
import { INITIAL_LOADS, ALERTS, DRIVERS, USER_SHIPMENTS, TRUCK_GVWR } from '../data/mockData';

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
  const [userShipments, setUserShipments] = useState(USER_SHIPMENTS);

  const pushNotification = useCallback(({ type, title, message }) => {
    setNotifications(prev => [{
      id: nextNotifId++, type, title, message, time: 'Just now', read: false,
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

  // Admin confirms a load — optionally pass the selected driver id
  const handleConfirmLoad = useCallback((id, selectedDriverId) => {
    const confirmedLoad = loads.find(l => l.id === id);
    const driverId = selectedDriverId ?? confirmedLoad?.driverId ?? confirmedLoad?.candidates?.[0];
    const driver = DRIVERS.find(d => d.id === driverId);

    setLoads(prev => prev.map(l =>
      l.id !== id ? l : { ...l, status: 'assigned', driverId }
    ));

    pushNotification({
      type: 'success',
      title: `Load #${id} Assigned`,
      message: `${driver?.name ?? 'Driver'} dispatched ${confirmedLoad?.pickup} → ${confirmedLoad?.delivery}.`,
    });

    // Mirror to user shipments
    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setUserShipments(prev => prev.map(s => {
      if (s.loadId !== id) return s;
      return {
        ...s,
        status: 'In Transit',
        driver: driver ? `${driver.name.split(' ')[0]} ${driver.name.split(' ')[1]?.[0] ?? ''}.` : 'Assigned',
        driverPhone: driver ? '(555) 000-0000' : '',
        truck: driver?.truck ?? 'TBD',
        events: s.events.map((ev, i) => {
          if (i === 1) return { ...ev, done: true, time: now, label: 'Order Confirmed by Admin' };
          if (i === 2) return { ...ev, done: true, time: now, label: `Driver Assigned — ${driver?.name ?? 'Driver'}` };
          return ev;
        }),
      };
    }));
  }, [loads, pushNotification]);

  // Admin marks an assigned load as delivered
  const markDelivered = useCallback((loadId) => {
    const load = loads.find(l => l.id === loadId);
    const driver = load ? DRIVERS.find(d => d.id === load.driverId) : null;

    setLoads(prev => prev.map(l =>
      l.id !== loadId ? l : { ...l, status: 'delivered' }
    ));

    pushNotification({
      type: 'success',
      title: `Load #${loadId} Delivered`,
      message: `${load?.pickup} → ${load?.delivery} marked as delivered.`,
    });

    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setUserShipments(prev => prev.map(s => {
      if (s.loadId !== loadId) return s;
      return {
        ...s,
        status: 'Delivered',
        events: s.events.map(ev => ({ ...ev, done: true, time: ev.time === 'Pending' ? now : ev.time })),
      };
    }));
  }, [loads, pushNotification]);

  // Billing pipeline finalizes invoice for a load
  const markInvoiced = useCallback((loadId) => {
    setUserShipments(prev => prev.map(s => {
      if (s.loadId !== loadId) return s;
      return { ...s, status: 'Invoiced ✓' };
    }));
  }, []);

  const handleDismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    pushNotification({ type: 'info', title: 'Alert Resolved', message: 'Fleet alert has been dismissed.' });
  }, [pushNotification]);

  // User books a shipment → creates a load in the dispatch board
  const bookShipment = useCallback((formData) => {
    const shipId = `SHP-${Math.floor(1000 + Math.random() * 9000)}`;
    const origin = formData.pickupCity && formData.pickupState
      ? `${formData.pickupCity}, ${formData.pickupState}`
      : formData.pickup || 'TBD';
    const dest = formData.destCity && formData.destState
      ? `${formData.destCity}, ${formData.destState}`
      : formData.dest || 'TBD';

    const nextLoadId = loads.length > 0 ? Math.max(...loads.map(l => l.id)) + 1 : 400;

    setLoads(prev => {
      const id = prev.length > 0 ? Math.max(...prev.map(l => l.id)) + 1 : 400;
      return [{
        id,
        pickup: origin,
        delivery: dest,
        cargo: formData.commodity || 'General Freight',
        weight: parseInt(formData.weight) || 0,
        miles: 0,
        rate: 0,
        priority: 'medium',
        deadline: formData.pickupDate || 'TBD',
        status: 'needs_input',
        tag: 'NEW ORDER',
        returnProb: 50,
        candidates: [1, 3, 4],
        customerShipmentId: shipId,
      }, ...prev];
    });

    const now = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newShipment = {
      id: shipId,
      loadId: nextLoadId,
      origin,
      dest,
      status: 'Pending',
      eta: 'TBD',
      driver: 'Unassigned',
      driverPhone: '',
      commodity: formData.commodity || 'General Freight',
      weight: `${parseInt(formData.weight || 0).toLocaleString()} lbs`,
      amount: 'Pending',
      trailer: formData.trailer || 'Dry Van',
      bol: `BOL-${80000 + Math.floor(Math.random() * 9999)}`,
      truck: 'TBD',
      pickupDate: formData.pickupDate || now,
      deliveryDate: 'TBD',
      distance: 'TBD',
      events: [
        { label: 'Booking Request Received', time: now, done: true },
        { label: 'Awaiting Admin Confirmation', time: 'Pending', done: false },
        { label: 'Driver Assignment Pending', time: 'Pending', done: false },
        { label: 'Pickup Scheduled', time: 'Pending', done: false },
        { label: 'Delivery', time: 'Pending', done: false },
      ],
    };

    setUserShipments(prev => [newShipment, ...prev]);

    pushNotification({
      type: 'info',
      title: `New Customer Order — Load #${nextLoadId}`,
      message: `${origin} → ${dest} · ${newShipment.commodity}`,
    });

    return shipId;
  }, [loads, pushNotification]);

  const addLoad = useCallback((newLoad) => {
    setLoads(prev => {
      const nextId = prev.length > 0 ? Math.max(...prev.map(l => l.id)) + 1 : 400;
      const load = { ...newLoad, id: nextId };
      pushNotification({
        type: 'success',
        title: `Load #${nextId} Created`,
        message: `${load.pickup} → ${load.delivery} · ${load.cargo} · $${load.rate.toLocaleString()}`,
      });

      // Broadcast backhaul opportunity if below 80% GVWR
      const assignedTruckId = newLoad.truckId || newLoad.driverTruckId;
      const gvwr = TRUCK_GVWR[assignedTruckId];
      if (gvwr && load.weight < 0.8 * gvwr) {
        pushNotification({
          type: 'info',
          title: 'Backhaul Opportunity Broadcast',
          message: `Load #${nextId} · ${load.pickup} → ${load.delivery} — partial capacity, backhaul opportunity broadcast`,
        });
      }

      return [load, ...prev];
    });
  }, [pushNotification]);

  const awardBackhaul = useCallback((opportunityId, bidId, carrierName, netValue, route) => {
    pushNotification({
      type: 'success',
      title: 'Backhaul Awarded',
      message: `${carrierName} awarded backhaul on ${route} · Net value $${netValue}`,
    });
  }, [pushNotification]);

  return (
    <FleetContext.Provider value={{
      loads, alerts, showMap, setShowMap,
      notifications, pushNotification, markAllRead, dismissNotification, clearAllNotifications,
      handleConfirmLoad, handleDismissAlert, addLoad, awardBackhaul,
      userShipments, bookShipment, markDelivered, markInvoiced,
    }}>
      {children}
    </FleetContext.Provider>
  );
}

export function useFleetState() {
  return useContext(FleetContext);
}
