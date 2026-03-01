#!/usr/bin/env python3
"""Initialize phase report folders/files from templates."""

from __future__ import annotations

import argparse
from pathlib import Path


TEMPLATE_MAP = {
    "teammate-report.md": "teammate-report.template.md",
    "you-report.md": "you-report.template.md",
    "integration-report.md": "integration-report.template.md",
    "test-report.md": "test-report.template.md",
    "defect-log.md": "defect-log.template.md",
    "handoff-decision.md": "handoff-decision.template.md",
}


def replace_phase_token(text: str, phase_num: int) -> str:
    phase_label = f"{phase_num:02d}"
    return text.replace("Phase XX", f"Phase {phase_label}")


def write_file(path: Path, content: str, force: bool) -> str:
    if path.exists() and not force:
        return "skipped"
    path.write_text(content, encoding="utf-8")
    return "created" if not path.exists() else "updated"


def main() -> int:
    parser = argparse.ArgumentParser(description="Initialize phase report artifacts.")
    parser.add_argument("--start", type=int, default=1, help="Start phase number (default: 1)")
    parser.add_argument("--end", type=int, default=8, help="End phase number (default: 8)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[1]
    templates_dir = repo_root / "reports" / "templates"
    reports_dir = repo_root / "reports"

    if not templates_dir.exists():
        raise SystemExit(f"Template directory not found: {templates_dir}")

    if args.start < 1 or args.end < args.start:
        raise SystemExit("Invalid phase range.")

    created = 0
    skipped = 0

    for phase in range(args.start, args.end + 1):
        phase_dir = reports_dir / f"phase-{phase:02d}"
        phase_dir.mkdir(parents=True, exist_ok=True)

        for output_name, template_name in TEMPLATE_MAP.items():
            template_path = templates_dir / template_name
            if not template_path.exists():
                raise SystemExit(f"Missing template: {template_path}")

            output_path = phase_dir / output_name
            content = replace_phase_token(template_path.read_text(encoding="utf-8"), phase)

            exists_before = output_path.exists()
            write_file(output_path, content, args.force)
            if exists_before and not args.force:
                skipped += 1
            else:
                created += 1

    print(f"Initialization complete. Created/updated: {created}, skipped: {skipped}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

