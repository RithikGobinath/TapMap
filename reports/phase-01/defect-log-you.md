# [YOU] Defect Log - Phase 01

## Open Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH1-DEF-003 | P2 | Open | Teammate | `well_service_areas.geojson` uses derived 1200-ft circular geometry from official GeoPDF labels instead of direct GIS-exported authoritative polygons. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\well_service_areas.geojson` properties include `geometry_basis` note |

## Closed Defects
| ID | Severity (P0/P1/P2) | Status (Open/Closed) | Owner | Summary | Retest Evidence |
| --- | --- | --- | --- | --- | --- |
| PH1-DEF-001 | P1 | Closed | Teammate | Missing required Phase 1 files (`pfas_well_latest.csv`, `well_coordinates.csv`, `dane_building_age.csv`, `well_service_areas.geojson`). | `python scripts/check_phase1_data.py` -> PASS |
| PH1-DEF-002 | P1 | Closed | Teammate | Invalid `NON_COMPL_PER_END_DATE` marker (`--->`) caused date parse failure in violations data. | `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_violations.csv` normalized and validator PASS |

## Notes
- No open P0 or P1 defects.
- Open P2 accepted for Phase 1 with explicit documentation and follow-up replacement path if official GIS boundary export becomes available.

