from __future__ import annotations

from typing import Any, Dict, Tuple
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.get("/health")
    def health() -> Tuple[Any, int]:
        return jsonify({"ok": True}), 200

    @app.get("/api/health")
    def api_health() -> Tuple[Any, int]:
        return jsonify({"ok": True}), 200

    @app.post("/api/score")
    def score_stub() -> Tuple[Any, int]:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}
        lat = payload.get("lat")
        lng = payload.get("lng")

        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            return jsonify({"message": "lat and lng are required numbers."}), 400

        return (
            jsonify(
                {
                    "score": 75,
                    "grade": "C",
                    "wellIds": ["WELL-STUB"],
                    "zoneId": "zone-stub",
                    "breakdown": {
                        "pfas": 4.5,
                        "nitrate": 3.2,
                        "lead": 6.0,
                        "voc": 1.1,
                        "violations": 2,
                        "infrastructure": 3,
                    },
                    "limits": {
                        "pfas": 9,
                        "nitrate": 10,
                        "lead": 15,
                        "voc": 5,
                    },
                    "lastUpdated": "2026-02-28",
                }
            ),
            200,
        )

    @app.get("/api/wells")
    def wells_stub() -> Tuple[Any, int]:
        return (
            jsonify(
                {
                    "wells": [
                        {
                            "id": "WELL-STUB",
                            "name": "Stub Well",
                            "lat": 43.0731,
                            "lng": -89.4012,
                            "riskLevel": 65,
                            "latestTestDate": "2026-02-28",
                            "contaminants": {
                                "pfas": 4.5,
                                "nitrate": 3.2,
                                "lead": 6.0,
                                "voc": 1.1,
                            },
                        }
                    ]
                }
            ),
            200,
        )

    @app.post("/api/submit")
    def submit_stub() -> Tuple[Any, int]:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}
        required = ["lat", "lng", "contaminant", "value", "unit", "testDate"]

        missing = [field for field in required if field not in payload]
        if missing:
            return jsonify({"message": f"Missing fields: {', '.join(missing)}"}), 400

        return (
            jsonify(
                {
                    "submissionId": f"stub-{uuid4().hex[:8]}",
                    "geohash": "stubgh6",
                    "stored": True,
                }
            ),
            201,
        )

    return app
