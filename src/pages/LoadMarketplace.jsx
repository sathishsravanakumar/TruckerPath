import { useState, useEffect } from 'react';
import { useFleetState } from '../hooks/useFleetState';
import { BACKHAUL_OPPORTUNITIES, TRUCK_CERTIFICATIONS, TRUCK_TRAILER_SPECS } from '../data/mockData';
import { localMatchCompute } from '../utils/marketplace';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import leafletIcon from 'leaflet/dist/images/marker-icon.png';
import leafletIconShadow from 'leaflet/dist/images/marker-shadow.png';

// ---------------------------------------------------------------------------
// Leaflet icon setup & city coordinates
// ---------------------------------------------------------------------------

const DefaultIcon = L.icon({
  iconUrl: leafletIcon,
  shadowUrl: leafletIconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const TruckIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#F59E0B;border:3px solid #fff;box-shadow:0 0 8px rgba(245,158,11,0.8);display:flex;align-items:center;justify-content:center;font-size:10px;">🚛</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const EligibleDropIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#10B981;border:2px solid #fff;box-shadow:0 0 6px rgba(16,185,129,0.7);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const IneligibleDropIcon = L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;border-radius:50%;background:#EF4444;border:2px solid rgba(255,255,255,0.4);opacity:0.6;"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const StopIcon = L.divIcon({
  className: '',
  html: `<div style="width:10px;height:10px;border-radius:50%;background:#F59E0B;border:2px solid rgba(255,255,255,0.6);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const CITY_COORDS = {
  'Dallas, TX':       [32.7767, -96.7970],
  'San Antonio, TX':  [29.4241, -98.4936],
  'El Paso, TX':      [31.7619, -106.4850],
  'Tucson, AZ':       [32.2226, -110.9747],
  'Phoenix, AZ':      [33.4484, -112.0740],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMatchRequest(opp) {
  return {
    truck_id: opp.truck_id,
    primary_load_weight: opp.primary_load_weight,
    truck_gvwr: opp.truck_gvwr,
    primary_cargo_type: opp.primary_cargo_type,
    truck_certified_commodities: TRUCK_CERTIFICATIONS[opp.truck_id] ?? [],
    next_stop_index: opp.next_stop_index,
    primary_load_volume_cuft: opp.primary_load_volume_cuft ?? 2660,
    truck_trailer_volume_cuft: TRUCK_TRAILER_SPECS[opp.truck_id]?.trailer_volume_cuft ?? 3800,
    bids: opp.bids.map(b => ({
      bid_id: b.bid_id,
      carrier_name: b.carrier_name,
      cargo_type: b.cargo_type,
      cargo_weight_lbs: b.cargo_weight_lbs,
      bid_price: b.bid_price,
      detour_cost: b.detour_cost,
      cargo_volume_cuft: b.cargo_volume_cuft ?? 0,
      drop_stop_index: b.drop_stop_index,
    })),
  };
}

/** Convert a disqualify_reason snake_case string to Title Case display text. */
function formatReason(reason) {
  if (!reason) return '';
  return reason
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// 5.1 — useMarketplace hook
// ---------------------------------------------------------------------------

function useMarketplace() {
  const { awardBackhaul } = useFleetState();
  const [matchResult, setMatchResult] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('idle');
  const [demoMode, setDemoMode] = useState(false);
  const [opportunity, setOpportunity] = useState(() =>
    JSON.parse(JSON.stringify(BACKHAUL_OPPORTUNITIES[0])) // deep clone so mutations don't affect seed
  );

  useEffect(() => { fetchOrFallback(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchOrFallback() {
    setFetchStatus('loading');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await fetch('http://localhost:8000/marketplace/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildMatchRequest(opportunity)),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Non-2xx');
      const data = await res.json();
      setMatchResult(data);
      setDemoMode(false);
    } catch {
      const data = localMatchCompute(opportunity);
      setMatchResult(data);
      setDemoMode(true);
    } finally {
      setFetchStatus('done');
    }
  }

  function handleAward(bid) {
    const route = `${opportunity.origin} → ${opportunity.destination}`;
    awardBackhaul(opportunity.id, bid.bid_id, bid.carrier_name, bid.net_value, route);
    const awardReason = `Rank #${bid.rank} · Net value $${bid.net_value} · ${bid.cargo_type} · ${bid.carrier_name}`;
    setOpportunity(prev => ({
      ...prev,
      status: 'awarded',
      winning_bid_id: bid.bid_id,
      award_reason: awardReason,
    }));
  }

  return { opportunity, matchResult, fetchStatus, demoMode, handleAward };
}

