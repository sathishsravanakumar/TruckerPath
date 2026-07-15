# Backhaul Marketplace — FastAPI Backend

## Setup
```bash
cd backend
pip install -r requirements.txt
python seed.py        # seed the SQLite database
uvicorn main:app --reload --port 8000
```

## Endpoint
POST /marketplace/match — accepts opportunity + bids, returns filtered/ranked result
