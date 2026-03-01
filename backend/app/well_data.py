from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


CATEGORY_WEIGHTS: dict[str, float] = {
    "pfas": 0.25,
    "nitrate": 0.20,
    "chromium6": 0.15,
    "radionuclides": 0.15,
    "sodiumChloride": 0.10,
    "violations": 0.10,
    "voc": 0.05,
}


CONTAMINANT_LIMITS: dict[str, float] = {
    "pfas_total_ppt": 10.0,
    "pfba_ppt": 7000.0,
    "nitrate_mg_l": 10.0,
    "chromium6_ug_l": 0.02,
    "radium_pci_l": 5.0,
    "sodium_mg_l": 20.0,
    "chloride_mg_l": 250.0,
    "voc_ug_l": 5.0,
}


EWG_GUIDELINES: dict[str, float] = {
    "pfas_total_ppt": 0.007,
    "nitrate_mg_l": 0.14,
    "chromium6_ug_l": 0.02,
    "radium_pci_l": 0.05,
    "sodium_mg_l": 20.0,
    "voc_ug_l": 0.06,
}


NATIONAL_REFERENCE: dict[str, float] = {
    "pfas_total_ppt": 0.5,
    "nitrate_mg_l": 1.0,
    "chromium6_ug_l": 0.08,
    "radium_pci_l": 0.6,
    "sodium_mg_l": 12.0,
    "voc_ug_l": 0.15,
}


UNITS: dict[str, str] = {
    "pfas_total_ppt": "ppt",
    "nitrate_mg_l": "mg/L",
    "chromium6_ug_l": "ug/L",
    "radium_pci_l": "pCi/L",
    "sodium_mg_l": "mg/L",
    "chloride_mg_l": "mg/L",
    "voc_ug_l": "ug/L",
}


DISPLAY_LABELS: dict[str, str] = {
    "pfas": "PFAS",
    "nitrate": "Nitrate",
    "chromium6": "Chromium-6",
    "radionuclides": "Radionuclides",
    "sodiumChloride": "Sodium/Chloride",
    "violations": "Violation History",
    "voc": "VOCs/Solvents",
}


PFAS_PROFILE: dict[str, dict[str, Any]] = {
    "6": {"compound": "PFHxS", "value_field": "pfhxs_ppt", "limit_field": "pfas_total_ppt"},
    "9": {"compound": "PFBA", "value_field": "total_pfas_ppt", "limit_field": "pfba_ppt"},
    "11": {"compound": "PFHxS", "value_field": "total_pfas_ppt", "limit_field": "pfas_total_ppt"},
    "14": {"compound": "PFHxS", "value_field": "total_pfas_ppt", "limit_field": "pfas_total_ppt"},
    "15": {"compound": "Historical PFAS", "value_field": "historical_max_pfas_ppt", "limit_field": "pfas_total_ppt"},
}


@dataclass(frozen=True)
class WellRecord:
    well_id: str
    well_name: str
    lat: float
    lng: float
    status: str
    sample_date: str
    contaminants: dict[str, float | str | None]
    quality: dict[str, str]
    violation_count: int
    pfas_profile: dict[str, Any]


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "na", "n/a"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _safe_int(value: Any) -> int | None:
    parsed = _safe_float(value)
    if parsed is None:
        return None
    return int(parsed)


def _canonical_well_id(value: Any) -> str:
    text = str(value).strip()
    if not text:
        return ""
    maybe_int = _safe_int(text)
    if maybe_int is not None:
        return str(maybe_int)
    return text


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _load_violation_counts(data_dir: Path) -> dict[str, int]:
    rows = _read_csv(data_dir / "madison_violations.csv")
    counts: dict[str, int] = {}
    for row in rows:
        well_id = _canonical_well_id(row.get("FACILITY_ID", ""))
        if not well_id:
            continue
        counts[well_id] = counts.get(well_id, 0) + 1
    return counts


