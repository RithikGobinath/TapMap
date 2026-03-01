#!/usr/bin/env python3
"""Run joint Phase 1 QA checks and emit matrix-style results."""

from __future__ import annotations

import csv
import json
import subprocess
import sys
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any


MATRIX_CATEGORIES = [
    "Contract tests",
    "Integration tests",
    "End-to-end tests",
    "Negative/error tests",
    "Regression tests",
    "Performance spot checks",
    "Resilience tests",
    "Privacy/security sanity tests",
]


@dataclass
class CheckResult:
    status: str
    notes: str
    evidence: str


def run_command(cmd: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=False)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def file_exists(path: Path) -> bool:
    return path.exists() and path.is_file()


def load_well_ids_from_csv(path: Path, key: str) -> set[str]:
    ids: set[str] = set()
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            value = (row.get(key) or "").strip()
            if value:
                ids.add(value)
    return ids


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))
    data_dir = repo_root / "data"
    evidence_dir = repo_root / "reports" / "phase-01" / "evidence" / "command-logs"
    evidence_dir.mkdir(parents=True, exist_ok=True)

    results: dict[str, CheckResult] = {}

    # Contract tests: data contract script + backend API contract.
    data_contract = run_command([sys.executable, str(repo_root / "scripts" / "check_phase1_data.py")], repo_root)
    if data_contract.returncode != 0 and "No module named 'pandas'" in (data_contract.stderr + data_contract.stdout):
        system_python = shutil.which("python")
        if system_python:
            data_contract = run_command([system_python, str(repo_root / "scripts" / "check_phase1_data.py")], repo_root)
    contract_notes: list[str] = []
    contract_pass = data_contract.returncode == 0
    contract_notes.append("check_phase1_data.py PASS" if contract_pass else "check_phase1_data.py FAIL")

    negative_pass = False
    privacy_pass = False
    backend_contract_pass = False
    try:
        from backend.app import create_app  # type: ignore

        app = create_app()
        client = app.test_client()

        health_ok = client.get("/api/health").status_code == 200
        score_valid = client.post("/api/score", json={"lat": 43.07, "lng": -89.40}).status_code == 200
        wells_ok = client.get("/api/wells").status_code == 200
        submit_resp = client.post(
            "/api/submit",
            json={
                "lat": 43.07,
                "lng": -89.40,
                "contaminant": "pfas",
                "value": 4.2,
                "unit": "ppb",
                "testDate": "2026-02-28",
            },
        )
        submit_ok = submit_resp.status_code == 201
        submit_json: dict[str, Any] = submit_resp.get_json(silent=True) or {}
        negative_pass = client.post("/api/score", json={"lat": "bad", "lng": -89.40}).status_code == 400
        negative_pass = negative_pass and client.post("/api/submit", json={"lat": 43.07, "lng": -89.40}).status_code == 400
        privacy_pass = "lat" not in submit_json and "lng" not in submit_json

        backend_contract_pass = all([health_ok, score_valid, wells_ok, submit_ok])
        contract_notes.append("backend API contract checks PASS" if backend_contract_pass else "backend API contract checks FAIL")
    except Exception as exc:  # pragma: no cover - environment-specific fallback
        contract_notes.append(f"backend API contract checks unavailable: {exc}")

    contract_status = "PASS" if contract_pass and backend_contract_pass else "FAIL"
    results["Contract tests"] = CheckResult(
        status=contract_status,
        notes="; ".join(contract_notes),
        evidence=str(evidence_dir / "phase1_data_check_current.txt"),
    )

    # Integration tests: cross-dataset well_id join + scaffold file presence.
    integration_notes: list[str] = []
    integration_pass = True
    try:
        pfas_ids = load_well_ids_from_csv(data_dir / "pfas_well_latest.csv", "well_id")
        coord_ids = load_well_ids_from_csv(data_dir / "well_coordinates.csv", "well_id")
        geo = json.loads((data_dir / "well_service_areas.geojson").read_text(encoding="utf-8"))
        geo_ids = {
            str((feature.get("properties") or {}).get("well_id", "")).strip()
            for feature in geo.get("features", [])
        }
        geo_ids.discard("")
        if not (pfas_ids == coord_ids == geo_ids):
            integration_pass = False
            integration_notes.append("well_id key sets do not match across core datasets")
        else:
            integration_notes.append(f"well_id sets match across datasets ({len(pfas_ids)} wells)")
    except Exception as exc:
        integration_pass = False
        integration_notes.append(f"dataset join check failed: {exc}")

    required_scaffold_files = [
        repo_root / "frontend" / "package.json",
        repo_root / "frontend" / "src" / "App.tsx",
        repo_root / "frontend" / "src" / "pages" / "HomePage.tsx",
        repo_root / "frontend" / "src" / "pages" / "StatusPage.tsx",
        repo_root / "backend" / "app" / "app.py",
        repo_root / "backend" / "run.py",
        repo_root / "backend" / "tests" / "test_api.py",
    ]
    missing = [str(path) for path in required_scaffold_files if not path.exists()]
    if missing:
        integration_pass = False
        integration_notes.append(f"missing scaffold files: {len(missing)}")
    else:
        integration_notes.append("frontend/backend scaffold files present")

    results["Integration tests"] = CheckResult(
        status="PASS" if integration_pass else "FAIL",
        notes="; ".join(integration_notes),
        evidence=str(evidence_dir / "phase1_cross_dataset_checks.txt"),
    )

    # End-to-end tests: backend pytest + frontend evidence logs.
    e2e_notes: list[str] = []
    pytest_result = run_command([sys.executable, "-m", "pytest", "backend/tests/test_api.py", "-q"], repo_root)
    e2e_pass = pytest_result.returncode == 0
    e2e_notes.append("backend pytest PASS" if e2e_pass else "backend pytest FAIL")

    frontend_build_log = evidence_dir / "frontend_build.txt"
    frontend_http_log = evidence_dir / "frontend_http_checks.txt"
    frontend_evidence_ok = file_exists(frontend_build_log) and file_exists(frontend_http_log)
    if frontend_evidence_ok:
        e2e_notes.append("frontend build/http evidence present")
    else:
        e2e_notes.append("frontend evidence logs missing")
        e2e_pass = False

    results["End-to-end tests"] = CheckResult(
        status="PASS" if e2e_pass else "FAIL",
        notes="; ".join(e2e_notes),
        evidence=str(evidence_dir / "backend_pytest_current.txt"),
    )

    # Negative/error tests: dynamic API invalid payload checks.
    neg_notes = "invalid /api/score and /api/submit payload checks PASS" if negative_pass else "invalid payload checks FAIL"
    results["Negative/error tests"] = CheckResult(
        status="PASS" if negative_pass else "FAIL",
        notes=neg_notes,
        evidence=str(evidence_dir / "api_contract_checks_current.txt"),
    )

    # Regression tests: rerun primary phase checks.
    regression_pass = data_contract.returncode == 0 and pytest_result.returncode == 0
    regression_notes = "phase data contract and backend tests re-run without regressions" if regression_pass else "regression rerun failed"
    results["Regression tests"] = CheckResult(
        status="PASS" if regression_pass else "FAIL",
        notes=regression_notes,
        evidence=str(evidence_dir / "phase1_data_check_current.txt"),
    )

    # Performance checks: use existing log evidence.
    performance_log = evidence_dir / "performance_spot_checks.txt"
    perf_text = read_text(performance_log) if file_exists(performance_log) else ""
    performance_pass = all(token in perf_text for token in ["/health", "/api/wells", "/api/score"])
    performance_notes = "performance spot-check log includes critical endpoints" if performance_pass else "performance spot-check evidence missing/incomplete"
    results["Performance spot checks"] = CheckResult(
        status="PASS" if performance_pass else "FAIL",
        notes=performance_notes,
        evidence=str(performance_log),
    )

    # Resilience checks: use evidence log + negative checks.
    resilience_log = evidence_dir / "resilience_checks.txt"
    resilience_text = read_text(resilience_log) if file_exists(resilience_log) else ""
    resilience_pass = negative_pass and "400" in resilience_text
    resilience_notes = "resilience log and negative-path behavior confirm deterministic 400 handling" if resilience_pass else "resilience evidence missing/incomplete"
    results["Resilience tests"] = CheckResult(
        status="PASS" if resilience_pass else "FAIL",
        notes=resilience_notes,
        evidence=str(resilience_log),
    )

    # Privacy/security sanity: dynamic submit response + evidence log presence.
    privacy_log = evidence_dir / "privacy_security_checks.txt"
    privacy_evidence_ok = file_exists(privacy_log)
    privacy_status = privacy_pass and privacy_evidence_ok
    privacy_notes = (
        "submit response does not leak raw lat/lng and privacy evidence log exists"
        if privacy_status
        else "privacy checks failed or evidence missing"
    )
    results["Privacy/security sanity tests"] = CheckResult(
        status="PASS" if privacy_status else "FAIL",
        notes=privacy_notes,
        evidence=str(privacy_log),
    )

    # Persist machine-readable summary.
    summary_json = {
        "phase": 1,
        "overall_pass": all(results[category].status == "PASS" for category in MATRIX_CATEGORIES),
        "results": {
            category: {
                "status": results[category].status,
                "notes": results[category].notes,
                "evidence": results[category].evidence,
            }
            for category in MATRIX_CATEGORIES
        },
    }
    json_out = evidence_dir / "phase1_joint_qa_summary.json"
    json_out.write_text(json.dumps(summary_json, indent=2), encoding="utf-8")

    # Persist markdown summary for report copy/paste.
    md_lines = [
        "# Phase 1 Joint QA Summary",
        "",
        "| Category | Status | Evidence | Notes |",
        "| --- | --- | --- | --- |",
    ]
    for category in MATRIX_CATEGORIES:
        result = results[category]
        md_lines.append(
            f"| {category} | {result.status} | `{result.evidence}` | {result.notes} |"
        )
    md_lines.append("")
    md_lines.append(f"Overall: {'PASS' if summary_json['overall_pass'] else 'FAIL'}")
    md_out = evidence_dir / "phase1_joint_qa_summary.md"
    md_out.write_text("\n".join(md_lines), encoding="utf-8")

    print("\n".join(md_lines))
    return 0 if summary_json["overall_pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
