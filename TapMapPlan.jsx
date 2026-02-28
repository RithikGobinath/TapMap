import { useState } from "react";

const sections = [
  {
    id: "overview",
    icon: "💧",
    title: "Project Overview",
    color: "#0EA5E9",
  },
  {
    id: "problem",
    icon: "⚠️",
    title: "The Problem",
    color: "#EF4444",
  },
  {
    id: "solution",
    icon: "🛡️",
    title: "The Solution",
    color: "#10B981",
  },
  {
    id: "architecture",
    icon: "🏗️",
    title: "Architecture",
    color: "#8B5CF6",
  },
  {
    id: "stack",
    icon: "⚙️",
    title: "Tech Stack",
    color: "#F59E0B",
  },
  {
    id: "timeline",
    icon: "⏱️",
    title: "22-Hour Plan",
    color: "#EC4899",
  },
  {
    id: "judging",
    icon: "🏆",
    title: "Winning Strategy",
    color: "#F97316",
  },
];

const SectionOverview = () => (
  <div>
    <div
      style={{
        background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)",
        borderRadius: 16,
        padding: "32px 28px",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.08 }}>💧</div>
      <h2
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: 36,
          fontWeight: 700,
          color: "#fff",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        TapMap
      </h2>
      <p
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: 18,
          color: "#bae6fd",
          margin: "8px 0 0",
          fontStyle: "italic",
        }}
      >
        Hyperlocal Water Quality Intelligence for Madison
      </p>
    </div>

    <p style={{ fontSize: 16, lineHeight: 1.8, color: "#334155", marginBottom: 16 }}>
      <strong>TapMap</strong> is a privacy-preserving, crowdsourced water quality intelligence platform that gives Madison residents street-level visibility into what's actually in their tap water — combining EPA violation data, municipal well testing results, infrastructure age modeling, and anonymous community-submitted test results into a single, interactive risk map.
    </p>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
      {[
        { theme: "Health & Lifestyle", desc: "Know what's in your water. Personalized risk scores.", bg: "#fef2f2", border: "#fecaca", color: "#991b1b" },
        { theme: "Social Good & Sustainability", desc: "Crowdsourced environmental monitoring for all.", bg: "#f0fdf4", border: "#bbf7d0", color: "#166534" },
        { theme: "Security & Privacy", desc: "Privacy-preserving geohash anonymization.", bg: "#eff6ff", border: "#bfdbfe", color: "#1e40af" },
      ].map((t) => (
        <div
          key={t.theme}
          style={{
            background: t.bg,
            border: `1.5px solid ${t.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13, color: t.color, marginBottom: 6 }}>{t.theme}</div>
          <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>{t.desc}</div>
        </div>
      ))}
    </div>

    <div
      style={{
        marginTop: 20,
        background: "#fefce8",
        border: "1.5px solid #fde68a",
        borderRadius: 12,
        padding: "14px 18px",
        fontSize: 14,
        color: "#92400e",
        lineHeight: 1.6,
      }}
    >
      <strong>🧀 "Most Madison" Superlative Lock:</strong> PFAS contamination from Truax Air Field is an active, emotional, local issue. Well 15 was shut down for years. This project directly serves UW-Madison students who drink from these wells daily.
    </div>
  </div>
);

const SectionProblem = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>The Gap Nobody Has Filled</h3>

    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[
        {
          num: "01",
          title: "Water quality reports are city-wide averages",
          detail: "Madison publishes annual reports covering all 21+ wells combined. But your tap water comes from 1-3 specific wells depending on your address, season, and demand. A resident near Well 15 (PFAS-contaminated, shut down 2019-2025) had vastly different water than someone served by Well 20.",
        },
        {
          num: "02",
          title: "Data exists but is scattered and inaccessible",
          detail: "EPA's SDWIS database, Madison Water Utility's semi-annual PFAS reports, DNR contamination site data, pipe infrastructure records — all public, but spread across 6+ government websites in incompatible formats. No regular person can synthesize this.",
        },
        {
          num: "03",
          title: "Infrastructure degrades invisibly",
          detail: "Madison has 900+ miles of water main. Older neighborhoods have pipes from the 1920s-1960s. Pipe age, material (lead service lines), and distance from treatment affect water quality block-by-block. This data exists in city records but isn't connected to health risk.",
        },
        {
          num: "04",
          title: "No community feedback loop",
          detail: "Residents who buy $15 home test kits have no way to contribute their results to a shared knowledge base. Each person tests in isolation. A crowdsourced approach could identify emerging issues before official quarterly testing catches them.",
        },
      ].map((item) => (
        <div
          key={item.num}
          style={{
            display: "flex",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              minWidth: 44,
              height: 44,
              borderRadius: "50%",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#dc2626",
              fontFamily: "monospace",
            }}
          >
            {item.num}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65 }}>{item.detail}</div>
          </div>
        </div>
      ))}
    </div>

    <div
      style={{
        marginTop: 24,
        background: "#0f172a",
        borderRadius: 12,
        padding: "20px 24px",
        color: "#e2e8f0",
        fontSize: 15,
        lineHeight: 1.7,
      }}
    >
      <strong style={{ color: "#f87171" }}>Key Stat:</strong> Madison Water Utility detected PFAS in 16 of its wells. Well 6, which serves the <em>UW campus area</em>, measured PFHxS at 5-6 ppt — approaching the EPA's 9 ppt limit. Every student at this hackathon drinks from these wells.
    </div>
  </div>
);

const SectionSolution = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>What TapMap Does</h3>

    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {[
        {
          icon: "📍",
          title: "Address-Level Risk Scoring",
          points: [
            "User enters their Madison address",
            "System identifies which wells serve that address (using Madison Water Utility's well service area data)",
            "Pulls latest PFAS, nitrate, lead, and VOC test results for those specific wells",
            "Calculates a composite WaterScore™ (0-100) using a custom multi-factor weighted algorithm",
            "Shows breakdown: which contaminants, at what levels, vs EPA/WI standards",
          ],
        },
        {
          icon: "🗺️",
          title: "Interactive Risk Heatmap",
          points: [
            "Google Cloud Maps with custom tile overlay showing risk gradient across Madison",
            "Color-coded by composite risk: green → yellow → orange → red",
            "Toggle layers: PFAS, Lead risk (pipe age), Nitrates, Overall",
            "Click any point to see the data sources and confidence level",
          ],
        },
        {
          icon: "🔬",
          title: "Crowdsourced Community Testing",
          points: [
            "Users submit results from home water test kits ($15 on Amazon)",
            "Location is anonymized via geohash (privacy-preserving — truncated to ~150m² blocks)",
            "Submissions are validated against expected ranges (outlier detection)",
            "Community data overlays on the map as a separate trust-tiered layer",
          ],
        },
        {
          icon: "🔔",
          title: "Anomaly Detection & Alerts",
          points: [
            "Custom statistical algorithm monitors for sudden spikes in community submissions",
            "Z-score based anomaly detection flags potential contamination events",
            "Generates alerts for users in affected geohash regions",
            "Historical trend visualization per-well",
          ],
        },
      ].map((feature) => (
        <div
          key={feature.title}
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>{feature.icon}</span>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{feature.title}</h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {feature.points.map((p, i) => (
              <li key={i} style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.7, marginBottom: 4 }}>
                {p}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

const SectionArchitecture = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>System Architecture</h3>

    <div
      style={{
        background: "#1e1b4b",
        borderRadius: 16,
        padding: 28,
        fontFamily: "monospace",
        fontSize: 12,
        color: "#c7d2fe",
        lineHeight: 2,
        whiteSpace: "pre",
        overflowX: "auto",
      }}
    >
{`┌─────────────────────────────────────────────────────┐
│                   FRONTEND (React)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Address  │ │ Risk Map │ │ Community Submit Form │ │
│  │ Search   │ │ (Leaflet │ │ (Geohash + Validate) │ │
│  │ + Score  │ │  + Tiles)│ │                      │ │
│  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │
└───────┼─────────────┼─────────────────┼─────────────┘
        │             │                 │
        ▼             ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              BACKEND (Python / Flask)                 │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         SCORING ENGINE (Custom Algorithm)     │    │
│  │                                               │    │
│  │  WaterScore™ = Σ(wᵢ × normalize(cᵢ/MCLᵢ))  │    │
│  │                                               │    │
│  │  Factors:                                     │    │
│  │  • PFAS levels vs EPA MCL     (w=0.30)       │    │
│  │  • Lead risk (pipe age model) (w=0.25)       │    │
│  │  • Nitrate levels             (w=0.15)       │    │
│  │  • VOC presence               (w=0.10)       │    │
│  │  • Violation history          (w=0.10)       │    │
│  │  • Infrastructure age         (w=0.10)       │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────┐  ┌───────────────────────────┐   │
│  │ Anomaly Detect │  │ Geohash Privacy Engine    │   │
│  │ (Z-score based │  │ (Truncate to precision 6  │   │
│  │  on community  │  │  ≈ 150m² anonymization)   │   │
│  │  submissions)  │  │                           │   │
│  └────────────────┘  └───────────────────────────┘   │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│            GOOGLE CLOUD PLATFORM                     │
│                                                      │
│  Cloud Run        │  Firestore       │  Maps API     │
│  (API hosting)    │  (User data,     │  (Tile render, │
│                   │   submissions)   │   geocoding)   │
└─────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────┐
│              DATA SOURCES (Pre-loaded + Live)         │
│                                                      │
│  • EPA SDWIS (violations, contaminant levels)        │
│  • Madison Water Utility PFAS reports (scraped)      │
│  • Well service area boundaries (GeoJSON)            │
│  • Dane County parcel data (building age → pipe age) │
│  • DNR contamination site coordinates                │
└─────────────────────────────────────────────────────┘`}
    </div>

    <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginTop: 24, marginBottom: 12 }}>
      The WaterScore™ Algorithm (Custom — No AI)
    </h4>
    <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7 }}>
      This is the technical core that will impress judges. It's a multi-factor weighted composite score using <strong>custom normalization curves</strong>, not a simple linear average:
    </p>
    <div
      style={{
        background: "#fefce8",
        border: "1.5px solid #fde68a",
        borderRadius: 10,
        padding: 18,
        fontFamily: "monospace",
        fontSize: 13,
        color: "#713f12",
        lineHeight: 1.8,
      }}
    >
      {`For each contaminant c:
  ratio = measured_level / MCL_limit
  
  if ratio < 0.5:  risk = 0           (safe zone)
  if 0.5 ≤ ratio < 0.8: risk = sigmoid_ramp(ratio)  
  if 0.8 ≤ ratio < 1.0: risk = steep_exponential(ratio)
  if ratio ≥ 1.0: risk = 1.0          (violation)

WaterScore = 100 - (100 × Σ(weight_i × risk_i))

Pipe age adjustment: 
  age_factor = 1 + (0.3 × sigmoid((year_built - 1970) / -20))
  // Pre-1970 pipes get up to 30% risk amplification`}
    </div>
  </div>
);

const SectionStack = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Tech Stack & Data Sources</h3>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      {[
        {
          cat: "Frontend",
          color: "#2563eb",
          bg: "#eff6ff",
          items: ["React + Vite", "Leaflet.js (maps — free, no API key needed)", "Recharts (trend graphs)", "TailwindCSS", "Geohash.js (privacy)"],
        },
        {
          cat: "Backend",
          color: "#7c3aed",
          bg: "#f5f3ff",
          items: ["Python 3 + Flask", "NumPy/SciPy (scoring algorithm)", "Pandas (data processing)", "BeautifulSoup (scraping city data)", "Flask-CORS"],
        },
        {
          cat: "Google Cloud",
          color: "#059669",
          bg: "#ecfdf5",
          items: ["Cloud Run (deploy backend)", "Firestore (community submissions)", "Maps JavaScript API (geocoding)", "Cloud Storage (static data files)", "Free credits from hackathon!"],
        },
        {
          cat: "Data Sources",
          color: "#dc2626",
          bg: "#fef2f2",
          items: [
            "EPA SDWIS (violations CSV download)",
            "Madison Water Utility PFAS reports",
            "Well service area GeoJSON (city site)",
            "Dane County parcel/assessor data",
            "EWG Tap Water Database",
          ],
        },
      ].map((stack) => (
        <div
          key={stack.cat}
          style={{
            background: stack.bg,
            borderRadius: 12,
            padding: 20,
            border: `1px solid ${stack.color}22`,
          }}
        >
          <h4 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: stack.color, textTransform: "uppercase", letterSpacing: 1 }}>{stack.cat}</h4>
          {stack.items.map((item, i) => (
            <div key={i} style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.8 }}>
              → {item}
            </div>
          ))}
        </div>
      ))}
    </div>

    <div style={{ marginTop: 20, padding: "16px 20px", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12 }}>
      <strong style={{ color: "#166534", fontSize: 14 }}>Why this stack wins on "Technical Depth":</strong>
      <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.7, margin: "8px 0 0" }}>
        The scoring algorithm uses custom sigmoid normalization curves, not a linear formula. The geohash privacy system implements real differential privacy concepts. The anomaly detection uses z-score statistics. The pipe-age risk model uses property records. <strong>None of this is a ChatGPT wrapper</strong> — judges specifically said they score higher for "reduced reliance on generative AI tools."
      </p>
    </div>
  </div>
);

