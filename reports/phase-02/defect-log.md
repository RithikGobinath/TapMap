# Defect Log - Phase 02.1

## Open Defects
| ID | Severity (P0/P1/P2) | Status | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| - | - | - | - | No open P0/P1/P2 defects at handoff checkpoint. | - |

## Closed Defects
| ID | Severity | Status | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH2-DEF-003 | P1 | Closed | You | Address score snapshot stayed stale after search/well interactions. | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` |
| PH2-DEF-004 | P1 | Closed | You | PFAS category could appear as `100` for non-reportable data and distort interpretation. | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` |
| PH2-DEF-005 | P1 | Closed | You | PFAS comparison missed EWG/legal values due field-key mismatch. | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_backend_tests_final.txt` |
| PH2-DEF-006 | P1 | Closed | You | Address score did not reflect mapped well distribution (equal/fallback behavior). | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/command-logs/phase2_1_address_e2e_checks.txt` |
| PH2-DEF-007 | P2 | Closed | You | City mapping parser failed for `Wy` street-type alias (`750 Hilldale Wy`). | `/Users/sikander/Documents/TapMap/reports/phase-02/evidence/750_Hilldale_Wy.png` |

## Notes
- Final regression run remained green after all fixes (`36 passed`).
- No unresolved blocking defects remain for Phase 2.1 handoff.
