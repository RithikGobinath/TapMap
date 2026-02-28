import { useState } from "react";

const phases = [
  {
    id: 1,
    phase: "Data Pipeline & Project Setup",
    time: "1:00 PM – 3:30 PM Sat",
    hours: "2.5 hrs",
    color: "#8b5cf6",
    you: [
      "Set up GitHub repo, React + Vite frontend scaffold, TailwindCSS",
      "Set up Flask backend with endpoint stubs: /api/score, /api/wells, /api/submit",
      "Set up Google Cloud project — Firestore DB, Cloud Run config",
      "Get Google Maps API key (free credits from hackathon)",
    ],
    teammate: [
      "Download EPA SDWIS data for Madison (PWSID: WI3903722) — violations + contaminants CSVs",
      "Scrape Madison Water Utility PFAS reports into structured JSON (per-well PFAS levels)",
      "Find & download well service area boundary GeoJSON from city GIS portal",
      "Compile well lat/lng coordinates + Dane County building age data into clean datasets",
    ],
    milestone: "All data files cleaned and in /data folder. Backend serves dummy responses. Frontend renders a blank page with routing.",
  },
  {
    id: 2,
    phase: "Scoring Engine + Map",
    time: "3:30 PM – 6:30 PM Sat",
    hours: "3 hrs",
    color: "#ec4899",
    you: [
      "Build Leaflet map component with well service area overlays (GeoJSON)",
      "Color-code well zones by risk level (green → red gradient)",
      "Add click-on-zone popups showing well ID, contaminants, last test date",
      "Integrate Google Maps geocoding: address → lat/lng → which well zone",
    ],
    teammate: [
      "Implement WaterScore™ algorithm in Python (sigmoid normalization, weighted composite)",
      "Build /api/score endpoint: takes lat/lng → identifies serving wells → returns score + breakdown",
      "Build /api/wells endpoint: returns all wells with latest contaminant data",
      "Unit test scoring with known well data — verify Well 15 (bad) scores low, clean wells score high",
    ],
    milestone: "Can hit /api/score with coordinates and get a real score. Map renders with colored well zones.",
  },
  {
    id: 3,
    phase: "Core UI + Integration",
    time: "6:30 PM – 8:00 PM Sat (dinner at 6:30, eat & code)",
    hours: "1.5 hrs",
    color: "#f59e0b",
    you: [
      "Build address search bar with autocomplete",
      "Build score display card: big number, color-coded, letter grade",
      "Build contaminant breakdown chart (Recharts bar chart: each contaminant vs its MCL)",
      "Wire frontend → backend: search address → geocode → fetch score → display",
    ],
    teammate: [
      "Build community submission API: /api/submit (validate inputs, geohash the location, store in Firestore)",
      "Implement geohash privacy truncation (precision 6 ≈ 150m²)",
      "Add input validation: reject impossible values, flag outliers",
      "Build /api/community endpoint: returns anonymized community data points for map overlay",
    ],
    milestone: "END-TO-END FLOW WORKS: type address → see score + breakdown + map highlights your zone.",
  },
  {
    id: 4,
    phase: "Community Layer + Anomaly Detection",
    time: "8:00 PM – 10:30 PM Sat",
    hours: "2.5 hrs",
    color: "#10b981",
    you: [
      "Build community submission form UI (contaminant dropdowns, value input, auto-location)",
      "Add community data dots on Leaflet map as a toggleable layer",
      "Build historical trend line chart per well (Recharts line chart)",
      "Add layer toggle controls on map: Official data / Community data / PFAS / Lead risk",
    ],
    teammate: [
      "Implement z-score anomaly detection on community submissions per geohash region",
      "Build alert flag system: if a cluster of submissions spike, mark region on map",
      "Seed Firestore with 30-50 realistic fake community submissions across Madison",
      "Add pipe-age risk amplification factor using building year data",
    ],
    milestone: "Community submit works. Map has multiple layers. Anomaly flags appear on seeded data.",
  },
  {
    id: 5,
    phase: "Polish & Deploy",
    time: "10:30 PM – 1:00 AM Sun",
    hours: "2.5 hrs",
    color: "#0ea5e9",
    you: [
      "UI polish: loading skeletons, transitions, error states, mobile responsiveness",
      "Add landing hero section with project tagline + \"Check Your Water\" CTA",
      "Style the score card to be visually stunning (gradients, animations)",
      "Add an \"About\" section explaining methodology + data sources",
    ],
    teammate: [
      "Deploy backend to Google Cloud Run",
      "Configure CORS, environment variables, Firestore production rules",
      "End-to-end testing: try 10+ real Madison addresses, verify scores",
      "Fix edge cases: addresses outside Madison, no data available, API errors",
    ],
    milestone: "App is LIVE on a public URL. Looks polished. Works for any Madison address.",
  },
  {
    id: 6,
    phase: "SLEEP",
    time: "1:00 AM – 7:00 AM Sun",
    hours: "6 hrs",
    color: "#64748b",
    you: ["Sleep. Seriously. A sharp 5-min demo > a buggy project from zombie coders."],
    teammate: ["Sleep. Set alarms for 7 AM. You'll need the energy for judging."],
    milestone: "Rested brains ready to present.",
  },
  {
    id: 7,
    phase: "Final Fixes + README",
    time: "7:00 AM – 9:30 AM Sun",
    hours: "2.5 hrs",
    color: "#f97316",
    you: [
      "Write GitHub README: project description, screenshots, architecture diagram, setup instructions",
      "Take screenshots of the app for README and submission form",
      "Fill out the Google Form submission",
      "Final UI touch-ups based on fresh-eyes review",
    ],
    teammate: [
      "Smoke test entire flow one more time on a clean browser",
      "Fix any overnight bugs (Firestore cold starts, CORS issues, etc.)",
      "Seed a few more community data points so the map looks populated",
      "Prepare backup: if Cloud Run is slow, have local Flask running as fallback",
    ],
    milestone: "Submitted on Google Form. GitHub repo is clean. App is rock solid.",
  },
  {
    id: 8,
    phase: "Demo Prep",
    time: "9:30 AM – 11:00 AM Sun",
    hours: "1.5 hrs",
    color: "#dc2626",
    you: [
      "Write the 5-min demo script together",
      "Practice the demo 3 times — time it",
      "Plan who covers what: You = problem + demo walkthrough, Teammate = technical deep dive",
      "Prepare for judge questions: \"How does scoring work?\" \"What about data accuracy?\" \"How would this scale?\"",
    ],
    teammate: [
      "Prepare the whiteboard-ready explanation of the WaterScore algorithm",
      "Have 3 pre-loaded addresses ready (one near campus, one east side, one clean area) as backup",
      "Test the live \"enter judge's address\" moment — make sure it's fast (<3 sec response)",
      "Charge laptop, clear notifications, full-screen the app",
    ],
    milestone: "You can deliver a flawless 5-min demo with confidence. Killer moment is rehearsed.",
  },
];