const SectionTimeline = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>22-Hour Build Plan</h3>

    {[
      {
        phase: "Phase 1: Data & Backend Core",
        time: "1:30 PM – 5:00 PM Saturday (3.5 hrs)",
        color: "#8b5cf6",
        tasks: [
          { who: "Person A", what: "Download & parse EPA SDWIS data for Madison (WI3903722). Clean CSVs. Build well→contaminant lookup." },
          { who: "Person B", what: "Scrape Madison Water Utility PFAS reports into structured JSON. Map well IDs to lat/lng coordinates." },
          { who: "Person C", what: "Set up Flask API skeleton. Define endpoints: /score?address=, /wells, /community/submit. Set up Firestore." },
          { who: "Person D", what: "Find and download well service area GeoJSON boundaries. Process Dane County parcel data for building ages." },
        ],
      },
      {
        phase: "Phase 2: Scoring Engine & Frontend Shell",
        time: "5:00 PM – 9:00 PM Saturday (4 hrs)",
        color: "#ec4899",
        tasks: [
          { who: "Person A", what: "Implement WaterScore™ algorithm in Python. Unit test with known well data. Verify scores make intuitive sense." },
          { who: "Person B", what: "Build React frontend: address search bar, score display card, breakdown chart (Recharts)." },
          { who: "Person C", what: "Implement Leaflet map with well service area overlays. Color-code by risk. Add click-for-details popups." },
          { who: "Person D", what: "Build community submission form with geohash anonymization. Implement input validation & outlier detection." },
        ],
      },
      {
        phase: "Phase 3: Integration & Polish",
        time: "9:00 PM – 1:00 AM Sunday (4 hrs)",
        color: "#f59e0b",
        tasks: [
          { who: "All", what: "Connect frontend ↔ backend. End-to-end flow: enter address → see score → see map → submit data." },
          { who: "Person A+B", what: "Implement anomaly detection on community data. Add historical trend charts per well." },
          { who: "Person C+D", what: "Deploy to Google Cloud Run. Style the UI — make it beautiful. Add loading states, error handling." },
        ],
      },
      {
        phase: "Phase 4: Demo & Presentation",
        time: "1:00 AM – 8:00 AM Sunday (sleep + work)",
        color: "#10b981",
        tasks: [
          { who: "Take shifts", what: "Sleep in shifts! At least 4 hours each. Fresh minds > zombie coders." },
          { who: "Morning", what: "Fix bugs. Seed community data with realistic test submissions. Polish demo flow." },
        ],
      },
      {
        phase: "Phase 5: Submission & Judging Prep",
        time: "8:00 AM – 11:00 AM Sunday (3 hrs)",
        color: "#0ea5e9",
        tasks: [
          { who: "Person A", what: "Write README on GitHub. Include architecture diagram, screenshots, setup instructions." },
          { who: "Person B", what: "Prepare 5-minute demo script. Practice twice. Plan the \"wow moment\" (enter a judge's address live)." },
          { who: "Person C+D", what: "Final bug fixes. Ensure the demo flow works perfectly on the presentation laptop." },
        ],
      },
    ].map((phase) => (
      <div key={phase.phase} style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: phase.color,
              boxShadow: `0 0 8px ${phase.color}66`,
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{phase.phase}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{phase.time}</div>
          </div>
        </div>
        <div style={{ marginLeft: 24, borderLeft: `2px solid ${phase.color}33`, paddingLeft: 16 }}>
          {phase.tasks.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: phase.color, fontSize: 12 }}>[{t.who}]</span> {t.what}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const SectionJudging = () => (
  <div>
    <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>How This Wins Every Judging Criteria</h3>

    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[
        {
          criteria: "Working Demo",
          score: "9/10",
          strategy: "Enter any Madison address live during demo. Show the score, breakdown, and map in real-time. Have a judge enter THEIR address. This creates a personal, visceral \"oh wow\" moment that no other project will match.",
        },
        {
          criteria: "Problem Clarity & Relevance",
          score: "10/10",
          strategy: "Open with: \"Everyone in this room drinks Madison tap water. Well 6 — which serves the UW campus — has PFAS levels approaching EPA limits. But you've never been told your personal risk.\" This immediately grabs attention because it's PERSONAL to every judge.",
        },
        {
          criteria: "Technical Depth & Difficulty",
          score: "9/10",
          strategy: "Custom multi-factor scoring algorithm with sigmoid normalization curves. Geohash-based differential privacy. Z-score anomaly detection. GIS computations. Data pipeline from 5+ government sources. ZERO reliance on LLMs/generative AI — all custom logic.",
        },
        {
          criteria: "Innovation & Creativity (TIEBREAKER)",
          score: "10/10",
          strategy: "Nobody has built address-level water quality scoring. The crowdsourced anonymous community testing layer is novel. The pipe-age risk amplification model is original research. The combination of government data + community data + privacy is unique.",
        },
        {
          criteria: "Presentation & Understanding",
          score: "9/10",
          strategy: "Every team member explains their component. Show the algorithm whiteboard-style. Have the math ready. Judges will ask \"how does the scoring work?\" and you'll have a clear, impressive answer.",
        },
      ].map((item) => (
        <div
          key={item.criteria}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{item.criteria}</span>
            <span
              style={{
                background: "#dcfce7",
                color: "#166534",
                fontWeight: 800,
                fontSize: 13,
                padding: "4px 10px",
                borderRadius: 20,
                fontFamily: "monospace",
              }}
            >
              {item.score}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>{item.strategy}</p>
        </div>
      ))}
    </div>

    <div
      style={{
        marginTop: 24,
        background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
        borderRadius: 14,
        padding: "22px 24px",
        color: "#451a03",
      }}
    >
      <h4 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 800 }}>🎯 The "Killer Demo Moment"</h4>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>
        During your presentation, turn to the judges and say: <em>"What's your address? Let me show you YOUR water quality score right now."</em> Pull it up live. Watch their faces when they see their personal risk breakdown. This is the moment that wins hackathons — when the demo becomes <strong>personal</strong>. No other team will make judges feel their project in their gut like this.
      </p>
    </div>

    <div style={{ marginTop: 20, padding: "16px 20px", background: "#faf5ff", border: "1.5px solid #d8b4fe", borderRadius: 12 }}>
      <strong style={{ color: "#6b21a8", fontSize: 14 }}>Superlative Targets:</strong>
      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginTop: 6 }}>
        <strong>Most Madison</strong> — Literally about Madison's water. Lock.<br />
        <strong>Most Potential</strong> — This could expand to every US city using the same EPA data pipeline.<br />
        <strong>Most Creative</strong> — Nobody is thinking about water infrastructure at a hackathon. That's the point.<br />
        <strong>Best Use of Google Cloud</strong> — Cloud Run + Firestore + Maps API = strong sponsor integration.
      </div>
    </div>
  </div>
);

