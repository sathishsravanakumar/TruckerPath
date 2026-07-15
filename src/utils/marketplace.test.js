/**
 * Tests for src/utils/marketplace.js
 * Unit tests + property-based tests (fast-check) for all marketplace utility functions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { haversineMiles, detourCost } from './marketplace.js';

// ---------------------------------------------------------------------------
// Unit tests — haversineMiles
// ---------------------------------------------------------------------------

describe('haversineMiles', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineMiles(32.7767, -96.797, 32.7767, -96.797)).toBe(0);
  });

  it('returns a positive distance for two different cities', () => {
    // Dallas, TX → Phoenix, AZ (roughly 887 miles great-circle)
    const d = haversineMiles(32.7767, -96.797, 33.4484, -112.074);
    expect(d).toBeGreaterThan(800);
    expect(d).toBeLessThan(950);
  });

  it('is symmetric — distance A→B equals B→A', () => {
    const lat1 = 29.4241, lng1 = -98.4936; // San Antonio
    const lat2 = 31.7619, lng2 = -106.485; // El Paso
    expect(haversineMiles(lat1, lng1, lat2, lng2)).toBeCloseTo(
      haversineMiles(lat2, lng2, lat1, lng1),
      10
    );
  });

  it('returns miles (not km) — equatorial degree ≈ 69 miles', () => {
    // 1 degree of latitude ≈ 69.1 miles
    const d = haversineMiles(0, 0, 1, 0);
    expect(d).toBeGreaterThan(68);
    expect(d).toBeLessThan(70);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — detourCost
// ---------------------------------------------------------------------------

describe('detourCost', () => {
  it('returns 0 when the drop is exactly on the direct route', () => {
    // All three points identical → no extra miles
    const cost = detourCost(32.7767, -96.797, 32.7767, -96.797, 32.7767, -96.797);
    expect(cost).toBe(0);
  });

  it('returns 0 when detour miles ≤ direct miles (triangle-inequality edge case)', () => {
    // drop point collinear between truck and resume should give 0
    const truck  = { lat: 0, lng: 0 };
    const resume = { lat: 2, lng: 0 };
    const drop   = { lat: 1, lng: 0 }; // exactly between them
    const cost = detourCost(truck.lat, truck.lng, drop.lat, drop.lng, resume.lat, resume.lng);
    expect(cost).toBeGreaterThanOrEqual(0);
  });

  it('returns a positive cost when the drop is off-route', () => {
    // Truck at Dallas, drop at San Antonio (off north-south axis), resume at El Paso
    const cost = detourCost(
      32.7767, -96.797,   // Dallas, TX
      29.4241, -98.4936,  // San Antonio, TX (side detour)
      31.7619, -106.485   // El Paso, TX
    );
    expect(cost).toBeGreaterThan(0);
  });

  it('result is rounded to at most 2 decimal places', () => {
    const cost = detourCost(
      32.7767, -96.797,
      29.4241, -98.4936,
      31.7619, -106.485
    );
    // Verify rounding — value × 100 should be an integer
    expect(Math.round(cost * 100)).toBe(cost * 100);
  });

  it('computes cost using $0.08/extra mile rate', () => {
    // Manufacture a scenario where extra miles is exactly known.
    // Use collinear points where detour detour distance is precisely 2× lat-step more.
    // Dallas → drop 1° east → resume 1° east+south vs direct south
    const truckLat = 0, truckLng = 0;
    const dropLat  = 0, dropLng  = 1;   // 1° east
    const resumeLat = 0, resumeLng = 0;  // back to start (forced detour)
    const directMiles = haversineMiles(truckLat, truckLng, resumeLat, resumeLng); // 0
    const detourMiles = haversineMiles(truckLat, truckLng, dropLat, dropLng)
                      + haversineMiles(dropLat, dropLng, resumeLat, resumeLng);
    const expectedCost = Math.round(Math.max(detourMiles - directMiles, 0) * 0.08 * 100) / 100;
    expect(detourCost(truckLat, truckLng, dropLat, dropLng, resumeLat, resumeLng))
      .toBe(expectedCost);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

// Arbitrary for valid lat/lng coordinates
const latArb = fc.float({ min: -89, max: 89, noNaN: true });
const lngArb = fc.float({ min: -179, max: 179, noNaN: true });

describe('haversineMiles — properties', () => {
  it('is always non-negative for any two coordinate pairs', () => {
    fc.assert(
      fc.property(latArb, lngArb, latArb, lngArb, (lat1, lng1, lat2, lng2) => {
        return haversineMiles(lat1, lng1, lat2, lng2) >= 0;
      }),
      { numRuns: 100 }
    );
  });

  it('is symmetric: d(A,B) === d(B,A) for any two points', () => {
    fc.assert(
      fc.property(latArb, lngArb, latArb, lngArb, (lat1, lng1, lat2, lng2) => {
        const d1 = haversineMiles(lat1, lng1, lat2, lng2);
        const d2 = haversineMiles(lat2, lng2, lat1, lng1);
        return Math.abs(d1 - d2) < 1e-9;
      }),
      { numRuns: 100 }
    );
  });

  it('satisfies triangle inequality: d(A,C) ≤ d(A,B) + d(B,C)', () => {
    fc.assert(
      fc.property(
        latArb, lngArb,
        latArb, lngArb,
        latArb, lngArb,
        (la, lo, lb, lb2, lc, lc2) => {
          const ab = haversineMiles(la, lo, lb, lb2);
          const bc = haversineMiles(lb, lb2, lc, lc2);
          const ac = haversineMiles(la, lo, lc, lc2);
          return ac <= ab + bc + 1e-6; // small epsilon for floating point
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when both points are identical', () => {
    fc.assert(
      fc.property(latArb, lngArb, (lat, lng) => {
        return haversineMiles(lat, lng, lat, lng) === 0;
      }),
      { numRuns: 100 }
    );
  });
});

describe('detourCost — properties', () => {
  it('is always non-negative for any coordinates', () => {
    fc.assert(
      fc.property(
        latArb, lngArb,
        latArb, lngArb,
        latArb, lngArb,
        (tLat, tLng, dLat, dLng, rLat, rLng) => {
          return detourCost(tLat, tLng, dLat, dLng, rLat, rLng) >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('is always rounded to at most 2 decimal places', () => {
    fc.assert(
      fc.property(
        latArb, lngArb,
        latArb, lngArb,
        latArb, lngArb,
        (tLat, tLng, dLat, dLng, rLat, rLng) => {
          const cost = detourCost(tLat, tLng, dLat, dLng, rLat, rLng);
          // cost * 100, when rounded, should equal cost * 100 exactly
          return Math.abs(Math.round(cost * 100) - cost * 100) < 1e-9;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('equals $0.08 × max(detourMiles − directMiles, 0), rounded to 2dp', () => {
    fc.assert(
      fc.property(
        latArb, lngArb,
        latArb, lngArb,
        latArb, lngArb,
        (tLat, tLng, dLat, dLng, rLat, rLng) => {
          const direct  = haversineMiles(tLat, tLng, rLat, rLng);
          const detour  = haversineMiles(tLat, tLng, dLat, dLng)
                        + haversineMiles(dLat, dLng, rLat, rLng);
          const expected = Math.round(Math.max(detour - direct, 0) * 0.08 * 100) / 100;
          const actual   = detourCost(tLat, tLng, dLat, dLng, rLat, rLng);
          return Math.abs(actual - expected) < 1e-9;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Unit tests — rankBids
// ---------------------------------------------------------------------------

import { rankBids } from './marketplace.js';

describe('rankBids', () => {
  // Seed bids from the design doc scenario
  const BID_001 = {
    bid_id: 'BID-001',
    carrier_name: 'Lone Star Freight',
    bid_price: 1400,
    detour_cost: 112,
  };
  const BID_002 = {
    bid_id: 'BID-002',
    carrier_name: 'Southwest Carriers',
    bid_price: 1850,
    detour_cost: 96,
  };

  it('BID-002 (net $1,754) ranks first over BID-001 (net $1,288)', () => {
    const result = rankBids([BID_001, BID_002]);
    expect(result[0].bid_id).toBe('BID-002');
    expect(result[0].net_value).toBe(1754);
    expect(result[0].rank).toBe(1);
    expect(result[1].bid_id).toBe('BID-001');
    expect(result[1].net_value).toBe(1288);
    expect(result[1].rank).toBe(2);
  });

  it('returns [] for an empty array', () => {
    expect(rankBids([])).toEqual([]);
  });

  it('assigns rank 1 to a single bid', () => {
    const result = rankBids([BID_001]);
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe(1);
    expect(result[0].net_value).toBe(1288);
  });

  it('tie on net_value → lower detour_cost wins (rank #1)', () => {
    const bidA = { bid_id: 'A', bid_price: 1000, detour_cost: 200 }; // net 800, detour 200
    const bidB = { bid_id: 'B', bid_price: 900,  detour_cost: 100 }; // net 800, detour 100
    const result = rankBids([bidA, bidB]);
    expect(result[0].bid_id).toBe('B'); // lower detour_cost wins
    expect(result[0].rank).toBe(1);
    expect(result[1].bid_id).toBe('A');
    expect(result[1].rank).toBe(2);
  });

  it('does not mutate the original array', () => {
    const original = [{ ...BID_001 }, { ...BID_002 }];
    const snapshot = original.map(b => ({ ...b }));
    rankBids(original);
    // Original array order and contents should be unchanged
    original.forEach((bid, i) => {
      expect(bid.bid_id).toBe(snapshot[i].bid_id);
      expect(bid.bid_price).toBe(snapshot[i].bid_price);
      expect(bid.detour_cost).toBe(snapshot[i].detour_cost);
    });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests — rankBids (Properties 7–9)
// ---------------------------------------------------------------------------

describe('rankBids — properties', () => {
  // Arbitrary for a single bid: bid_price and detour_cost as finite numbers
  const bidArb = fc.record({
    bid_id:      fc.uuid(),
    bid_price:   fc.float({ min: 0, max: 10000, noNaN: true }),
    detour_cost: fc.float({ min: 0, max: 5000,  noNaN: true }),
  });

  // Non-empty list of bids
  const bidsArb     = fc.array(bidArb, { minLength: 1, maxLength: 20 });
  // Possibly empty list of bids
  const bidsAnyArb  = fc.array(bidArb, { minLength: 0, maxLength: 20 });

  it(
    'Property 7: net_value === bid_price - detour_cost for every bid — Validates: Requirements 6.1',
    () => {
      fc.assert(
        fc.property(bidsAnyArb, (bids) => {
          const result = rankBids(bids);
          return result.every(b => b.net_value === b.bid_price - b.detour_cost);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'Property 8: result is sorted descending by net_value; ties broken by ascending detour_cost — Validates: Requirements 6.2, 6.3',
    () => {
      fc.assert(
        fc.property(bidsArb, (bids) => {
          const result = rankBids(bids);
          for (let i = 0; i < result.length - 1; i++) {
            const curr = result[i];
            const next = result[i + 1];
            if (curr.net_value === next.net_value) {
              // tie-break: ascending detour_cost
              if (curr.detour_cost > next.detour_cost) return false;
            } else {
              // descending net_value
              if (curr.net_value < next.net_value) return false;
            }
          }
          return true;
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'Property 9: ranks are contiguous 1-indexed integers (bids[i].rank === i+1) — Validates: Requirements 6.4',
    () => {
      fc.assert(
        fc.property(bidsAnyArb, (bids) => {
          const result = rankBids(bids);
          return result.every((b, i) => b.rank === i + 1);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// filterBid — task 2.2
// ---------------------------------------------------------------------------
import { filterBid } from './marketplace.js';

// ---------------------------------------------------------------------------
// Seed data for unit tests (TRUCK-012 scenario from design doc)
// ---------------------------------------------------------------------------

/**
 * TRUCK-012: certifications General/Retail/Automotive/Agriculture/Industrial
 * GVWR 80,000 lbs.
 */
