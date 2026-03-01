# Phase 2 Checklist (Teammate)

## Scope Lock (Phase 2 teammate duties only)
- [ ] Implement WaterScore algorithm in Python (weighted composite + normalization).
- [ ] Replace `POST /api/score` stub with real scoring flow.
- [ ] Replace `GET /api/wells` stub with full well dataset output.
- [ ] Add deterministic unit tests: high-risk wells score lower than clean wells.

## Data Inputs and Source of Truth
- [x] PFAS parser audit reviewed and accepted:
`/Users/sikander/Documents/TapMap/reports/phase-02/evidence/pfas-parser-audit-report.md`
- [x] Corrected PFAS dataset available:
`/Users/sikander/Documents/TapMap/data/pfas_well_latest.json`
- [ ] Freeze canonical backend per-well schema (single source of truth).
- [ ] Add/ingest per-well 2024 inorganics dataset (nitrate, Cr-6, sodium, chloride, etc.).
- [ ] Add/ingest radionuclide context fields (with test-cycle status if partial coverage).
- [ ] Confirm active-well set for scoring domain (20 active vs broader legacy set).

## Backend Implementation
- [ ] Create backend data loader module for per-well contaminant records.
- [ ] Implement `resolve_serving_wells(lat, lng)` with deterministic fallback behavior.
- [ ] Implement `compute_score(well_ids)` returning:
- [ ] `score`
- [ ] `grade`
- [ ] `breakdown`
- [ ] `limits`
- [ ] `lastUpdated`
- [ ] Wire `/api/score` to resolver + scoring engine.
- [ ] Wire `/api/wells` to return all well records with latest contaminant fields.
- [ ] Keep `/api/submit` contract intact for Phase 2 (may remain stub).

## API Contract Compatibility (must not break frontend)
- [ ] Keep endpoint paths unchanged:
- [ ] `POST /api/score`
- [ ] `GET /api/wells`
- [ ] `POST /api/submit`
- [ ] Preserve existing top-level keys consumed by frontend (`score`, `grade`, `breakdown`, `limits`, `lastUpdated`).
- [ ] Only add fields in backward-compatible way (no key removals/renames).

## Testing and Validation
- [ ] Add/expand backend tests in:
`/Users/sikander/Documents/TapMap/backend/tests/test_api.py`
- [ ] Test invalid/malformed `lat/lng` returns expected error status.
- [ ] Test missing contaminant fields do not crash scoring.
- [ ] Test known high-risk well score is lower than known clean well score.
- [ ] Run backend tests successfully in teammate environment.
- [ ] Run data contract checks successfully in teammate environment.

## Handoff Deliverables
- [ ] Update teammate implementation notes:
`/Users/sikander/Documents/TapMap/reports/phase-02/teammate-report.md`
- [ ] Provide evidence paths for test logs and API outputs.
- [ ] Share final `/api/score` and `/api/wells` example payloads for frontend integration.
- [ ] List any accepted P2 risks and unresolved data limitations.

## Done Criteria for Teammate Phase 2
- [ ] `/api/score` returns real, data-driven scores (not stubs).
- [ ] `/api/wells` returns complete well set with contaminant data.
- [ ] Tests demonstrate ranking separation between high-risk and clean wells.
- [ ] Frontend can consume backend without contract breakage.
- [ ] No open P0/P1 backend defects for Phase 2 handoff.
