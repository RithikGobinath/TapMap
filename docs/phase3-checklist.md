# Phase 3 Checklist (Solo: You + Codex)

## Scope (Your Duties Only)
- [x] Build address search bar with autocomplete.
- [x] Build score display card with numeric score, color state, and letter grade.
- [x] Build Recharts contaminant-vs-MCL bar chart.
- [x] Wire frontend flow: search -> geocode -> `POST /api/score` -> UI update.
- [x] Keep Phase 2 map context integrated with Phase 3 scoring flow.

## Implementation Artifacts
- [x] Added autocomplete service:
1. `/Users/sikander/Documents/TapMap/frontend/src/services/autocomplete.ts`
- [x] Added autocomplete search UI component:
1. `/Users/sikander/Documents/TapMap/frontend/src/components/AddressAutocompleteSearch.tsx`
- [x] Added score display card component:
1. `/Users/sikander/Documents/TapMap/frontend/src/components/ScoreDisplayCard.tsx`
- [x] Added contaminant-vs-MCL chart component:
1. `/Users/sikander/Documents/TapMap/frontend/src/components/ContaminantBarChart.tsx`
- [x] Added dedicated phase page and route:
1. `/Users/sikander/Documents/TapMap/frontend/src/pages/Phase3Page.tsx`
2. `/Users/sikander/Documents/TapMap/frontend/src/App.tsx`
- [x] Added chart datum type contract:
1. `/Users/sikander/Documents/TapMap/frontend/src/types/phase2.ts`
- [x] Added Recharts dependency:
1. `/Users/sikander/Documents/TapMap/frontend/package.json`

## Quality Gates
- [x] Frontend production build passes:
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_frontend_build.txt`
- [x] Backend regression suite passes:
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_backend_tests.txt`
- [x] API contract smoke checks pass:
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_api_contract_smoke.txt`
- [x] Rigorous API matrix checks pass (all wells + weighted mix + negative payloads):
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_rigorous_api_matrix.txt`
- [x] Rigorous fuzz and latency checks pass:
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_rigorous_fuzz_perf.txt`
- [x] In-zone sampling checks pass:
1. `/Users/sikander/Documents/TapMap/reports/phase-03/evidence/command-logs/phase3_rigorous_inzone_sampling.txt`

## Manual Validation Checklist
- [ ] Live browser test with your API key:
1. Type partial address and confirm autocomplete suggestions appear.
2. Select suggestion and submit.
3. Verify score card updates (score, grade, color).
4. Verify contaminant-vs-MCL chart renders.
5. Click a map zone and confirm score card switches to selected-well context.
