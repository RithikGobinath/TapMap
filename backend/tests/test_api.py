from pathlib import Path
import sys
from unittest.mock import patch

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app import create_app


def test_health() -> None:
    app = create_app()
    client = app.test_client()

    response = client.get("/health")
    assert response.status_code == 200


def test_api_health() -> None:
    app = create_app()
    client = app.test_client()

    response = client.get("/api/health")
    assert response.status_code == 200


def test_score_endpoint_returns_real_payload() -> None:
    app = create_app()
    client = app.test_client()

    response = client.post("/api/score", json={"lat": 43.07, "lng": -89.40})
    assert response.status_code == 200
    body = response.get_json()
    assert isinstance(body, dict)
    assert "score" in body
    assert "grade" in body
    assert "wellIds" in body and isinstance(body["wellIds"], list) and len(body["wellIds"]) >= 1
    assert body["wellIds"][0] != "WELL-STUB"
    assert "zoneId" in body
    assert "breakdown" in body
    assert "limits" in body
    assert "lastUpdated" in body
    assert "availableCategories" in body and isinstance(body["availableCategories"], list)
    assert "categoryScores" in body and isinstance(body["categoryScores"], dict)
    assert "worstContaminant" in body and isinstance(body["worstContaminant"], dict)
    assert "comparisons" in body and isinstance(body["comparisons"], dict)
    assert "contaminants" in body and isinstance(body["contaminants"], dict)


def test_wells_endpoint_returns_dataset_records() -> None:
    app = create_app()
    client = app.test_client()

    response = client.get("/api/wells")
    assert response.status_code == 200
    body = response.get_json()
    assert isinstance(body, dict)
    wells = body.get("wells")
    assert isinstance(wells, list)
    assert len(wells) >= 20
    well_ids = {item["id"] for item in wells}
    assert "15" in well_ids
    assert "7" in well_ids
    sample = wells[0]
    assert "riskLevel" in sample
    assert "score" in sample
    assert "contaminants" in sample and isinstance(sample["contaminants"], dict)
    assert "availableCategories" in sample and isinstance(sample["availableCategories"], list)
    assert "categoryScores" in sample and isinstance(sample["categoryScores"], dict)
    assert "worstContaminant" in sample and isinstance(sample["worstContaminant"], dict)


def test_well_15_scores_lower_than_clean_well() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]

    well_15 = next(item for item in wells if item["id"] == "15")
    well_7 = next(item for item in wells if item["id"] == "7")

    score_15 = client.post("/api/score", json={"lat": well_15["lat"], "lng": well_15["lng"]})
    score_7 = client.post("/api/score", json={"lat": well_7["lat"], "lng": well_7["lng"]})

    assert score_15.status_code == 200
    assert score_7.status_code == 200

    body_15 = score_15.get_json()
    body_7 = score_7.get_json()
    assert body_15["score"] < body_7["score"]
    assert body_15["grade"] in {"D", "F"}
    assert body_7["grade"] in {"A", "B"}


def test_well_14_scores_lower_than_well_30() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]
    well_14 = next(item for item in wells if item["id"] == "14")
    well_30 = next(item for item in wells if item["id"] == "30")

    assert well_14["score"] < well_30["score"]
    assert well_14["worstContaminant"]["key"] in {
        "chromium6",
        "nitrate",
        "sodiumChloride",
        "pfas",
    }


def test_well_15_no_current_pfas_is_omitted_from_scoring_payload() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]
    well_15 = next(item for item in wells if item["id"] == "15")

    assert "pfas" not in well_15["availableCategories"]
    assert "pfas" not in well_15["categoryScores"]

    score_response = client.post("/api/score", json={"lat": well_15["lat"], "lng": well_15["lng"]})
    assert score_response.status_code == 200
    score_body = score_response.get_json()
    assert "pfas" not in score_body["availableCategories"]
    assert "pfas" not in score_body["categoryScores"]
    assert "pfas" not in score_body["comparisons"]


