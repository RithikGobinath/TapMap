# Defect Log - Phase 02

## Open Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| - | - | - | - | No open P0/P1 defects recorded in current Phase 2 baseline. | - |

## Closed Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH2-DEF-001 | P1 | Closed | You | Frontend was consuming an outdated PFAS dataset copy; wells 9/11/14 showed `null` totals despite parser audit fixes. | `/Users/sikander/Documents/TapMap/frontend/src/data/pfas_well_latest.json` |
| PH2-DEF-002 | P2 | Closed | You | UI semantics did not distinguish `0` (not detected) from `null` (not reported/no current sample). | `/Users/sikander/Documents/TapMap/frontend/src/utils/pfas.ts` |

## Notes
- Phase-wide NO-GO remains due incomplete teammate backend implementation, not due open P0/P1 defects.
