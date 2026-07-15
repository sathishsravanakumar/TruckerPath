"""
seed.py — Populate marketplace.db with the OPP-001 demo scenario.
Run from the project root: python -m backend.seed
"""
import sqlite3
from backend.database import get_db, create_tables, DB_PATH

OPPORTUNITY = {
    "id": "OPP-001",
    "truck_id": "TRUCK-012",
    "primary_load_id": 303,
    "primary_load_weight": 56000,
    "truck_gvwr": 80000,
    "capacity_utilization_pct": 70.0,
    "primary_load_volume_cuft": 2660.0,
    "truck_trailer_volume_cuft": 3800.0,
    "status": "broadcast",
    "winning_bid_id": None,
    "award_reason": None,
}

BIDS = [
    {"bid_id": "BID-001", "opportunity_id": "OPP-001", "carrier_name": "Lone Star Freight",    "cargo_type": "Retail",      "cargo_weight_lbs": 18000, "bid_price": 1400.0, "detour_cost": 112.0, "cargo_volume_cuft": 1200.0, "drop_stop_index": 1},
    {"bid_id": "BID-002", "opportunity_id": "OPP-001", "carrier_name": "Southwest Carriers",   "cargo_type": "Automotive",  "cargo_weight_lbs": 15000, "bid_price": 1850.0, "detour_cost": 96.0,  "cargo_volume_cuft": 850.0,  "drop_stop_index": 1},
    {"bid_id": "BID-003", "opportunity_id": "OPP-001", "carrier_name": "Desert Haul Co.",      "cargo_type": "Hazmat",      "cargo_weight_lbs": 10000, "bid_price": 2200.0, "detour_cost": 80.0,  "cargo_volume_cuft": 400.0,  "drop_stop_index": 2},
    {"bid_id": "BID-004", "opportunity_id": "OPP-001", "carrier_name": "BorderLine Logistics", "cargo_type": "General",     "cargo_weight_lbs": 28000, "bid_price": 1600.0, "detour_cost": 72.0,  "cargo_volume_cuft": 900.0,  "drop_stop_index": 2},
    {"bid_id": "BID-005", "opportunity_id": "OPP-001", "carrier_name": "SunState Express",     "cargo_type": "Agriculture", "cargo_weight_lbs": 12000, "bid_price": 1100.0, "detour_cost": 55.0,  "cargo_volume_cuft": 600.0,  "drop_stop_index": 3},
]


def seed() -> None:
    create_tables()
    conn = get_db()
    cursor = conn.cursor()

    # Insert opportunity (ignore if already exists)
    cursor.execute("""
        INSERT OR IGNORE INTO opportunities
            (id, truck_id, primary_load_id, primary_load_weight, truck_gvwr,
             capacity_utilization_pct, status, winning_bid_id, award_reason)
        VALUES (:id, :truck_id, :primary_load_id, :primary_load_weight, :truck_gvwr,
                :capacity_utilization_pct, :status, :winning_bid_id, :award_reason)
    """, OPPORTUNITY)

    # Insert bids
    for bid in BIDS:
        cursor.execute("""
            INSERT OR IGNORE INTO bids
                (bid_id, opportunity_id, carrier_name, cargo_type, cargo_weight_lbs,
                 bid_price, detour_cost, drop_stop_index)
            VALUES (:bid_id, :opportunity_id, :carrier_name, :cargo_type, :cargo_weight_lbs,
                    :bid_price, :detour_cost, :drop_stop_index)
        """, bid)

    conn.commit()
    conn.close()
    print(f"Seeded OPP-001 with {len(BIDS)} bids into {DB_PATH}")


if __name__ == "__main__":
    seed()
