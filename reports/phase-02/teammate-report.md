# Teammate Report - Phase 02 (Backend + Data Execution Brief)

## Phase Goal
- Deliver real backend/data implementation for Phase 2 teammate scope:
1. Implement WaterScore algorithm in Python.
2. Replace `/api/score` stub with real scoring from serving-well data.
3. Replace `/api/wells` stub with full well dataset response.
4. Add deterministic unit tests validating low-risk vs high-risk wells.
- Apply updated data direction from `/Users/sikander/Downloads/TapMap-Data-Findings-v2.docx` so backend supports multi-contaminant differentiation (not PFAS-only).

## Duties Assigned to Teammate (Source-Aligned)
- From `tapmap-2person-plan.jsx` Phase 2:
1. Implement WaterScore algorithm (sigmoid normalization + weighted composite).
2. Build `POST /api/score`: lat/lng -> serving wells -> score + breakdown.
3. Build `GET /api/wells`: all wells with latest contaminant data.
4. Unit test scoring with known wells (bad wells score worse than clean wells).
- From TapMap Data Findings v2 ("Backend Person" action items):
1. Transcribe official per-well 2024 inorganics into structured JSON.
2. Ensure PFAS wells 6, 9, 11, 14 are represented accurately.
3. Include radionuclide coverage for known higher-risk wells (19, 27) with documented status.
4. Implement/address resolver from Madison address to serving wells (or deterministic fallback mapping with explicit status).

## Completed Work (Already Available for Use)
- PFAS parser audit completed; parser-induced nulls corrected for wells 9, 11, and 14.
- Regenerated PFAS outputs now include:
1. `total_pfas_ppt` corrected values.
2. `pfas_status` tags (`detected`, `not_detected`, `no_current_sample`).
3. `historical_max_pfas_ppt` (well 15 context).
- Frontend Phase 2 has been synced to corrected PFAS dataset and now displays status context.

## Artifacts Produced (with absolute paths)
- Corrected PFAS datasets:
1. `/Users/sikander/Documents/TapMap/data/pfas_well_latest.csv`
2. `/Users/sikander/Documents/TapMap/data/pfas_well_latest.json`
- Parser implementation:
1. `/Users/sikander/Documents/TapMap/scripts/generate_phase1_outputs.py`
- Parser audit evidence:
1. `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/pfas-parser-audit-report.md`
- Current backend API stub baseline (to be replaced):
1. `/Users/sikander/Documents/TapMap/backend/app/app.py`
2. `/Users/sikander/Documents/TapMap/backend/tests/test_api.py`
- Current frontend PFAS consumer (already synced):
1. `/Users/sikander/Documents/TapMap/frontend/src/data/pfas_well_latest.json`
2. `/Users/sikander/Documents/TapMap/frontend/src/pages/Phase2Page.tsx`
3. `/Users/sikander/Documents/TapMap/frontend/src/components/Phase2Map.tsx`

## Implementation Contract Constraints (Do Not Break)
- Keep existing endpoint paths:
1. `POST /api/score`
2. `GET /api/wells`
3. `POST /api/submit` (can remain stub for Phase 2)
- Preserve current response keys used by frontend/stubs; additive fields are allowed.
- If scoring model changes, keep `score`, `grade`, `breakdown`, `limits`, `lastUpdated` present in `/api/score`.

## Required Deliverables for Teammate to Complete Phase 2
1. New backend data layer files for structured well contaminants (PFAS + inorganics + radionuclide context), under:
`/Users/sikander/Documents/TapMap/backend/app/` (or `/Users/sikander/Documents/TapMap/data/` + loader module).
2. Real serving-well resolver callable from `/api/score` using lat/lng.
3. Real score computation function with documented weights and normalization.
4. `/api/wells` response returning all well entries (not one stub well).
5. Unit tests covering:
- known high-risk well(s) rank lower score than clean well(s),
- malformed lat/lng handling,
- missing data fallback behavior.

## Suggested Build Order (Execution Plan)
1. Freeze canonical backend data schema for one well record.
2. Load corrected PFAS dataset from `/Users/sikander/Documents/TapMap/data/pfas_well_latest.json`.
3. Add inorganics/radium fields from findings doc source set into structured JSON.
4. Implement `resolve_serving_wells(lat, lng)` with deterministic behavior.
5. Implement `compute_score(well_ids)` returning full breakdown and grade mapping.
6. Wire `/api/score` to resolver + score engine.
7. Wire `/api/wells` to return full dataset.
8. Add tests and update existing backend test coverage.

## Data/API Validation Results (Current Evidence)
- From parser audit evidence:
1. Corrected PFAS snapshot = 22 wells, detected=4, not_detected=17, no_current_sample=1.
2. Corrected wells: 9 (`47.0`), 11 (`4.0`), 14 (`8.0`).
- Local frontend build after sync:
1. `npm run build` passes in `/Users/sikander/Documents/TapMap/frontend`.
- Note:
1. `python3 scripts/check_phase1_data.py` currently fails in this machine shell without `pandas`; run inside teammate Python environment where dependencies are installed.

## Known Issues / Risks
1. Backend endpoints are still stubbed in `/Users/sikander/Documents/TapMap/backend/app/app.py`.
2. Multi-contaminant inorganics/radionuclide structured dataset for scoring is not yet implemented in backend runtime.
3. Address-to-serving-well mapping may require fallback behavior if source scraping is unstable.
4. Keep data semantics explicit:
- `0` = not detected,
- `null` = not reported / no current sample.

## What Is Ready For Teammate
1. Corrected PFAS base dataset and parser evidence are available and usable now.
2. Frontend Phase 2 map/zone UX is complete and ready to consume real `/api/score` and `/api/wells`.
3. Existing backend test harness and app factory are in place.

## Blocked / Needs Input
1. Final agreed scoring weight vector to lock for Phase 2 backend implementation.
2. Decision on temporary resolver strategy if `mywells.cfm` scraping is delayed.
3. Confirmation whether to include only active 20 wells vs legacy/offline wells in final score domain.

## Next Phase Plan (first 30 min)
1. Create backend `scoring.py` and `well_data.py` modules.
2. Load PFAS corrected JSON and add placeholder inorganics schema for immediate integration.
3. Replace `/api/wells` stub with full loaded dataset.
4. Replace `/api/score` stub with deterministic resolver + provisional composite scoring.
5. Add first 3 tests:
- high-risk well scores lower than clean well,
- invalid lat/lng returns 400,
- missing contaminant fields handled without crash.