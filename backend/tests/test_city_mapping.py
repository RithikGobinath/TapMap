from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.city_mapping import CityWellMapper


SAMPLE_FOUND_HTML = """
<div>
  <h3>Well Service Area Information</h3>
  <p><span><strong>Parcel:</strong></span><span>070926419015</span></p>
  <p><span><strong>Address:</strong></span><span>119 E OLIN AVE</span></p>
  <table id="summer">
    <tbody>
      <tr>
        <th scope="row" headers="summer_well">30</th>
        <td headers="summer_percent">80-100</td>
        <td headers="summer_report"><a href="/water/documents/water-quality/Well30QualityReport.pdf" target="_blank">30</a></td>
      </tr>
    </tbody>
  </table>
</div>
"""

SAMPLE_NOT_FOUND_HTML = """
<div class="alert alert-block alert-dismissible alert-danger messages error">
  <p>No well service information found for this parcel.</p>
</div>
"""


def test_parse_address_components() -> None:
    mapper = CityWellMapper()
    components = mapper._parse_address("119 E Olin Ave, Madison, WI")
    assert components["housenum"] == "119"
    assert components["streetdir"] == "E"
    assert components["streetname"] == "Olin"
    assert components["streettype"] == "Ave"
    assert components["municipality"] == "73"


def test_parse_address_components_infers_non_madison_municipality() -> None:
    mapper = CityWellMapper()
    components = mapper._parse_address("100 Main St, Fitchburg, WI")
    assert components["municipality"] == "15"


def test_parse_address_components_handles_wy_alias() -> None:
    mapper = CityWellMapper()
    components = mapper._parse_address("750 Hilldale Wy, Madison, WI 53705")
    assert components["housenum"] == "750"
    assert components["streetname"] == "Hilldale"
    assert components["streettype"] == "Way"
    assert components["municipality"] == "73"


def test_parse_lookup_html_found() -> None:
    mapper = CityWellMapper()
    parsed = mapper._parse_lookup_html(SAMPLE_FOUND_HTML)
    assert parsed["notFound"] is False
    assert parsed["parcelId"] == "070926419015"
    assert parsed["matchedAddress"] == "119 E OLIN AVE"
    assert parsed["wellIds"] == ["30"]
    assert len(parsed["wellUsage"]) == 1
    assert parsed["wellUsage"][0]["qualityReportUrl"] is not None


def test_parse_lookup_html_not_found() -> None:
    mapper = CityWellMapper()
    parsed = mapper._parse_lookup_html(SAMPLE_NOT_FOUND_HTML)
    assert parsed["notFound"] is True
    assert parsed["wellIds"] == []
    assert parsed["wellUsage"] == []