def _load_pfas_rows(data_dir: Path) -> dict[str, dict[str, Any]]:
    path = data_dir / "pfas_well_latest.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    by_well: dict[str, dict[str, Any]] = {}
    for row in raw:
        well_id = _canonical_well_id(row.get("well_id", ""))
        if not well_id:
            continue
        by_well[well_id] = {
            "sample_date": str(row.get("sample_date", "")).strip(),
            "total_pfas_ppt": _safe_float(row.get("total_pfas_ppt")),
            "pfoa_ppt": _safe_float(row.get("pfoa_ppt")),
            "pfos_ppt": _safe_float(row.get("pfos_ppt")),
            "pfhxs_ppt": _safe_float(row.get("pfhxs_ppt")),
            "historical_max_pfas_ppt": _safe_float(row.get("historical_max_pfas_ppt")),
            "pfas_status": str(row.get("pfas_status", "") or "").strip() or "unknown",
            "source_url": row.get("source_url"),
        }
    return by_well


def _load_inorganics_rows(data_dir: Path) -> dict[str, dict[str, Any]]:
    path = data_dir / "well_inorganics_2024.json"
    raw = json.loads(path.read_text(encoding="utf-8"))
    by_well: dict[str, dict[str, Any]] = {}
    for row in raw.get("wells", []):
        well_id = _canonical_well_id(row.get("well_id", ""))
        if not well_id:
            continue
        by_well[well_id] = {
            "active": bool(row.get("active", True)),
            "nitrate_mg_l": _safe_float(row.get("nitrate_mg_l")),
            "chromium6_ug_l": _safe_float(row.get("chromium6_ug_l")),
            "sodium_mg_l": _safe_float(row.get("sodium_mg_l")),
            "chloride_mg_l": _safe_float(row.get("chloride_mg_l")),
            "radium_pci_l": _safe_float(row.get("radium_pci_l")),
            "voc_ug_l": _safe_float(row.get("voc_ug_l")),
            "quality": dict(row.get("quality", {})),
        }
    return by_well


def load_well_records(data_dir: Path) -> dict[str, WellRecord]:
    coordinates = _read_csv(data_dir / "well_coordinates.csv")
    pfas = _load_pfas_rows(data_dir)
    inorganics = _load_inorganics_rows(data_dir)
    violations = _load_violation_counts(data_dir)

    records: dict[str, WellRecord] = {}
    for row in coordinates:
        well_id = _canonical_well_id(row.get("well_id", ""))
        lat = _safe_float(row.get("lat"))
        lng = _safe_float(row.get("lng"))
        if not well_id or lat is None or lng is None:
            continue

        pfas_row = pfas.get(well_id, {})
        inorganics_row = inorganics.get(well_id, {})
        is_active = bool(inorganics_row.get("active", True))
        status = "active" if is_active else "inactive"
        sample_date = str(pfas_row.get("sample_date", "")).strip()

        contaminants: dict[str, float | str | None] = {
            "total_pfas_ppt": pfas_row.get("total_pfas_ppt"),
            "pfoa_ppt": pfas_row.get("pfoa_ppt"),
            "pfos_ppt": pfas_row.get("pfos_ppt"),
            "pfhxs_ppt": pfas_row.get("pfhxs_ppt"),
            "historical_max_pfas_ppt": pfas_row.get("historical_max_pfas_ppt"),
            "pfas_status": pfas_row.get("pfas_status", "unknown"),
            "nitrate_mg_l": inorganics_row.get("nitrate_mg_l"),
            "chromium6_ug_l": inorganics_row.get("chromium6_ug_l"),
            "sodium_mg_l": inorganics_row.get("sodium_mg_l"),
            "chloride_mg_l": inorganics_row.get("chloride_mg_l"),
            "radium_pci_l": inorganics_row.get("radium_pci_l"),
            "voc_ug_l": inorganics_row.get("voc_ug_l"),
        }
        quality = dict(inorganics_row.get("quality", {}))
        quality["pfas_status"] = str(contaminants["pfas_status"] or "unknown")

        records[well_id] = WellRecord(
            well_id=well_id,
            well_name=str(row.get("well_name", f"Well {well_id}")).strip() or f"Well {well_id}",
            lat=lat,
            lng=lng,
            status=status,
            sample_date=sample_date,
            contaminants=contaminants,
            quality=quality,
            violation_count=int(violations.get(well_id, 0)),
            pfas_profile=dict(PFAS_PROFILE.get(well_id, {})),
        )
    return records
