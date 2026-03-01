# PFAS Parser Audit Report (Phase 2)

## Purpose
Verify whether PFAS `null` values were truly missing from source data or caused by parser limitations.

## Source Data Reviewed
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\pfas_well_latest.csv`
- City well quality PDFs referenced in `source_url` for each well row
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\SDWA_VIOLATIONS_ENFORCEMENT.csv` (Madison rows check)

## Findings
1. Wisconsin SDWA violations extract does not currently provide PFAS rows for Madison (`WI1130224`), so PFAS values come from City well PDFs for this phase.
2. The old parser logic missed valid PFAS phrases in some PDFs.
3. After parser fix and regeneration, PFAS data is now populated correctly for those wells.

## Parser Fix Summary
Updated parser in:
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\scripts\generate_phase1_outputs.py`

Added support for phrase patterns such as:
- `level of this PFAS was X`
- `combined PFAS level is estimated at X`
- plus status tagging: `detected`, `not_detected`, `no_current_sample`

## Old vs New Result (Reproducible Audit)
Comparison against legacy parsing behavior shows exactly 3 corrected wells:

| Well ID | Old Parser `total_pfas_ppt` | Corrected `total_pfas_ppt` | Status |
| --- | --- | --- | --- |
| 9 | `null` | `47.0` | `detected` |
| 11 | `null` | `4.0` | `detected` |
| 14 | `null` | `8.0` | `detected` |

Well 15 remains `null` for current total by design:
- `pfas_status = no_current_sample`
- `historical_max_pfas_ppt = 56.0`
- report text indicates well is out of service and no routine/annual sample for current period.

## Current PFAS Snapshot (Post-Fix)
- Total wells: `22`
- `detected`: `4`
- `not_detected`: `17`
- `no_current_sample`: `1`
- Remaining `null total_pfas_ppt`: `1` (Well 15 only)

## Regenerated Outputs
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\pfas_well_latest.csv`
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\data\pfas_well_latest.json`

## Validation
- Data contract check: `python scripts/check_phase1_data.py` -> PASS
- Backend tests: `pytest backend/tests -q` -> PASS (`11 passed`)
- Test log evidence:
  - `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\test_backend_all.txt`

## Conclusion
PFAS `null` values were partly genuine and partly parser-induced.  
Parser-induced nulls are now fixed for wells 9, 11, and 14.  
Only Well 15 remains null for current PFAS value, which matches source-report semantics (`no_current_sample`).
