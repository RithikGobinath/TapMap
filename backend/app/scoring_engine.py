from __future__ import annotations

import csv
import json
import math
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import median
from typing import Any


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
    as_int = _safe_int(text)
    if as_int is not None:
        return str(as_int)
    return text


def _parse_date(value: Any) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    return None


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
            denom = (yj - yi)
            if abs(denom) < 1e-12:
                j = i
                continue
            x_cross = (xj - xi) * (y - yi) / denom + xi
            if x < x_cross:
                inside = not inside
        j = i
    return inside


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


@dataclass(frozen=True)
class WellScore:
    well_id: str
    well_name: str
    lat: float
    lng: float
    status: str
    sample_date: str
    score: float
    grade: str
    risk_level: int
    breakdown: dict[str, float | int]
    limits: dict[str, float]
    violation_count: int


class WaterScoreEngine:
    """Phase 2 scoring engine backed by local Phase 1 datasets."""

    PFAS_LIMIT_PPT = 9.0
    NITRATE_LIMIT_MG_L = 10.0
    LEAD_LIMIT_PPB = 15.0
    VOC_LIMIT_UG_L = 5.0

    def __init__(self, data_dir: Path | None = None) -> None:
        repo_root = Path(__file__).resolve().parents[2]
        self._data_dir = data_dir or (repo_root / "data")
        self._lead_baseline_ppb = 1.8
        self._violation_counts: dict[str, int] = {}
        self._max_violation_count = 1
        self._building_rows: list[tuple[float, float, int]] = []
        self._service_area_rings: dict[str, list[list[list[float]]]] = {}
        self._well_scores: dict[str, WellScore] = {}
        self._ordered_well_ids: list[str] = []
        self._load()

    def _load(self) -> None:
        self._load_lead_baseline()
        self._load_violations()
        self._load_building_ages()
        self._load_service_areas()
        self._load_well_scores()

    def _csv_rows(self, file_name: str) -> list[dict[str, str]]:
        path = self._data_dir / file_name
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            return list(csv.DictReader(handle))

    def _load_lead_baseline(self) -> None:
        latest_date: datetime | None = None
        latest_measure_mg_l: float | None = None
        for row in self._csv_rows("madison_lead_samples.csv"):
            sample_measure = _safe_float(row.get("SAMPLE_MEASURE"))
            if sample_measure is None:
                continue
            end_date = _parse_date(row.get("SAMPLING_END_DATE"))
            if end_date is None:
                continue
            if latest_date is None or end_date > latest_date:
                latest_date = end_date
                latest_measure_mg_l = sample_measure
        if latest_measure_mg_l is not None:
            self._lead_baseline_ppb = latest_measure_mg_l * 1000.0

    def _load_violations(self) -> None:
        counts: dict[str, int] = {}
        for row in self._csv_rows("madison_violations.csv"):
            well_id = _canonical_well_id(row.get("FACILITY_ID", ""))
            if not well_id:
                continue
            counts[well_id] = counts.get(well_id, 0) + 1
        self._violation_counts = counts
        if counts:
            self._max_violation_count = max(counts.values())

    def _load_building_ages(self) -> None:
        rows: list[tuple[float, float, int]] = []
        for row in self._csv_rows("dane_building_age.csv"):
            lat = _safe_float(row.get("lat"))
            lng = _safe_float(row.get("lng"))
            year_built = _safe_int(row.get("year_built"))
            if lat is None or lng is None or year_built is None:
                continue
            rows.append((lat, lng, year_built))
        self._building_rows = rows

    def _load_service_areas(self) -> None:
        path = self._data_dir / "well_service_areas.geojson"
        geojson = json.loads(path.read_text(encoding="utf-8"))
        rings_by_well: dict[str, list[list[list[float]]]] = {}
        for feature in geojson.get("features", []):
            properties = feature.get("properties") or {}
            well_id = _canonical_well_id(properties.get("well_id", ""))
            if not well_id:
                continue
            geometry = feature.get("geometry") or {}
            rings = _extract_rings(geometry)
            if not rings:
                continue
            rings_by_well.setdefault(well_id, []).extend(rings)
        self._service_area_rings = rings_by_well

    def _load_well_scores(self) -> None:
        pfas_by_well: dict[str, dict[str, Any]] = {}
        for row in self._csv_rows("pfas_well_latest.csv"):
            well_id = _canonical_well_id(row.get("well_id", ""))
            if not well_id:
                continue
            pfas_by_well[well_id] = {
                "sample_date": str(row.get("sample_date", "")).strip(),
                "total_pfas_ppt": _safe_float(row.get("total_pfas_ppt")),
            }

        scores: dict[str, WellScore] = {}
        for row in self._csv_rows("well_coordinates.csv"):
            well_id = _canonical_well_id(row.get("well_id", ""))
            if not well_id:
                continue
            lat = _safe_float(row.get("lat"))
            lng = _safe_float(row.get("lng"))
            if lat is None or lng is None:
                continue

            pfas_info = pfas_by_well.get(well_id, {})
            pfas_total = pfas_info.get("total_pfas_ppt")
            sample_date = str(pfas_info.get("sample_date", "")).strip()
            violation_count = self._violation_counts.get(well_id, 0)

            metrics = self._compute_metrics(
                well_id=well_id,
                well_name=str(row.get("well_name", f"Well {well_id}")).strip() or f"Well {well_id}",
                lat=lat,
                lng=lng,
                status=str(row.get("status", "active")).strip() or "active",
                sample_date=sample_date,
                pfas_total=pfas_total,
                violation_count=violation_count,
            )
            scores[well_id] = metrics

        self._well_scores = scores
        self._ordered_well_ids = sorted(scores.keys(), key=lambda value: int(value))

    def _nearest_building_median_year(self, lat: float, lng: float) -> float:
        if not self._building_rows:
            return 1980.0

        radius_squared = 0.02 * 0.02
        years_in_radius: list[int] = []
        distances: list[tuple[float, int]] = []

        for b_lat, b_lng, year in self._building_rows:
            d_lat = b_lat - lat
            d_lng = b_lng - lng
            dist2 = d_lat * d_lat + d_lng * d_lng
            distances.append((dist2, year))
            if dist2 <= radius_squared:
                years_in_radius.append(year)

        sample_years: list[int]
        if len(years_in_radius) >= 50:
            sample_years = years_in_radius
        else:
            distances.sort(key=lambda item: item[0])
            sample_years = [year for _, year in distances[:300]]

        if not sample_years:
            return 1980.0
        return float(median(sample_years))

    def _compute_metrics(
        self,
        *,
        well_id: str,
        well_name: str,
        lat: float,
        lng: float,
        status: str,
        sample_date: str,
        pfas_total: float | None,
        violation_count: int,
    ) -> WellScore:
        missing_pfas = pfas_total is None
        pfas_raw = pfas_total if pfas_total is not None else self.PFAS_LIMIT_PPT * 1.3

        violation_pressure = violation_count / float(self._max_violation_count or 1)
        median_year = self._nearest_building_median_year(lat, lng)
        infrastructure_age_risk = _clamp((1980.0 - median_year) / 80.0, 0.0, 1.0)

        nitrate_mg_l = 0.6 + 9.4 * violation_pressure
        lead_ppb = self._lead_baseline_ppb * (1.0 + 2.0 * infrastructure_age_risk + 1.5 * violation_pressure)
        voc_ug_l = 0.2 + 4.8 * violation_pressure

        pfas_risk = _sigmoid(4.0 * ((pfas_raw / self.PFAS_LIMIT_PPT) - 1.0))
        if missing_pfas:
            pfas_risk = _clamp(pfas_risk + 0.15, 0.0, 1.0)

        nitrate_risk = _sigmoid(3.5 * ((nitrate_mg_l / self.NITRATE_LIMIT_MG_L) - 1.0))
        lead_risk = _sigmoid(3.5 * ((lead_ppb / self.LEAD_LIMIT_PPB) - 1.0))
        voc_risk = _sigmoid(3.5 * ((voc_ug_l / self.VOC_LIMIT_UG_L) - 1.0))
        violations_risk = _sigmoid(4.0 * ((violation_pressure * 2.0) - 1.0))
        infrastructure_risk = _sigmoid(5.0 * (infrastructure_age_risk - 0.5))

        total_risk = (
            0.40 * pfas_risk
            + 0.15 * nitrate_risk
            + 0.15 * lead_risk
            + 0.10 * voc_risk
            + 0.10 * violations_risk
            + 0.10 * infrastructure_risk
        )
        score = round(_clamp((1.0 - total_risk) * 100.0, 0.0, 100.0), 1)
        risk_level = int(round(100.0 - score))

        breakdown = {
            "pfas": round(float(pfas_raw), 3),
            "nitrate": round(float(nitrate_mg_l), 3),
            "lead": round(float(lead_ppb), 3),
            "voc": round(float(voc_ug_l), 3),
            "violations": int(violation_count),
            "infrastructure": round(float(infrastructure_age_risk * 10.0), 2),
        }
        limits = {
            "pfas": self.PFAS_LIMIT_PPT,
            "nitrate": self.NITRATE_LIMIT_MG_L,
            "lead": self.LEAD_LIMIT_PPB,
            "voc": self.VOC_LIMIT_UG_L,
        }

        return WellScore(
            well_id=well_id,
            well_name=well_name,
            lat=lat,
            lng=lng,
            status=status,
            sample_date=sample_date,
            score=score,
            grade=_grade_from_score(score),
            risk_level=risk_level,
            breakdown=breakdown,
            limits=limits,
            violation_count=violation_count,
        )

    def _serving_well_ids(self, lat: float, lng: float) -> tuple[list[str], bool]:
        matched: list[str] = []
        for well_id, rings in self._service_area_rings.items():
            for ring in rings:
                if _point_in_ring(lat, lng, ring):
                    matched.append(well_id)
                    break
        if matched:
            matched = sorted(set(matched), key=lambda value: int(value))
            return matched, False

        nearest_id = self._nearest_well_id(lat, lng)
        return ([nearest_id] if nearest_id else []), True

    def _nearest_well_id(self, lat: float, lng: float) -> str:
        best_id = ""
        best_dist = float("inf")
        for well_id in self._ordered_well_ids:
            well = self._well_scores[well_id]
            d_lat = well.lat - lat
            d_lng = well.lng - lng
            dist2 = d_lat * d_lat + d_lng * d_lng
            if dist2 < best_dist:
                best_dist = dist2
                best_id = well_id
        return best_id

    def score_location(self, *, lat: float, lng: float) -> dict[str, Any]:
        well_ids, out_of_zone = self._serving_well_ids(lat, lng)
        if not well_ids:
            raise RuntimeError("No wells available for scoring.")

        wells = [self._well_scores[well_id] for well_id in well_ids if well_id in self._well_scores]
        if not wells:
            raise RuntimeError("Matched wells missing score records.")

        avg_score = round(sum(well.score for well in wells) / len(wells), 1)
        latest_date = max((well.sample_date for well in wells if well.sample_date), default="")
        breakdown = {
            "pfas": round(sum(float(well.breakdown["pfas"]) for well in wells) / len(wells), 3),
            "nitrate": round(sum(float(well.breakdown["nitrate"]) for well in wells) / len(wells), 3),
            "lead": round(sum(float(well.breakdown["lead"]) for well in wells) / len(wells), 3),
            "voc": round(sum(float(well.breakdown["voc"]) for well in wells) / len(wells), 3),
            "violations": int(round(sum(int(well.breakdown["violations"]) for well in wells) / len(wells))),
            "infrastructure": round(
                sum(float(well.breakdown["infrastructure"]) for well in wells) / len(wells),
                2,
            ),
        }
        zone_id = well_ids[0] if len(well_ids) == 1 else f"multi:{'-'.join(well_ids)}"
        return {
            "score": avg_score,
            "grade": _grade_from_score(avg_score),
            "wellIds": well_ids,
            "zoneId": zone_id,
            "breakdown": breakdown,
            "limits": wells[0].limits,
            "lastUpdated": latest_date or datetime.utcnow().date().isoformat(),
            "outOfZone": out_of_zone,
        }

    def list_wells(self) -> dict[str, list[dict[str, Any]]]:
        wells_payload: list[dict[str, Any]] = []
        for well_id in self._ordered_well_ids:
            well = self._well_scores[well_id]
            wells_payload.append(
                {
                    "id": well.well_id,
                    "name": well.well_name,
                    "lat": round(well.lat, 6),
                    "lng": round(well.lng, 6),
                    "riskLevel": well.risk_level,
                    "score": well.score,
                    "grade": well.grade,
                    "latestTestDate": well.sample_date,
                    "status": well.status,
                    "violationCount": well.violation_count,
                    "contaminants": {
                        "pfas": well.breakdown["pfas"],
                        "nitrate": well.breakdown["nitrate"],
                        "lead": well.breakdown["lead"],
                        "voc": well.breakdown["voc"],
                    },
                }
            )
        return {"wells": wells_payload}

