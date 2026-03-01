#!/usr/bin/env python3
"""Generate Phase 1 data outputs from Madison public sources."""

from __future__ import annotations

import csv
import io
import json
import math
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

import pandas as pd
from bs4 import BeautifulSoup
from pypdf import PdfReader


USER_AGENT = "TapMapPhase1/1.0"
BASE_CITY = "https://www.cityofmadison.com"
WELLHEAD_PAGE = "https://www.cityofmadison.com/es/node/20552"
PARCEL_QUERY_URL = (
    "https://maps.cityofmadison.com/arcgis/rest/services/Public/Property_Lookup/MapServer/9/query"
)


@dataclass
class WellRow:
    well_id: str
    well_name: str
    area_served: str
    report_url: str
    map_url: str


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def fetch_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def abs_city_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return urllib.parse.urljoin(BASE_CITY, url)


def parse_well_table() -> list[WellRow]:
    html = fetch_text(WELLHEAD_PAGE)
    soup = BeautifulSoup(html, "html.parser")
    rows: list[WellRow] = []

    for tr in soup.select("table tbody tr"):
        tds = tr.find_all("td")
        if len(tds) < 3:
            continue

        first_col_text = " ".join(tds[0].stripped_strings)
        m = re.search(r"Well\s+(\d+)", first_col_text, flags=re.IGNORECASE)
        if not m:
            continue

        well_num = int(m.group(1))
        well_id = str(well_num)
        well_name = f"Well {well_num}"
        area_served = " ".join(tds[1].stripped_strings).strip()
        report_link = tds[0].find("a")
        map_link = tds[2].find("a")
        if not report_link or not map_link:
            continue

        rows.append(
            WellRow(
                well_id=well_id,
                well_name=well_name,
                area_served=area_served,
                report_url=abs_city_url(report_link["href"]),
                map_url=abs_city_url(map_link["href"]),
            )
        )

    return rows


def _extract_pdf_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    return text


def _parse_updated_date(text: str) -> str:
    m = re.search(r"Updated:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})", text)
    if not m:
        return ""
    try:
        dt = datetime.strptime(m.group(1), "%B %d, %Y")
        return dt.strftime("%Y-%m-%d")
    except ValueError:
        return ""


def _parse_total_pfas(text: str) -> float | None:
    # Examples: "estimated total PFAS level is 7.3 ng/L"
    m = re.search(
        r"total\s+PFAS\s+level\s+is\s+([0-9]+(?:\.[0-9]+)?)",
        text,
        flags=re.IGNORECASE,
    )
    if m:
        return float(m.group(1))
    if re.search(r"\bno\s+PFAS\b", text, flags=re.IGNORECASE):
        return 0.0
    return None


def _parse_detected_analytes(text: str) -> list[str]:
    # Typical phrase: "One PFAS [PFHxS] was found ..."
    m = re.search(r"PFAS\s*\[([^\]]+)\]", text, flags=re.IGNORECASE)
    if not m:
        return []
    raw = m.group(1)
    parts = re.split(r",| and ", raw)
    out = []
    for p in parts:
        token = p.strip().upper()
        if token:
            out.append(token)
    return out


