from __future__ import annotations

from typing import Any, Dict, Tuple
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_cors import CORS

from .city_mapping import CityWellMapper
from .scoring_engine import WaterScoreEngine


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    engine: WaterScoreEngine | None = None
    city_mapper = CityWellMapper()
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

        if engine is None:
            message = "Scoring engine unavailable."
            if engine_load_error:
                message = f"{message} {engine_load_error}"
            return jsonify({"message": message}), 503

        well_ids = payload.get("wellIds")
        if isinstance(well_ids, list) and well_ids:
            well_weights = payload.get("wellWeights")
            zone_id = payload.get("zoneId")
            out_of_zone = bool(payload.get("outOfZone", False))
            try:
                response = engine.score_well_mix(
                    well_ids=[str(item) for item in well_ids],
                    well_weights=well_weights if isinstance(well_weights, dict) else None,
                    zone_id=str(zone_id) if isinstance(zone_id, str) and zone_id else None,
                    out_of_zone=out_of_zone,
                )
            except Exception as exc:
                return jsonify({"message": f"Failed to score well mix: {exc}"}), 503
            return jsonify(response), 200

        lat, lng = _parse_lat_lng(payload)
        if lat is None or lng is None:
            return jsonify({"message": "Provide either wellIds[] or lat/lng numeric coordinates."}), 400

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

    @app.post("/api/address-wells")
    def address_wells() -> Tuple[Any, int]:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}
        address = payload.get("address")
        if not isinstance(address, str) or not address.strip():
            return jsonify({"message": "address is required."}), 400

        try:
            response = city_mapper.lookup_address(address.strip())
        except ValueError as exc:
            return jsonify({"message": str(exc)}), 400
        except Exception as exc:
            return jsonify({"message": f"Failed to map address to wells: {exc}"}), 503
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