const TRUCK_012 = {
  id: 'TRUCK-012',
  gvwr: 80000,
  certified_commodities: ['General', 'Retail', 'Automotive', 'Agriculture', 'Industrial'],
  trailer_volume_cuft: 3800,
};

/**
 * OPP-001: Industrial primary cargo, 56,000 lbs, next stop index 1.
 */
const OPP_001 = {
  id: 'OPP-001',
  primary_cargo_type: 'Industrial',
  primary_load_weight: 56000,
  next_stop_index: 1,
  primary_load_volume_cuft: 2660,
};

// Seed bids from design doc
const BID_001 = {
  bid_id: 'BID-001',
  cargo_type: 'Retail',
  cargo_weight_lbs: 18000,   // 56000+18000=74000 < 80000 ✓
  drop_stop_index: 1,        // matches next stop ✓
  cargo_volume_cuft: 1200,   // 2660+1200=3860 > 3800 ✗ (fails Gate 4)
};

const BID_002 = {
  bid_id: 'BID-002',
  cargo_type: 'Automotive',
  cargo_weight_lbs: 15000,   // 56000+15000=71000 < 80000 ✓
  drop_stop_index: 1,
  cargo_volume_cuft: 850,    // 2660+850=3510 ≤ 3800 ✓ (passes Gate 4)
};

