# Phase 01 - Teammate Report (Backend + Data)

## Duty Matrix
| Duty (from `tapmap-2person-plan.jsx` Phase 1) | Status | Notes |
|---|---|---|
| Download EPA SDWIS data for Madison (violations + contaminants CSVs) | Partial | Core SDWIS-derived files are present (`madison_violations.csv`, `madison_ref_codes.csv`, `madison_water_systems.csv`, `madison_facilities.csv`, `madison_summary.json`). |
| Scrape Madison Water Utility PFAS reports into structured per-well dataset | Not complete | Expected explicit PFAS well-level artifact (for example `pfas_well_latest.csv` or JSON equivalent) is not present. |
| Find/download well service area boundary GeoJSON | Not complete | Expected `well_service_areas.geojson` (or equivalent) is not present in `data/`. |
| Compile well lat/lng coordinates + Dane building age data | Partial | No dedicated `well_coordinates.csv` or `dane_building_age.csv` found; current files do not provide explicit join-ready coordinate and building-age tables. |

## Implemented Work
1. A Madison-focused SDWIS data baseline exists in the repository under `data/`.
2. A summarized system profile exists in `data/madison_summary.json` with PWSID `WI1130224`, lead trend entries, and well references.
3. Lead sample history exists in `data/madison_lead_samples.csv`.

## File/Path Inventory
Primary teammate-side artifacts currently detected:
1. `data/madison_violations.csv`
2. `data/madison_ref_codes.csv`
3. `data/madison_water_systems.csv`
4. `data/madison_facilities.csv`
5. `data/madison_lead_samples.csv`
6. `data/madison_summary.json`
7. `data/filter.py`

Missing expected Phase 1 artifacts:
1. `data/pfas_well_latest.csv` (or equivalent structured PFAS per-well output)
2. `data/well_service_areas.geojson`
3. `data/well_coordinates.csv`
4. `data/dane_building_age.csv`

## Commands Run
Repository-side verification commands used for this report:
1. `ls -la data` -> captured in `reports/phase-01/evidence/command-logs/data_directory_listing.txt`
2. Data presence audit from report generation pipeline -> see `reports/phase-01/evidence/command-logs/`

## Known Gaps
1. **P1-DATA-001**: No explicit PFAS per-well structured dataset available for integration.
2. **P1-GEO-002**: No well service area GeoJSON available for frontend map overlays.
3. **P1-AGE-003**: No Dane building-age dataset for downstream risk-model joins.

## Evidence
1. Data directory listing: `reports/phase-01/evidence/command-logs/data_directory_listing.txt`
2. Existing summary snapshot: `data/madison_summary.json`
3. Defect tracking: `reports/phase-01/defect-log.md`