def build_pfas_rows(wells: list[WellRow]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    for w in wells:
        pdf = fetch_bytes(w.report_url)
        text = _extract_pdf_text(pdf)
        sample_date = _parse_updated_date(text)
        total_pfas = _parse_total_pfas(text)
        analytes = _parse_detected_analytes(text)

        pfoa = None
        pfos = None
        pfhxs = None

        # If exactly one analyte is named and total exists, assign total to that analyte.
        if total_pfas is not None and len(analytes) == 1:
            a = analytes[0]
            if a == "PFOA":
                pfoa = total_pfas
            elif a == "PFOS":
                pfos = total_pfas
            elif a in {"PFHXS", "PFHXS"}:
                pfhxs = total_pfas

        rows.append(
            {
                "well_id": w.well_id,
                "sample_date": sample_date,
                "pfoa_ppt": pfoa,
                "pfos_ppt": pfos,
                "pfhxs_ppt": pfhxs,
                "total_pfas_ppt": total_pfas,
                "source_url": w.report_url,
            }
        )

    return rows


def _extract_well_label_xy(map_pdf_bytes: bytes, well_id: str) -> tuple[float, float]:
    reader = PdfReader(io.BytesIO(map_pdf_bytes))
    page = reader.pages[0]
    vp_list = page.get("/VP")
    if not vp_list:
        raise ValueError("Map PDF missing /VP geospatial viewport.")
    main_vp = vp_list[0]
    bbox = [float(v) for v in main_vp["/BBox"]]
    x_min = min(bbox[0], bbox[2])
    x_max = max(bbox[0], bbox[2])
    y_min = min(bbox[1], bbox[3])
    y_max = max(bbox[1], bbox[3])

    items: list[tuple[str, float, float]] = []

    def visitor_text(text: str, cm, tm, font_dict, font_size) -> None:
        t = (text or "").strip()
        if t:
            items.append((t, float(tm[4]), float(tm[5])))

    page.extract_text(visitor_text=visitor_text)

    # 1) Exact match first
    target = f"Unit Well {well_id}"
    for t, x, y in items:
        if t == target and x_min <= x <= x_max and y_min <= y <= y_max:
            return x, y

    # 2) Pattern match for "Well {id}" in map viewport (exclude legend/overview text)
    pat = re.compile(rf"\bWell\s*#?\s*{re.escape(str(int(well_id)))}\b", flags=re.IGNORECASE)
    candidates = []
    for t, x, y in items:
        if pat.search(t) and x_min <= x <= x_max and y_min <= y <= y_max:
            candidates.append((x, y))
    if candidates:
        return candidates[0]

    # 3) Last-resort: find isolated well id token near "Unit Well" text in viewport
    unit_tokens = [(x, y) for t, x, y in items if "Unit Well" in t and x_min <= x <= x_max and y_min <= y <= y_max]
    id_tokens = [(x, y) for t, x, y in items if t.strip() == str(int(well_id)) and x_min <= x <= x_max and y_min <= y <= y_max]
    if unit_tokens and id_tokens:
        ux, uy = unit_tokens[0]
        nearest = min(id_tokens, key=lambda p: abs(p[0] - ux) + abs(p[1] - uy))
        return nearest

    raise ValueError(f"Could not locate map label for well {well_id}.")


def _geo_from_pdf_xy(map_pdf_bytes: bytes, x: float, y: float) -> tuple[float, float]:
    reader = PdfReader(io.BytesIO(map_pdf_bytes))
    page = reader.pages[0]

    vp_list = page.get("/VP")
    if not vp_list:
        raise ValueError("Map PDF missing /VP geospatial viewport.")

    # Use first viewport (main map area)
    vp = vp_list[0]
    bbox = [float(v) for v in vp["/BBox"]]
    measure = vp["/Measure"].get_object()
    gpts = [float(v) for v in measure["/GPTS"]]

    # GPTS order with LPTS in these files:
    # (0,1)->(lat1,lon1), (0,0)->(lat2,lon2), (1,0)->(lat3,lon3), (1,1)->(lat4,lon4)
    lat1, lon1, lat2, lon2, lat3, lon3, lat4, lon4 = gpts

    x_min = min(bbox[0], bbox[2])
    x_max = max(bbox[0], bbox[2])
    y_min = min(bbox[1], bbox[3])
    y_max = max(bbox[1], bbox[3])

    if x_max == x_min or y_max == y_min:
        raise ValueError("Invalid viewport bounds for geospatial transform.")

    u = (x - x_min) / (x_max - x_min)
    # LPTS y=0 corresponds to top in these map exports
    v = (y_max - y) / (y_max - y_min)

    lat_top = (lat2 + lat3) / 2.0
    lat_bottom = (lat1 + lat4) / 2.0
    lon_left = (lon1 + lon2) / 2.0
    lon_right = (lon3 + lon4) / 2.0

    lat = lat_top + (lat_bottom - lat_top) * v
    lon = lon_left + (lon_right - lon_left) * u
    return lat, lon


def _circle_polygon(lon: float, lat: float, radius_ft: float = 1200.0, points: int = 72) -> list[list[float]]:
    radius_m = radius_ft * 0.3048
    dlat = radius_m / 111_320.0
    dlon = dlat / max(math.cos(math.radians(lat)), 0.1)

    ring: list[list[float]] = []
    for i in range(points):
        theta = 2 * math.pi * (i / points)
        px = lon + dlon * math.cos(theta)
        py = lat + dlat * math.sin(theta)
        ring.append([px, py])
    ring.append(ring[0])
    return ring


def build_well_coords_and_service_areas(wells: list[WellRow], facilities_df: pd.DataFrame) -> tuple[list[dict[str, object]], dict]:
    facility_status = {}
    for _, row in facilities_df.iterrows():
        fid = str(row.get("FACILITY_ID", "")).strip()
        code = str(row.get("FACILITY_ACTIVITY_CODE", "")).strip().upper()
        if not fid:
            continue
        facility_status[fid] = "active" if code == "A" else "inactive"

    coords_rows: list[dict[str, object]] = []
    features: list[dict] = []

    for w in wells:
        map_pdf = fetch_bytes(w.map_url)
        x, y = _extract_well_label_xy(map_pdf, w.well_id)
        lat, lon = _geo_from_pdf_xy(map_pdf, x, y)
        status = facility_status.get(w.well_id, "active")

        coords_rows.append(
            {
                "well_id": w.well_id,
                "well_name": w.well_name,
                "lat": round(lat, 7),
                "lng": round(lon, 7),
                "status": status,
            }
        )

        ring = _circle_polygon(lon=lon, lat=lat, radius_ft=1200.0)
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "well_id": w.well_id,
                    "well_name": w.well_name,
                    "area_served_label": w.area_served,
                    "source_map_url": w.map_url,
                    "geometry_basis": "1200-foot radius circle around GeoPDF well label",
                },
                "geometry": {"type": "Polygon", "coordinates": [ring]},
            }
        )

    geojson = {"type": "FeatureCollection", "features": features}
    return coords_rows, geojson


