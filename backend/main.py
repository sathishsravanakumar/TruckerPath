"""
main.py — FastAPI Backhaul Load Marketplace service

Run from the project root:
    uvicorn backend.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models import MatchRequest, MatchResponse, BidResult
from backend.matching import eligibility_filter, net_value_rank
from backend.database import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup."""
    create_tables()
    yield


app = FastAPI(title="Backhaul Load Marketplace", version="1.0.0", lifespan=lifespan)

# CORS — allow the Vite dev server to reach this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/marketplace/match", response_model=MatchResponse)
def match_backhaul(request: MatchRequest) -> MatchResponse:
    """
    Accept a backhaul opportunity payload, apply eligibility filter and net-value
    ranking, return structured result identical to the front-end localMatchCompute output.
    """
    eligible_bids: list[BidResult] = []
    ineligible_bids: list[BidResult] = []

    for bid in request.bids:
        result = eligibility_filter(bid, request)
        bid_result = BidResult(
            bid_id=bid.bid_id,
            carrier_name=bid.carrier_name,
            cargo_type=bid.cargo_type,
            cargo_weight_lbs=bid.cargo_weight_lbs,
            bid_price=bid.bid_price,
            detour_cost=bid.detour_cost,
            drop_stop_index=bid.drop_stop_index,
            eligibility_status=result["eligibility_status"],
            disqualify_reason=result["disqualify_reason"],
        )
        if result["eligibility_status"] == "eligible":
            eligible_bids.append(bid_result)
        else:
            ineligible_bids.append(bid_result)

    ranked = net_value_rank(eligible_bids)
    recommended_bid_id = ranked[0].bid_id if ranked else None

    return MatchResponse(
        eligible_bids=ranked,
        ineligible_bids=ineligible_bids,
        recommended_bid_id=recommended_bid_id,
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "backhaul-marketplace"}
