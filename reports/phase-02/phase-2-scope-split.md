# Phase 2 Scope Split: Baseline vs Phase 2.1

## Decision
- Baseline Phase 2 goals/deliverables are completed first.
- Findings v2 expansion is tracked as separate `Phase 2.1`.

## Baseline Phase 2 (Current)
Includes only original Phase 2 teammate duties:
1. WaterScore algorithm implementation.
2. Real `POST /api/score`.
3. Real `GET /api/wells`.
4. Unit tests proving bad wells score lower than clean wells.

Current backend status:
- Teammate baseline implementation: complete.
- Verification:
  - `pytest backend/tests/test_scoring_engine.py -q` -> PASS
  - `pytest backend/tests/test_api.py -q` -> PASS
  - `pytest backend/tests -q` -> PASS
- Evidence path:
  - `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\evidence\command-logs\`

## Deferred Phase 2.1
Findings v2 integration scope (multi-contaminant enrichment and source-priority harmonization) is deferred and tracked in:
- `C:\Users\rithi\OneDrive\Documents\Github\TapMap\reports\phase-02\teammate-data-findings-v2-checklist.md`

## Notes
- This split avoids blocking baseline Phase 2 completion.
- Phase 2.1 can proceed immediately after baseline Phase 2 handoff/gate tasks are finished.
