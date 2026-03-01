# Test Report - Phase 02

## Test Execution Summary
- Environment: Local backend workspace (`C:\Users\rithi\OneDrive\Documents\Github\TapMap`)
- Test window: 2026-03-01
- Test owner(s): Teammate (backend/data)
- [x] Teammate implementation complete before testing.
- [ ] You implementation complete before testing.

## Matrix Results
| Category | Status (PASS/FAIL) | Evidence Path | Notes |
| --- | --- | --- | --- |
| Contract tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_api.txt` | API contract and required keys verified for backend scope. |
| Integration tests | FAIL | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\integration-report.md` | Cross-role integration blocked until `You` frontend/map deliverables are present. |
| End-to-end tests | FAIL | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\integration-report.md` | Full address->map->score flow cannot be run without partner UI integration. |
| Negative/error tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_api.txt` | Invalid lat/lng and malformed payload paths return controlled errors. |
| Regression tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_backend_all.txt` | Backend suite remains green after scoring engine updates. |
| Performance spot checks | FAIL |  | Not executed for this backend-only checkpoint. |
| Resilience tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_api.txt` | Out-of-zone fallback and missing-data paths handled deterministically. |
| Privacy/security sanity tests | PASS | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\api_score_response.json` | Score/wells responses do not expose sensitive user-submitted location history. |

## Detailed Test Cases
- ID: PH2-TM-001
  Expected: `GET /api/wells` returns full non-stub list.
  Actual: 22 wells returned with contaminant/risk fields.
  Result: PASS
  Evidence: `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\api_wells_response.json`
- ID: PH2-TM-002
  Expected: Well 15 scores lower than clean well 7.
  Actual: Comparison assertion true.
  Result: PASS
  Evidence: `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\known_well_comparison.json`
- ID: PH2-TM-003
  Expected: Invalid `lat/lng` returns `400`.
  Actual: API tests confirm error handling.
  Result: PASS
  Evidence: `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_api.txt`
- ID: PH2-JNT-001
  Expected: Full frontend-backend Phase 2 flow executes.
  Actual: Partner frontend Phase 2 artifacts not in workspace.
  Result: FAIL
  Evidence: `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\you-report.md`

## Retest Results After Fixes
- Backend suite rerun after scoring engine and PFAS parser corrections:
  - `pytest backend/tests -q` -> `11 passed`.
- Final teammate baseline status: PASS.
- Joint phase status: pending partner implementation and joint rerun.

