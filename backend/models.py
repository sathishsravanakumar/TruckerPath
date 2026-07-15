from pydantic import BaseModel
from typing import Optional


class BidRequest(BaseModel):
    bid_id: str
    carrier_name: str
    cargo_type: str
    cargo_weight_lbs: int
    bid_price: float
    detour_cost: float
    cargo_volume_cuft: float
    drop_stop_index: int


class MatchRequest(BaseModel):
    truck_id: str
    primary_load_weight: int
    truck_gvwr: int
    primary_cargo_type: str
    truck_certified_commodities: list[str]
    next_stop_index: int
    primary_load_volume_cuft: float
    truck_trailer_volume_cuft: float
    bids: list[BidRequest]


class BidResult(BaseModel):
    bid_id: str
    carrier_name: str
    cargo_type: str
    cargo_weight_lbs: int
    bid_price: float
    detour_cost: float
    drop_stop_index: int
    cargo_volume_cuft: Optional[float] = None
    eligibility_status: str
    disqualify_reason: Optional[str] = None
    net_value: Optional[float] = None
    rank: Optional[int] = None


class MatchResponse(BaseModel):
    eligible_bids: list[BidResult]
    ineligible_bids: list[BidResult]
    recommended_bid_id: Optional[str] = None
