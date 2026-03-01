from __future__ import annotations

import json
import math
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from .well_data import (
    CATEGORY_WEIGHTS,
    CONTAMINANT_LIMITS,
    DISPLAY_LABELS,
    EWG_GUIDELINES,
    NATIONAL_REFERENCE,
    UNITS,
    WellRecord,
    load_well_records,
)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _sigmoid(value: float) -> float:
    bounded = _clamp(value, -60.0, 60.0)
    return 1.0 / (1.0 + math.exp(-bounded))


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


def _extract_rings(geometry: dict[str, Any]) -> list[list[list[float]]]:
    gtype = geometry.get("type")
    coords = geometry.get("coordinates")
    rings: list[list[list[float]]] = []

    if gtype == "Polygon" and isinstance(coords, list) and coords:
        exterior = coords[0]
        if isinstance(exterior, list):
            rings.append(exterior)
    elif gtype == "MultiPolygon" and isinstance(coords, list):
        for polygon in coords:
            if isinstance(polygon, list) and polygon:
                exterior = polygon[0]
                if isinstance(exterior, list):
                    rings.append(exterior)
    return rings


def _point_in_ring(lat: float, lng: float, ring: list[list[float]]) -> bool:
    if len(ring) < 3:
        return False

    inside = False
    x = lng
    y = lat
    j = len(ring) - 1

    for i in range(len(ring)):
        xi = float(ring[i][0])
        yi = float(ring[i][1])
        xj = float(ring[j][0])
        yj = float(ring[j][1])
        intersects = (yi > y) != (yj > y)
        if intersects:
            denom = yj - yi
            if abs(denom) < 1e-12:
                j = i
                continue
            x_cross = (xj - xi) * (y - yi) / denom + xi
            if x < x_cross:
                inside = not inside
        j = i

    return inside


