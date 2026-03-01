#!/usr/bin/env python3
"""Validate phase reporting and joint QA gate requirements."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


REQUIRED_FILES = [
    "teammate-report.md",
    "you-report.md",
    "integration-report.md",
    "test-report.md",
    "defect-log.md",
    "handoff-decision.md",
]

COMMON_HEADINGS = [
    "## Phase Goal",
    "## Completed Work",
    "## Artifacts Produced (with absolute paths)",
    "## Data/API Validation Results",
    "## Known Issues / Risks",
    "## What Is Ready For Teammate",
    "## Blocked / Needs Input",
    "## Next Phase Plan (first 30 min)",
]

TEST_MATRIX_CATEGORIES = [
    "Contract tests",
    "Integration tests",
    "End-to-end tests",
    "Negative/error tests",
    "Regression tests",
    "Performance spot checks",
    "Resilience tests",
    "Privacy/security sanity tests",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def check_contains(text: str, required_tokens: list[str], file_name: str, errors: list[str]) -> None:
    for token in required_tokens:
        if token not in text:
            errors.append(f"{file_name}: missing required section '{token}'.")


def parse_markdown_matrix_statuses(test_report: str) -> dict[str, str]:
    statuses: dict[str, str] = {}
    pattern = re.compile(r"^\|\s*([^|]+?)\s*\|\s*(PASS|FAIL)\s*\|", re.IGNORECASE)
    for line in test_report.splitlines():
        m = pattern.match(line.strip())
        if not m:
            continue
        category = m.group(1).strip()
        status = m.group(2).upper()
        statuses[category] = status
    return statuses


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate phase artifacts and gate readiness.")
    parser.add_argument("--phase", type=int, required=True, help="Phase number (1-8)")
    parser.add_argument(
        "--mode",
        choices=["progress", "gate"],
        default="gate",
        help="progress=structure only, gate=strict GO checks (default: gate)",
    )
    args = parser.parse_args()

    if args.phase < 1 or args.phase > 8:
        raise SystemExit("Phase must be between 1 and 8.")

    repo_root = Path(__file__).resolve().parents[1]
    phase_dir = repo_root / "reports" / f"phase-{args.phase:02d}"

    errors: list[str] = []
    warnings: list[str] = []

    if not phase_dir.exists():
        errors.append(f"Missing phase directory: {phase_dir}")
        for e in errors:
            print(f"ERROR: {e}")
        return 1

    missing_files = [name for name in REQUIRED_FILES if not (phase_dir / name).exists()]
    if missing_files:
        for name in missing_files:
            errors.append(f"Missing required file: {phase_dir / name}")
        for e in errors:
            print(f"ERROR: {e}")
        return 1

    teammate = read_text(phase_dir / "teammate-report.md")
    you = read_text(phase_dir / "you-report.md")
    integration = read_text(phase_dir / "integration-report.md")
    test_report = read_text(phase_dir / "test-report.md")
    defect_log = read_text(phase_dir / "defect-log.md")
    handoff = read_text(phase_dir / "handoff-decision.md")

    check_contains(teammate, COMMON_HEADINGS, "teammate-report.md", errors)
    check_contains(you, COMMON_HEADINGS, "you-report.md", errors)

    check_contains(
        integration,
        [
            "## Integration Freeze",
            "## Implementation Completion Checks",
            "## Integrated Components",
            "## End-to-End Verification",
            "## Integration Risks",
            "## Ready/Not Ready",
        ],
        "integration-report.md",
        errors,
    )

    check_contains(
        test_report,
        [
            "## Test Execution Summary",
            "## Matrix Results",
            "## Detailed Test Cases",
            "## Retest Results After Fixes",
        ],
        "test-report.md",
        errors,
    )

    check_contains(
        defect_log,
        ["## Open Defects", "## Closed Defects", "## Notes"],
        "defect-log.md",
        errors,
    )

    check_contains(
        handoff,
        [
            "## Decision",
            "## Completion Preconditions",
            "## Unresolved Issues",
            "## P2 Risk Acceptance",
            "## Signoff",
        ],
        "handoff-decision.md",
        errors,
    )

    if args.mode == "gate":
        if "- [x] Teammate implementation complete for this phase." not in integration:
            errors.append("integration-report.md: teammate completion checkbox not checked.")
        if "- [x] You implementation complete for this phase." not in integration:
            errors.append("integration-report.md: you completion checkbox not checked.")

        if "- [x] Teammate implementation complete before testing." not in test_report:
            errors.append("test-report.md: teammate pre-test completion checkbox not checked.")
        if "- [x] You implementation complete before testing." not in test_report:
            errors.append("test-report.md: you pre-test completion checkbox not checked.")

        statuses = parse_markdown_matrix_statuses(test_report)
        for category in TEST_MATRIX_CATEGORIES:
            status = statuses.get(category)
            if status != "PASS":
                errors.append(f"test-report.md: '{category}' must be PASS for gate mode.")

        if not re.search(r"-\s*Decision:\s*GO\b", handoff, flags=re.IGNORECASE):
            errors.append("handoff-decision.md: Decision must be GO in gate mode.")

        required_handoff_checks = [
            "- [x] Teammate report complete.",
            "- [x] You report complete.",
            "- [x] Integration report complete.",
            "- [x] Test report complete.",
            "- [x] Defect log complete.",
            "- [x] No open P0 defects.",
            "- [x] No open P1 defects.",
        ]
        for check in required_handoff_checks:
            if check not in handoff:
                errors.append(f"handoff-decision.md: missing or unchecked precondition '{check}'.")

        open_critical = re.findall(
            r"^\|\s*[^|]+\|\s*(P0|P1)\s*\|\s*Open\s*\|",
            defect_log,
            flags=re.IGNORECASE | re.MULTILINE,
        )
        if open_critical:
            errors.append("defect-log.md: contains open P0/P1 defects.")

        if "- Accepted by:" in handoff and "- Rationale:" in handoff:
            accepted_by_line = next((ln for ln in handoff.splitlines() if ln.strip().startswith("- Accepted by:")), "")
            rationale_line = next((ln for ln in handoff.splitlines() if ln.strip().startswith("- Rationale:")), "")
            if accepted_by_line.strip().endswith(":") or rationale_line.strip().endswith(":"):
                warnings.append("handoff-decision.md: fill P2 risk acceptance details when applicable.")

    if errors:
        print(f"Validation failed for phase {args.phase:02d} ({args.mode} mode).")
        for e in errors:
            print(f"ERROR: {e}")
        if warnings:
            for w in warnings:
                print(f"WARN: {w}")
        return 1

    print(f"Validation passed for phase {args.phase:02d} ({args.mode} mode).")
    if warnings:
        for w in warnings:
            print(f"WARN: {w}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

