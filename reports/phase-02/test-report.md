# Test Report - Phase 02.1

## Test Execution Summary
- Environment: `/Users/sikander/Documents/TapMap`
- Test window: March 1, 2026
- Test owner(s): You
- [x] You implementation complete before testing.

## Matrix Results
| Category | Status (PASS/FAIL) | Evidence Path | Notes |
| --- | --- | --- | --- |
| Contract tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | Backend/API contracts validated. |
| Integration tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/integration-report.md` | Frontend + backend + city mapping integrated. |
| End-to-end tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_address_e2e_checks.txt` | Address mapping + weighted scoring verified on known addresses. |
| Negative/error tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | Invalid payload and fallback paths pass. |
| Regression tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` | Full backend suite green after fixes. |
| Performance spot checks | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_perf_spotcheck.txt` | Spot checks documented and acceptable. |
| Resilience tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_resilience_privacy_checks.txt` | Retry/fallback/no-data behavior stable. |
| Privacy/security sanity tests | PASS | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_resilience_privacy_checks.txt` | No sensitive location history leakage in payloads. |

## Automated Results
1. Backend:
- Command: `pytest -q`
- Result: `36 passed in 0.30s`
- Evidence: `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt`
2. Frontend:
- Command: `npm run build`
- Result: PASS
- Evidence: `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_frontend_build_final.txt`

## Address E2E Highlights
1. `835 W Dayton St, Madison, WI` -> wells `30,27,18,19` -> score `72.0 (C)`
2. `610 Langdon St, Madison, WI` -> wells `19,30,27,24,18` -> score `74.8 (C)`
3. `750 Hilldale Wy, Madison, WI 53705` -> well `14` -> score `32.8 (F)`
4. `600 N Park St, Madison, WI` -> city mapping miss, fallback path validated
Evidence:
- `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/835_W_Dayton_St.png`
- `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/610_Langdon_St.png`
- `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/750_Hilldale_Wy.png`
- `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/600_N_Park_St.png`

## Final Status
- Phase 2.1 test matrix: PASS
- Open P0/P1 defects: None
