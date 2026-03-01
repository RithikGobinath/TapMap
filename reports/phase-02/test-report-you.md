# Test Report - Phase 02.1 (You Scope)

## Test Execution Summary
- Environment: `/Users/sikander/Documents/TapMap`
- Test window: March 1, 2026
- Test owner: You (frontend + integration with live backend)
- [x] You implementation complete before testing.
- [x] Teammate-dependent blockers removed for this checkpoint.

## Matrix Results
| Category | Status (PASS/FAIL) | Evidence Path | Notes |
| --- | --- | --- | --- |
| Contract tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | `/api/score`, `/api/wells`, `/api/address-wells` contracts validated via backend test suite. |
| Integration tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/integration-report.md` | Frontend geocode + city mapping + weighted scoring all integrated. |
| End-to-end tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_address_e2e_checks.txt` | Address -> mapping -> weighted score verified across known Madison addresses. |
| Negative/error tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | Invalid payload, empty address, upstream failure, and out-of-zone fallback handled. |
| Regression tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | 36-test suite green after PFAS/mapping/scoring fixes. |
| Performance spot checks | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_perf_spotcheck.txt` | Spot checks documented and no blocking performance regressions found. |
| Resilience tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_resilience_privacy_checks.txt` | Retry/fallback and no-data paths remain deterministic. |
| Privacy/security sanity tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_resilience_privacy_checks.txt` | No sensitive personal location history exposed by API payloads. |

## Automated Test Results
- Backend tests:
  - Command: `pytest -q`
  - Result: `36 passed in 0.30s`
  - Evidence: `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt`
- Frontend build:
  - Command: `npm run build`
  - Result: PASS
  - Evidence: `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_frontend_build_final.txt`

## Address E2E Scenarios (Executed)
- `835 W Dayton St, Madison, WI`
  - Mapping wells: `30, 27, 18, 19`
  - Score: `72.0 (C)`
  - Evidence:
    - `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/835_W_Dayton_St.png`
- `610 Langdon St, Madison, WI`
  - Mapping wells: `19, 30, 27, 24, 18`
  - Score: `74.8 (C)`
  - Evidence:
    - `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/610_Langdon_St.png`
- `750 Hilldale Wy, Madison, WI 53705`
  - Mapping wells: `14`
  - Score: `32.8 (F)`
  - Evidence:
    - `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/750_Hilldale_Wy.png`
- `600 N Park St, Madison, WI`
  - Mapping: Not found on city mapping tool, fallback path shown.
  - Evidence:
    - `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/600_N_Park_St.png`

## Additional Robustness Check
- Randomized lat/lng score calls in Madison-area bounds: `200` samples
- Failures: `0/200`
- Evidence: `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_address_e2e_checks.txt`

## Final Test Status
- Phase 2.1 You-scope matrix: PASS
- Open P0/P1 defects from this execution: None
