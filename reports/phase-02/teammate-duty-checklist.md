# Phase 02 Teammate Duty Checklist (Backend + Data)

## Scope
Phase 2 teammate duties:
1. Implement WaterScore algorithm in Python (sigmoid normalization + weighted composite).
2. Build `POST /api/score` (`lat,lng` -> serving wells -> score + breakdown).
3. Build `GET /api/wells` (all wells + latest contaminant data).
4. Add unit tests proving bad wells score lower than clean wells (Well 15 vs clean wells).

## Implementation Checklist
- [x] Add/confirm scoring engine module with:
  - [x] Sigmoid normalization per contaminant metric.
  - [x] Weighted composite risk/score calculation.
  - [x] Deterministic grade mapping (`A`-`F`).
  - [x] Robust handling for missing contaminant values.
- [x] Add/confirm zone lookup logic:
  - [x] Point-in-polygon match against `well_service_areas.geojson`.
  - [x] Fallback to nearest well for out-of-zone coordinates.
- [x] Wire `POST /api/score`:
  - [x] Validate numeric `lat/lng` and coordinate ranges.
  - [x] Return score payload with `score`, `grade`, `wellIds`, `zoneId`, `breakdown`, `limits`, `lastUpdated`.
  - [x] Return explicit error message for invalid payloads.
- [x] Wire `GET /api/wells`:
  - [x] Return all wells from dataset.
  - [x] Include latest contaminant summary per well.
  - [x] Include risk-level fields needed by frontend map rendering.

## Test Checklist
- [x] Unit tests for scoring engine pass.
- [x] API tests for `/api/score` pass (valid + invalid payloads).
- [x] API tests for `/api/wells` pass (shape + required fields).
- [x] Known-well assertion passes:
  - [x] Well 15 score < clean reference well score.
  - [x] Well 15 grade/risk is worse than clean reference well.
- [x] Out-of-zone coordinate test passes and returns fallback well result.

## Verification Commands
- [x] `python -m pytest backend/tests/test_scoring_engine.py -q`
- [x] `python -m pytest backend/tests/test_api.py -q`
- [x] `python -m pytest backend/tests -q`

## Evidence to Capture
- [x] Test output log path recorded.
- [x] Example `/api/score` response saved.
- [x] Example `/api/wells` response saved.
- [x] Known-well comparison output saved (Well 15 vs clean well).

## Definition of Done (Teammate, Phase 2)
- [x] All four teammate duties completed.
- [x] Backend tests green for scoring + API contracts.
- [x] Evidence collected and ready for `reports/phase-02/teammate-report.md`.
- [x] No open P0/P1 defects for teammate scope.
