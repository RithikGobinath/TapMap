# Phase 01 - Defect Log

## Open Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH1-DEF-003 | P2 | Open | Teammate | `well_service_areas.geojson` uses derived geometry from official map references and is not a direct authoritative GIS portal export. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\well_service_areas.geojson` + `phase1_cross_dataset_checks.txt` |

## Closed Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH1-DEF-001 | P1 | Closed | Teammate | Missing required Phase 1 data artifacts (PFAS/service area/coordinates/building-age) in earlier state. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_data_check_current.txt` |
| PH1-DEF-002 | P1 | Closed | Teammate | Invalid date marker in violations data caused parse failure risk. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_data_check_current.txt` |
| PH1-DEF-004 | P1 | Closed | You | Planned health endpoint contract expected `/api/health` but backend exposed only `/health`. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\backend_pytest_current.txt` and `api_contract_checks_current.txt` |

## Notes
- No open `P0` or `P1` defects remain.
- Open `P2` is documented and explicitly handled in handoff risk acceptance.