def test_well_7_not_detected_without_breakdown_omits_pfas() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]
    well_7 = next(item for item in wells if item["id"] == "7")
    assert well_7["contaminants"]["pfas_status"] == "not_detected"
    assert "pfas" not in well_7["availableCategories"]
    assert "pfas" not in well_7["categoryScores"]
    assert "pfas" not in well_7["comparisons"]


def test_detected_pfas_has_limits_and_guidelines() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]
    well_6 = next(item for item in wells if item["id"] == "6")
    pfas = well_6["comparisons"]["pfas"]
    assert pfas["unit"] == "ppt"
    assert pfas["ewgGuideline"] is not None
    assert pfas["legalLimit"] is not None


def test_score_out_of_zone_fallback() -> None:
    app = create_app()
    client = app.test_client()

    response = client.post("/api/score", json={"lat": 0.0, "lng": 0.0})
    assert response.status_code == 200
    body = response.get_json()
    assert body["outOfZone"] is True
    assert isinstance(body["wellIds"], list) and len(body["wellIds"]) == 1


def test_score_invalid_payload_returns_400() -> None:
    app = create_app()
    client = app.test_client()

    response = client.post("/api/score", json={"lat": "bad", "lng": -89.4})
    assert response.status_code == 400
    response = client.post("/api/score", json={"lat": 999, "lng": -89.4})
    assert response.status_code == 400


def test_score_endpoint_supports_weighted_well_mix() -> None:
    app = create_app()
    client = app.test_client()

    wells_response = client.get("/api/wells")
    assert wells_response.status_code == 200
    wells = wells_response.get_json()["wells"]
    well_6 = next(item for item in wells if item["id"] == "6")
    well_30 = next(item for item in wells if item["id"] == "30")

    heavy_6 = client.post(
        "/api/score",
        json={
            "wellIds": ["6", "30"],
            "wellWeights": {"6": 90, "30": 10},
            "zoneId": "city-map:6-30",
        },
    )
    heavy_30 = client.post(
        "/api/score",
        json={
            "wellIds": ["6", "30"],
            "wellWeights": {"6": 10, "30": 90},
            "zoneId": "city-map:6-30",
        },
    )

    assert heavy_6.status_code == 200
    assert heavy_30.status_code == 200
    score_heavy_6 = heavy_6.get_json()["score"]
    score_heavy_30 = heavy_30.get_json()["score"]

    assert score_heavy_6 < score_heavy_30
    assert abs(score_heavy_6 - score_heavy_30) > 5
    assert well_6["score"] < well_30["score"]


