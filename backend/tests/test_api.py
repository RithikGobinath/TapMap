from pathlib import Path
import sys

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
