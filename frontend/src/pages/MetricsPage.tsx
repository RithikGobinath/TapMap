import { Link } from "react-router-dom";
import { useThemeMode } from "../hooks/useThemeMode";

interface MetricDetail {
  id: string;
  title: string;
  unit: string;
  whyItMatters: string;
  healthyRange: string;
  cautionRange: string;
  sources: string;
}

const metricDetails: MetricDetail[] = [
  {
    id: "pfas",
    title: "PFAS",
    unit: "ppt",
    whyItMatters: "PFAS compounds persist for years and can increase long-term health risk with sustained exposure.",
    healthyRange: "Near-zero and non-detect is preferred.",
    cautionRange: "Anything trending upward above EWG guidance requires attention.",
    sources: "City well quality reports + PFAS parser pipeline."
  },
  {
    id: "nitrate",
    title: "Nitrate",
    unit: "mg/L",
    whyItMatters: "High nitrate can indicate runoff pressure and affects infant safety at elevated levels.",
    healthyRange: "Low single-digit mg/L and below health guidance.",
    cautionRange: "Rising trends toward guideline thresholds.",
    sources: "Annual inorganics reporting and city laboratory records."
  },
  {
    id: "chromium6",
    title: "Chromium-6",
    unit: "ug/L",
    whyItMatters: "Chromium-6 is tracked for potential carcinogenic risk even at low concentrations.",
    healthyRange: "As low as possible versus precautionary guidance.",
    cautionRange: "Repeated values materially above guideline baseline.",
    sources: "Inorganics datasets merged into well-level snapshots."
  },
  {
    id: "radionuclides",
    title: "Radionuclides",
    unit: "pCi/L",
    whyItMatters: "Radiological contaminants can vary by geology and are crucial for long-term system monitoring.",
    healthyRange: "Below regulatory and precautionary levels with stable trends.",
    cautionRange: "Spikes near or above historical baseline bands.",
    sources: "RADS reports and city annual compliance disclosures."
  },
  {
    id: "sodiumchloride",
    title: "Sodium/Chloride",
    unit: "mg/L",
    whyItMatters: "Salt-related compounds affect taste, corrosion behavior, and can signal distribution stress.",
    healthyRange: "Moderate, stable levels with no significant jumps.",
    cautionRange: "Persistent high values or rapid increase events.",
    sources: "City chemistry measurements and category aggregation logic."
  },
  {
    id: "voc",
    title: "VOCs/Solvents",
    unit: "ug/L",
    whyItMatters: "Volatile compounds indicate potential industrial/solvent pressure and should remain tightly controlled.",
    healthyRange: "Non-detect or very low concentrations.",
    cautionRange: "Any recurring detections or upward sequence.",
    sources: "VOC report exports and well-specific quality sheets."
  }
];

export function MetricsPage(): JSX.Element {
  const [themeMode, setThemeMode] = useThemeMode();
  const isLight = themeMode === "light";

  const pageClass = isLight
    ? "min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.15),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(180deg,#f8fafc,#eef2ff)] text-slate-900"
    : "min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(16,185,129,0.16),transparent_28%),linear-gradient(180deg,#030712,#020617)] text-slate-100";

  const topShellClass = isLight
    ? "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-300/90 bg-white/88 px-3 py-2 shadow-2xl shadow-slate-300/50 backdrop-blur-md"
    : "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-md";
  const navLinkClass = isLight
    ? "rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-slate-700 hover:border-slate-400 hover:text-slate-900"
    : "rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-slate-200 hover:border-slate-500";

  const heroClass = isLight
    ? "rounded-3xl border border-slate-300/90 bg-white/82 p-6 shadow-xl shadow-slate-300/30 backdrop-blur"
    : "rounded-3xl border border-slate-700/70 bg-slate-950/75 p-6 shadow-2xl backdrop-blur";

  const cardClass = isLight
    ? "rounded-2xl border border-slate-300/90 bg-white/85 p-4 shadow-lg shadow-slate-300/25 backdrop-blur"
    : "rounded-2xl border border-slate-700/70 bg-slate-950/70 p-4 shadow-xl backdrop-blur";

  return (
    <section className={pageClass}>
      <header className="p-2 md:p-3">
        <div className={topShellClass}>
          <div className="flex items-center gap-2.5">
            <img src="/tapmap-logo.svg" alt="TapMap logo" className="h-8 w-8 rounded-md" />
            <div>
            <p className={`text-[10px] uppercase tracking-[0.2em] ${isLight ? "text-sky-700" : "text-cyan-300"}`}>TapMap Live</p>
            <h1 className={`text-sm font-semibold md:text-base ${isLight ? "text-slate-900" : "text-white"}`}>Water Risk Atlas</h1>
            </div>
          </div>
          <nav className="flex items-center gap-1.5 text-xs font-medium">
            <button
              type="button"
              aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
              aria-pressed={isLight}
              onClick={() => setThemeMode((current) => (current === "dark" ? "light" : "dark"))}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 transition ${
                isLight
                  ? "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  : "border-slate-700 bg-slate-900/80 text-slate-200 hover:border-slate-500"
              }`}
            >
              <span>{isLight ? "Light" : "Dark"}</span>
              <span className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${isLight ? "bg-sky-500" : "bg-slate-600"}`}>
                <span className={`absolute h-3 w-3 rounded-full bg-white transition ${isLight ? "translate-x-3.5" : "translate-x-0.5"}`} />
              </span>
            </button>
            <Link className={navLinkClass} to="/">Map</Link>
            <Link className={navLinkClass} to="/metrics">Metrics</Link>
            <Link className={navLinkClass} to="/scoring">Scoring</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pb-8">
        <section className={heroClass}>
          <h2 className={`text-3xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>What each metric means</h2>
          <p className={`mt-3 max-w-3xl text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            TapMap scores combine chemistry, trend pressure, and guideline context. This page is your glossary for
            interpreting each contaminant category before you compare neighborhoods, wells, or address-level mixes.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metricDetails.map((metric) => (
            <article key={metric.id} className={cardClass}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{metric.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isLight ? "bg-sky-100 text-sky-800" : "bg-sky-500/20 text-sky-200"}`}>
                  {metric.unit}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>{metric.whyItMatters}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Healthy trend:</span>{" "}
                  {metric.healthyRange}
                </p>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Caution trend:</span>{" "}
                  {metric.cautionRange}
                </p>
                <p className={isLight ? "text-slate-700" : "text-slate-300"}>
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Data feed:</span>{" "}
                  {metric.sources}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section className={cardClass}>
          <h3 className={`text-lg font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Interpretation Checklist</h3>
          <div className={`mt-3 grid gap-2 text-sm ${isLight ? "text-slate-700" : "text-slate-300"} md:grid-cols-3`}>
            <p>1. Compare measured value against EWG baseline first.</p>
            <p>2. Use legal limits as a second lens, not the primary signal.</p>
            <p>3. Check trend direction and data quality tags before conclusions.</p>
          </div>
        </section>
      </div>
    </section>
  );
}
