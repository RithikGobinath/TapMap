import { Link } from "react-router-dom";
import { useThemeMode } from "../hooks/useThemeMode";

const scoringSteps = [
  {
    title: "1. Normalize each metric",
    body: "Every contaminant value is converted against its guideline reference so very different units can be compared in one model."
  },
  {
    title: "2. Compute category safety score",
    body: "Each category gets a safety score from 0-100. Lower means worse quality pressure; higher means cleaner relative position."
  },
  {
    title: "3. Apply address well mixing",
    body: "When address-to-well mix is available, TapMap weights each well contribution by usage range before final score rollup."
  },
  {
    title: "4. Build composite snapshot",
    body: "The app combines available categories into overall score, grade, and worst-contaminant callout for explainable decision support."
  }
];

const scoreBands = [
  { label: "90-100", grade: "A", meaning: "Excellent" },
  { label: "80-89", grade: "B", meaning: "Good" },
  { label: "70-79", grade: "C", meaning: "Moderate" },
  { label: "60-69", grade: "D", meaning: "Elevated concern" },
  { label: "0-59", grade: "F", meaning: "High concern" }
];

function gradeBadgeClass(grade: string, isLight: boolean): string {
  if (grade === "A") return isLight ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-emerald-500/20 text-emerald-200 border-emerald-400/40";
  if (grade === "B") return isLight ? "bg-lime-100 text-lime-800 border-lime-300" : "bg-lime-500/20 text-lime-200 border-lime-400/40";
  if (grade === "C") return isLight ? "bg-amber-100 text-amber-800 border-amber-300" : "bg-amber-500/20 text-amber-200 border-amber-400/40";
  if (grade === "D") return isLight ? "bg-orange-100 text-orange-800 border-orange-300" : "bg-orange-500/20 text-orange-200 border-orange-400/40";
  return isLight ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-rose-500/20 text-rose-200 border-rose-400/40";
}

export function ScoringPage(): JSX.Element {
  const [themeMode, setThemeMode] = useThemeMode();
  const isLight = themeMode === "light";

  const pageClass = isLight
    ? "min-h-screen bg-[radial-gradient(circle_at_8%_0%,rgba(14,165,233,0.13),transparent_34%),radial-gradient(circle_at_88%_8%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#f8fafc,#ecfeff)] text-slate-900"
    : "min-h-screen bg-[radial-gradient(circle_at_12%_0%,rgba(14,165,233,0.2),transparent_32%),radial-gradient(circle_at_86%_12%,rgba(34,197,94,0.14),transparent_26%),linear-gradient(180deg,#030712,#020617)] text-slate-100";

  const topShellClass = isLight
    ? "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-300/90 bg-white/88 px-3 py-2 shadow-2xl shadow-slate-300/50 backdrop-blur-md"
    : "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-md";
  const navLinkClass = isLight
    ? "rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-slate-700 hover:border-slate-400 hover:text-slate-900"
    : "rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-slate-200 hover:border-slate-500";

  const panelClass = isLight
    ? "rounded-2xl border border-slate-300/90 bg-white/86 p-5 shadow-lg shadow-slate-300/30 backdrop-blur"
    : "rounded-2xl border border-slate-700/70 bg-slate-950/72 p-5 shadow-2xl backdrop-blur";

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
        <section className={panelClass}>
          <h2 className={`text-3xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Scoring Pipeline</h2>
          <p className={`mt-3 max-w-3xl text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
            TapMap focuses on explainable risk scoring. You can trace every displayed score back to category values,
            guidelines, and (for addresses) the local well mix percentages.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {scoringSteps.map((step) => (
              <article
                key={step.title}
                className={`rounded-xl border p-4 ${
                  isLight ? "border-slate-300/80 bg-white/80" : "border-slate-700/70 bg-slate-900/70"
                }`}
              >
                <h3 className={`text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{step.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className={panelClass}>
            <h3 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Address Mix Formula</h3>
            <div className={`mt-3 rounded-xl border px-4 py-3 font-mono text-sm ${isLight ? "border-slate-300/85 bg-slate-100 text-slate-800" : "border-slate-700/75 bg-slate-900/70 text-slate-100"}`}>
              Final Score = sum(well_score × normalized_weight)
            </div>
            <p className={`mt-3 text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              If the city mapping returns 3 wells with usage ranges, TapMap estimates midpoint weights, normalizes them,
              and computes a weighted blend. If weights are missing, wells are blended equally as a safe fallback.
            </p>
            <p className={`mt-3 text-sm leading-6 ${isLight ? "text-slate-700" : "text-slate-300"}`}>
              This keeps address snapshots honest to service reality instead of pretending every address receives water
              from one single well.
            </p>
          </article>

          <article className={panelClass}>
            <h3 className={`text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>Score Bands</h3>
            <div className="mt-3 space-y-2">
              {scoreBands.map((band) => (
                <div
                  key={band.label}
                  className={`grid grid-cols-[1fr_auto_1fr] items-center rounded-lg border px-3 py-2 text-sm ${
                    isLight ? "border-slate-300/80 bg-white/80 text-slate-700" : "border-slate-700/70 bg-slate-900/70 text-slate-200"
                  }`}
                >
                  <span className={`justify-self-start ${isLight ? "font-semibold text-slate-900" : "font-semibold text-slate-100"}`}>{band.label}</span>
                  <span
                    className={`inline-flex min-w-[68px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${gradeBadgeClass(
                      band.grade,
                      isLight
                    )}`}
                  >
                    Grade {band.grade}
                  </span>
                  <span className="justify-self-end text-right">{band.meaning}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
