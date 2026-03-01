# TapMap Phase QA Checklists

These checklists are executed after both `Teammate` and `You` implementation for a phase are complete.

## Global Preconditions (Every Phase)
1. Both role reports are updated for the phase.
2. Integration freeze timestamps are recorded.
3. Test environment and data snapshot are documented.
4. Prior-phase regression baseline is available.

## Phase 1 QA (Data Pipeline)
1. Cross-file join keys: verify `well_id` consistency across PFAS, coordinates, and service areas.
2. Null checks: no nulls in required identifier and coordinate columns.
3. Unit checks: PFAS fields in `ppt`, lead in `mg/L` where applicable.
4. Date checks: parseability and non-future values for sample/report dates.
5. Geospatial checks: coordinates valid range, GeoJSON geometry valid.
6. Reproducibility: data-summary output regenerated and matched.
7. Run executable validator: `python scripts/check_phase1_data.py`.

## Phase 2 QA (Scoring + Wells API)
1. `POST /api/score` valid coordinate returns deterministic score and full schema.
2. Out-of-zone coordinate returns expected error contract.
3. `GET /api/wells` schema matches frontend map needs.
4. Score bounds remain `0..100`.
5. Regression: Phase 1 data validations still pass.

## Phase 3 QA (Community APIs + End-to-End Core)
1. Address -> geocode -> score -> map flow completes.
2. `POST /api/submit` validation rejects invalid lat/lng, negative values, bad units.
3. `GET /api/community` returns anonymized output and no precise user location.
4. Storage fallback path tested when primary store unavailable.
5. Regression: Phase 2 endpoint contracts still pass.

## Phase 4 QA (Community Layer)
1. Seeded community data quality verified (distribution + required fields).
2. Map layer renders seeded and user-submitted points correctly.
3. API/UI error messages are consistent and actionable.
4. Deferred v2 items documented with no accidental partial implementation.
5. Regression: core end-to-end flow remains stable.

## Phase 5 QA (Deploy + Hardening)
1. Cloud endpoint health check and CORS check pass.
2. 10+ Madison address smoke tests pass.
3. Performance spot checks recorded for critical endpoints.
4. Local fallback runbook executed successfully.
5. Security sanity checks: no debug mode, no secrets in logs.

## Phase 6 QA (Risk Triage)
1. Outstanding risks are re-validated and prioritized.
2. No hidden P0/P1 blockers carried forward.
3. Morning execution plan reviewed and accepted.

## Phase 7 QA (Final Fixes)
1. Clean-session smoke test passes on demo hardware/browser.
2. All critical defects retested and closed.
3. Submission-critical flow fully green.
4. Regression for all accepted phases passes.

## Phase 8 QA (Demo Readiness)
1. Three timed full demo rehearsals completed.
2. Live flow and fallback flow both pass.
3. Backup addresses and expected outputs verified.
4. Final GO decision documented with signoff.

## Gate Command
Run:
`python scripts/validate_phase_gate.py --phase <N> --mode gate`

Phase moves forward only if command exits successfully and `handoff-decision.md` is `GO`.
