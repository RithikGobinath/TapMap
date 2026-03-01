# Phase 01 - Test Report

## Test Execution Summary
- Test window: 2026-02-28
- Execution scope: full Phase 1 joint QA matrix after both role implementations.
- [x] Teammate implementation complete before testing.
- [x] You implementation complete before testing.
- Primary orchestrated run: `C:\Users\rithi\OneDrive\Documents\Github\TapMap\scripts\run_phase1_joint_qa.py`

## Matrix Results
| Category | Status (PASS/FAIL) | Evidence Path | Notes |
| --- | --- | --- | --- |
| Contract tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\api_contract_checks_current.txt` | Data contract + backend endpoint contract checks passed. |
| Integration tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_cross_dataset_checks.txt` | Cross-dataset key joins and scaffold presence checks passed. |
| End-to-end tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_joint_qa_summary.md` | Combined phase flow checks passed for Phase 1 scope. |
| Negative/error tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\api_contract_checks_current.txt` | Invalid payloads return deterministic `400` responses. |
| Regression tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\backend_pytest_current.txt` | Re-run data and backend checks remained green. |
| Performance spot checks | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\performance_spot_checks.txt` | Endpoint latency spot checks available for `/health`, `/api/wells`, `/api/score`. |
| Resilience tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\resilience_checks.txt` | Malformed JSON and content-type edge cases return controlled errors. |
| Privacy/security sanity tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\privacy_security_checks.txt` | Submission response excludes raw lat/lng; no sensitive leakage in outputs. |

## Detailed Test Cases
- `PH1-CT-001`: `python scripts/check_phase1_data.py` -> PASS.
- `PH1-CT-002`: strict backend contract probe on `/api/health`, `/api/score`, `/api/wells`, `/api/submit` -> PASS.
- `PH1-INT-001`: well_id set parity across `pfas_well_latest.csv`, `well_coordinates.csv`, `well_service_areas.geojson` -> PASS.
- `PH1-INT-002`: frontend/backend required scaffold file presence -> PASS.
- `PH1-NEG-001`: invalid `/api/score` and `/api/submit` payloads -> `400` as expected -> PASS.
- `PH1-REG-001`: re-run backend tests -> `5 passed` -> PASS.
- `PH1-RSL-001`: malformed input resilience evidence reviewed -> PASS.
- `PH1-PRV-001`: submit response checked for absence of raw coordinates -> PASS.

## Retest Results After Fixes
- Added `/api/health` route compatibility in backend and test coverage.
- Re-ran backend tests: PASS (`5 passed`).
- Re-ran joint QA script: overall PASS.
- Final matrix status for Phase 1: all categories PASS.
