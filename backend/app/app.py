from __future__ import annotations

from typing import Any, Dict, Tuple
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS

from .scoring_engine import WaterScoreEngine


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    engine: WaterScoreEngine | None = None
    engine_load_error: str | None = None

    try:
        engine = WaterScoreEngine()
    except Exception as exc:  # pragma: no cover - runtime guard
        engine_load_error = str(exc)

    @app.get("/health")
    def health() -> Tuple[Any, int]:
        return jsonify({"ok": True}), 200

    @app.get("/api/health")
    def api_health() -> Tuple[Any, int]:
        return jsonify({"ok": True}), 200

    def _parse_lat_lng(payload: Dict[str, Any]) -> tuple[float | None, float | None]:
        lat = payload.get("lat")
        lng = payload.get("lng")
        if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
            return None, None
        parsed_lat = float(lat)
        parsed_lng = float(lng)
        if parsed_lat < -90 or parsed_lat > 90 or parsed_lng < -180 or parsed_lng > 180:
            return None, None
        return parsed_lat, parsed_lng

    @app.post("/api/score")
    def score() -> Tuple[Any, int]:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}
        lat, lng = _parse_lat_lng(payload)

        if lat is None or lng is None:
            return jsonify({"message": "lat and lng are required numbers."}), 400

        if engine is None:
            message = "Scoring engine unavailable."
            if engine_load_error:
                message = f"{message} {engine_load_error}"
            return jsonify({"message": message}), 503

        try:
            response = engine.score_location(lat=lat, lng=lng)
        except Exception as exc:
            return jsonify({"message": f"Failed to score location: {exc}"}), 503
        return jsonify(response), 200

    @app.get("/api/wells")
    def wells() -> Tuple[Any, int]:
        if engine is None:
            message = "Scoring engine unavailable."
            if engine_load_error:
                message = f"{message} {engine_load_error}"
            return jsonify({"message": message}), 503

        try:
            response = engine.list_wells()
        except Exception as exc:
            return jsonify({"message": f"Failed to load wells: {exc}"}), 503
        return jsonify(response), 200

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