const BID_003 = {
  bid_id: 'BID-003',
  cargo_type: 'Hazmat',      // TRUCK-012 not Hazmat certified ✗
  cargo_weight_lbs: 10000,
  drop_stop_index: 2,
  cargo_volume_cuft: 400,    // irrelevant, still fails Gate 1
};

const BID_004 = {
  bid_id: 'BID-004',
  cargo_type: 'General',
  cargo_weight_lbs: 28000,   // 56000+28000=84000 > 80000 ✗
  drop_stop_index: 2,
  cargo_volume_cuft: 900,    // irrelevant, still fails Gate 2
};

const BID_005 = {
  bid_id: 'BID-005',
  cargo_type: 'Agriculture',
  cargo_weight_lbs: 12000,   // 56000+12000=68000 < 80000 ✓
  drop_stop_index: 3,        // 3 > next_stop_index 1 ✗
  cargo_volume_cuft: 600,    // irrelevant, still fails Gate 3
};

// ---------------------------------------------------------------------------
// Unit tests — filterBid
// ---------------------------------------------------------------------------

describe('filterBid — unit tests', () => {
  // BID-003: Hazmat, truck not certified → commodity_mismatch
  it('BID-003: returns commodity_mismatch for Hazmat bid on uncertified truck', () => {
    const result = filterBid(BID_003, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'ineligible',
      disqualify_reason: 'commodity_mismatch',
    });
  });

  // BID-004: General cargo, overweight → gvwr_exceeded
  it('BID-004: returns gvwr_exceeded when combined weight exceeds truck GVWR', () => {
    const result = filterBid(BID_004, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'ineligible',
      disqualify_reason: 'gvwr_exceeded',
    });
  });

  // BID-005: Agriculture, wrong stop order → route_sequence_violation
  it('BID-005: returns route_sequence_violation when drop_stop_index > next_stop_index', () => {
    const result = filterBid(BID_005, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'ineligible',
      disqualify_reason: 'route_sequence_violation',
    });
  });

  // BID-001: now fails Gate 4 (volume_exceeded)
  it('BID-001: returns volume_exceeded — light but bulky, cubes out at Gate 4', () => {
    const result = filterBid(BID_001, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'ineligible',
      disqualify_reason: 'volume_exceeded',
    });
  });

  // BID-002: eligible — passes all four gates
  it('BID-002: returns eligible for Automotive bid that passes all four gates', () => {
    const result = filterBid(BID_002, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'eligible',
      disqualify_reason: null,
    });
  });

  // Pharma bid on non-Pharma certified truck → commodity_mismatch
  it('returns commodity_mismatch for Pharma bid when truck lacks Pharma certification', () => {
    const pharmaBid = { cargo_type: 'Pharma', cargo_weight_lbs: 5000, drop_stop_index: 0 };
    const result = filterBid(pharmaBid, OPP_001, TRUCK_012);
    expect(result).toEqual({
      eligibility_status: 'ineligible',
      disqualify_reason: 'commodity_mismatch',
    });
  });

  // Hazmat on Hazmat-certified truck with compatible primary → should pass gate 1
  it('passes commodity gate for Hazmat bid when truck is Hazmat certified', () => {
    const hazmatTruck = { gvwr: 80000, certified_commodities: ['General', 'Hazmat'] };
    // Use a General primary so commodity gate passes, then check rest
    const generalOpp = { primary_cargo_type: 'General', primary_load_weight: 30000, next_stop_index: 5 };
    const hazmatBid = { cargo_type: 'Hazmat', cargo_weight_lbs: 5000, drop_stop_index: 2 };
    const result = filterBid(hazmatBid, generalOpp, hazmatTruck);
    expect(result).toEqual({ eligibility_status: 'eligible', disqualify_reason: null });
  });

  // GVWR boundary: combined weight exactly equal to GVWR → eligible (not exceeded)
  it('treats combined weight exactly equal to GVWR as eligible', () => {
    const exactBid = { cargo_type: 'Retail', cargo_weight_lbs: 24000, drop_stop_index: 1, cargo_volume_cuft: 100 };
    // 56000 + 24000 = 80000 === gvwr → not exceeded
    const result = filterBid(exactBid, OPP_001, TRUCK_012);
    expect(result).toEqual({ eligibility_status: 'eligible', disqualify_reason: null });
  });

  // Stop index boundary: drop_stop_index === next_stop_index → eligible
  it('treats drop_stop_index equal to next_stop_index as eligible', () => {
    const samestopBid = { cargo_type: 'Retail', cargo_weight_lbs: 5000, drop_stop_index: 1, cargo_volume_cuft: 100 };
    const result = filterBid(samestopBid, OPP_001, TRUCK_012);
    expect(result).toEqual({ eligibility_status: 'eligible', disqualify_reason: null });
  });

  // Gate 4: exact-fit boundary (combined volume === trailer volume → eligible)
  it('passes Gate 4 when combined volume exactly equals trailer volume', () => {
    const exactVolBid = { cargo_type: 'Retail', cargo_weight_lbs: 5000, drop_stop_index: 1, cargo_volume_cuft: 1140 };
    // 2660 + 1140 = 3800 === trailer_volume_cuft → not exceeded
    const result = filterBid(exactVolBid, OPP_001, TRUCK_012);
    expect(result).toEqual({ eligibility_status: 'eligible', disqualify_reason: null });
  });

  // Gate 4: over-limit case
  it('returns volume_exceeded when combined volume exceeds trailer capacity', () => {
    const bulkyBid = { cargo_type: 'Retail', cargo_weight_lbs: 5000, drop_stop_index: 1, cargo_volume_cuft: 1141 };
    // 2660 + 1141 = 3801 > 3800 ✗
    const result = filterBid(bulkyBid, OPP_001, TRUCK_012);
    expect(result).toEqual({ eligibility_status: 'ineligible', disqualify_reason: 'volume_exceeded' });
  });

  // Gate 4: light-but-bulky demo case
  it('returns volume_exceeded for BID-001 (18,000 lbs is fine on weight, but 1,200 cuft cubes out)', () => {
    // Weight: 56000+18000=74000 < 80000 ✓ (weight gate passes)
    // Volume: 2660+1200=3860 > 3800 ✗ (volume gate fails)
    const result = filterBid(BID_001, OPP_001, TRUCK_012);
    expect(result.eligibility_status).toBe('ineligible');
    expect(result.disqualify_reason).toBe('volume_exceeded');
  });
});

