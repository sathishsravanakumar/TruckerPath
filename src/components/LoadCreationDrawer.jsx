import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Zap, MapPin } from 'lucide-react';
import { DRIVERS, CARGO_TYPES, US_CITIES } from '../data/mockData';
import { useFleetState } from '../hooks/useFleetState';

// ── Haversine distance (straight-line miles × 1.2 road factor) ─────────────
function calcMiles(c1, c2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(c2.lat - c1.lat);
  const dLng = toRad(c2.lng - c1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.2);
}

const EMPTY_FORM = {
  pickup: '', pickupCoords: null,
  delivery: '', deliveryCoords: null,
  cargo: '', weight: '', miles: '', milesAuto: false,
  rate: '', priority: 'medium', deadline: '', driverId: null,
};

const RETURN_HUBS = ['dallas', 'los angeles', 'denver', 'chicago', 'houston', 'phoenix', 'atlanta'];
const returnProb = delivery => {
  const d = delivery.toLowerCase();
  return RETURN_HUBS.some(h => d.includes(h))
    ? Math.floor(Math.random() * 21) + 60
    : Math.floor(Math.random() * 21) + 30;
};
const estimatedHours = miles => (miles ? Math.ceil(Number(miles) / 55) : 0);

// ── City Autocomplete ───────────────────────────────────────────────────────
function CityAutocomplete({ value, onSelect, placeholder, error }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  const results = query.length >= 2
    ? US_CITIES.filter(c => c.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  // sync external clear (form reset)
  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = city => {
    setQuery(city.label);
    setOpen(false);
    onSelect(city);
  };

  const handleKeyDown = e => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (results[highlighted]) handleSelect(results[highlighted]); }
    if (e.key === 'Escape')    setOpen(false);
  };

  const [focused, setFocused] = useState(false);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setHighlighted(0); setOpen(true); if (!e.target.value) onSelect(null); }}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${error ? 'var(--red)' : focused ? 'var(--blue)' : 'rgba(255,255,255,0.12)'}`,
            borderRadius: '8px', padding: '10px 12px 10px 30px',
            color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
          }}
        />
      </div>

      {open && results.length > 0 && (
        <div ref={listRef} style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          background: 'rgba(13,17,23,0.98)', border: '1px solid var(--border)',
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)',
        }}>
          {results.map((city, i) => (
            <div key={city.label}
              onMouseDown={() => handleSelect(city)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
                background: i === highlighted ? 'rgba(57,171,212,0.15)' : 'transparent',
                color: i === highlighted ? 'var(--blue)' : 'var(--text)',
                borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.1s',
              }}>
              <MapPin size={12} style={{ color: i === highlighted ? 'var(--blue)' : 'var(--muted)', flexShrink: 0 }} />
              <span>{city.label}</span>
            </div>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 600,
          background: 'rgba(13,17,23,0.98)', border: '1px solid var(--border)',
          borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--muted)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          No cities found for "{query}"
        </div>
      )}
    </div>
  );
}

// ── Shared primitives ───────────────────────────────────────────────────────
function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px', fontWeight: '700' }}>{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>{hint}</p>}
      {error && <p style={{ fontSize: '11px', color: 'var(--red)', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

const baseInput = {
  width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px', padding: '10px 12px', color: '#fff', fontSize: '13px', outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
};

function Input({ value, onChange, placeholder, type = 'text', min, max, readOnly, suffix }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        min={min} max={max} readOnly={readOnly}
        style={{ ...baseInput, borderColor: focused ? 'var(--blue)' : 'rgba(255,255,255,0.12)', paddingRight: suffix ? '52px' : '12px', background: readOnly ? 'rgba(57,171,212,0.05)' : baseInput.background, cursor: readOnly ? 'default' : 'text' }}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
      {suffix && <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--blue)', fontWeight: '700' }}>{suffix}</span>}
    </div>
  );
}

function SelectInput({ value, onChange, options, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <select value={value} onChange={onChange}
      style={{ ...baseInput, borderColor: focused ? 'var(--blue)' : 'rgba(255,255,255,0.12)', cursor: 'pointer', appearance: 'none' }}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <option value="" disabled style={{ background: '#0d1117' }}>{placeholder}</option>
      {options.map(o => <option key={o} value={o} style={{ background: '#0d1117' }}>{o}</option>)}
    </select>
  );
}

// ── Step Indicator ──────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Route & Cargo', 'Driver', 'Review'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
      {steps.map((label, i) => {
        const done = i < current, active = i === current;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? '1' : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0, background: done ? 'var(--green)' : active ? 'var(--blue)' : 'rgba(255,255,255,0.08)', border: `2px solid ${done ? 'var(--green)' : active ? 'var(--blue)' : 'rgba(255,255,255,0.15)'}`, color: done || active ? '#000' : 'var(--muted)' }}>
                {done ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: '10px', color: active ? 'var(--blue)' : done ? 'var(--green)' : 'var(--muted)', whiteSpace: 'nowrap', fontWeight: active ? '700' : '400' }}>{label}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', background: done ? 'var(--green)' : 'rgba(255,255,255,0.08)', margin: '0 8px', marginBottom: '18px' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Route & Cargo ───────────────────────────────────────────────────
function Step1({ form, setForm, errors }) {
  const handlePickupSelect = city => {
    if (!city) { setForm(f => ({ ...f, pickup: '', pickupCoords: null, miles: '', milesAuto: false })); return; }
    setForm(f => {
      const miles = f.deliveryCoords ? String(calcMiles(city, f.deliveryCoords)) : f.miles;
      return { ...f, pickup: city.label, pickupCoords: city, miles, milesAuto: !!f.deliveryCoords };
    });
  };

  const handleDeliverySelect = city => {
    if (!city) { setForm(f => ({ ...f, delivery: '', deliveryCoords: null, miles: '', milesAuto: false })); return; }
    setForm(f => {
      const miles = f.pickupCoords ? String(calcMiles(f.pickupCoords, city)) : f.miles;
      return { ...f, delivery: city.label, deliveryCoords: city, miles, milesAuto: !!f.pickupCoords };
    });
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Pickup Location" error={errors.pickup}>
          <CityAutocomplete value={form.pickup} onSelect={handlePickupSelect} placeholder="Search city..." error={errors.pickup} />
        </Field>
        <Field label="Delivery Location" error={errors.delivery}>
          <CityAutocomplete value={form.delivery} onSelect={handleDeliverySelect} placeholder="Search city..." error={errors.delivery} />
        </Field>
      </div>

      {form.pickupCoords && form.deliveryCoords && (
        <div style={{ background: 'rgba(57,171,212,0.07)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', marginTop: '-4px', fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={12} color="var(--blue)" />
          <span>{form.pickup} → {form.delivery} · <strong style={{ color: 'var(--blue)' }}>{form.miles} mi</strong> estimated (road distance)</span>
        </div>
      )}

      <Field label="Cargo Type" error={errors.cargo}>
        <SelectInput value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value, priority: e.target.value === 'Chemical Supplies' ? 'high' : f.priority }))} options={CARGO_TYPES} placeholder="Select cargo type" />
        {form.cargo === 'Chemical Supplies' && (
          <p style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '4px' }}>⚠️ HazMat cargo — auto-set to High Priority</p>
        )}
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Weight (lbs)" error={errors.weight}>
          <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="42,000" min="1" max="80000" />
        </Field>
        <Field label="Miles" error={errors.miles} hint={form.milesAuto ? undefined : 'Select both cities to auto-calculate'}>
          <Input type="number" value={form.miles} onChange={e => setForm(f => ({ ...f, miles: e.target.value, milesAuto: false }))} placeholder="601" min="1" readOnly={form.milesAuto} suffix={form.milesAuto ? 'AUTO' : undefined} />
        </Field>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Rate ($)" error={errors.rate}>
          <Input type="number" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} placeholder="2,980" min="1" />
        </Field>
        <Field label="Priority">
          <div style={{ display: 'flex', gap: '8px' }}>
            {['high', 'medium'].map(p => (
              <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', textTransform: 'capitalize', transition: 'all 0.2s', border: form.priority === p ? `2px solid ${p === 'high' ? 'var(--red)' : 'var(--amber)'}` : '1px solid rgba(255,255,255,0.12)', background: form.priority === p ? (p === 'high' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)') : 'rgba(255,255,255,0.03)', color: form.priority === p ? (p === 'high' ? 'var(--red)' : 'var(--amber)') : 'var(--muted)' }}>
                {p}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <Field label="Deadline" error={errors.deadline}>
        <Input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
      </Field>
    </>
  );
}

// ── Step 2: Driver Assignment ───────────────────────────────────────────────
function Step2({ form, setForm }) {
  const needed = estimatedHours(form.miles);
  const eligible = DRIVERS.filter(d => d.status === 'available' && d.hos >= needed);
  const best = eligible.reduce((a, b) => (!a || b.score > a.score ? b : a), null);

  return (
    <>
      {needed > 0 && (
        <div style={{ background: 'rgba(57,171,212,0.07)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px', color: 'var(--muted)' }}>
          Estimated trip: <strong style={{ color: 'var(--text)' }}>{needed} hrs</strong> · Showing drivers with HOS ≥ {needed} hrs
        </div>
      )}
      <div style={{ marginBottom: '12px' }}>
        <button type="button" onClick={() => setForm(f => ({ ...f, driverId: null }))}
          style={{ width: '100%', padding: '14px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', textAlign: 'left', transition: 'all 0.2s', border: form.driverId === null ? '2px solid var(--blue)' : '1px solid rgba(255,255,255,0.1)', background: form.driverId === null ? 'rgba(57,171,212,0.1)' : 'rgba(255,255,255,0.03)', color: form.driverId === null ? 'var(--blue)' : 'var(--muted)' }}>
          Leave Unassigned — status: NEEDS INPUT
        </button>
      </div>
      {eligible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: '13px' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
          No available drivers with sufficient HOS for this trip.
        </div>
      ) : eligible.map(d => {
        const isSelected = form.driverId === d.id;
        return (
          <div key={d.id} onClick={() => setForm(f => ({ ...f, driverId: d.id }))}
            style={{ padding: '14px 16px', borderRadius: '10px', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.2s', border: isSelected ? '2px solid var(--blue)' : '1px solid rgba(255,255,255,0.08)', background: isSelected ? 'rgba(57,171,212,0.1)' : 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', color: '#000', flexShrink: 0 }}>{d.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px' }}>{d.name}</span>
                  {best?.id === d.id && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--blue)', fontWeight: '700' }}><Zap size={10} /> AI PICK</span>}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{d.location} · {d.truck} · HOS {d.hos}hrs · Score {d.score}</span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: d.score >= 80 ? 'var(--green)' : d.score >= 50 ? 'var(--amber)' : 'var(--red)' }}>{d.score}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>score</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Step 3: Review ──────────────────────────────────────────────────────────
function Step3({ form, onEdit }) {
  const driver = form.driverId ? DRIVERS.find(d => d.id === form.driverId) : null;
  const margin = form.rate ? Math.round(Number(form.rate) * 0.12) : 0;
  const retProb = form.delivery ? returnProb(form.delivery) : '—';

  const rows = [
    { label: 'Route',       value: `${form.pickup} → ${form.delivery}`, step: 0 },
    { label: 'Cargo',       value: `${form.cargo}${form.cargo === 'Chemical Supplies' ? ' ⚠️ HazMat' : ''}`, step: 0 },
    { label: 'Weight',      value: `${Number(form.weight).toLocaleString()} lbs`, step: 0 },
    { label: 'Miles',       value: `${Number(form.miles).toLocaleString()} mi${form.milesAuto ? ' (auto)' : ''}`, step: 0 },
    { label: 'Rate',        value: `$${Number(form.rate).toLocaleString()}`, step: 0, color: 'var(--green)' },
    { label: 'Est. Margin', value: `$${margin.toLocaleString()}`, step: 0, color: 'var(--green)' },
    { label: 'Priority',    value: form.priority.toUpperCase(), step: 0, color: form.priority === 'high' ? 'var(--red)' : 'var(--amber)' },
    { label: 'Deadline',    value: new Date(form.deadline).toLocaleString(), step: 0 },
    { label: 'Return Prob.',value: `${retProb}%`, step: 1, color: retProb >= 60 ? 'var(--green)' : retProb >= 40 ? 'var(--amber)' : 'var(--red)' },
    { label: 'Driver',      value: driver ? `${driver.name} · ${driver.truck}` : 'Unassigned (Needs Input)', step: 1, color: driver ? 'var(--text)' : 'var(--amber)' },
  ];

  return (
    <div>
      <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>Ready to Create</div>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>{form.pickup} → {form.delivery}</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>{form.cargo} · {Number(form.miles).toLocaleString()} mi · ${Number(form.rate).toLocaleString()}</div>
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{row.label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: row.color || 'var(--text)' }}>{row.value}</span>
            <button type="button" onClick={() => onEdit(row.step)} style={{ fontSize: '10px', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}>edit</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Drawer ─────────────────────────────────────────────────────────────
export default function LoadCreationDrawer({ open, onClose }) {
  const { addLoad } = useFleetState();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) { setStep(0); setForm(EMPTY_FORM); setErrors({}); setSubmitted(false); }
  }, [open]);

  const validate = useCallback(() => {
    const e = {};
    if (!form.pickup.trim()) e.pickup = 'Select a pickup city';
    if (!form.delivery.trim()) e.delivery = 'Select a delivery city';
    else if (form.pickup.trim().toLowerCase() === form.delivery.trim().toLowerCase()) e.delivery = 'Pickup and delivery must differ';
    if (!form.cargo) e.cargo = 'Cargo type is required';
    if (!form.weight || Number(form.weight) < 1 || Number(form.weight) > 80000) e.weight = 'Weight must be 1–80,000 lbs';
    if (!form.miles || Number(form.miles) < 1) e.miles = 'Miles must be greater than 0';
    if (!form.rate || Number(form.rate) < 1) e.rate = 'Rate must be greater than 0';
    if (!form.deadline) {
      e.deadline = 'Deadline is required';
    } else if (new Date(form.deadline) < new Date(Date.now() + 2 * 60 * 60 * 1000)) {
      e.deadline = 'Deadline must be at least 2 hours from now';
    }
    return e;
  }, [form]);

  const handleNext = () => {
    if (step === 0) {
      const e = validate();
      setErrors(e);
      if (Object.keys(e).length > 0) return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    const driver = form.driverId ? DRIVERS.find(d => d.id === form.driverId) : null;
    addLoad({
      pickup: form.pickup,
      delivery: form.delivery,
      cargo: form.cargo,
      weight: Number(form.weight),
      miles: Number(form.miles),
      rate: Number(form.rate),
      priority: form.priority,
      deadline: new Date(form.deadline).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
      driverId: form.driverId || undefined,
      candidates: form.driverId ? undefined : DRIVERS.filter(d => d.status === 'available').map(d => d.id),
      status: driver ? 'ready' : 'needs_input',
      tag: driver ? 'READY' : 'NEEDS INPUT',
      returnProb: returnProb(form.delivery),
    });
    setSubmitted(true);
    setTimeout(() => onClose(), 1800);
  };

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 400, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '500px', zIndex: 500, background: 'rgba(13,17,23,0.98)', backdropFilter: 'blur(24px)', borderLeft: '1px solid var(--border)', boxShadow: '-16px 0 48px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px' }}>New Load</h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>Create and dispatch a load</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '4px', borderRadius: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '24px' }}>✓</div>
              <h3 style={{ color: 'var(--green)', marginBottom: '8px' }}>Load Created!</h3>
              <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Added to the dispatch queue.</p>
            </div>
          ) : (
            <>
              <StepIndicator current={step} />
              {step === 0 && <Step1 form={form} setForm={setForm} errors={errors} />}
              {step === 1 && <Step2 form={form} setForm={setForm} />}
              {step === 2 && <Step3 form={form} onEdit={setStep} />}
            </>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{ padding: '20px 28px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0 }}>
            {step > 0 && (
              <button className="btn secondary" onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ChevronLeft size={15} /> Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 2 ? (
              <button className="btn" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Next <ChevronRight size={15} />
              </button>
            ) : (
              <button className="btn" onClick={handleSubmit} style={{ background: 'var(--green)', color: '#000', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                <Check size={15} /> Create Load
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