def _grade_from_score(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def _risk_from_ratio(ratio: float, *, center: float, steepness: float) -> float:
    # Maps a ratio (measured/limit) into [0,1] risk with controllable sensitivity.
    return _sigmoid(steepness * (ratio - center))


@dataclass(frozen=True)
class ScoredWell:
    well_id: str
    well_name: str
    lat: float
    lng: float
    status: str
    sample_date: str
    score: float
    grade: str
    risk_level: int
    violation_count: int
    contaminants: dict[str, Any]
    category_scores: dict[str, float]
    category_risks: dict[str, float]
    available_categories: list[str]
    limits: dict[str, float]
    worst_contaminant: dict[str, Any]
    comparisons: dict[str, Any]


class WaterScoreEngine:
    """Phase 2.1 scoring engine backed by canonical multi-contaminant well data."""

    def __init__(self, data_dir: Path | None = None) -> None:
        module_dir = Path(__file__).resolve().parent
        candidate_dirs = [
            module_dir.parent / "data",        # backend/data (and Cloud Run source deploy)
            module_dir.parent.parent / "data",  # repo-root data during local dev
            Path("/workspace/data"),            # explicit Cloud Build/Run fallback
            Path("/data"),
        ]
        self._data_dir = data_dir or next((path for path in candidate_dirs if path.exists()), candidate_dirs[0])
        self._service_area_rings: dict[str, list[list[list[float]]]] = {}
        self._well_records: dict[str, WellRecord] = {}
        self._scored_wells: dict[str, ScoredWell] = {}
        self._ordered_well_ids: list[str] = []
        self._max_violation_count = 1
        self._madison_averages: dict[str, float] = {}
        self._load()

    def _load(self) -> None:
        self._well_records = load_well_records(self._data_dir)
        self._ordered_well_ids = sorted(self._well_records.keys(), key=lambda value: int(value))
        self._max_violation_count = max(
            (record.violation_count for record in self._well_records.values()),
            default=1,
        )
        self._load_service_areas()
        self._madison_averages = self._compute_madison_averages()
        self._score_all_wells()

    def _load_service_areas(self) -> None:
        path = self._data_dir / "well_service_areas.geojson"
        raw = json.loads(path.read_text(encoding="utf-8"))

        rings_by_well: dict[str, list[list[list[float]]]] = {}
        for feature in raw.get("features", []):
            props = feature.get("properties") or {}
            well_id = _canonical_well_id(props.get("well_id", ""))
            if not well_id:
                continue
            rings = _extract_rings(feature.get("geometry") or {})
            if not rings:
                continue
            rings_by_well.setdefault(well_id, []).extend(rings)

        self._service_area_rings = rings_by_well

    def _compute_madison_averages(self) -> dict[str, float]:
        keys = [
            "total_pfas_ppt",
            "nitrate_mg_l",
            "chromium6_ug_l",
            "radium_pci_l",
            "sodium_mg_l",
            "voc_ug_l",
            "violation_count",
        ]
        out: dict[str, float] = {}

        for key in keys:
            values: list[float] = []
            if key == "violation_count":
                values = [float(record.violation_count) for record in self._well_records.values()]
            else:
                for record in self._well_records.values():
                    value = _safe_float(record.contaminants.get(key))
                    if value is not None:
                        values.append(value)
            out[key] = round(sum(values) / len(values), 4) if values else 0.0

        return out

    def _score_all_wells(self) -> None:
        scored: dict[str, ScoredWell] = {}
        for well_id in self._ordered_well_ids:
            record = self._well_records[well_id]
            scored[well_id] = self._score_well(record)
        self._scored_wells = scored

    def _compute_pfas_risk(self, record: WellRecord) -> tuple[float, float, str, float, bool]:
        status = str(record.contaminants.get("pfas_status") or "unknown")
        total = _safe_float(record.contaminants.get("total_pfas_ppt"))
        historical_max = _safe_float(record.contaminants.get("historical_max_pfas_ppt"))
        pfoa = _safe_float(record.contaminants.get("pfoa_ppt"))
        pfos = _safe_float(record.contaminants.get("pfos_ppt"))
        pfhxs = _safe_float(record.contaminants.get("pfhxs_ppt"))

        profile = record.pfas_profile
        compound = str(profile.get("compound") or "PFAS")
        limit_field = str(profile.get("limit_field") or "pfas_total_ppt")
        limit_value = CONTAMINANT_LIMITS.get(limit_field, CONTAMINANT_LIMITS["pfas_total_ppt"])

        has_any_pfas_value = any(value is not None for value in [total, historical_max, pfoa, pfos, pfhxs])
        has_compound_breakdown = any(value is not None for value in [pfoa, pfos, pfhxs])

        if status in {"unknown", "no_current_sample"}:
            return 0.0, 0.0, compound, limit_value, False

        if not has_any_pfas_value and status != "not_detected":
            return 0.0, 0.0, compound, limit_value, False

        if status == "not_detected":
            # If only a synthesized 0 total is present with no analyte breakdown,
            # treat PFAS as not reportable for scoring instead of granting a 100.
            if not has_compound_breakdown:
                return 0.0, 0.0, compound, limit_value, False
            return 0.0, 0.0, compound, limit_value, True

        value_field = str(profile.get("value_field") or "total_pfas_ppt")
        measured = _safe_float(record.contaminants.get(value_field))
        if measured is None:
            measured = total
        if measured is None:
            return 0.0, 0.0, compound, limit_value, False

        ratio = (measured or 0.0) / limit_value if limit_value > 0 else 0.0

        # PFBA-heavy wells should not dominate risk because the guidance threshold is much higher.
        if limit_field == "pfba_ppt":
            risk = _risk_from_ratio(ratio, center=0.0015, steepness=8.0)
        else:
            risk = _risk_from_ratio(ratio, center=0.55, steepness=7.0)

        return _clamp(risk, 0.0, 0.99), ratio, compound, limit_value, True

    def _compute_category_risks(self, record: WellRecord) -> tuple[dict[str, float], dict[str, Any]]:
        details: dict[str, Any] = {}

        pfas_risk, pfas_ratio, pfas_compound, pfas_limit, pfas_available = self._compute_pfas_risk(record)
        details["pfas"] = {
            "ratio": round(pfas_ratio, 4),
            "compound": pfas_compound,
            "limit": pfas_limit,
            "available": pfas_available,
        }

        nitrate = _safe_float(record.contaminants.get("nitrate_mg_l"))
        nitrate_ratio = (nitrate / CONTAMINANT_LIMITS["nitrate_mg_l"]) if nitrate is not None else 0.25
        nitrate_risk = _risk_from_ratio(nitrate_ratio, center=0.18, steepness=9.0)
        details["nitrate"] = {"ratio": round(nitrate_ratio, 4)}

        chromium6 = _safe_float(record.contaminants.get("chromium6_ug_l"))
        chromium_ratio = (
            chromium6 / CONTAMINANT_LIMITS["chromium6_ug_l"]
            if chromium6 is not None
            else 0.0
        )
        # Use log scaling so chromium-6 differentiates wells without dominating all scores.
        chromium_scaled = math.log10(1.0 + max(chromium_ratio, 0.0))
        chromium_risk = _risk_from_ratio(chromium_scaled, center=1.0, steepness=3.0)
        details["chromium6"] = {"ratio": round(chromium_ratio, 4), "scaled": round(chromium_scaled, 4)}

        radium = _safe_float(record.contaminants.get("radium_pci_l"))
        radium_ratio = (radium / CONTAMINANT_LIMITS["radium_pci_l"]) if radium is not None else 0.35
        radium_risk = _risk_from_ratio(radium_ratio, center=0.7, steepness=6.0)
        details["radionuclides"] = {"ratio": round(radium_ratio, 4)}

        sodium = _safe_float(record.contaminants.get("sodium_mg_l"))
        chloride = _safe_float(record.contaminants.get("chloride_mg_l"))
        sodium_ratio = (sodium / CONTAMINANT_LIMITS["sodium_mg_l"]) if sodium is not None else 0.35
        chloride_ratio = (chloride / CONTAMINANT_LIMITS["chloride_mg_l"]) if chloride is not None else 0.12
        salt_ratio = 0.7 * sodium_ratio + 0.3 * chloride_ratio
        salt_risk = _risk_from_ratio(salt_ratio, center=0.85, steepness=5.5)
        details["sodiumChloride"] = {"ratio": round(salt_ratio, 4)}

        violation_ratio = (
            record.violation_count / float(self._max_violation_count)
            if self._max_violation_count > 0
            else 0.0
        )
        violation_risk = _risk_from_ratio(violation_ratio, center=0.30, steepness=6.0)
        details["violations"] = {"ratio": round(violation_ratio, 4)}

        voc = _safe_float(record.contaminants.get("voc_ug_l"))
        voc_ratio = (voc / CONTAMINANT_LIMITS["voc_ug_l"]) if voc is not None else 0.08
        voc_risk = _risk_from_ratio(voc_ratio, center=0.20, steepness=8.0)
        details["voc"] = {"ratio": round(voc_ratio, 4)}

        risks = {
            "nitrate": _clamp(nitrate_risk, 0.0, 1.0),
            "chromium6": _clamp(chromium_risk, 0.0, 1.0),
            "radionuclides": _clamp(radium_risk, 0.0, 1.0),
            "sodiumChloride": _clamp(salt_risk, 0.0, 1.0),
            "violations": _clamp(violation_risk, 0.0, 1.0),
            "voc": _clamp(voc_risk, 0.0, 1.0),
        }
        if pfas_available:
            risks["pfas"] = _clamp(pfas_risk, 0.0, 1.0)

        if record.status == "inactive":
            for key, value in list(risks.items()):
                risks[key] = _clamp(value + 0.08, 0.0, 1.0)

        return risks, details

    def _ordered_categories(self, categories: list[str]) -> list[str]:
        return [key for key in CATEGORY_WEIGHTS.keys() if key in categories]

    def _normalized_weights(self, categories: list[str]) -> dict[str, float]:
        ordered = self._ordered_categories(categories)
        selected = {key: CATEGORY_WEIGHTS[key] for key in ordered}
        total_weight = sum(selected.values())
        if total_weight <= 0:
            return {}
        return {key: weight / total_weight for key, weight in selected.items()}

    def _build_limits(self, categories: list[str]) -> dict[str, float]:
        limit_by_category = {
            "pfas": CONTAMINANT_LIMITS["pfas_total_ppt"],
            "nitrate": CONTAMINANT_LIMITS["nitrate_mg_l"],
            "chromium6": CONTAMINANT_LIMITS["chromium6_ug_l"],
            "radionuclides": CONTAMINANT_LIMITS["radium_pci_l"],
            "sodiumChloride": CONTAMINANT_LIMITS["sodium_mg_l"],
            "violations": float(self._max_violation_count),
            "voc": CONTAMINANT_LIMITS["voc_ug_l"],
        }
        return {key: limit_by_category[key] for key in self._ordered_categories(categories)}

    def _build_comparisons(
        self,
        contaminants: dict[str, Any],
        *,
        categories: list[str],
        category_scores: dict[str, float],
        violation_count: float | None,
    ) -> dict[str, Any]:
        field_by_category = {
            "pfas": {"value_field": "total_pfas_ppt", "reference_field": "pfas_total_ppt"},
            "nitrate": {"value_field": "nitrate_mg_l", "reference_field": "nitrate_mg_l"},
            "chromium6": {"value_field": "chromium6_ug_l", "reference_field": "chromium6_ug_l"},
            "radionuclides": {"value_field": "radium_pci_l", "reference_field": "radium_pci_l"},
            "sodiumChloride": {"value_field": "sodium_mg_l", "reference_field": "sodium_mg_l"},
            "violations": {"value_field": None, "reference_field": None},
            "voc": {"value_field": "voc_ug_l", "reference_field": "voc_ug_l"},
        }

        comparisons: dict[str, Any] = {}
        for category in self._ordered_categories(categories):
            mapping = field_by_category.get(category, {"value_field": None, "reference_field": None})
            value_field = mapping.get("value_field")
            reference_field = mapping.get("reference_field")
            your_value = _safe_float(contaminants.get(value_field)) if value_field else violation_count
            comparisons[category] = {
                "label": DISPLAY_LABELS[category],
                "unit": UNITS.get(reference_field, "") if reference_field else "count",
                "yourValue": your_value,
                "madisonAverage": self._madison_averages.get(value_field or "violation_count"),
                "ewgGuideline": EWG_GUIDELINES.get(reference_field) if reference_field else None,
                "legalLimit": CONTAMINANT_LIMITS.get(reference_field) if reference_field else None,
                "nationalReference": NATIONAL_REFERENCE.get(reference_field) if reference_field else None,
                "categoryScore": category_scores.get(category),
                "available": True,
            }

        return comparisons

    def _score_well(self, record: WellRecord) -> ScoredWell:
        category_risks, _details = self._compute_category_risks(record)
        available_categories = self._ordered_categories(list(category_risks.keys()))

        normalized_weights = self._normalized_weights(available_categories)
        weighted_risk = 0.0
        for category in available_categories:
            weighted_risk += normalized_weights[category] * category_risks[category]

        score = round(_clamp((1.0 - weighted_risk) * 100.0, 0.0, 100.0), 1)
        risk_level = int(round(100.0 - score))
        category_scores = {
            key: round(_clamp((1.0 - value) * 100.0, 0.0, 100.0), 1)
            for key, value in category_risks.items()
        }

        worst_key, worst_risk = max(category_risks.items(), key=lambda item: item[1])
        worst_contaminant = {
            "key": worst_key,
            "label": DISPLAY_LABELS[worst_key],
            "risk": round(worst_risk, 4),
            "score": round((1.0 - worst_risk) * 100.0, 1),
        }

        limits = self._build_limits(available_categories)

        return ScoredWell(
            well_id=record.well_id,
            well_name=record.well_name,
            lat=record.lat,
            lng=record.lng,
            status=record.status,
            sample_date=record.sample_date,
            score=score,
            grade=_grade_from_score(score),
            risk_level=risk_level,
            violation_count=record.violation_count,
            contaminants=dict(record.contaminants),
            category_scores=category_scores,
            category_risks=category_risks,
            available_categories=available_categories,
            limits=limits,
            worst_contaminant=worst_contaminant,
            comparisons=self._build_comparisons(
                record.contaminants,
                categories=available_categories,
                category_scores=category_scores,
                violation_count=float(record.violation_count),
            ),
        )

    def _serving_well_ids(self, *, lat: float, lng: float) -> tuple[list[str], bool]:
        matched: list[str] = []
        for well_id, rings in self._service_area_rings.items():
            for ring in rings:
                if _point_in_ring(lat, lng, ring):
                    matched.append(well_id)
                    break

        if matched:
            matched = sorted(set(matched), key=lambda value: int(value))
            return matched, False

        nearest = self._nearest_well_id(lat=lat, lng=lng)
        return ([nearest] if nearest else []), True

    def _nearest_well_id(self, *, lat: float, lng: float) -> str:
        best_id = ""
        best_dist = float("inf")
        for well_id in self._ordered_well_ids:
            well = self._scored_wells[well_id]
            d_lat = well.lat - lat
            d_lng = well.lng - lng
            dist2 = d_lat * d_lat + d_lng * d_lng
            if dist2 < best_dist:
                best_dist = dist2
                best_id = well_id
        return best_id

    def _avg(self, wells: list[ScoredWell], key: str) -> float | None:
        values: list[float] = []
        for well in wells:
            value = _safe_float(well.contaminants.get(key))
            if value is not None:
                values.append(value)
        if not values:
            return None
        return round(sum(values) / len(values), 4)

    def _weighted_avg(self, values: list[tuple[float, float]]) -> float | None:
        if not values:
            return None
        total_weight = sum(weight for weight, _ in values)
        if total_weight <= 0:
            return None
        return sum(weight * value for weight, value in values) / total_weight

    def _aggregate_contaminants(self, wells: list[ScoredWell]) -> dict[str, Any]:
        pfas_statuses = sorted({str(well.contaminants.get("pfas_status") or "unknown") for well in wells})
        pfas_status = pfas_statuses[0] if len(pfas_statuses) == 1 else "mixed"
        return {
            "total_pfas_ppt": self._avg(wells, "total_pfas_ppt"),
            "pfoa_ppt": self._avg(wells, "pfoa_ppt"),
            "pfos_ppt": self._avg(wells, "pfos_ppt"),
            "pfhxs_ppt": self._avg(wells, "pfhxs_ppt"),
            "historical_max_pfas_ppt": self._avg(wells, "historical_max_pfas_ppt"),
            "pfas_status": pfas_status,
            "nitrate_mg_l": self._avg(wells, "nitrate_mg_l"),
            "chromium6_ug_l": self._avg(wells, "chromium6_ug_l"),
            "sodium_mg_l": self._avg(wells, "sodium_mg_l"),
            "chloride_mg_l": self._avg(wells, "chloride_mg_l"),
            "radium_pci_l": self._avg(wells, "radium_pci_l"),
            "voc_ug_l": self._avg(wells, "voc_ug_l"),
        }

    def _aggregate_contaminants_weighted(self, well_ids: list[str], weights: dict[str, float]) -> dict[str, Any]:
        wells = [self._scored_wells[well_id] for well_id in well_ids]
        pfas_statuses = sorted({str(well.contaminants.get("pfas_status") or "unknown") for well in wells})
        pfas_status = pfas_statuses[0] if len(pfas_statuses) == 1 else "mixed"

        def weighted_field(field: str) -> float | None:
            pairs: list[tuple[float, float]] = []
            for well_id in well_ids:
                value = _safe_float(self._scored_wells[well_id].contaminants.get(field))
                if value is None:
                    continue
                pairs.append((weights[well_id], value))
            avg = self._weighted_avg(pairs)
            return round(avg, 4) if avg is not None else None

        return {
            "total_pfas_ppt": weighted_field("total_pfas_ppt"),
            "pfoa_ppt": weighted_field("pfoa_ppt"),
            "pfos_ppt": weighted_field("pfos_ppt"),
            "pfhxs_ppt": weighted_field("pfhxs_ppt"),
            "historical_max_pfas_ppt": weighted_field("historical_max_pfas_ppt"),
            "pfas_status": pfas_status,
            "nitrate_mg_l": weighted_field("nitrate_mg_l"),
            "chromium6_ug_l": weighted_field("chromium6_ug_l"),
            "sodium_mg_l": weighted_field("sodium_mg_l"),
            "chloride_mg_l": weighted_field("chloride_mg_l"),
            "radium_pci_l": weighted_field("radium_pci_l"),
            "voc_ug_l": weighted_field("voc_ug_l"),
        }

    def _normalized_mix_weights(self, well_ids: list[str], well_weights: dict[str, Any] | None) -> dict[str, float]:
        raw: dict[str, float] = {}
        for well_id in well_ids:
            weight_value = _safe_float((well_weights or {}).get(well_id))
            raw[well_id] = weight_value if weight_value is not None and weight_value > 0 else 1.0
        total = sum(raw.values())
        if total <= 0:
            equal = 1.0 / float(len(well_ids))
            return {well_id: equal for well_id in well_ids}
        return {well_id: raw[well_id] / total for well_id in well_ids}

    def score_location(self, *, lat: float, lng: float) -> dict[str, Any]:
        well_ids, out_of_zone = self._serving_well_ids(lat=lat, lng=lng)
        if not well_ids:
            raise RuntimeError("No wells available for scoring.")

        wells = [self._scored_wells[well_id] for well_id in well_ids if well_id in self._scored_wells]
        if not wells:
            raise RuntimeError("Matched wells missing score records.")

        score = round(sum(well.score for well in wells) / len(wells), 1)
        grade = _grade_from_score(score)
        latest_date = max((well.sample_date for well in wells if well.sample_date), default="")
        category_scores = {
            key: round(
                sum(well.category_scores[key] for well in wells if key in well.category_scores)
                / len([well for well in wells if key in well.category_scores]),
                1,
            )
            for key in CATEGORY_WEIGHTS.keys()
            if any(key in well.category_scores for well in wells)
        }
        category_risks = {
            key: round(
                sum(well.category_risks[key] for well in wells if key in well.category_risks)
                / len([well for well in wells if key in well.category_risks]),
                6,
            )
            for key in CATEGORY_WEIGHTS.keys()
            if any(key in well.category_risks for well in wells)
        }
        available_categories = self._ordered_categories(list(category_scores.keys()))
        worst_key = max(category_risks.items(), key=lambda item: item[1])[0]

        contaminants = self._aggregate_contaminants(wells)
        comparisons = self._build_comparisons(
            contaminants,
            categories=available_categories,
            category_scores=category_scores,
            violation_count=round(sum(well.violation_count for well in wells) / len(wells), 4),
        )

        return {
            "score": score,
            "grade": grade,
            "wellIds": well_ids,
            "zoneId": well_ids[0] if len(well_ids) == 1 else f"multi:{'-'.join(well_ids)}",
            "breakdown": category_scores,
            "limits": self._build_limits(available_categories),
            "lastUpdated": latest_date or datetime.utcnow().date().isoformat(),
            "outOfZone": out_of_zone,
            "availableCategories": available_categories,
            "categoryScores": category_scores,
            "contaminants": contaminants,
            "worstContaminant": {
                "key": worst_key,
                "label": DISPLAY_LABELS[worst_key],
                "score": category_scores[worst_key],
                "risk": round(category_risks[worst_key], 4),
            },
            "comparisons": comparisons,
        }

    def score_well_mix(
        self,
        *,
        well_ids: list[str],
        well_weights: dict[str, Any] | None = None,
        out_of_zone: bool = False,
        zone_id: str | None = None,
    ) -> dict[str, Any]:
        canonical_ids: list[str] = []
        for raw_id in well_ids:
            well_id = _canonical_well_id(raw_id)
            if not well_id or well_id not in self._scored_wells or well_id in canonical_ids:
                continue
            canonical_ids.append(well_id)

        if not canonical_ids:
            raise RuntimeError("No valid well IDs provided for scoring.")

        mix_weights = self._normalized_mix_weights(canonical_ids, well_weights)
        wells = [self._scored_wells[well_id] for well_id in canonical_ids]

        score_value = self._weighted_avg([(mix_weights[well.well_id], well.score) for well in wells])
        score = round(score_value if score_value is not None else 0.0, 1)
        grade = _grade_from_score(score)
        latest_date = max((well.sample_date for well in wells if well.sample_date), default="")

        category_scores: dict[str, float] = {}
        category_risks: dict[str, float] = {}
        for key in CATEGORY_WEIGHTS.keys():
            score_pairs: list[tuple[float, float]] = []
            risk_pairs: list[tuple[float, float]] = []
            for well in wells:
                if key in well.category_scores:
                    score_pairs.append((mix_weights[well.well_id], well.category_scores[key]))
                if key in well.category_risks:
                    risk_pairs.append((mix_weights[well.well_id], well.category_risks[key]))

            score_avg = self._weighted_avg(score_pairs)
            risk_avg = self._weighted_avg(risk_pairs)
            if score_avg is not None:
                category_scores[key] = round(score_avg, 1)
            if risk_avg is not None:
                category_risks[key] = round(risk_avg, 6)

        available_categories = self._ordered_categories(list(category_scores.keys()))
        worst_key = max(category_risks.items(), key=lambda item: item[1])[0]

        contaminants = self._aggregate_contaminants_weighted(canonical_ids, mix_weights)
        violation_avg = self._weighted_avg([(mix_weights[well.well_id], float(well.violation_count)) for well in wells])
        comparisons = self._build_comparisons(
            contaminants,
            categories=available_categories,
            category_scores=category_scores,
            violation_count=round(violation_avg, 4) if violation_avg is not None else None,
        )

        return {
            "score": score,
            "grade": grade,
            "wellIds": canonical_ids,
            "zoneId": zone_id or (canonical_ids[0] if len(canonical_ids) == 1 else f"mix:{'-'.join(canonical_ids)}"),
            "breakdown": category_scores,
            "limits": self._build_limits(available_categories),
            "lastUpdated": latest_date or datetime.utcnow().date().isoformat(),
            "outOfZone": out_of_zone,
            "availableCategories": available_categories,
            "categoryScores": category_scores,
            "contaminants": contaminants,
            "worstContaminant": {
                "key": worst_key,
                "label": DISPLAY_LABELS[worst_key],
                "score": category_scores[worst_key],
                "risk": round(category_risks[worst_key], 4),
            },
            "comparisons": comparisons,
        }

    def list_wells(self) -> dict[str, list[dict[str, Any]]]:
        payload: list[dict[str, Any]] = []
        for well_id in self._ordered_well_ids:
            well = self._scored_wells[well_id]
            payload.append(
                {
                    "id": well.well_id,
                    "name": well.well_name,
                    "lat": round(well.lat, 6),
                    "lng": round(well.lng, 6),
                    "score": well.score,
                    "grade": well.grade,
                    "riskLevel": well.risk_level,
                    "status": well.status,
                    "latestTestDate": well.sample_date,
                    "violationCount": well.violation_count,
                    "contaminants": well.contaminants,
                    "quality": self._well_records[well_id].quality,
                    "availableCategories": well.available_categories,
                    "categoryScores": well.category_scores,
                    "worstContaminant": well.worst_contaminant,
                    "comparisons": well.comparisons,
                }
            )
        return {"wells": payload}
