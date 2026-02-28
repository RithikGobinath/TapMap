import pandas as pd
import json

# --- Violations summary ---
v = pd.read_csv("madison_violations.csv")
active = v[v["VIOLATION_STATUS"] == "Unaddressed"]
recent = v[pd.to_datetime(v["NON_COMPL_PER_BEGIN_DATE"], errors="coerce") >= "2010-01-01"]

# --- Lead trend ---
l = pd.read_csv("madison_lead_samples.csv")
l["year"] = pd.to_datetime(l["SAMPLING_END_DATE"], errors="coerce").dt.year
lead_trend = l[["year", "SAMPLE_MEASURE"]].dropna().sort_values("year")

# --- Wells ---
f = pd.read_csv("madison_facilities.csv")
wells = f[f["FACILITY_TYPE_CODE"] == "WL"][["FACILITY_ID", "FACILITY_NAME"]]

summary = {
    "pwsid": "WI1130224",
    "system_name": "Madison Water Utility",
    "population_served": 272000,
    "total_violations": len(v),
    "active_violations": len(active),
    "active_violation_detail": "Public notification failure since Oct 2024 (unresolved)",
    "lead_90th_percentile_latest_mg_L": 0.0018,
    "lead_action_level_mg_L": 0.015,
    "lead_status": "Below action level",
    "lead_trend": lead_trend.to_dict(orient="records"),
    "wells": wells.to_dict(orient="records"),
    "well_count": len(wells),
}

with open("madison_summary.json", "w") as f:
    json.dump(summary, f, indent=2)

print("✅ Saved madison_summary.json")
print(json.dumps(summary, indent=2, default=str))