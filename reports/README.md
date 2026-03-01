# Reports Structure

Each phase must contain the six mandatory files:
1. `teammate-report.md`
2. `you-report.md`
3. `integration-report.md`
4. `test-report.md`
5. `defect-log.md`
6. `handoff-decision.md`

Generation and validation:
- Initialize missing folders/files: `python scripts/init_phase_reports.py`
- Validate a phase gate: `python scripts/validate_phase_gate.py --phase 1`

The phase can move forward only when validation passes and `handoff-decision.md` says `Decision: GO`.