// ---------------------------------------------------------------------------
// 5.2 — CapacityBar
// ---------------------------------------------------------------------------

function CapacityBar({ pct, label = 'Capacity' }) {
  // Color thresholds: > 85% → red, >= 70% → amber, < 70% → green
  const color = pct > 85
    ? 'var(--red)'
    : pct >= 70
      ? 'var(--amber)'
      : 'var(--green)';

  const bgColor = pct > 85
    ? 'var(--red-dim)'
    : pct >= 70
      ? 'var(--amber-dim)'
      : 'var(--green-dim)';

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          {label}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 8, borderRadius: 100,
        background: bgColor,
        border: `1px solid ${color}33`,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          background: color,
          borderRadius: 100,
          transition: 'width 0.6s var(--ease)',
        }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.2 — OpportunitySummaryCard
// ---------------------------------------------------------------------------

function OpportunitySummaryCard({ opportunity }) {
  const {
    truck_id, driver_name, origin, destination, stops,
    capacity_utilization_pct, primary_load_weight, primary_load_volume_cuft,
    truck_gvwr, status, primary_cargo_type, next_stop_index,
  } = opportunity;

  const stopCount = stops ? stops.length : 0;
  const completedStops = next_stop_index || 0;
  const progressPct = stopCount > 1 ? Math.round((completedStops / (stopCount - 1)) * 100) : 0;

  // Truck health data (from TRUCK_DB)
  const truckHealth = {
    tireRL: 94, engine: 'OK', fuel: 71, brakes: 91,
  };

  return (
    <div className="glass-card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--amber), var(--green), var(--amber))' }} />

      <div style={{ padding: '20px 24px' }}>
        {/* Row 1: Truck ID + Status + Live indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Truck avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--amber-dim)', border: '1px solid var(--amber-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              🚛
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>{truck_id}</span>
                {status === 'awarded' ? (
                  <span className="badge green">Awarded</span>
                ) : (
                  <span className="badge amber">Broadcasting</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                {driver_name} · CDL Class A · 53ft Dry Van
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 2 }}>Dispatched</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Today 8:00 PM ETA</div>
          </div>
        </div>

        {/* Row 2: Route visualization — horizontal step progress */}
        <div style={{
          background: 'var(--surface2)', borderRadius: 12, padding: '16px 20px',
          border: '1px solid var(--border2)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              Live Route
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {completedStops} of {stopCount - 1} legs complete · {progressPct}%
            </span>
          </div>

          {/* Route dots + line */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            {/* Background line */}
            <div style={{ position: 'absolute', top: '50%', left: 20, right: 20, height: 2, background: 'var(--border2)', transform: 'translateY(-50%)' }} />
            {/* Progress line */}
            <div style={{ position: 'absolute', top: '50%', left: 20, width: `calc(${progressPct}% - 20px)`, height: 2, background: 'var(--amber)', transform: 'translateY(-50%)', transition: 'width 0.5s ease' }} />

            {stops.map((stop, i) => {
              const isCompleted = i < completedStops;
              const isCurrent = i === completedStops;

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
                  <div style={{
                    width: isCurrent ? 16 : 10,
                    height: isCurrent ? 16 : 10,
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--amber)' : isCurrent ? 'var(--green)' : 'var(--surface2)',
                    border: `2px solid ${isCompleted ? 'var(--amber)' : isCurrent ? 'var(--green)' : 'var(--border2)'}`,
                    boxShadow: isCurrent ? '0 0 8px rgba(16,185,129,0.6)' : 'none',
                    transition: 'all 0.3s',
                  }} />
                  <div style={{
                    position: 'absolute', top: 22,
                    fontSize: isCurrent ? 10 : 9,
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? 'var(--green)' : isCompleted ? 'var(--amber)' : 'var(--faint)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    maxWidth: 70,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {stop.split(',')[0]}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 28 }} /> {/* spacer for city labels */}
        </div>

        {/* Row 3: Stats grid — 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {/* Current Cargo */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>Primary Cargo</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{primary_cargo_type}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {primary_load_weight?.toLocaleString()} lbs · {(primary_load_volume_cuft || 0).toLocaleString()} cu ft
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              {origin} → {destination}
            </div>
          </div>

          {/* Capacity */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>Capacity</div>
            <div style={{ marginBottom: 8 }}>
              <CapacityBar pct={capacity_utilization_pct} label="Weight" />
            </div>
            <CapacityBar
              pct={Math.round(((primary_load_volume_cuft || 0) / (TRUCK_TRAILER_SPECS[truck_id]?.trailer_volume_cuft ?? 3800)) * 100)}
              label="Space"
            />
          </div>

          {/* Truck Health */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 8 }}>Truck Health</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {[
                { label: 'Tires', value: `${truckHealth.tireRL} PSI`, ok: truckHealth.tireRL >= 80 },
                { label: 'Engine', value: truckHealth.engine, ok: true },
                { label: 'Fuel', value: `${truckHealth.fuel}%`, ok: truckHealth.fuel >= 50 },
                { label: 'Brakes', value: `${truckHealth.brakes}%`, ok: truckHealth.brakes >= 70 },
              ].map(({ label, value, ok }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: ok ? 'var(--green)' : 'var(--red)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'blink 1.5s ease infinite' }} />
              <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>All Systems Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — BidCard (used in Incoming Bids column)
// ---------------------------------------------------------------------------

function BidCard({ bid, ineligible, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(bid.bid_id)}
      style={{
        background: selected ? 'rgba(245,158,11,0.08)' : 'var(--surface2)',
        border: '1px solid var(--border2)',
        borderLeft: selected ? '3px solid var(--amber)' : '3px solid transparent',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 10,
        opacity: ineligible ? 0.45 : 1,
        transition: 'opacity 0.2s, box-shadow 0.2s, background 0.2s',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
      }}
    >
      <div style={{
        fontWeight: 700,
        fontSize: 13,
        color: 'var(--text)',
        textDecoration: ineligible ? 'line-through' : 'none',
        marginBottom: 4,
      }}>
        {bid.carrier_name}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)' }}>
        <span>{bid.cargo_type}</span>
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span>{bid.cargo_weight_lbs?.toLocaleString()} lbs</span>
        <span style={{ color: 'var(--faint)' }}>·</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>${bid.bid_price?.toLocaleString()}</span>
      </div>
      {bid.pickup_location && (
        <div style={{ fontSize: 11, color: 'var(--faint)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{bid.pickup_location}</span>
          <span style={{ color: 'var(--amber)' }}>→</span>
          <span>{bid.drop_location}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — EligibilityBidRow (used in Eligibility Filter column)
// ---------------------------------------------------------------------------

function EligibilityBidRow({ bid, selected, onSelect }) {
  const isEligible = bid.eligibility_status === 'eligible';
  return (
    <div
      onClick={() => onSelect(bid.bid_id)}
      style={{
        background: selected ? 'rgba(245,158,11,0.08)' : 'var(--surface2)',
        border: `1px solid ${isEligible ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
        borderLeft: selected ? '3px solid var(--amber)' : '3px solid transparent',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, background 0.2s',
        boxShadow: selected ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>
        {bid.carrier_name}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{bid.cargo_type}</span>
        {isEligible ? (
          <span className="badge green">Passed</span>
        ) : (
          <span className="badge red">{formatReason(bid.disqualify_reason)}</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — RankedBidCard (used in Ranked List column)
// ---------------------------------------------------------------------------

function RankedBidCard({ bid, onAward, canAward, selected, onSelect }) {
  const isTopRank = bid.rank === 1;

  return (
    <div
      onClick={() => onSelect(bid.bid_id)}
      style={{
        background: selected ? 'rgba(245,158,11,0.08)' : 'var(--surface2)',
        border: '1px solid var(--border2)',
        borderLeft: selected ? '3px solid var(--amber)' : isTopRank ? '3px solid var(--amber)' : '3px solid transparent',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, background 0.2s',
        boxShadow: selected ? '0 0 12px rgba(245,158,11,0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* Rank badge */}
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: isTopRank ? '2px solid var(--amber)' : '2px solid var(--border2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 11, fontWeight: 800,
          color: isTopRank ? 'var(--amber)' : 'var(--muted)',
          flexShrink: 0,
        }}>
          {bid.rank}
        </div>
        <span style={{
          fontWeight: 700, fontSize: 13, color: 'var(--text)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {bid.carrier_name}
        </span>
        <span className="lb-tag" style={{
          background: 'var(--amber-dim)', color: 'var(--amber)',
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
        }}>
          {bid.cargo_type}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', marginBottom: 8 }}>
        <span>Bid <span style={{ color: 'var(--text)', fontWeight: 600 }}>${bid.bid_price?.toLocaleString()}</span></span>
        <span>Detour <span style={{ color: 'var(--red)', fontWeight: 600 }}>−${bid.detour_cost?.toLocaleString()}</span></span>
        <span>Net <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>${bid.net_value?.toLocaleString()}</span></span>
      </div>

      {isTopRank && canAward && (
        <button className="btn" style={{ width: '100%', marginTop: 4 }} onClick={() => onAward(bid)}>
          Award
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — WinnerCard (used in Award column)
// ---------------------------------------------------------------------------

function WinnerCard({ opportunity, matchResult }) {
  const winningBid = matchResult?.eligible_bids?.find(
    b => b.bid_id === opportunity.winning_bid_id
  );

  return (
    <div style={{
      background: 'var(--amber-dim)',
      border: '1px solid var(--amber-border)',
      borderRadius: 12,
      padding: '16px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
        Winner
      </div>
      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
        {winningBid?.carrier_name ?? '—'}
      </div>
      {winningBid && (
        <div style={{
          fontSize: 22, fontWeight: 800, color: 'var(--amber)',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.8px', marginBottom: 10,
        }}>
          ${winningBid.net_value?.toLocaleString()}
        </div>
      )}
      {opportunity.award_reason && (
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>
          {opportunity.award_reason}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — PipelineColumn
// ---------------------------------------------------------------------------

function PipelineColumn({ title, badge, badgeVariant = 'amber', children }) {
  return (
    <div className="glass-card" style={{ margin: 0, padding: 0, display: 'flex', flexDirection: 'column', minHeight: 320 }}>
      <div className="card-header">
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
          {title}
        </span>
        {badge !== undefined && (
          <span className={`badge ${badgeVariant}`}>{badge}</span>
        )}
      </div>
      <div className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.3 — BidPipelinePanel — four column kanban
// ---------------------------------------------------------------------------

function BidPipelinePanel({ opportunity, matchResult, onAward, selectedBidId, onSelectBid }) {
  // Build a set of ineligible bid_ids for fast lookup
  const ineligibleIds = new Set(
    (matchResult?.ineligible_bids ?? []).map(b => b.bid_id)
  );

  // Merge eligibility info back into all bids for the eligibility column
  const allBidsWithStatus = opportunity.bids.map(bid => {
    const ineligibleBid = matchResult?.ineligible_bids?.find(b => b.bid_id === bid.bid_id);
    const eligibleBid   = matchResult?.eligible_bids?.find(b => b.bid_id === bid.bid_id);
    if (ineligibleBid) return { ...bid, ...ineligibleBid };
    if (eligibleBid)   return { ...bid, ...eligibleBid, eligibility_status: 'eligible' };
    return bid;
  });

  const eligibleBids = matchResult?.eligible_bids ?? [];
  const eligibleCount = eligibleBids.length;
  const totalBids = opportunity.bids.length;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginTop: 8,
    }}>
      {/* Column 1 — Incoming Bids */}
      <PipelineColumn title="Incoming Bids" badge={totalBids} badgeVariant="amber">
        {opportunity.bids.map(bid => (
          <BidCard
            key={bid.bid_id}
            bid={bid}
            ineligible={ineligibleIds.has(bid.bid_id)}
            selected={bid.bid_id === selectedBidId}
            onSelect={onSelectBid}
          />
        ))}
      </PipelineColumn>

      {/* Column 2 — Eligibility Filter */}
      <PipelineColumn title="Eligibility Filter" badge={eligibleCount} badgeVariant="green">
        {allBidsWithStatus.map(bid => (
          <EligibilityBidRow key={bid.bid_id} bid={bid} selected={bid.bid_id === selectedBidId} onSelect={onSelectBid} />
        ))}
      </PipelineColumn>

      {/* Column 3 — Ranked List */}
      <PipelineColumn title="Ranked List" badge={eligibleCount} badgeVariant="amber">
        {eligibleBids.length === 0 ? (
          <p style={{ textAlign: 'center', paddingTop: 24 }}>No eligible bids</p>
        ) : (
          eligibleBids.map(bid => (
            <RankedBidCard
              key={bid.bid_id}
              bid={bid}
              canAward={opportunity.status === 'broadcast'}
              onAward={onAward}
              selected={bid.bid_id === selectedBidId}
              onSelect={onSelectBid}
            />
          ))
        )}
      </PipelineColumn>

      {/* Column 4 — Award */}
      <PipelineColumn title="Award" badgeVariant="green">
        {opportunity.status === 'awarded' ? (
          <WinnerCard opportunity={opportunity} matchResult={matchResult} />
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 24 }}>
            Awaiting award decision…
          </p>
        )}
      </PipelineColumn>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BidDetailPanel — full detail view of selected bid
// ---------------------------------------------------------------------------

function BidDetailPanel({ bid, opportunity, matchResult, onClose }) {
  if (!bid) return null;

  // Find the full bid data (with eligibility status) from matchResult
  const fullBid = matchResult?.eligible_bids?.find(b => b.bid_id === bid.bid_id)
    ?? matchResult?.ineligible_bids?.find(b => b.bid_id === bid.bid_id)
    ?? bid;

  const isEligible = fullBid.eligibility_status === 'eligible';
  const isWinner = opportunity.winning_bid_id === bid.bid_id;

  // Gate check details
  const gates = [
    {
      name: 'Commodity Compatibility',
      passed: fullBid.disqualify_reason !== 'commodity_mismatch',
      detail: isEligible || fullBid.disqualify_reason !== 'commodity_mismatch'
        ? `${bid.cargo_type} is compatible with primary cargo (${opportunity.primary_cargo_type})`
        : `${bid.cargo_type} cannot co-load with ${opportunity.primary_cargo_type} — truck lacks ${bid.cargo_type} certification`,
    },
    {
      name: 'Weight / GVWR',
      passed: fullBid.disqualify_reason !== 'gvwr_exceeded',
      detail: `Combined: ${(opportunity.primary_load_weight + bid.cargo_weight_lbs).toLocaleString()} lbs / ${opportunity.truck_gvwr.toLocaleString()} lbs GVWR`
        + (fullBid.disqualify_reason === 'gvwr_exceeded' ? ' — EXCEEDS LIMIT' : ' ✓'),
    },
    {
      name: 'Route Sequence (LIFO)',
      passed: fullBid.disqualify_reason !== 'route_sequence_violation',
      detail: `Drop at stop ${bid.drop_stop_index} (${bid.drop_location}), next primary stop is ${opportunity.next_stop_index} (${opportunity.stops[opportunity.next_stop_index]})`
        + (fullBid.disqualify_reason === 'route_sequence_violation' ? ' — OUT OF ORDER' : ' ✓'),
    },
    {
      name: 'Volumetric Space',
      passed: fullBid.disqualify_reason !== 'volume_exceeded',
      detail: `Combined: ${((opportunity.primary_load_volume_cuft || 0) + (bid.cargo_volume_cuft || 0)).toLocaleString()} cu ft / 3,800 cu ft`
        + (fullBid.disqualify_reason === 'volume_exceeded' ? ' — EXCEEDS CAPACITY' : ' ✓'),
    },
  ];

  return (
    <div className="glass-card" style={{ marginBottom: 16, borderLeft: isWinner ? '4px solid var(--green)' : isEligible ? '4px solid var(--amber)' : '4px solid var(--red)', animation: 'fadeUp 0.3s both' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ marginBottom: 2 }}>{bid.carrier_name}</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {bid.cargo_type} · {bid.cargo_weight_lbs?.toLocaleString()} lbs · {(bid.cargo_volume_cuft || 0).toLocaleString()} cu ft
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isWinner && <span className="badge green">WINNER</span>}
          {isEligible && !isWinner && <span className="badge amber">ELIGIBLE · RANK #{fullBid.rank}</span>}
          {!isEligible && <span className="badge red">{formatReason(fullBid.disqualify_reason)}</span>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 18, cursor: 'pointer', padding: '4px 8px' }}>✕</button>
        </div>
      </div>

      {/* Shipment Details */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
          Shipment Details
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* Pickup */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>📦</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pickup</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{bid.pickup_location || '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{bid.pickup_address || ''}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ color: 'var(--faint)' }}>Window:</span> {bid.pickup_window || '—'}
            </div>
          </div>
          {/* Dropoff */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>📍</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '1px' }}>Dropoff</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{bid.drop_location || '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{bid.drop_address || ''}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ color: 'var(--faint)' }}>Window:</span> {bid.delivery_window || '—'}
            </div>
          </div>
        </div>

        {/* Cargo + Shipping + Contact row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
          {/* Cargo description */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Cargo</div>
            <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 4 }}>{bid.commodity_description || bid.cargo_type}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
              <span>{bid.cargo_weight_lbs?.toLocaleString()} lbs</span>
              <span>{(bid.cargo_volume_cuft || 0).toLocaleString()} cu ft</span>
              <span>{bid.pallet_count || bid.skid_count || '—'} pallets</span>
            </div>
            {bid.special_instructions && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)', fontStyle: 'italic' }}>
                ⚠ {bid.special_instructions}
              </div>
            )}
          </div>

          {/* Shipping specs */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Shipping Specs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: 11 }}>
              <div style={{ color: 'var(--muted)' }}>Freight Class</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{bid.freight_class || '—'}</div>
              <div style={{ color: 'var(--muted)' }}>Skid Dims</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{bid.skid_dims || '—'}</div>
              <div style={{ color: 'var(--muted)' }}>Stackable</div>
              <div style={{ color: bid.is_stackable ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>{bid.is_stackable ? 'Yes' : 'No'}</div>
              <div style={{ color: 'var(--muted)' }}>Urgent</div>
              <div style={{ color: bid.is_urgent ? 'var(--red)' : 'var(--green)', fontWeight: 600 }}>{bid.is_urgent ? 'Yes' : 'No'}</div>
              <div style={{ color: 'var(--muted)' }}>Appt Required</div>
              <div style={{ color: 'var(--text)', fontWeight: 600 }}>{bid.delivery_appointment ? 'Yes' : 'No'}</div>
            </div>
            {bid.shipment_ref && (
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--faint)' }}>
                Ref: {bid.shipment_ref}
              </div>
            )}
          </div>

          {/* Contact */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Contact</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{bid.contact_name || '—'}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{bid.contact_phone || '—'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontSize: 10, color: 'var(--faint)' }}>
              <span>Fuel Surch.</span>
              <span style={{ color: 'var(--muted)' }}>{bid.fuel_surcharge_pct || 0}%</span>
              <span>Accessorials</span>
              <span style={{ color: 'var(--muted)' }}>${bid.accessorial_charges || 0}</span>
              <span>Quote</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>${bid.quote_amount?.toLocaleString() || '—'}</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 8 }}>
              Bid placed: {bid.bid_submitted_at || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Gate checks */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
          Eligibility Gates
        </div>
        {gates.map((gate, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
            background: gate.passed ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.06)',
            border: `1px solid ${gate.passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: 8, marginBottom: 6,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{gate.passed ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{gate.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{gate.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Financial breakdown (only for eligible bids) */}
      {isEligible && (
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border2)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
            Financial Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Bid Price</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>${bid.bid_price?.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Detour Cost</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>−${bid.detour_cost?.toLocaleString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Net Value</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>${fullBid.net_value?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RouteMap — live Leaflet map showing primary route + bid drops
// ---------------------------------------------------------------------------

function RouteMapFitBounds({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(coords, { padding: [40, 40] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function RouteMap({ opportunity, matchResult, selectedBidId }) {
  const [hoveredBidId, setHoveredBidId] = useState(null);

  const stops = opportunity.stops ?? [];
  const routeCoords = stops
    .map(s => CITY_COORDS[s])
    .filter(Boolean);

  const truckPos = CITY_COORDS[opportunity.origin] ?? routeCoords[0];

  const allBids = opportunity.bids ?? [];
  const eligibleIds = new Set((matchResult?.eligible_bids ?? []).map(b => b.bid_id));

  // Priority: selected > winning > hovered
  const activeBidId = selectedBidId ?? opportunity.winning_bid_id ?? hoveredBidId;
  const activeBid = allBids.find(b => b.bid_id === activeBidId);
  const detourPath = activeBid ? (() => {
    const dropCoords = CITY_COORDS[activeBid.drop_location];
    const nextStop = stops[activeBid.drop_stop_index + 1];
    const resumeCoords = nextStop ? CITY_COORDS[nextStop] : null;
    if (!dropCoords) return null;
    return resumeCoords
      ? [truckPos, dropCoords, resumeCoords]
      : [truckPos, dropCoords];
  })() : null;

  const primaryRevenue = opportunity.primary_load_id ? 2840 : 0;
  const bestBid = matchResult?.eligible_bids?.[0];
  const isAwarded = opportunity.status === 'awarded';
  const winningBid = matchResult?.eligible_bids?.find(b => b.bid_id === opportunity.winning_bid_id);

  if (routeCoords.length < 2) return null;

  return (
    <div style={{ position: 'relative', marginBottom: 24, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border2)', height: 380 }}>
      <MapContainer
        center={truckPos}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <RouteMapFitBounds coords={routeCoords} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Primary route — amber solid line */}
        <Polyline
          positions={routeCoords}
          pathOptions={{ color: '#F59E0B', weight: 3, opacity: 0.85 }}
        />

        {/* Detour path — blue dashed line */}
        {detourPath && (
          <Polyline
            positions={detourPath}
            pathOptions={{ color: '#3B82F6', weight: 2.5, opacity: 0.9, dashArray: '8 6' }}
          />
        )}

        {/* Stop markers along primary route (skip origin, that's the truck) */}
        {stops.slice(1).map((stop, i) => {
          const coords = CITY_COORDS[stop];
          if (!coords) return null;
          return (
            <Marker key={stop} position={coords} icon={StopIcon}>
              <Popup>
                <strong>{stop}</strong><br />
                Stop {i + 2} of {stops.length}
              </Popup>
            </Marker>
          );
        })}

        {/* Bid drop markers */}
        {allBids.map(bid => {
          const coords = CITY_COORDS[bid.drop_location];
          if (!coords) return null;
          const isEligible = eligibleIds.has(bid.bid_id);
          const isActive = bid.bid_id === activeBidId;
          return (
            <Marker
              key={bid.bid_id}
              position={coords}
              icon={isEligible ? EligibleDropIcon : IneligibleDropIcon}
              eventHandlers={{
                mouseover: () => setHoveredBidId(bid.bid_id),
                mouseout:  () => setHoveredBidId(null),
              }}
            >
              <Popup>
                <strong>{bid.carrier_name}</strong><br />
                {bid.cargo_type} · {bid.cargo_weight_lbs?.toLocaleString()} lbs<br />
                Bid: ${bid.bid_price?.toLocaleString()}<br />
                {isEligible
                  ? <span style={{ color: '#10B981', fontWeight: 700 }}>✓ Eligible · Net ${(bid.bid_price - bid.detour_cost)?.toLocaleString()}</span>
                  : <span style={{ color: '#EF4444', fontWeight: 700 }}>✗ {bid.disqualify_reason?.replace(/_/g, ' ')}</span>
                }
              </Popup>
            </Marker>
          );
        })}

        {/* Truck marker at origin */}
        <Marker position={truckPos} icon={TruckIcon}>
          <Popup>
            <strong>{opportunity.truck_id}</strong><br />
            {opportunity.driver_name}<br />
            {opportunity.capacity_utilization_pct}% loaded
          </Popup>
        </Marker>
      </MapContainer>

      {/* Financial overlay — bottom left */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 500,
        background: 'rgba(5,8,15,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border2)',
        borderRadius: 12,
        padding: '12px 16px',
        minWidth: 200,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
          Revenue Summary
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Primary haul</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>${primaryRevenue.toLocaleString()}</span>
        </div>
        {bestBid && !isAwarded && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Best backhaul</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)' }}>+${bestBid.net_value?.toLocaleString()}</span>
          </div>
        )}
        {winningBid && isAwarded && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Backhaul awarded</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>+${winningBid.net_value?.toLocaleString()}</span>
          </div>
        )}
        <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isAwarded ? '#10B981' : 'var(--amber)' }}>
            {isAwarded ? 'Confirmed' : 'Total potential'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-display)', color: isAwarded ? '#10B981' : 'var(--amber)' }}>
            ${(primaryRevenue + (isAwarded ? (winningBid?.net_value ?? 0) : (bestBid?.net_value ?? 0))).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend — bottom right */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 500,
        background: 'rgba(5,8,15,0.88)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border2)',
        borderRadius: 10,
        padding: '10px 14px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>Legend</div>
        {[
          { color: '#F59E0B', label: 'Primary route', dashed: false },
          { color: '#3B82F6', label: 'Detour path',   dashed: true  },
          { color: '#10B981', label: 'Eligible drop', dashed: false },
          { color: '#EF4444', label: 'Ineligible',    dashed: false },
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 20, height: 2, background: dashed ? 'transparent' : color, borderTop: dashed ? `2px dashed ${color}` : 'none', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
          </div>
        ))}
        <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 4 }}>Hover a bid pin to see detour</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5.4 — LoadMarketplace page
// ---------------------------------------------------------------------------

export default function LoadMarketplace() {
  const { opportunity, matchResult, fetchStatus, demoMode, handleAward } = useMarketplace();
  const [selectedBidId, setSelectedBidId] = useState(null);

  return (
    <div style={{ animation: 'fadeUp 0.4s both' }}>
      <div className="s-tag">Revenue · Load Marketplace</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2>Backhaul Marketplace</h2>
        {fetchStatus === 'done' && (
          <span className="status-live"><span className="live-dot" />Live</span>
        )}
        {demoMode && (
          <span className="badge amber">Demo Mode — Local Fallback</span>
        )}
      </div>

      <OpportunitySummaryCard opportunity={opportunity} />

      {fetchStatus === 'loading' && (
        <div style={{ color: 'var(--muted)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
          Fetching bids…
        </div>
      )}

      {fetchStatus === 'done' && matchResult && (
        <>
          <RouteMap opportunity={opportunity} matchResult={matchResult} selectedBidId={selectedBidId} />
          <BidDetailPanel
            bid={selectedBidId ? opportunity.bids.find(b => b.bid_id === selectedBidId) : null}
            opportunity={opportunity}
            matchResult={matchResult}
            onClose={() => setSelectedBidId(null)}
          />
          <BidPipelinePanel
            opportunity={opportunity}
            matchResult={matchResult}
            onAward={handleAward}
            selectedBidId={selectedBidId}
            onSelectBid={setSelectedBidId}
          />
        </>
      )}
    </div>
  );
}