const sectionComponents = {
  overview: SectionOverview,
  problem: SectionProblem,
  solution: SectionSolution,
  architecture: SectionArchitecture,
  stack: SectionStack,
  timeline: SectionTimeline,
  judging: SectionJudging,
};

export default function TapMapPlan() {
  const [activeSection, setActiveSection] = useState("overview");
  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0c4a6e, #1e3a5f)",
          padding: "20px 28px",
          borderBottom: "3px solid #fbbf24",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>💧</span>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>
              TapMap — CheeseHacks 2026 Battle Plan
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#93c5fd" }}>
              Hyperlocal Water Quality Intelligence for Madison
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto" }}>
        <nav
          style={{
            width: 200,
            minWidth: 200,
            padding: "16px 12px",
            borderRight: "1px solid #e2e8f0",
            background: "#fff",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 12px",
                marginBottom: 4,
                background: activeSection === s.id ? `${s.color}15` : "transparent",
                border: activeSection === s.id ? `1.5px solid ${s.color}40` : "1.5px solid transparent",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: activeSection === s.id ? 700 : 500,
                  color: activeSection === s.id ? s.color : "#64748b",
                }}
              >
                {s.title}
              </span>
            </button>
          ))}
        </nav>

        <main style={{ flex: 1, padding: "24px 32px", maxWidth: 800 }}>
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