@patch("backend.app.app.CityWellMapper.lookup_address")
def test_address_flow_weighted_scoring_differs_by_distribution(mock_lookup) -> None:
    mapping_by_address = {
        "835 W Dayton St, Madison, WI": {
            "source": "cityofmadison-mywells",
            "queryAddress": "835 W Dayton St, Madison, WI",
            "request": {
                "housenum": "835",
                "streetdir": "W",
                "streetname": "Dayton",
                "streettype": "St",
                "municipality": "73",
                "submit": "Submit",
            },
            "notFound": False,
            "parcelId": "parcel-a",
            "matchedAddress": "835 W DAYTON ST",
            "wellIds": ["30", "27", "18", "19"],
            "wellUsage": [
                {"wellId": "30", "percentUsageRange": "20-40", "qualityReportUrl": None},
                {"wellId": "27", "percentUsageRange": "20-40", "qualityReportUrl": None},
                {"wellId": "18", "percentUsageRange": "20-40", "qualityReportUrl": None},
                {"wellId": "19", "percentUsageRange": "05-10", "qualityReportUrl": None},
            ],
        },
        "610 Langdon St, Madison, WI": {
            "source": "cityofmadison-mywells",
            "queryAddress": "610 Langdon St, Madison, WI",
            "request": {
                "housenum": "610",
                "streetdir": "",
                "streetname": "Langdon",
                "streettype": "St",
                "municipality": "73",
                "submit": "Submit",
            },
            "notFound": False,
            "parcelId": "parcel-b",
            "matchedAddress": "610 LANGDON ST",
            "wellIds": ["19", "30", "27", "24", "18"],
            "wellUsage": [
                {"wellId": "19", "percentUsageRange": "20-40", "qualityReportUrl": None},
                {"wellId": "30", "percentUsageRange": "10-20", "qualityReportUrl": None},
                {"wellId": "27", "percentUsageRange": "10-20", "qualityReportUrl": None},
                {"wellId": "24", "percentUsageRange": "10-20", "qualityReportUrl": None},
                {"wellId": "18", "percentUsageRange": "10-20", "qualityReportUrl": None},
            ],
        },
    }

    def fake_lookup(address: str):
        return mapping_by_address[address]

    mock_lookup.side_effect = fake_lookup

    app = create_app()
    client = app.test_client()

    def midpoint(range_text: str) -> float:
        lo, hi = range_text.split("-")
        return (float(lo) + float(hi)) / 2.0

    addr_a = "835 W Dayton St, Madison, WI"
    addr_b = "610 Langdon St, Madison, WI"

    map_a = client.post("/api/address-wells", json={"address": addr_a})
    map_b = client.post("/api/address-wells", json={"address": addr_b})
    assert map_a.status_code == 200
    assert map_b.status_code == 200

    body_a = map_a.get_json()
    body_b = map_b.get_json()
    assert body_a["wellIds"] != body_b["wellIds"]

    weights_a = {row["wellId"]: midpoint(row["percentUsageRange"]) for row in body_a["wellUsage"]}
    weights_b = {row["wellId"]: midpoint(row["percentUsageRange"]) for row in body_b["wellUsage"]}

    score_a = client.post("/api/score", json={"wellIds": body_a["wellIds"], "wellWeights": weights_a})
    score_b = client.post("/api/score", json={"wellIds": body_b["wellIds"], "wellWeights": weights_b})
    assert score_a.status_code == 200
    assert score_b.status_code == 200
    assert score_a.get_json()["score"] != score_b.get_json()["score"]


@patch("backend.app.app.CityWellMapper.lookup_address")
def test_address_wells_endpoint_returns_mapping(mock_lookup) -> None:
    mock_lookup.return_value = {
        "source": "cityofmadison-mywells",
        "queryAddress": "119 E Olin Ave, Madison, WI",
        "request": {
            "housenum": "119",
            "streetdir": "E",
            "streetname": "Olin",
            "streettype": "Ave",
            "municipality": "73",
            "submit": "Submit",
        },
        "notFound": False,
        "parcelId": "070926419015",
        "matchedAddress": "119 E OLIN AVE",
        "wellIds": ["30"],
        "wellUsage": [
            {
                "wellId": "30",
                "percentUsageRange": "80-100",
                "qualityReportUrl": "https://www.cityofmadison.com/water/documents/water-quality/Well30QualityReport.pdf",
            }
        ],
    }

    app = create_app()
    client = app.test_client()
    response = client.post("/api/address-wells", json={"address": "119 E Olin Ave, Madison, WI"})
    assert response.status_code == 200
    body = response.get_json()
    assert body["source"] == "cityofmadison-mywells"
    assert body["wellIds"] == ["30"]
    assert body["notFound"] is False


def test_address_wells_endpoint_requires_address() -> None:
    app = create_app()
    client = app.test_client()
    response = client.post("/api/address-wells", json={})
    assert response.status_code == 400


@patch("backend.app.app.CityWellMapper.lookup_address")
def test_address_wells_endpoint_handles_upstream_failure(mock_lookup) -> None:
    mock_lookup.side_effect = RuntimeError("upstream timeout")

    app = create_app()
    client = app.test_client()
    response = client.post("/api/address-wells", json={"address": "119 E Olin Ave, Madison, WI"})
    assert response.status_code == 503


def test_submit_stub() -> None:
    app = create_app()
    client = app.test_client()

    response = client.post(
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
    assert response.status_code == 201
