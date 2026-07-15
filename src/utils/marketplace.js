/**
 * marketplace.js — Backhaul Load Marketplace utility functions
 *
 * Exports:
 *   haversineMiles    — great-circle distance in miles
 *   detourCost        — extra fuel cost for a detour ($0.08/mi)
 *   filterBid         — 4-gate eligibility filter
 *   rankBids          — net value ranking with tie-break
 *   localMatchCompute — full pipeline (fallback when backend is unavailable)
 */

/**
 * Haversine distance between two lat/lng points, returned in miles.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lng1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lng2 - Longitude of point 2 (degrees)
 * @returns {number} Great-circle distance in miles
 */
export function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate the extra cost (USD) a truck incurs by detouring to drop a backhaul
 * load before continuing to its resume point.
 *
 * Formula: (detour miles − direct miles) × $0.08/mile, floored at 0.
 *
 * @param {number} truckLat  - Current truck latitude
 * @param {number} truckLng  - Current truck longitude
 * @param {number} dropLat   - Backhaul drop-off latitude
 * @param {number} dropLng   - Backhaul drop-off longitude
 * @param {number} resumeLat - Primary route resume point latitude
 * @param {number} resumeLng - Primary route resume point longitude
 * @returns {number} Extra cost in USD, rounded to 2 decimal places
 */
export function detourCost(truckLat, truckLng, dropLat, dropLng, resumeLat, resumeLng) {
  const directMiles = haversineMiles(truckLat, truckLng, resumeLat, resumeLng);
  const detourMiles = haversineMiles(truckLat, truckLng, dropLat, dropLng)
                    + haversineMiles(dropLat, dropLng, resumeLat, resumeLng);
  const extraMiles  = Math.max(detourMiles - directMiles, 0);
  return Math.round(extraMiles * 0.08 * 100) / 100; // round to 2 decimal places
}

/**
 * Rank a list of eligible bids by net value (descending), with tie-break on
 * ascending detour_cost. Attaches `net_value` and 1-indexed `rank` to each bid.
 *
 * @param {Array} eligibleBids - Array of bid objects with bid_price and detour_cost
 * @returns {Array} New array with net_value and rank attached; original is not mutated
 */
export function rankBids(eligibleBids) {
  // Attach net value
  const bids = eligibleBids.map(b => ({
    ...b,
    net_value: b.bid_price - b.detour_cost,
  }));

  // Sort: descending net_value; tie-break ascending detour_cost
  bids.sort((a, b) => {
    if (b.net_value !== a.net_value) return b.net_value - a.net_value;
    return a.detour_cost - b.detour_cost;
  });

  // Attach 1-indexed rank
  return bids.map((b, i) => ({ ...b, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// Commodity Compatibility Matrix
// Key = primary cargo type on the truck.
// Value = backhaul cargo types allowed alongside it.
// ---------------------------------------------------------------------------
const COMMODITY_COMPATIBILITY = {
  General:     ['General', 'Reefer', 'Hazmat', 'Pharma', 'Automotive', 'Agriculture', 'Industrial', 'Retail'],
  Retail:      ['General', 'Reefer', 'Automotive', 'Agriculture', 'Industrial', 'Retail'],
  Automotive:  ['General', 'Reefer', 'Automotive', 'Agriculture', 'Industrial', 'Retail'],
  Agriculture: ['General', 'Reefer', 'Automotive', 'Agriculture', 'Industrial', 'Retail'],
  Industrial:  ['General', 'Reefer', 'Automotive', 'Agriculture', 'Industrial', 'Retail', 'Hazmat'],
  Reefer:      ['Reefer', 'General', 'Pharma'],
  Hazmat:      ['Hazmat'],
  Pharma:      ['Pharma'],
};

/**
 * Eligibility filter for a backhaul bid.
 *
 * Applies three sequential gates:
 *   1. Commodity compatibility (or truck certification for Hazmat/Pharma)
 *   2. GVWR headroom
 *   3. LIFO route sequence
 *
 * @param {object} bid         - Bid object (cargo_type, cargo_weight_lbs, drop_stop_index)
 * @param {object} opportunity - Opportunity object (primary_cargo_type, primary_load_weight, next_stop_index)
 * @param {object} truck       - Truck object (certified_commodities, gvwr)
 * @returns {{ eligibility_status: string, disqualify_reason: string|null }}
 */
export function filterBid(bid, opportunity, truck) {
  // Gate 1: Commodity compatibility
  if (bid.cargo_type === 'Hazmat' || bid.cargo_type === 'Pharma') {
    if (!truck.certified_commodities.includes(bid.cargo_type)) {
      return { eligibility_status: 'ineligible', disqualify_reason: 'commodity_mismatch' };
    }
  } else {
    const compatibleWith = COMMODITY_COMPATIBILITY[opportunity.primary_cargo_type] || [];
    if (!compatibleWith.includes(bid.cargo_type)) {
      return { eligibility_status: 'ineligible', disqualify_reason: 'commodity_mismatch' };
    }
  }

  // Gate 2: GVWR headroom
  if (opportunity.primary_load_weight + bid.cargo_weight_lbs > truck.gvwr) {
    return { eligibility_status: 'ineligible', disqualify_reason: 'gvwr_exceeded' };
  }

  // Gate 3: LIFO route sequence
  if (bid.drop_stop_index > opportunity.next_stop_index) {
    return { eligibility_status: 'ineligible', disqualify_reason: 'route_sequence_violation' };
  }

  // Gate 4: Volumetric capacity
  if (opportunity.primary_load_volume_cuft + bid.cargo_volume_cuft > truck.trailer_volume_cuft) {
    return { eligibility_status: 'ineligible', disqualify_reason: 'volume_exceeded' };
  }

  return { eligibility_status: 'eligible', disqualify_reason: null };
}

// ---------------------------------------------------------------------------
// localMatchCompute — task 2.6
// Local fallback that mirrors the FastAPI /marketplace/match response shape.
// ---------------------------------------------------------------------------

import { TRUCK_GVWR, TRUCK_CERTIFICATIONS, TRUCK_TRAILER_SPECS } from '../data/mockData.js';

/**
 * Run the full eligibility filter + ranking pipeline locally, without the
 * FastAPI backend. Returns a result object that is structurally identical to
 * the POST /marketplace/match response.
 *
 * @param {object} opportunity - A BackhaulOpportunity object (with a `bids` array)
 * @returns {{ eligible_bids: object[], ineligible_bids: object[], recommended_bid_id: string|null }}
 */
export function localMatchCompute(opportunity) {
  const gvwr = TRUCK_GVWR[opportunity.truck_id] ?? opportunity.truck_gvwr;
  const certifiedCommodities = TRUCK_CERTIFICATIONS[opportunity.truck_id] ?? [];
  const trailerVolume = TRUCK_TRAILER_SPECS[opportunity.truck_id]?.trailer_volume_cuft ?? opportunity.truck_trailer_volume_cuft ?? 3800;
  const truck = { gvwr, certified_commodities: certifiedCommodities, trailer_volume_cuft: trailerVolume };

  const eligible_bids = [];
  const ineligible_bids = [];

  for (const bid of opportunity.bids) {
    const result = filterBid(bid, opportunity, truck);
    const annotated = { ...bid, ...result };
    if (result.eligibility_status === 'eligible') {
      eligible_bids.push(annotated);
    } else {
      ineligible_bids.push(annotated);
    }
  }

  const ranked = rankBids(eligible_bids);

  return {
    eligible_bids: ranked,
    ineligible_bids,
    recommended_bid_id: ranked[0]?.bid_id ?? null,
  };
}
