# Phase 2.1 Checklist (Solo Execution: You + Codex)

## Scope Definition
- [x] Phase 2.1 is defined as: "Data findings integration + upgraded implementation plan" layered on top of Phase 2 baseline.
- [x] Team split is removed for Phase 2.1; all backend + frontend tasks are owned in one track.
- [x] Source references locked:
1. `/Users/sikander/Downloads/TapMap-Data-Findings-v2.docx`
2. `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/pfas-parser-audit-report.md`

## Carryover Completed from Phase 2
- [x] Phase 2 frontend map/geocode/zone flow is complete.
- [x] PFAS parser audit findings have been reviewed.
- [x] Corrected PFAS values are synced to frontend.
- [x] UI semantics distinguish `0` vs `null`.
- [x] Baseline report and evidence artifacts exist for Phase 2.

## Phase 2.1 Data Layer (Solo)
- [x] Freeze canonical per-well data schema for backend scoring.
- [x] Add per-well inorganics dataset (2024 official values) into repo data pipeline.
- [x] Add radionuclide fields with explicit status when data is partial/older-cycle.
- [x] Normalize units across contaminants (ppt/ppb/ug/L/mg/L/pCi/L) for scoring inputs.
- [x] Add data-quality flags per field (`measured`, `not_detected`, `not_reported`, `estimated`).
- [x] Validate well ID parity across all datasets used by Phase 2.1 scoring.

## Phase 2.1 Backend API + Scoring (Solo)
- [x] Implement `resolve_serving_wells(lat, lng)` (deterministic and testable).
- [x] Implement multi-category WaterScore computation function.
- [x] Keep/return required `/api/score` fields:
1. `score`
2. `grade`
3. `breakdown`
4. `limits`
5. `lastUpdated`
- [x] Extend `/api/score` with additive fields needed for 2.1 UI (e.g., `worstContaminant`, `comparisons`).
- [x] Replace `/api/score` stub with real data-driven response.
- [x] Replace `/api/wells` stub with full well payload (all required fields).
- [x] Keep endpoint paths unchanged:
1. `POST /api/score`
2. `GET /api/wells`
3. `POST /api/submit`

## Phase 2.1 Frontend (Solo)
- [x] Add 7-category score breakdown UI.
- [x] Add "worst contaminant" callout for selected address/well.
- [x] Add comparison UI: "Your well vs Madison avg vs National/EWG".
- [x] Add map color mode based on composite score from real backend.
- [x] Keep robust loading/error/empty states for each new panel.
- [x] Ensure mobile responsiveness remains intact after 2.1 additions.
- [x] Capture new 2.1 screenshots for evidence.

## Testing (Solo, Required)
- [x] Backend unit tests for score math and resolver behavior.
- [x] Backend API tests for `/api/score` and `/api/wells` real payload contracts.
- [x] Frontend build passes after 2.1 changes.
- [x] End-to-end tests for at least 3 known Madison addresses.
- [x] Negative tests:
1. invalid/empty address
2. no-zone result
3. backend 5xx fallback UI
- [x] Regression checks for existing Phase 2 behavior.
- [x] Performance spot checks documented.
- [x] Resilience checks documented.
- [x] Privacy/security sanity checks documented.

## Reporting and Gate Updates
- [x] Update `reports/phase-02/you-report.md` with 2.1 work summary.
- [x] Update `reports/phase-02/test-report-you.md` with executed 2.1 matrix results.
- [x] Update `reports/phase-02/integration-report.md` with real backend integration evidence.
- [x] Update `reports/phase-02/defect-log.md` with any 2.1 defects and retests.
- [x] Update `reports/phase-02/handoff-decision.md` to GO only if gate conditions are fully met.

## Phase 2.1 Done Criteria
- [x] Multi-contaminant backend scoring is live and consumed by frontend.
- [x] Frontend clearly surfaces top risk drivers beyond PFAS.
- [x] All required test matrix categories are PASS.
- [x] No open P0/P1 defects at handoff.
