import { useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ContaminantBarDatum } from "../types/phase2";

interface ContaminantBarChartProps {
  loading: boolean;
  data: ContaminantBarDatum[];
  missingLabels: string[];
  theme?: "dark" | "light";
}

interface RadarRow extends ContaminantBarDatum {
  axisLabel: string;
  ewgPercent: number | null;
  legalPercent: number | null;
  primaryPercent: number;
  cappedPrimaryPercent: number;
  cappedLegalPercent: number;
  boundaryPercent: number;
}

function toAxisLabel(label: string): string {
  if (label === "Sodium/Chloride") return "Sodium/Cl";
  if (label === "VOCs/Solvents") return "VOCs/Solv";
  return label;
}

function metricHelpText(key: ContaminantBarDatum["key"]): string {
  switch (key) {
    case "pfas":
      return "PFAS concentration relative to guideline thresholds.";
    case "nitrate":
      return "Nitrate concentration in mg/L compared to EWG/legal references.";
    case "chromium6":
      return "Hexavalent chromium concentration in ug/L.";
    case "radionuclides":
      return "Radioactive contaminant level (radium-focused) in pCi/L.";
    case "sodiumChloride":
      return "Salt-related category combining sodium/chloride pressure.";
    case "voc":
      return "Volatile organic compounds aggregate indicator in ug/L.";
    default:
      return "Category risk metric.";
  }
}