def build_dane_building_age(max_rows: int = 10000) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    offset = 0
    page_size = 1000

    while len(rows) < max_rows:
        params = {
            "f": "json",
            "where": "YearBuilt IS NOT NULL AND YearBuilt > 0",
            "outFields": "Parcel,YearBuilt",
            "returnGeometry": "true",
            "outSR": "4326",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
        }
        url = PARCEL_QUERY_URL + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        features = data.get("features", [])
        if not features:
            break

        for feat in features:
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})
            rings = geom.get("rings") or []
            if not rings:
                continue
            # Approximate centroid using first ring mean
            pts = rings[0]
            if not pts:
                continue
            lon = sum(p[0] for p in pts) / len(pts)
            lat = sum(p[1] for p in pts) / len(pts)

            parcel = str(attrs.get("Parcel", "")).strip()
            year_built = attrs.get("YearBuilt")
            if not parcel or year_built in (None, ""):
                continue

            rows.append(
                {
                    "parcel_id": parcel,
                    "year_built": int(float(year_built)),
                    "lat": round(float(lat), 7),
                    "lng": round(float(lon), 7),
                }
            )
            if len(rows) >= max_rows:
                break

        exceeded = bool(data.get("exceededTransferLimit"))
        if not exceeded:
            break
        offset += page_size

    return rows


def normalize_violations_dates(data_dir: Path) -> None:
    path = data_dir / "madison_violations.csv"
    df = pd.read_csv(path, dtype=str)
    if "NON_COMPL_PER_END_DATE" in df.columns:
        df["NON_COMPL_PER_END_DATE"] = (
            df["NON_COMPL_PER_END_DATE"].fillna("").str.strip().replace({"--->": ""})
        )
    df.to_csv(path, index=False, quoting=csv.QUOTE_MINIMAL)


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    data_dir = repo_root / "data"

    facilities_path = data_dir / "madison_facilities.csv"
    if not facilities_path.exists():
        raise SystemExit(f"Missing required file: {facilities_path}")

    facilities_df = pd.read_csv(facilities_path, dtype=str)

    print("Parsing wellhead table...")
    wells = parse_well_table()
    print(f"Found {len(wells)} well rows.")

    print("Building PFAS dataset from well quality reports...")
    pfas_rows = build_pfas_rows(wells)
    pd.DataFrame(pfas_rows).to_csv(data_dir / "pfas_well_latest.csv", index=False)
    print(f"Wrote {len(pfas_rows)} rows to pfas_well_latest.csv")

    print("Extracting well coordinates and generating service-area GeoJSON...")
    well_coords_rows, service_geojson = build_well_coords_and_service_areas(wells, facilities_df)
    pd.DataFrame(well_coords_rows).to_csv(data_dir / "well_coordinates.csv", index=False)
    (data_dir / "well_service_areas.geojson").write_text(
        json.dumps(service_geojson, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(well_coords_rows)} rows to well_coordinates.csv")
    print(f"Wrote {len(service_geojson['features'])} features to well_service_areas.geojson")

    print("Building Dane/Madison building-age dataset (sampled parcel centroids)...")
    building_rows = build_dane_building_age(max_rows=10000)
    pd.DataFrame(building_rows).to_csv(data_dir / "dane_building_age.csv", index=False)
    print(f"Wrote {len(building_rows)} rows to dane_building_age.csv")

    print("Normalizing invalid NON_COMPL_PER_END_DATE markers...")
    normalize_violations_dates(data_dir)
    print("Updated madison_violations.csv")

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