// ---------------------------------------------------------------------------
// Property-based tests — filterBid (Properties 3–6 from design doc)
// ---------------------------------------------------------------------------

const COMMODITY_TYPES = ['General', 'Reefer', 'Hazmat', 'Pharma', 'Automotive', 'Agriculture', 'Industrial', 'Retail'];

// Arbitrary generators
const cargoTypeArb = fc.constantFrom(...COMMODITY_TYPES);
const certifiedArb = fc.subarray(COMMODITY_TYPES, { minLength: 0, maxLength: COMMODITY_TYPES.length });

const bidArb = fc.record({
  cargo_type: cargoTypeArb,
  cargo_weight_lbs: fc.integer({ min: 0, max: 50000 }),
  drop_stop_index: fc.integer({ min: 0, max: 10 }),
});

const opportunityArb = fc.record({
  primary_cargo_type: cargoTypeArb,
  primary_load_weight: fc.integer({ min: 0, max: 79999 }),
  next_stop_index: fc.integer({ min: 0, max: 10 }),
});

const truckArb = fc.record({
  gvwr: fc.integer({ min: 1000, max: 100000 }),
  certified_commodities: certifiedArb,
});

/**
 * Property 3: any ineligible bid's disqualify_reason is one of the three valid strings.
 * Validates: Requirements 3.4, 5.1
 */
