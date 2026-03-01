# TapMap 2-Person Phase Workflow With Joint QA Gates

This document operationalizes the agreed plan for `TapMap`.

## Core Rule
Each phase closes only after:
1. `Teammate` implementation is complete.
2. `You` implementation is complete.
3. Joint integration freeze is declared.
4. Joint QA matrix is executed.
5. All `P0` and `P1` defects are fixed and retested.
6. `handoff-decision.md` is marked `GO`.

If any condition fails, the phase remains `NO-GO`.

## Roles
- `Teammate`: Backend + Data.
- `You`: Frontend + UI.

## Scope Guardrail
Scope cuts remain active unless changed in the current phase handoff decision:
- Keep: core address -> score -> map flow, real data pipeline, community submission with geohash privacy, deployment.
- Defer to v2: anomaly alerts, trend charts, pipe-age amplification in scoring.

## Required Report Artifacts Per Phase
Under `reports/phase-XX/`:
1. `teammate-report.md`
2. `you-report.md`
3. `integration-report.md`
4. `test-report.md`
5. `defect-log.md`
6. `handoff-decision.md`

## Joint QA Matrix (Phase-Scoped)
The following must be documented in `test-report.md`:
1. Contract tests (API + data schema).
2. Integration tests (frontend-backend + map joins).
3. End-to-end feature tests for that phase.
4. Negative/error tests.
5. Regression tests for prior accepted phases.
6. Performance spot checks (critical endpoints).
7. Resilience tests (fallback behavior).
8. Privacy/security sanity tests.

## Data Contracts
Canonical PWSID: `WI1130224`.

Required datasets:
- `data/madison_violations.csv`
- `data/madison_lead_samples.csv`
- `data/madison_facilities.csv`
- `data/madison_water_systems.csv`
- `data/madison_ref_codes.csv`
- `data/pfas_well_latest.csv`
- `data/well_service_areas.geojson`
- `data/well_coordinates.csv`
- `data/dane_building_age.csv`

## API Contracts
- `GET /api/health`
- `POST /api/score` with `{lat,lng}`
- `GET /api/wells`
- `POST /api/submit`
- `GET /api/community`

## Gate Criteria For `GO`
1. Both role reports are complete with artifact evidence.
2. Integration report confirms both implementations complete.
3. QA matrix rows are marked `PASS`.
4. Defect log has no open `P0` or `P1`.
5. Handoff report includes unresolved issue list and explicit P2 risk acceptance if any.

## Automation
Use scripts in `scripts/`:
1. `init_phase_reports.py` to create phase report files.
2. `validate_phase_gate.py --phase <1-8>` to validate phase evidence and gate readiness.
3. `check_phase1_data.py` to run rigorous Phase 1 data contract checks.
