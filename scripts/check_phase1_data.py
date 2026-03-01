#!/usr/bin/env python3
"""Run rigorous Phase 1 data contract checks."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


def fail(msg: str, errors: list[str]) -> None:
    errors.append(msg)


def validate_columns(df: pd.DataFrame, required: list[str], file_name: str, errors: list[str]) -> None:
    missing = [col for col in required if col not in df.columns]
    if missing:
        fail(f"{file_name}: missing columns {missing}", errors)


def validate_dates(df: pd.DataFrame, columns: list[str], file_name: str, errors: list[str]) -> None:
    for col in columns:
        if col not in df.columns:
            continue
        raw = df[col].astype(str).fillna("").str.strip()
        # Treat empty/end-marker values as nullable dates for open/unaddressed periods.
        nullable_markers = {"", "nan", "NaN", "--->", "N/A", "NA"}
        candidate = raw[~raw.isin(nullable_markers)]
        parsed = pd.to_datetime(candidate, errors="coerce")
        invalid = int(parsed.isna().sum())
        if invalid > 0:
            fail(f"{file_name}: column '{col}' has {invalid} unparseable date values", errors)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    data_dir = repo_root / "data"

    required_csvs = {
        "madison_violations.csv": ["PWSID", "VIOLATION_ID", "VIOLATION_STATUS", "NON_COMPL_PER_BEGIN_DATE"],
        "madison_lead_samples.csv": ["PWSID", "SAMPLING_END_DATE", "SAMPLE_MEASURE", "UNIT_OF_MEASURE"],
        "madison_facilities.csv": ["PWSID", "FACILITY_ID", "FACILITY_NAME", "FACILITY_TYPE_CODE"],
        "madison_water_systems.csv": ["PWSID", "PWS_NAME", "POPULATION_SERVED_COUNT"],
        "madison_ref_codes.csv": ["VALUE_TYPE", "VALUE_CODE", "VALUE_DESCRIPTION"],
        "pfas_well_latest.csv": [
            "well_id",
            "sample_date",
            "pfoa_ppt",
            "pfos_ppt",
            "pfhxs_ppt",
            "total_pfas_ppt",
            "source_url",
        ],
        "well_coordinates.csv": ["well_id", "well_name", "lat", "lng", "status"],
        "dane_building_age.csv": ["parcel_id", "year_built", "lat", "lng"],
    }

    required_geojson = data_dir / "well_service_areas.geojson"
    errors: list[str] = []
    summary: list[str] = []

    for file_name, columns in required_csvs.items():
        path = data_dir / file_name
        if not path.exists():
            fail(f"Missing required file: {path}", errors)
            continue
        try:
            df = pd.read_csv(path)
        except Exception as exc:
            fail(f"{file_name}: failed to read CSV ({exc})", errors)
            continue

        validate_columns(df, columns, file_name, errors)
        summary.append(f"{file_name}: {len(df)} rows")

        if file_name == "madison_water_systems.csv":
            if "PWSID" in df.columns and not (df["PWSID"].astype(str) == "WI1130224").any():
                fail("madison_water_systems.csv: canonical PWSID WI1130224 not found", errors)

        if file_name == "madison_violations.csv":
            validate_dates(df, ["NON_COMPL_PER_BEGIN_DATE", "NON_COMPL_PER_END_DATE"], file_name, errors)

        if file_name == "madison_lead_samples.csv":
            validate_dates(df, ["SAMPLING_START_DATE", "SAMPLING_END_DATE"], file_name, errors)

        if file_name == "pfas_well_latest.csv":
            validate_dates(df, ["sample_date"], file_name, errors)
            for col in ["pfoa_ppt", "pfos_ppt", "pfhxs_ppt", "total_pfas_ppt"]:
                if col in df.columns and (pd.to_numeric(df[col], errors="coerce") < 0).any():
                    fail(f"{file_name}: negative values found in {col}", errors)

        if file_name in ("well_coordinates.csv", "dane_building_age.csv"):
            if {"lat", "lng"}.issubset(df.columns):
                lat = pd.to_numeric(df["lat"], errors="coerce")
                lng = pd.to_numeric(df["lng"], errors="coerce")
                if lat.isna().any() or lng.isna().any():
                    fail(f"{file_name}: non-numeric lat/lng values found", errors)
                if ((lat < -90) | (lat > 90)).any():
                    fail(f"{file_name}: latitude out of range", errors)
                if ((lng < -180) | (lng > 180)).any():
                    fail(f"{file_name}: longitude out of range", errors)

    if not required_geojson.exists():
        fail(f"Missing required file: {required_geojson}", errors)
    else:
        try:
            geo = json.loads(required_geojson.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"well_service_areas.geojson: invalid JSON ({exc})", errors)
            geo = None

        if geo is not None:
            features = geo.get("features")
            if not isinstance(features, list) or len(features) == 0:
                fail("well_service_areas.geojson: features array missing or empty", errors)
            else:
                missing_well_id = 0
                invalid_geometry = 0
                for feature in features:
                    props = feature.get("properties") or {}
                    geom = feature.get("geometry") or {}
                    if "well_id" not in props:
                        missing_well_id += 1
                    gtype = geom.get("type")
                    if gtype not in ("Polygon", "MultiPolygon"):
                        invalid_geometry += 1
                if missing_well_id:
                    fail(f"well_service_areas.geojson: {missing_well_id} features missing well_id", errors)
                if invalid_geometry:
                    fail(f"well_service_areas.geojson: {invalid_geometry} invalid geometry types", errors)
                summary.append(f"well_service_areas.geojson: {len(features)} features")

    print("Phase 1 data check summary:")
    for line in summary:
        print(f"- {line}")

    if errors:
        print("\nPhase 1 data checks FAILED:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("\nPhase 1 data checks PASSED.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