export default function BuildPlan() {
  const [expanded, setExpanded] = useState(1);
  const totalHours = "19 hrs (+ 6 hrs sleep)";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: -0.5 }}>
              💧 TapMap — 2-Person Build Plan
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              CheeseHacks 2026 · {totalHours} · Saturday 1PM → Sunday 11AM
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>You</div>
              <div style={{ fontSize: 14, color: "#60a5fa", fontWeight: 700, marginTop: 2 }}>Frontend + UI</div>
            </div>
            <div style={{ background: "#1e293b", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Teammate</div>
              <div style={{ fontSize: 14, color: "#a78bfa", fontWeight: 700, marginTop: 2 }}>Backend + Data</div>
            </div>
          </div>
        </div>

        {/* Timeline bar */}
        <div style={{ display: "flex", gap: 2, marginTop: 20, borderRadius: 6, overflow: "hidden" }}>
          {phases.map((p) => (
            <div
              key={p.id}
              onClick={() => setExpanded(p.id)}
              style={{
                flex: p.id === 6 ? 2 : 1,
                height: 8,
                background: expanded === p.id ? p.color : `${p.color}55`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Phases */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px" }}>
        {phases.map((p) => {
          const isOpen = expanded === p.id;
          return (
            <div
              key={p.id}
              style={{
                marginBottom: 8,
                borderRadius: 12,
                border: isOpen ? `1.5px solid ${p.color}66` : "1.5px solid #1e293b",
                background: isOpen ? "#1e293b" : "#0f172a",
                overflow: "hidden",
                transition: "all 0.2s",
              }}
            >
              {/* Phase header */}
              <div
                onClick={() => setExpanded(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `${p.color}22`,
                      border: `2px solid ${p.color}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      color: p.color,
                      fontFamily: "monospace",
                    }}
                  >
                    {p.id}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{p.phase}</div>
                    <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>
                      {p.time}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: `${p.color}22`,
                    color: p.color,
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontFamily: "monospace",
                  }}
                >
                  {p.hours}
                </div>
              </div>

              {/* Phase detail */}
              {isOpen && (
                <div style={{ padding: "0 20px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    {/* You column */}
                    <div style={{ background: "#0f172a", borderRadius: 10, padding: 16 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#60a5fa",
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          marginBottom: 12,
                        }}
                      >
                        ● You
                      </div>
                      {p.you.map((task, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8,
                            fontSize: 13,
                            color: "#cbd5e1",
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ color: "#475569", flexShrink: 0 }}>→</span>
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>

                    {/* Teammate column */}
                    <div style={{ background: "#0f172a", borderRadius: 10, padding: 16 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#a78bfa",
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          marginBottom: 12,
                        }}
                      >
                        ● Teammate
                      </div>
                      {p.teammate.map((task, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 8,
                            marginBottom: 8,
                            fontSize: 13,
                            color: "#cbd5e1",
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ color: "#475569", flexShrink: 0 }}>→</span>
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone */}
                  <div
                    style={{
                      background: `${p.color}11`,
                      border: `1px solid ${p.color}33`,
                      borderRadius: 8,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, flexShrink: 0 }}>✅</span>
                    <span style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.6 }}>
                      <strong style={{ color: p.color }}>Milestone:</strong> {p.milestone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Scope cuts callout */}
        <div
          style={{
            marginTop: 20,
            background: "#1e293b",
            borderRadius: 14,
            padding: "20px 24px",
            border: "1.5px solid #fbbf2444",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>
            ⚡ 2-Person Scope Cuts (vs 4-person plan)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13 }}>
            <div>
              <div style={{ color: "#10b981", fontWeight: 700, marginBottom: 8 }}>✓ KEEP (core)</div>
              <div style={{ color: "#cbd5e1", lineHeight: 1.8 }}>
                Address → WaterScore™ flow<br />
                Interactive risk map w/ well zones<br />
                Real EPA + city data pipeline<br />
                Custom scoring algorithm<br />
                Community submission w/ geohash privacy<br />
                Google Cloud deployment<br />
                Beautiful UI for demo
              </div>
            </div>
            <div>
              <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 8 }}>✗ CUT (nice-to-have)</div>
              <div style={{ color: "#94a3b8", lineHeight: 1.8 }}>
                <s>Anomaly detection alerts</s> → simplify to just showing community dots<br />
                <s>Historical trend charts per well</s> → show latest data only<br />
                <s>Multiple map layer toggles</s> → one combined layer<br />
                <s>Pipe-age risk model</s> → mention in presentation as "v2"<br />
                <s>Mobile responsiveness</s> → desktop-first for demo laptop
              </div>
            </div>
          </div>
        </div>

        {/* Critical path warning */}
        <div
          style={{
            marginTop: 12,
            background: "#1e293b",
            borderRadius: 14,
            padding: "20px 24px",
            border: "1.5px solid #ef444444",
          }}
        >
          <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800, color: "#f87171" }}>
            🚨 Critical Path — Don't Get Stuck Here
          </h3>
          <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.8 }}>
            <strong style={{ color: "#fbbf24" }}>6:30 PM checkpoint:</strong> If end-to-end flow isn't working (address → score → map), drop community features entirely and focus on making the core flow bulletproof + beautiful. A polished single-feature app beats a broken multi-feature one every time.<br /><br />
            <strong style={{ color: "#fbbf24" }}>If data scraping takes too long:</strong> Hardcode the top 10 well datasets manually from the city's published PDF reports. You can always say "we built the scraper pipeline but pre-cached the data for demo reliability."
          </div>
        </div>
      </div>
    </div>
  );
}
