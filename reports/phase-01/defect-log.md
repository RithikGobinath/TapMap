# Phase 01 - Defect Log

| Defect ID | Severity | Owner | Status | Reproduction | Fix Reference | Retest Result |
|---|---|---|---|---|---|---|
| P1-DATA-001 | P1 | Teammate | Open | Expected PFAS well-structured dataset for Phase 1 handoff is missing from `data/`. | N/A (pending teammate artifact generation) | Not retestable until dataset exists |
| P1-GEO-002 | P1 | Teammate | Open | Expected service-area GeoJSON (`well_service_areas.geojson`) missing from `data/`. | N/A (pending teammate artifact generation) | Not retestable until file exists |
| P1-AGE-003 | P1 | Teammate | Open | Expected building-age dataset (`dane_building_age.csv`) missing from `data/`. | N/A (pending teammate artifact generation) | Not retestable until file exists |
| P2-GCP-004 | P2 | You + Organizer/Admin | Open (external) | `gcloud` warns project lacks required `environment` tag; tag binding attempt failed with permission denied (`resourcemanager.tagValueBindings.create`). | Requires organizer/admin IAM action | Pending external IAM grant |
| P2-OPS-005 | P2 | You | Resolved | Local backend port `5000` conflict with macOS ControlCenter blocked startup. | Backend run switched to `5001` + frontend base URL aligned in `frontend/.env`. | Pass (backend endpoints reachable on `5001`) |
| P2-DEV-006 | P2 | You | Resolved | Frontend startup failed with `vite: command not found` due missing frontend deps. | Ran `npm install` in `frontend/`. | Pass (`npm run build` succeeded) |

## Notes
1. Under hard gate rules, any open `P1` means phase cannot advance (`NO-GO`).
2. Open defects currently block Phase 01 closure despite local setup/test success for implemented files.
