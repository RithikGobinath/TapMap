from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.scoring_engine import WaterScoreEngine


def test_scoring_engine_loads_wells() -> None:
    engine = WaterScoreEngine()
    wells = engine.list_wells()["wells"]
    assert len(wells) >= 20


def test_well_15_scores_lower_than_clean_well_7() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}

    assert "15" in wells
    assert "7" in wells
    assert wells["15"]["score"] < wells["7"]["score"]

    # Expected Phase 2 milestone behavior: historically bad well lower than clean well.
    assert wells["15"]["score"] <= 65
    assert wells["7"]["score"] >= 85


def test_score_location_contract_and_out_of_zone_fallback() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    well_15 = wells["15"]

    in_zone = engine.score_location(lat=well_15["lat"], lng=well_15["lng"])
    assert in_zone["score"] <= 70
    assert "15" in in_zone["wellIds"]
    assert isinstance(in_zone["breakdown"], dict)
    assert isinstance(in_zone["limits"], dict)
    assert in_zone["outOfZone"] is False

    out_zone = engine.score_location(lat=0.0, lng=0.0)
    assert out_zone["outOfZone"] is True
    assert len(out_zone["wellIds"]) == 1
