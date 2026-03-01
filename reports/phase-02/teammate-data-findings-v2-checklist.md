# Phase 2.1 Teammate Checklist - Data Findings v2 Integration

## Status
- Deferred from baseline Phase 2 closure.
- This checklist is intentionally tracked as `Phase 2.1` scope.

## Inputs to Lock
- [ ] Confirm source files are available:
- [ ] `c:\Users\rithi\Downloads\TapMap-Data-Findings-v2.docx`
- [ ] `c:\Users\rithi\Downloads\teammate-report.md`
- [ ] Confirm canonical PWSID to use in all outputs is `WI1130224`.
- [ ] Freeze source-priority rule (documented in report):
- [ ] Priority 1: official per-well Madison report values
- [ ] Priority 2: corrected PFAS parser outputs
- [ ] Priority 3: fallback/proxy values (only when source missing)

## Data Model
- [ ] Define canonical per-well schema for scoring dataset.
- [ ] Include core fields: `well_id`, `well_name`, `status`, `source_date`.
- [ ] Include PFAS fields: `total_pfas_ppt`, `pfas_status`, `historical_max_pfas_ppt`.
- [ ] Include inorganic/radionuclide fields: `nitrate_mg_l`, `chromium6_ug_l`, `sodium_mg_l`, `chloride_mg_l`, `radium_pci_l`.
- [ ] Include metadata fields: `data_confidence`, `source_refs`, `notes`.
- [ ] Validate all units and convert to canonical units if needed.
- [ ] Save schema doc path in Phase 2 report.

## Dataset Build
- [ ] Build structured per-well dataset from Findings v2 values (20 active wells minimum).
- [ ] Merge in corrected PFAS dataset from `data/pfas_well_latest.csv`.
- [ ] Join well coordinates from `data/well_coordinates.csv`.
- [ ] Join zone geometry key mapping from `data/well_service_areas.geojson`.
- [ ] Run completeness check for required columns.
- [ ] Run null audit and classify each null as:
- [ ] `not_detected`
- [ ] `no_current_sample`
- [ ] `unknown`
- [ ] Export final backend-consumable dataset.

## Scoring Engine Upgrade
- [ ] Replace provisional scoring inputs with explicit contaminant fields.
- [ ] Implement normalization per contaminant threshold/guideline.
- [ ] Implement weighted composite risk score.
- [ ] Keep response keys stable:
- [ ] `score`, `grade`, `breakdown`, `limits`, `lastUpdated`, `wellIds`, `zoneId`
- [ ] Add additive fields only if backward-compatible.
- [ ] Document final weight vector and rationale in teammate report.

## Serving-Well Resolver
- [ ] Keep polygon resolver for in-zone points.
- [ ] Keep nearest-well fallback for out-of-zone points.
- [ ] Return explicit fallback signal (for example `outOfZone: true`).
- [ ] Add deterministic behavior for ambiguous overlaps.

## API Wiring
- [ ] Wire `GET /api/wells` to full real dataset (no stub rows).
- [ ] Wire `POST /api/score` to resolver + upgraded scoring engine.
- [ ] Keep `POST /api/submit` unchanged for Phase 2 scope (unless required).
- [ ] Validate error responses for malformed `lat/lng`.

## Tests (Required)
- [ ] Unit tests for dataset loader and schema validation.
- [ ] Unit tests for scoring math and grade mapping.
- [ ] API tests for `/api/wells` shape + row count.
- [ ] API tests for `/api/score` valid payload and invalid payload.
- [ ] Ranking tests:
- [ ] Higher-risk wells (for example 14/9/11) score lower than clean wells (for example 24/28/30).
- [ ] Out-of-zone fallback test returns deterministic result.
- [ ] Full backend suite passes.

## Evidence Collection
- [ ] Save pytest logs under `reports/phase-02/evidence/command-logs/`.
- [ ] Save example `/api/wells` JSON response under `reports/phase-02/evidence/`.
- [ ] Save example `/api/score` JSON response under `reports/phase-02/evidence/`.
- [ ] Save well ranking comparison artifact under `reports/phase-02/evidence/`.
- [ ] Save source-priority decision note under `reports/phase-02/evidence/`.

## Reporting / Handoff
- [ ] Update `reports/phase-02/teammate-report.md` with:
- [ ] completed work
- [ ] artifact paths
- [ ] data validation results
- [ ] known risks
- [ ] teammate-ready handoff notes
- [ ] Update `reports/phase-02/integration-report.md` with integration status.
- [ ] Update `reports/phase-02/test-report.md` with matrix results.
- [ ] Update `reports/phase-02/defect-log.md` with open/closed defects.
- [ ] Update `reports/phase-02/handoff-decision.md` with GO/NO-GO.

## Definition of Done (This Checklist)
- [ ] Findings v2 contaminants are integrated into scoring data and APIs.
- [ ] No open P0/P1 defects in teammate scope.
- [ ] All required tests pass and evidence is saved.
- [ ] Phase 2 teammate report is ready for joint QA handoff.
