import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "marketplace.db")


def get_db() -> sqlite3.Connection:
    """Return a SQLite connection to marketplace.db with row_factory set."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def create_tables() -> None:
    """Create all required tables if they don't exist."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS opportunities (
            id                       TEXT PRIMARY KEY,
            truck_id                 TEXT NOT NULL,
            primary_load_id          INTEGER,
            primary_load_weight      INTEGER NOT NULL,
            truck_gvwr               INTEGER NOT NULL,
            capacity_utilization_pct REAL,
            status                   TEXT DEFAULT 'broadcast',
            winning_bid_id           TEXT,
            award_reason             TEXT,
            created_at               DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS bids (
            bid_id              TEXT PRIMARY KEY,
            opportunity_id      TEXT NOT NULL REFERENCES opportunities(id),
            carrier_name        TEXT NOT NULL,
            cargo_type          TEXT NOT NULL,
            cargo_weight_lbs    INTEGER NOT NULL,
            bid_price           REAL NOT NULL,
            detour_cost         REAL NOT NULL,
            drop_stop_index     INTEGER NOT NULL,
            eligibility_status  TEXT DEFAULT 'pending',
            disqualify_reason   TEXT,
            net_value           REAL,
            rank                INTEGER,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS awards (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            opportunity_id  TEXT NOT NULL REFERENCES opportunities(id),
            winning_bid_id  TEXT NOT NULL,
            award_reason    TEXT NOT NULL,
            awarded_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()
    conn.close()
