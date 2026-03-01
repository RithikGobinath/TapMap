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


def test_score_stub() -> None:
    app = create_app()
    client = app.test_client()

    response = client.post("/api/score", json={"lat": 43.07, "lng": -89.40})
    assert response.status_code == 200


def test_wells_stub() -> None:
    app = create_app()
    client = app.test_client()

    response = client.get("/api/wells")
    assert response.status_code == 200


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