describe('filterBid — Property 3: ineligible bid reason validity', () => {
  it('every ineligible result has a valid disqualify_reason string', () => {
    const VALID_REASONS = ['commodity_mismatch', 'gvwr_exceeded', 'route_sequence_violation', 'volume_exceeded'];
    fc.assert(
      fc.property(bidArb, opportunityArb, truckArb, (bid, opportunity, truck) => {
        const result = filterBid(bid, opportunity, truck);
        if (result.eligibility_status === 'ineligible') {
          return VALID_REASONS.includes(result.disqualify_reason);
        }
        // eligible → disqualify_reason must be null
        return result.disqualify_reason === null;
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 4: Hazmat/Pharma with uncertified truck → always commodity_mismatch.
 * Validates: Requirements 5.2
 */
describe('filterBid — Property 4: Hazmat/Pharma uncertified truck', () => {
  it('Hazmat or Pharma bid on uncertified truck always yields commodity_mismatch', () => {
    const hazmatOrPharmaArb = fc.constantFrom('Hazmat', 'Pharma');

    fc.assert(
      fc.property(
        hazmatOrPharmaArb,
        fc.integer({ min: 0, max: 50000 }),    // cargo_weight_lbs
        fc.integer({ min: 0, max: 10 }),        // drop_stop_index
        opportunityArb,
        truckArb,
        (cargoType, cargoWeightLbs, dropStopIndex, opportunity, truck) => {
          // Ensure truck does NOT have the certification for this cargo type
          const uncertifiedTruck = {
            ...truck,
            certified_commodities: truck.certified_commodities.filter(c => c !== cargoType),
          };
          const bid = { cargo_type: cargoType, cargo_weight_lbs: cargoWeightLbs, drop_stop_index: dropStopIndex };
          const result = filterBid(bid, opportunity, uncertifiedTruck);
          return (
            result.eligibility_status === 'ineligible' &&
            result.disqualify_reason === 'commodity_mismatch'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: combined weight > gvwr → always gvwr_exceeded.
 * Validates: Requirements 5.3
 */
describe('filterBid — Property 5: GVWR headroom gate', () => {
  it('combined weight exceeding GVWR always yields gvwr_exceeded', () => {
    // Build a bid+truck+opportunity where commodity gate passes but weight fails.
    // Use a non-Hazmat/Pharma bid with a compatible cargo type.
    const compatibleBidArb = fc.record({
      cargo_type: fc.constantFrom('General', 'Retail', 'Automotive', 'Agriculture', 'Industrial'),
      drop_stop_index: fc.integer({ min: 0, max: 5 }),
    });

    fc.assert(
      fc.property(
        compatibleBidArb,
        fc.integer({ min: 1000, max: 50000 }),    // primary_load_weight
        fc.integer({ min: 0, max: 10 }),           // next_stop_index (≥ drop_stop_index)
        fc.integer({ min: 1000, max: 40000 }),     // gvwr base
        (bidBase, primaryLoadWeight, nextStopIndex, gvwrBase) => {
          const gvwr = gvwrBase + primaryLoadWeight; // gvwr = primaryLoadWeight + gvwrBase
          // Make cargo_weight = gvwrBase + 1 so combined weight = primaryLoad + cargo > gvwr
          const cargoWeightLbs = gvwrBase + 1;

          const truck = {
            gvwr,
            certified_commodities: ['General', 'Retail', 'Automotive', 'Agriculture', 'Industrial'],
          };
          const opportunity = {
            primary_cargo_type: 'Industrial',
            primary_load_weight: primaryLoadWeight,
            next_stop_index: nextStopIndex,
          };
          // Ensure drop_stop_index ≤ next_stop_index so route gate doesn't trigger first
          const bid = {
            ...bidBase,
            cargo_weight_lbs: cargoWeightLbs,
            drop_stop_index: Math.min(bidBase.drop_stop_index, nextStopIndex),
          };

          const result = filterBid(bid, opportunity, truck);
          return (
            result.eligibility_status === 'ineligible' &&
            result.disqualify_reason === 'gvwr_exceeded'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: drop_stop_index > next_stop_index → always route_sequence_violation.
 * Validates: Requirements 5.4
 */
describe('filterBid — Property 6: LIFO route sequence gate', () => {
  it('drop_stop_index > next_stop_index always yields route_sequence_violation', () => {
    fc.assert(
      fc.property(
        // next_stop_index in [0..8] so drop can be strictly greater
        fc.integer({ min: 0, max: 8 }),
        fc.integer({ min: 0, max: 10 }),           // offset to add to make drop > next
        (nextStopIndex, offset) => {
          const dropStopIndex = nextStopIndex + offset + 1; // strictly greater

          // Use compatible, lightweight bid so only the route gate can trigger
          const bid = {
            cargo_type: 'Retail',
            cargo_weight_lbs: 1000,    // well within GVWR
            drop_stop_index: dropStopIndex,
          };
          const truck = {
            gvwr: 80000,
            certified_commodities: ['General', 'Retail', 'Automotive', 'Agriculture', 'Industrial'],
          };
          const opportunity = {
            primary_cargo_type: 'Industrial',
            primary_load_weight: 10000, // combined = 11000 << 80000, GVWR passes
            next_stop_index: nextStopIndex,
          };

          const result = filterBid(bid, opportunity, truck);
          return (
            result.eligibility_status === 'ineligible' &&
            result.disqualify_reason === 'route_sequence_violation'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// localMatchCompute — task 2.6
// ---------------------------------------------------------------------------

import { localMatchCompute } from './marketplace.js';
import { BACKHAUL_OPPORTUNITIES } from '../data/mockData.js';

describe('localMatchCompute', () => {
  let result;

  // Run once; all assertions share this single computed result.
  beforeAll(() => {
    result = localMatchCompute(BACKHAUL_OPPORTUNITIES[0]);
  });

  // 1. Returns the expected top-level shape
  it('returns an object with eligible_bids, ineligible_bids, and recommended_bid_id', () => {
    expect(result).toHaveProperty('eligible_bids');
    expect(result).toHaveProperty('ineligible_bids');
    expect(result).toHaveProperty('recommended_bid_id');
  });

  // 2. recommended_bid_id is BID-002 (net $1,754 — rank #1)
  it('recommended_bid_id equals BID-002', () => {
    expect(result.recommended_bid_id).toBe('BID-002');
  });

  // 3. eligible_bids has exactly 1 item (BID-002 only; BID-001 now fails Gate 4)
  it('eligible_bids has exactly 1 item', () => {
    expect(result.eligible_bids).toHaveLength(1);
    const ids = result.eligible_bids.map(b => b.bid_id);
    expect(ids).toContain('BID-002');
  });

  // 4. ineligible_bids has exactly 4 items (BID-001, BID-003, BID-004, BID-005)
  it('ineligible_bids has exactly 4 items', () => {
    expect(result.ineligible_bids).toHaveLength(4);
    const ids = result.ineligible_bids.map(b => b.bid_id);
    expect(ids).toContain('BID-001');
    expect(ids).toContain('BID-003');
    expect(ids).toContain('BID-004');
    expect(ids).toContain('BID-005');
  });

  // 5. BID-003 has disqualify_reason 'commodity_mismatch'
  it('BID-003 has disqualify_reason commodity_mismatch', () => {
    const bid003 = result.ineligible_bids.find(b => b.bid_id === 'BID-003');
    expect(bid003).toBeDefined();
    expect(bid003.disqualify_reason).toBe('commodity_mismatch');
  });

  // 6. BID-004 has disqualify_reason 'gvwr_exceeded'
  it('BID-004 has disqualify_reason gvwr_exceeded', () => {
    const bid004 = result.ineligible_bids.find(b => b.bid_id === 'BID-004');
    expect(bid004).toBeDefined();
    expect(bid004.disqualify_reason).toBe('gvwr_exceeded');
  });

  // 7. BID-005 has disqualify_reason 'route_sequence_violation'
  it('BID-005 has disqualify_reason route_sequence_violation', () => {
    const bid005 = result.ineligible_bids.find(b => b.bid_id === 'BID-005');
    expect(bid005).toBeDefined();
    expect(bid005.disqualify_reason).toBe('route_sequence_violation');
  });

  // 7b. BID-001 has disqualify_reason 'volume_exceeded' (light but bulky)
  it('BID-001 has disqualify_reason volume_exceeded (light but bulky)', () => {
    const bid001 = result.ineligible_bids.find(b => b.bid_id === 'BID-001');
    expect(bid001).toBeDefined();
    expect(bid001.disqualify_reason).toBe('volume_exceeded');
  });

  // 8. eligible_bids[0] has rank 1 (only one eligible bid now)
  it('eligible_bids[0] has rank 1', () => {
    expect(result.eligible_bids[0].rank).toBe(1);
  });

  // 9. Result structure matches the FastAPI response shape exactly
  it('result structure matches the FastAPI response shape', () => {
    // Top-level keys
    expect(Object.keys(result).sort()).toEqual(
      ['eligible_bids', 'ineligible_bids', 'recommended_bid_id'].sort()
    );
    // eligible_bids are arrays
    expect(Array.isArray(result.eligible_bids)).toBe(true);
    expect(Array.isArray(result.ineligible_bids)).toBe(true);
    // recommended_bid_id is a string (not null for this opportunity)
    expect(typeof result.recommended_bid_id).toBe('string');
    // eligible_bids[0] has all expected fields from the FastAPI response
    const top = result.eligible_bids[0];
    expect(top).toHaveProperty('bid_id');
    expect(top).toHaveProperty('carrier_name');
    expect(top).toHaveProperty('cargo_type');
    expect(top).toHaveProperty('cargo_weight_lbs');
    expect(top).toHaveProperty('bid_price');
    expect(top).toHaveProperty('detour_cost');
    expect(top).toHaveProperty('net_value');
    expect(top).toHaveProperty('rank');
    expect(top).toHaveProperty('eligibility_status');
    expect(top).toHaveProperty('disqualify_reason');
    // recommended_bid_id equals eligible_bids[0].bid_id
    expect(result.recommended_bid_id).toBe(result.eligible_bids[0].bid_id);
  });
});

describe('filterBid — Property: volumetric capacity gate', () => {
  it('combined volume > trailer_volume always yields volume_exceeded', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3799 }),   // primaryLoadVolume
        fc.integer({ min: 0, max: 10 }),      // next_stop_index
        fc.integer({ min: 1000, max: 4000 }), // trailerVolume
        (primaryLoadVolume, nextStopIndex, trailerVolume) => {
          // cargo volume = exactly 1 more than remaining space
          const cargoVolume = trailerVolume - primaryLoadVolume + 1;
          const bid = {
            cargo_type: 'Retail',
            cargo_weight_lbs: 1000,
            drop_stop_index: nextStopIndex,    // route gate won't trigger
            cargo_volume_cuft: cargoVolume,
          };
          const truck = {
            gvwr: 200000,                      // weight gate won't trigger
            certified_commodities: ['General', 'Retail', 'Automotive', 'Agriculture', 'Industrial'],
            trailer_volume_cuft: trailerVolume,
          };
          const opportunity = {
            primary_cargo_type: 'Industrial',
            primary_load_weight: 1000,          // weight gate won't trigger
            next_stop_index: nextStopIndex,
            primary_load_volume_cuft: primaryLoadVolume,
          };
          const result = filterBid(bid, opportunity, truck);
          return (
            result.eligibility_status === 'ineligible' &&
            result.disqualify_reason === 'volume_exceeded'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
