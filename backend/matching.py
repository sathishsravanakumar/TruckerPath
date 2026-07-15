from typing import Optional
from backend.models import BidRequest, MatchRequest, BidResult

# Commodity compatibility matrix — key = primary cargo type, value = allowed backhaul types
COMMODITY_COMPATIBILITY: dict[str, list[str]] = {
    "General":     ["General", "Reefer", "Hazmat", "Pharma", "Automotive", "Agriculture", "Industrial", "Retail"],
    "Retail":      ["General", "Reefer", "Automotive", "Agriculture", "Industrial", "Retail"],
    "Automotive":  ["General", "Reefer", "Automotive", "Agriculture", "Industrial", "Retail"],
    "Agriculture": ["General", "Reefer", "Automotive", "Agriculture", "Industrial", "Retail"],
    "Industrial":  ["General", "Reefer", "Automotive", "Agriculture", "Industrial", "Retail", "Hazmat"],
    "Reefer":      ["Reefer", "General", "Pharma"],
    "Hazmat":      ["Hazmat"],
    "Pharma":      ["Pharma"],
}


def eligibility_filter(bid: BidRequest, request: MatchRequest) -> dict:
    """
    Apply three sequential eligibility gates.
    Returns dict with eligibility_status and disqualify_reason.
    """
    # Gate 1: Commodity compatibility
    if bid.cargo_type in ("Hazmat", "Pharma"):
        if bid.cargo_type not in request.truck_certified_commodities:
            return {"eligibility_status": "ineligible", "disqualify_reason": "commodity_mismatch"}
    else:
        compatible = COMMODITY_COMPATIBILITY.get(request.primary_cargo_type, [])
        if bid.cargo_type not in compatible:
            return {"eligibility_status": "ineligible", "disqualify_reason": "commodity_mismatch"}

    # Gate 2: GVWR headroom
    if request.primary_load_weight + bid.cargo_weight_lbs > request.truck_gvwr:
        return {"eligibility_status": "ineligible", "disqualify_reason": "gvwr_exceeded"}

    # Gate 3: LIFO route sequence
    if bid.drop_stop_index > request.next_stop_index:
        return {"eligibility_status": "ineligible", "disqualify_reason": "route_sequence_violation"}

    # Gate 4: Volumetric capacity
    if request.primary_load_volume_cuft + bid.cargo_volume_cuft > request.truck_trailer_volume_cuft:
        return {"eligibility_status": "ineligible", "disqualify_reason": "volume_exceeded"}

    return {"eligibility_status": "eligible", "disqualify_reason": None}


def net_value_rank(eligible_bids: list[BidResult]) -> list[BidResult]:
    """
    Attach net_value, sort descending by net_value (tie-break: ascending detour_cost),
    and attach 1-indexed rank. Returns new list; input is not mutated.
    """
    bids = [b.model_copy(update={"net_value": b.bid_price - b.detour_cost}) for b in eligible_bids]
    bids.sort(key=lambda b: (-b.net_value, b.detour_cost))
    return [b.model_copy(update={"rank": i + 1}) for i, b in enumerate(bids)]
