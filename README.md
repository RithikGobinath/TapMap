# TapMap - Phase 1 Setup

This repo currently includes **Phase 1 only** for the `You` scope from the two-person plan.

## Included
- React + Vite + TypeScript frontend scaffold
- TailwindCSS setup
- Basic routing shell (`/` and `/status`)
- Flask backend with endpoint stubs:
  - `POST /api/score`
  - `GET /api/wells`
  - `POST /api/submit`
- Google Cloud setup docs + Cloud Run/Firestore config placeholders
- Environment variable wiring for Google Maps API key

## Not Included Yet
- Any Phase 2+ implementation (map features, scoring UI, charts, community UI, polish, demo assets)

## Project Structure
- `frontend/`: Phase 1 frontend scaffold
- `backend/`: Flask stub backend
- `docs/`: setup docs and phase checklist
- `scripts/`: local run helpers

## Local Run

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment
Set in `frontend/.env`:
```bash
VITE_GOOGLE_MAPS_API_KEY=
VITE_API_BASE_URL=http://localhost:5000
```

## Phase 1 Docs
- `docs/phase1-checklist.md`
- `docs/google-cloud-setup.md`
