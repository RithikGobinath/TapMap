# Phase 01 - You Report (Frontend + UI + Setup)

## Duty Matrix
| Duty (from `tapmap-2person-plan.jsx` Phase 1) | Status | Notes |
|---|---|---|
| Set up GitHub repo + React/Vite frontend scaffold + Tailwind | Complete | Frontend scaffold and routing shell are present and build successfully. |
| Set up Flask backend with endpoint stubs (`/api/score`, `/api/wells`, `/api/submit`) | Complete | Flask app exposes stub endpoints with success and validation-error behavior. |
| Set up Google Cloud project, Firestore, Cloud Run config | Complete with external IAM note | Project, billing, APIs, and Firestore database are configured; environment-tag binding is blocked by organizer IAM. |
| Obtain Google Maps API key and wire env vars | Complete | Key is configured in `frontend/.env` and live geocode check returned `status: OK`. |

## Implemented Work
1. Frontend Phase 1 shell implemented:
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/HomePage.tsx`
- `frontend/src/pages/StatusPage.tsx`
- Tailwind/Vite/TypeScript config files under `frontend/`.
2. Backend stub implementation:
- `backend/app/app.py`
- `backend/run.py`
- `backend/tests/test_api.py`
3. Cloud/config docs and placeholders:
- `docs/google-cloud-setup.md`
- `backend/cloudrun.service.yaml` (project id already replaced)
- `backend/firestore.indexes.json`
4. Manual setup verification complete:
- Billing enabled
- Firestore database created at `us-central1`
- Required services enabled (`run`, `firestore`, `maps-backend`, `geocoding-backend`)

## File/Path Inventory
Core files delivered by this track:
1. `frontend/package.json`
2. `frontend/src/App.tsx`
3. `frontend/src/pages/HomePage.tsx`
4. `frontend/src/pages/StatusPage.tsx`
5. `backend/app/app.py`
6. `backend/run.py`
7. `backend/tests/test_api.py`
8. `backend/cloudrun.service.yaml`
9. `docs/google-cloud-setup.md`
10. `docs/phase1-checklist.md`

## Commands Run
1. Backend tests:
- `backend/.venv/bin/python -m pytest backend/tests/test_api.py -q`
- Output: `reports/phase-01/evidence/command-logs/backend_pytest.txt`
2. Frontend production build:
- `cd frontend && npm run build`
- Output: `reports/phase-01/evidence/command-logs/frontend_build.txt`
3. Live API checks:
- `/health`, `/api/wells`, `/api/score`, `/api/submit` (valid + invalid)
- Output: `reports/phase-01/evidence/command-logs/api_contract_checks.txt`
4. GCP state checks:
- `gcloud config list`, billing describe, firestore list, enabled services query
- Output: `reports/phase-01/evidence/command-logs/gcp_state.txt`

## Known Gaps
1. **P2-GCP-004**: Project environment tag binding remains pending organizer/admin IAM (`resourcemanager.tagValueBindings.create`).
2. No additional Phase 2+ feature work intentionally (per scope control rule).

## Evidence
1. Frontend screenshots:
- `reports/phase-01/evidence/frontend-home.png`
- `reports/phase-01/evidence/frontend-status.png`
2. API outputs:
- `reports/phase-01/evidence/health.json`
- `reports/phase-01/evidence/wells.json`
- `reports/phase-01/evidence/score.json`
3. Setup snapshots:
- `reports/phase-01/evidence/command-logs/gcp_state.txt`
- `reports/phase-01/evidence/command-logs/phase1_checklist_snapshot.txt`
