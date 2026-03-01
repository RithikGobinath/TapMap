# Phase 01 - Teammate Report (Backend + Data)

## Phase Goal
- Deliver all Phase 1 teammate data artifacts for Madison SDWIS/PFAS/geospatial/building-age inputs, in join-ready formats for Phase 2 scoring and map integration.

## Completed Work
- Produced Madison SDWIS-derived working files (`madison_violations.csv`, `madison_lead_samples.csv`, `madison_facilities.csv`, `madison_water_systems.csv`, `madison_ref_codes.csv`).
- Generated structured PFAS well dataset from Madison reports (`pfas_well_latest.csv` plus JSON companion).
- Produced well coordinate dataset (`well_coordinates.csv`) and well service-area GeoJSON (`well_service_areas.geojson`).
- Produced Dane building-age dataset (`dane_building_age.csv`) for infrastructure context.
- Added/reused automation checks for repeatable validation (`scripts/check_phase1_data.py`, cross-dataset checks in QA run).
- Confirmed canonical Madison PWSID coverage (`WI1130224`) in violations/lead/water-system datasets.

## Artifacts Produced (with absolute paths)
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_violations.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_lead_samples.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_facilities.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_water_systems.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\madison_ref_codes.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\pfas_well_latest.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\pfas_well_latest.json`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\well_coordinates.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\well_service_areas.geojson`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\dane_building_age.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\scripts\check_phase1_data.py`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\scripts\run_phase1_joint_qa.py`

## Data/API Validation Results
- `python scripts/check_phase1_data.py` -> PASS (327 violations, 9 lead rows, 22 PFAS wells, 22 service-area features, 10000 building-age rows).
- Cross-file key integrity check -> PASS (`well_id` sets match across PFAS, coordinates, and service areas with 22/22 overlap).
- Coordinate/date/unit sanity checks -> PASS (lat/lng ranges valid; PFAS sample dates parse; building years in expected range).
- Joint QA matrix execution -> PASS summary generated at:
  - `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_joint_qa_summary.md`
  - `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-01\evidence\command-logs\phase1_joint_qa_summary.json`

## Known Issues / Risks
- `P2` accepted risk: `well_service_areas.geojson` geometry is derived from official well map references rather than a direct ArcGIS portal boundary export.
- No open `P0`/`P1` data defects remain.

## What Is Ready For Teammate
- All Phase 1 teammate data contracts are present and join-ready for scoring logic and map overlay integration.
- Validation evidence and repeatable QA scripts are available for re-run before phase handoff.

## Blocked / Needs Input
- No blocking input required for Phase 1 close.
- Optional future improvement: replace derived service areas with authoritative GIS polygon export when city access allows.

## Next Phase Plan (first 30 min)
- Wire these datasets into Phase 2 scoring service inputs.
- Add deterministic unit tests for known coordinate-to-well zone scoring behavior.
- Keep Phase 1 data checks in regression suite before any Phase 2 merges.