function CustomTooltip({
  active,
  payload,
  theme
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarRow }>;
  theme: "dark" | "light";
}): JSX.Element | null {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const isLight = theme === "light";

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs shadow-2xl ${
        isLight ? "border-slate-300 bg-white/95 text-slate-700" : "border-slate-700 bg-slate-950/95 text-slate-200"
      }`}
    >
      <p className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{row.label}</p>
      <p>Measured: {row.measured.toFixed(3)} {row.unit}</p>
      <p>EWG guideline: {row.ewgGuideline == null ? "N/A" : `${row.ewgGuideline.toFixed(3)} ${row.unit}`}</p>
      <p>Legal limit: {row.legalLimit == null ? "N/A" : `${row.legalLimit.toFixed(3)} ${row.unit}`}</p>
      <p>Of EWG guideline: {row.ewgPercent == null ? "N/A" : `${row.ewgPercent.toFixed(1)}%`}</p>
      <p>Of legal limit: {row.legalPercent == null ? "N/A" : `${row.legalPercent.toFixed(1)}%`}</p>
    </div>
  );
}

export function ContaminantBarChart({
  loading,
  data,
  missingLabels,
  theme = "dark"
}: ContaminantBarChartProps): JSX.Element {
  const [showLegalOverlay, setShowLegalOverlay] = useState(false);
  const isLight = theme === "light";
  const metricTooltipClass = isLight
    ? "pointer-events-none absolute left-0 top-full z-[1400] mt-1 w-44 rounded-md border border-slate-300/85 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-800 opacity-0 shadow-lg shadow-slate-300/30 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    : "pointer-events-none absolute left-0 top-full z-[1400] mt-1 w-44 rounded-md border border-slate-600/70 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-100 opacity-0 shadow-lg shadow-black/35 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";
  const palette = isLight
    ? {
        textHeading: "text-slate-500",
        textBody: "text-slate-500",
        section: "overflow-visible rounded-2xl border border-slate-300/90 bg-white/88 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-md",
        switchText: "text-slate-600",
        switchOff: "bg-slate-300",
        switchOn: "peer-checked:bg-sky-500",
        ewgLine: "border-sky-500",
        boundaryLine: "border-slate-400",
        legalLine: "border-orange-500",
        fillLegend: "border-sky-500/70 bg-sky-400/20",
        pulse: "bg-slate-200/90",
        empty: "text-slate-500",
        card: "overflow-visible rounded-lg border border-slate-300/90 bg-white/90 px-2.5 py-1.5 text-[11px] text-slate-600",
        cardTitle: "text-slate-900",
        legalText: "text-slate-500",
        missingText: "text-slate-500",
        chartGrid: "#94a3b8",
        chartAngleTick: "#334155",
        chartRadiusTick: "#475569",
        chartFill: "#0ea5e9",
        chartPrimary: "#0284c7",
        chartLegal: "#ea580c",
        chartBoundary: "#64748b"
      }
    : {
        textHeading: "text-slate-300",
        textBody: "text-slate-400",
        section: "overflow-visible rounded-2xl border border-slate-700/70 bg-slate-950/75 p-3 shadow-xl backdrop-blur-md",
        switchText: "text-slate-400",
        switchOff: "bg-slate-700",
        switchOn: "peer-checked:bg-cyan-500",
        ewgLine: "border-cyan-400",
        boundaryLine: "border-slate-500",
        legalLine: "border-orange-400",
        fillLegend: "border-cyan-300/60 bg-cyan-300/20",
        pulse: "bg-slate-800/70",
        empty: "text-slate-400",
        card: "overflow-visible rounded-lg border border-slate-700/70 bg-slate-900/80 px-2.5 py-1.5 text-[11px] text-slate-300",
        cardTitle: "text-slate-100",
        legalText: "text-slate-400",
        missingText: "text-slate-400",
        chartGrid: "#334155",
        chartAngleTick: "#cbd5e1",
        chartRadiusTick: "#94a3b8",
        chartFill: "#38bdf8",
        chartPrimary: "#22d3ee",
        chartLegal: "#f97316",
        chartBoundary: "#64748b"
      };

  const radarData = useMemo<RadarRow[]>(() => {
    return data
      .map((row) => {
        const ewgPercent = row.ewgGuideline != null && row.ewgGuideline > 0
          ? (row.measured / row.ewgGuideline) * 100
          : null;
        const legalPercent = row.legalLimit != null && row.legalLimit > 0
          ? (row.measured / row.legalLimit) * 100
          : null;
        const primaryPercent = ewgPercent ?? legalPercent ?? 0;
        return {
          ...row,
          axisLabel: toAxisLabel(row.label),
          ewgPercent,
          legalPercent,
          primaryPercent,
          cappedPrimaryPercent: Math.min(primaryPercent, 250),
          cappedLegalPercent: Math.min(legalPercent ?? primaryPercent, 250),
          boundaryPercent: 100
        };
      })
      .filter((row) => row.ewgPercent != null || row.legalPercent != null)
      .sort((a, b) => b.primaryPercent - a.primaryPercent);
  }, [data]);

  const hasAnyEwg = radarData.some((row) => row.ewgPercent != null);
  const useLegalFallback = !hasAnyEwg;
  const effectiveRadarData = useMemo<RadarRow[]>(() => {
    if (useLegalFallback) {
      return radarData
        .filter((row) => row.legalPercent != null)
        .map((row) => ({
          ...row,
          primaryPercent: row.legalPercent ?? 0,
          cappedPrimaryPercent: Math.min(row.legalPercent ?? 0, 250)
        }));
    }
    return radarData
      .filter((row) => row.ewgPercent != null)
      .map((row) => ({
        ...row,
        primaryPercent: row.ewgPercent ?? 0,
        cappedPrimaryPercent: Math.min(row.ewgPercent ?? 0, 250)
      }));
  }, [radarData, useLegalFallback]);

  return (
    <section className={palette.section}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${palette.textHeading}`}>
            Contaminant Risk Radar
          </h3>
          <p className={`mt-1 text-xs ${palette.textBody}`}>
            Baseline is EWG guideline (100% = at guideline).
          </p>
        </div>

        <label className={`inline-flex items-center gap-1.5 text-[11px] ${useLegalFallback ? "opacity-50" : ""}`}>
          <span className={palette.switchText}>Show legal limits</span>
          <span className="relative inline-flex h-5 w-10 items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={showLegalOverlay}
              disabled={useLegalFallback}
              onChange={(event) => setShowLegalOverlay(event.target.checked)}
            />
            <span className={`absolute inset-0 rounded-full transition ${palette.switchOff} ${palette.switchOn}`} />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {useLegalFallback ? (
        <p className={`mt-2 text-xs ${isLight ? "text-amber-700" : "text-amber-300"}`}>
          EWG guidelines are unavailable for current categories. Showing legal limits as fallback.
        </p>
      ) : null}

      <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] ${palette.textBody}`}>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-0 w-7 border-t-2 ${palette.ewgLine}`} />
          EWG guideline line
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-0 w-7 border-t-2 border-dashed ${palette.boundaryLine}`} />
          100% boundary
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-4 rounded-sm border ${palette.fillLegend}`} />
          Filled risk area
        </span>
        {showLegalOverlay && !useLegalFallback ? (
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-0 w-7 border-t-2 border-dashed ${palette.legalLine}`} />
            Legal limit line
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className={`mt-2 h-72 animate-pulse rounded-lg ${palette.pulse}`} />
      ) : null}

      {!loading && effectiveRadarData.length > 0 ? (
        <div className="mt-2 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              key={`radar-${showLegalOverlay ? "legal-on" : "legal-off"}-${useLegalFallback ? "legal" : "ewg"}`}
              cx="52%"
              cy="50%"
              outerRadius="67%"
              data={effectiveRadarData}
            >
              <PolarGrid stroke={palette.chartGrid} />
              <PolarAngleAxis dataKey="axisLabel" tick={{ fill: palette.chartAngleTick, fontSize: 11 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 250]}
                tick={{ fill: palette.chartRadiusTick, fontSize: 10 }}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip theme={theme} />} />
              <Radar
                name={useLegalFallback ? "% of legal limit (area)" : "% of EWG guideline (area)"}
                dataKey="cappedPrimaryPercent"
                stroke="transparent"
                fill={palette.chartFill}
                fillOpacity={0.22}
                isAnimationActive={false}
              />
              <Radar
                name={useLegalFallback ? "% of legal limit" : "% of EWG guideline"}
                dataKey="cappedPrimaryPercent"
                stroke={palette.chartPrimary}
                strokeWidth={2.2}
                fillOpacity={0}
                isAnimationActive={false}
              />
              {showLegalOverlay && !useLegalFallback && effectiveRadarData.some((row) => row.legalPercent != null) ? (
                <Radar
                  name="% of legal limit"
                  dataKey="cappedLegalPercent"
                  stroke={palette.chartLegal}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  fillOpacity={0}
                  isAnimationActive={false}
                />
              ) : null}
              <Radar
                name="100% limit boundary"
                dataKey="boundaryPercent"
                stroke={palette.chartBoundary}
                fillOpacity={0}
                strokeDasharray="4 4"
                isAnimationActive={false}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {!loading && effectiveRadarData.length === 0 ? (
        <p className={`mt-3 text-sm ${palette.empty}`}>
          No contaminant categories with measurable values and guidelines are available.
        </p>
      ) : null}

      {!loading && effectiveRadarData.length > 0 ? (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {effectiveRadarData.map((row) => {
            const primaryOver = row.primaryPercent > 100;
            return (
              <div key={row.key} className={palette.card}>
                <p className={`inline-flex items-center gap-1 font-semibold ${palette.cardTitle}`}>
                  <span className="group relative inline-flex items-center">
                    <span
                      className={`inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold ${
                        isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-200"
                      }`}
                      tabIndex={0}
                      aria-label={`${row.label} info`}
                      aria-describedby={`metric-card-tip-${row.key}`}
                    >
                      i
                    </span>
                    <span
                      id={`metric-card-tip-${row.key}`}
                      role="tooltip"
                      className={metricTooltipClass}
                    >
                      {metricHelpText(row.key)}
                    </span>
                  </span>
                  {row.label}
                </p>
                <p>
                  Measured: {row.measured.toFixed(3)} {row.unit}
                </p>
                <p
                  className={
                    primaryOver
                      ? isLight
                        ? "font-semibold text-rose-700"
                        : "font-semibold text-rose-300"
                      : isLight
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-emerald-300"
                  }
                >
                  {(useLegalFallback ? row.legalPercent : row.ewgPercent)?.toFixed(1)}% of{" "}
                  {useLegalFallback ? "legal limit" : "EWG guideline"} {primaryOver ? "(Over)" : "(Within)"}
                </p>
                {showLegalOverlay && !useLegalFallback ? (
                  <p className={palette.legalText}>
                    Legal view: {row.legalPercent == null ? "N/A" : `${row.legalPercent.toFixed(1)}%`}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}

      {!loading && missingLabels.length > 0 ? (
        <p className={`mt-3 text-xs ${palette.missingText}`}>
          Not reported / missing limit: {missingLabels.join(", ")}
        </p>
      ) : null}
    </section>
  );
}
