from pathlib import Path
import sys
from collections import Counter

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


def test_well_14_scores_worse_than_well_30() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}

    assert wells["14"]["score"] < wells["30"]["score"]
    assert wells["14"]["worstContaminant"]["key"] in {
        "chromium6",
        "nitrate",
        "sodiumChloride",
        "pfas",
    }
    assert wells["30"]["grade"] in {"A", "B"}


def test_score_location_contract_and_out_of_zone_fallback() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    well_15 = wells["15"]

    in_zone = engine.score_location(lat=well_15["lat"], lng=well_15["lng"])
    assert in_zone["score"] <= 70
    assert "15" in in_zone["wellIds"]
    assert isinstance(in_zone["breakdown"], dict)
    assert isinstance(in_zone["limits"], dict)
    assert isinstance(in_zone["categoryScores"], dict)
    assert isinstance(in_zone["availableCategories"], list)
    assert isinstance(in_zone["worstContaminant"], dict)
    assert isinstance(in_zone["comparisons"], dict)
    assert in_zone["outOfZone"] is False

    out_zone = engine.score_location(lat=0.0, lng=0.0)
    assert out_zone["outOfZone"] is True
    assert len(out_zone["wellIds"]) == 1


def test_pfba_heavy_well_9_has_lower_pfas_risk_than_well_6() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    assert wells["9"]["categoryScores"]["pfas"] > wells["6"]["categoryScores"]["pfas"]


def test_well_15_excludes_pfas_when_no_current_sample() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    well_15 = wells["15"]
    assert "pfas" not in well_15["availableCategories"]
    assert "pfas" not in well_15["categoryScores"]
    assert "pfas" not in well_15["comparisons"]


def test_not_detected_without_breakdown_excludes_pfas_category() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    well_7 = wells["7"]
    assert well_7["contaminants"]["pfas_status"] == "not_detected"
    assert "pfas" not in well_7["availableCategories"]
    assert "pfas" not in well_7["categoryScores"]
    assert "pfas" not in well_7["comparisons"]


def test_detected_pfas_comparison_has_guideline_and_limit() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    well_6 = wells["6"]
    comparison = well_6["comparisons"]["pfas"]
    assert comparison["unit"] == "ppt"
    assert comparison["ewgGuideline"] is not None
    assert comparison["legalLimit"] is not None


def test_worst_contaminant_is_not_stuck_on_chromium6() -> None:
    engine = WaterScoreEngine()
    wells = engine.list_wells()["wells"]
    worst_counts = Counter(well["worstContaminant"]["key"] for well in wells)
    assert len(worst_counts) >= 3
    assert worst_counts.get("chromium6", 0) < len(wells)
