from __future__ import annotations

import re
import ssl
from typing import Any
from urllib.error import URLError
from urllib.parse import urlencode, urljoin
from urllib.request import Request, urlopen


CITY_MY_WELLS_URL = "https://www.cityofmadison.com/water/waterquality/mywells.cfm"
DEFAULT_MUNICIPALITY = "73"
MUNICIPALITY_BY_CITY: dict[str, str] = {
    "BLOOMING GROVE": "04",
    "FITCHBURG": "15",
    "MADISON": "73",
    "MONONA": "75",
    "MAPLE BLUFF": "61",
    "SHOREWOOD HILLS": "69",
    "BURKE": "07",
    "TOWN OF MADISON": "16",
}

STREET_TYPES: dict[str, str] = {
    "ALY": "Aly",
    "AVE": "Ave",
    "AV": "Ave",
    "BLVD": "Blvd",
    "BOULEVARD": "Blvd",
    "BND": "Bnd",
    "CIR": "Cir",
    "CRES": "Cres",
    "CT": "Ct",
    "DR": "Dr",
    "GLN": "Gln",
    "GRN": "Grn",
    "HTS": "Hts",
    "HWY": "Hwy",
    "LN": "Ln",
    "LOOP": "Loop",
    "MALL": "Mall",
    "PASS": "Pass",
    "PATH": "Path",
    "PKWY": "Pkwy",
    "PL": "Pl",
    "PLZ": "Plz",
    "RAMP": "Ramp",
    "RD": "Rd",
    "RDG": "Rdg",
    "ROW": "Row",
    "RR": "RR",
    "RUN": "Run",
    "SPUR": "Spur",
    "SQ": "Sq",
    "ST": "St",
    "STREET": "St",
    "TER": "Ter",
    "TRCE": "Trce",
    "TRL": "Trl",
    "VW": "Vw",
    "WY": "Way",
    "WAY": "Way",
    "WALK": "Walk",
    "XING": "Xing",
}


class CityWellMapper:
    """Address -> serving wells integration for the City of Madison MyWells tool."""

    def __init__(self, endpoint: str = CITY_MY_WELLS_URL, timeout_seconds: float = 8.0) -> None:
        self._endpoint = endpoint
        self._timeout = timeout_seconds

    def lookup_address(self, address: str) -> dict[str, Any]:
        components = self._parse_address(address)
        html = self._post_lookup(components)
        parsed = self._parse_lookup_html(html)

        return {
            "source": "cityofmadison-mywells",
            "queryAddress": address,
            "request": components,
            **parsed,
        }

    def _parse_address(self, address: str) -> dict[str, str]:
        raw = (address or "").strip()
        if not raw:
            raise ValueError("Address is required.")

        # Keep the street line only: "600 N Park St, Madison, WI ..."
        street_line = raw.split(",")[0].strip()
        parts = [token.strip(".") for token in street_line.split() if token.strip(".")]
        if len(parts) < 2:
            raise ValueError("Address format not recognized.")

        housenum_match = re.match(r"^(\d{1,6})[A-Za-z]?$", parts[0])
        if not housenum_match:
            raise ValueError("Address must start with a house number.")
        housenum = housenum_match.group(1)

        remaining = parts[1:]
        streetdir = ""
        if remaining and remaining[0].upper() in {"N", "S", "E", "W"}:
            streetdir = remaining[0].upper()
            remaining = remaining[1:]

        if not remaining:
            raise ValueError("Street name is required.")

        streettype = ""
        last_token = re.sub(r"[^A-Za-z]", "", remaining[-1]).upper()
        if last_token in STREET_TYPES:
            streettype = STREET_TYPES[last_token]
            remaining = remaining[:-1]

        if not remaining:
            raise ValueError("Street name is required.")

        streetname = " ".join(remaining)
        if len(streetname) > 24:
            streetname = streetname[:24].strip()

        municipality = self._infer_municipality(raw)

        return {
            "housenum": housenum,
            "streetdir": streetdir,
            "streetname": streetname,
            "streettype": streettype or " ",
            "municipality": municipality,
            "submit": "Submit",
        }

    def _infer_municipality(self, address: str) -> str:
        parts = [part.strip().upper() for part in address.split(",") if part.strip()]
        city_tokens = parts[1:] if len(parts) > 1 else parts

        for token in city_tokens:
            for city_name, municipality in MUNICIPALITY_BY_CITY.items():
                if city_name in token:
                    return municipality

        return DEFAULT_MUNICIPALITY

    def _post_lookup(self, payload: dict[str, str]) -> str:
        body = urlencode(payload).encode("utf-8")
        request = Request(
            self._endpoint,
            data=body,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "TapMap/1.0 (+https://github.com/)",
            },
        )
        try:
            with urlopen(request, timeout=self._timeout) as response:  # nosec: B310
                return response.read().decode("utf-8", "ignore")
        except URLError as exc:
            reason = getattr(exc, "reason", None)
            if not isinstance(reason, ssl.SSLCertVerificationError):
                raise
            # Some local/proxied environments inject cert chains unknown to Python.
            # Retry with unverified context for this public read-only endpoint.
            insecure_context = ssl._create_unverified_context()
            with urlopen(request, timeout=self._timeout, context=insecure_context) as response:  # nosec: B310
                return response.read().decode("utf-8", "ignore")

    def _parse_lookup_html(self, html: str) -> dict[str, Any]:
        if "No well service information found for this parcel" in html:
            return {
                "notFound": True,
                "parcelId": None,
                "matchedAddress": None,
                "wellIds": [],
                "wellUsage": [],
            }

        parcel_match = re.search(
            r"<strong>\s*Parcel:\s*</strong>\s*</span>\s*<span>\s*([^<]+)\s*</span>",
            html,
            flags=re.IGNORECASE | re.DOTALL,
        )
        address_match = re.search(
            r"<strong>\s*Address:\s*</strong>\s*</span>\s*<span>\s*([^<]+)\s*</span>",
            html,
            flags=re.IGNORECASE | re.DOTALL,
        )

        row_pattern = re.compile(
            r"<tr>\s*"
            r"<th[^>]*>\s*(?P<well>\d+)\s*</th>\s*"
            r"<td[^>]*>\s*(?P<percent>[^<]+?)\s*</td>\s*"
            r"<td[^>]*>\s*(?P<report>.*?)\s*</td>\s*"
            r"</tr>",
            flags=re.IGNORECASE | re.DOTALL,
        )
        href_pattern = re.compile(r'href="([^"]+)"', flags=re.IGNORECASE)

        well_usage: list[dict[str, str | None]] = []
        for row in row_pattern.finditer(html):
            well_id = row.group("well").strip()
            percent_range = row.group("percent").strip()
            report_cell = row.group("report")
            href_match = href_pattern.search(report_cell)
            report_url = urljoin(self._endpoint, href_match.group(1)) if href_match else None

            well_usage.append(
                {
                    "wellId": well_id,
                    "percentUsageRange": percent_range,
                    "qualityReportUrl": report_url,
                }
            )

        well_ids: list[str] = []
        for usage in well_usage:
            well_id = str(usage["wellId"])
            if well_id not in well_ids:
                well_ids.append(well_id)

        return {
            "notFound": len(well_usage) == 0,
            "parcelId": parcel_match.group(1).strip() if parcel_match else None,
            "matchedAddress": address_match.group(1).strip() if address_match else None,
            "wellIds": well_ids,
            "wellUsage": well_usage,
        }
