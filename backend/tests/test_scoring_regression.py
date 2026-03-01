from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.scoring_engine import WaterScoreEngine


def _expected_grade(score: float) -> str:
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def test_all_wells_score_contract_bounds_and_consistency() -> None:
    engine = WaterScoreEngine()
    wells = engine.list_wells()["wells"]
    assert wells

    for well in wells:
        score = float(well["score"])
        risk_level = int(well["riskLevel"])
        grade = str(well["grade"])
        available = list(well["availableCategories"])
        category_scores = dict(well["categoryScores"])
        worst = dict(well["worstContaminant"])

        assert 0.0 <= score <= 100.0
        assert risk_level == int(round(100.0 - score))
        assert grade == _expected_grade(score)

        assert len(available) >= 1
        assert set(category_scores.keys()).issubset(set(available))
        for key, value in category_scores.items():
            assert 0.0 <= float(value) <= 100.0, f"{well['id']}:{key} out of range"

        assert worst["key"] in available
        assert abs(float(worst["score"]) - float(category_scores[worst["key"]])) < 1e-6


def test_score_well_mix_single_well_identity() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    # Spot-check several wells including one with PFAS omitted.
    for well_id in ["6", "14", "15", "30"]:
        base = wells[well_id]
        mix = engine.score_well_mix(well_ids=[well_id], well_weights={well_id: 100})
        assert mix["wellIds"] == [well_id]
        assert mix["score"] == base["score"]
        assert mix["grade"] == base["grade"]
        assert mix["availableCategories"] == base["availableCategories"]
        assert mix["categoryScores"] == base["categoryScores"]


def test_score_well_mix_equal_weights_matches_average() -> None:
    engine = WaterScoreEngine()
    wells = {item["id"]: item for item in engine.list_wells()["wells"]}
    # Use two wells with PFAS category present to exercise full category surface.
    well_a = wells["6"]
    well_b = wells["14"]

    mix = engine.score_well_mix(well_ids=["6", "14"], well_weights={"6": 50, "14": 50}, zone_id="test:6-14")

    expected_score = round((well_a["score"] + well_b["score"]) / 2.0, 1)
    assert mix["score"] == expected_score
    assert mix["zoneId"] == "test:6-14"
    assert mix["grade"] == _expected_grade(expected_score)

    for key in mix["availableCategories"]:
        expected = round((well_a["categoryScores"][key] + well_b["categoryScores"][key]) / 2.0, 1)
        assert mix["categoryScores"][key] == expected


def test_score_well_mix_monotonic_with_weight_shift() -> None:
    engine = WaterScoreEngine()
    wells = engine.list_wells()["wells"]
    ordered = sorted(wells, key=lambda item: item["score"])
    low = ordered[0]
    high = ordered[-1]

    low_heavy = engine.score_well_mix(
        well_ids=[low["id"], high["id"]],
        well_weights={low["id"]: 90, high["id"]: 10},
    )
    high_heavy = engine.score_well_mix(
        well_ids=[low["id"], high["id"]],
        well_weights={low["id"]: 10, high["id"]: 90},
    )

    assert low_heavy["score"] < high_heavy["score"]
    assert low_heavy["grade"] != high_heavy["grade"] or abs(low_heavy["score"] - high_heavy["score"]) >= 1.0


def test_score_location_out_of_zone_matches_single_well_mix() -> None:
    engine = WaterScoreEngine()
    out_zone = engine.score_location(lat=0.0, lng=0.0)
    assert out_zone["outOfZone"] is True
    assert len(out_zone["wellIds"]) == 1

    fallback_id = out_zone["wellIds"][0]
    mix = engine.score_well_mix(well_ids=[fallback_id], well_weights={fallback_id: 1}, out_of_zone=True)
    assert mix["score"] == out_zone["score"]
    assert mix["grade"] == out_zone["grade"]
    assert mix["categoryScores"] == out_zone["categoryScores"]
