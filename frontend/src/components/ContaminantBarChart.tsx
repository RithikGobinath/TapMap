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
import type { CategoryKey, ContaminantBarDatum } from "../types/phase2";

interface ContaminantBarChartProps {
  loading: boolean;
  data: ContaminantBarDatum[];
  missingLabels: string[];
  theme?: "dark" | "light";
}

interface LegalReferenceMeta {
  hasFederalMcl: boolean;
  legalReferenceLabel: string;
}

interface RadarRow extends ContaminantBarDatum {
  axisLabel: string;
  ewgPercent: number | null;
  legalPercent: number | null;
  federalLegalPercent: number | null;
  primaryPercent: number;
  cappedPrimaryPercent: number;
  cappedLegalPercent: number;
  cappedFederalLegalPercent: number | null;
  boundaryPercent: number;
  hasFederalMcl: boolean;
  legalReferenceLabel: string;
}

const RADAR_CAP_PERCENT = 250;

const LEGAL_REFERENCE_BY_KEY: Record<CategoryKey, LegalReferenceMeta> = {
  pfas: {
    hasFederalMcl: false,
    legalReferenceLabel: "PFAS total has no single federal MCL (compound-specific limits vary).",
  },
  nitrate: {
    hasFederalMcl: true,
    legalReferenceLabel: "Federal nitrate MCL.",
  },
  chromium6: {
    hasFederalMcl: false,
    legalReferenceLabel: "Hexavalent chromium has no federal MCL (EWG/CA health goal context).",
  },
  radionuclides: {
    hasFederalMcl: true,
    legalReferenceLabel: "Federal MCL for combined radium (226+228).",
  },
  sodiumChloride: {
    hasFederalMcl: false,
    legalReferenceLabel: "Sodium uses EPA advisory guidance (not enforceable).",
  },
  violations: {
    hasFederalMcl: false,
    legalReferenceLabel: "Operational trend indicator (not a contaminant MCL).",
  },
  voc: {
    hasFederalMcl: true,
    legalReferenceLabel: "Federal VOC MCL reference (category aggregate).",
  },
};

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

function formatMeasurementValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10) {
    return Math.round(value).toLocaleString();
  }
  if (abs >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatReferenceValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  if (abs >= 1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  if (abs >= 0.1) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (abs >= 0.01) {
    return value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
}

function formatExactPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatDisplayPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  if (value > 1000) return ">1,000%";
  if (value > 100) {
    return `${Math.round(value).toLocaleString()}%`;
  }
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function ValueWithUnit({ value, unit }: { value: number; unit: string }): JSX.Element {
  return (
    <span className="whitespace-nowrap">
      {formatMeasurementValue(value)} {unit}
    </span>
  );
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
      <p>Measured: {formatMeasurementValue(row.measured)} {row.unit}</p>
      {row.secondaryMeasured != null && row.secondaryLabel ? (
        <p>
          {row.secondaryLabel}: {formatMeasurementValue(row.secondaryMeasured)} {row.secondaryUnit ?? row.unit}
        </p>
      ) : null}
      <p>
        EWG guideline: {row.ewgGuideline == null ? "N/A" : `${formatReferenceValue(row.ewgGuideline)} ${row.unit}`}
      </p>
      <p>
        Legal limit: {row.legalLimit == null ? "N/A" : `${formatReferenceValue(row.legalLimit)} ${row.unit}`}
      </p>
      <p>Of EWG guideline: {formatDisplayPercent(row.ewgPercent)} (actual {formatExactPercent(row.ewgPercent)})</p>
      <p>Of legal limit: {formatDisplayPercent(row.legalPercent)} (actual {formatExactPercent(row.legalPercent)})</p>
      {!row.hasFederalMcl ? <p>Legal note: {row.legalReferenceLabel}</p> : null}
      {row.primaryPercent > RADAR_CAP_PERCENT ? (
        <p>Chart cap: plotted at {RADAR_CAP_PERCENT}% for readability.</p>
      ) : null}
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
        const legalMeta = LEGAL_REFERENCE_BY_KEY[row.key];
        const ewgPercent = row.ewgGuideline != null && row.ewgGuideline > 0
          ? (row.measured / row.ewgGuideline) * 100
          : null;
        const legalPercent = row.legalLimit != null && row.legalLimit > 0
          ? (row.measured / row.legalLimit) * 100
          : null;
        const primaryPercent = ewgPercent ?? legalPercent ?? 0;
        const federalLegalPercent = legalMeta.hasFederalMcl ? legalPercent : null;

        return {
          ...row,
          axisLabel: toAxisLabel(row.label),
          ewgPercent,
          legalPercent,
          federalLegalPercent,
          primaryPercent,
          cappedPrimaryPercent: Math.min(primaryPercent, RADAR_CAP_PERCENT),
          cappedLegalPercent: Math.min(legalPercent ?? primaryPercent, RADAR_CAP_PERCENT),
          cappedFederalLegalPercent:
            federalLegalPercent == null ? null : Math.min(federalLegalPercent, RADAR_CAP_PERCENT),
          boundaryPercent: 100,
          hasFederalMcl: legalMeta.hasFederalMcl,
          legalReferenceLabel: legalMeta.legalReferenceLabel,
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
          cappedPrimaryPercent: Math.min(row.legalPercent ?? 0, RADAR_CAP_PERCENT)
        }));
    }
    return radarData
      .filter((row) => row.ewgPercent != null)
      .map((row) => ({
        ...row,
        primaryPercent: row.ewgPercent ?? 0,
        cappedPrimaryPercent: Math.min(row.ewgPercent ?? 0, RADAR_CAP_PERCENT)
      }));
  }, [radarData, useLegalFallback]);

  const cappedLabels = useMemo(
    () => effectiveRadarData.filter((row) => row.primaryPercent > RADAR_CAP_PERCENT).map((row) => row.label),
    [effectiveRadarData]
  );
  const showFederalLegalOverlay =
    showLegalOverlay && !useLegalFallback && effectiveRadarData.some((row) => row.cappedFederalLegalPercent != null);

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
        {showFederalLegalOverlay ? (
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
              key={`radar-${showFederalLegalOverlay ? "legal-on" : "legal-off"}-${useLegalFallback ? "legal" : "ewg"}`}
              cx="52%"
              cy="50%"
              outerRadius="67%"
              data={effectiveRadarData}
            >
              <PolarGrid stroke={palette.chartGrid} />
              <PolarAngleAxis dataKey="axisLabel" tick={{ fill: palette.chartAngleTick, fontSize: 11 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, RADAR_CAP_PERCENT]}
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
              {showFederalLegalOverlay ? (
                <Radar
                  name="% of legal limit"
                  dataKey="cappedFederalLegalPercent"
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

      {!loading && cappedLabels.length > 0 ? (
        <p className={`mt-1 text-[11px] ${palette.textBody}`}>
          Chart scale is capped at {RADAR_CAP_PERCENT}% for readability: {cappedLabels.join(", ")}. Exact values are shown in cards.
        </p>
      ) : null}

      {!loading && effectiveRadarData.length > 0 ? (
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {effectiveRadarData.map((row) => {
            const primaryPercent = useLegalFallback ? row.legalPercent : row.ewgPercent;
            const primaryOver = (primaryPercent ?? 0) > 100;
            const primaryTitle =
              primaryPercent != null
                ? `Actual: ${formatExactPercent(primaryPercent)} - measured ${formatMeasurementValue(row.measured)} ${row.unit} vs ${
                    useLegalFallback
                      ? "legal limit"
                      : "EWG guideline"
                  }`
                : undefined;
            const chlorideLegalPercent =
              row.secondaryMeasured != null && row.secondaryLegalLimit != null && row.secondaryLegalLimit > 0
                ? (row.secondaryMeasured / row.secondaryLegalLimit) * 100
                : null;

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
                {row.key === "sodiumChloride" && row.secondaryMeasured != null ? (
                  <>
                    <p>
                      Measured sodium: <ValueWithUnit value={row.measured} unit={row.unit} />
                    </p>
                    <p>
                      Measured {row.secondaryLabel?.toLowerCase() ?? "chloride"}:{" "}
                      <ValueWithUnit value={row.secondaryMeasured} unit={row.secondaryUnit ?? row.unit} />
                    </p>
                  </>
                ) : (
                  <p>
                    Measured: <ValueWithUnit value={row.measured} unit={row.unit} />
                  </p>
                )}
                <p className={palette.legalText}>
                  EWG guideline:{" "}
                  {row.ewgGuideline == null ? (
                    "N/A"
                  ) : (
                    <span className="whitespace-nowrap">
                      {formatReferenceValue(row.ewgGuideline)} {row.unit}
                    </span>
                  )}
                </p>
                <p
                  title={primaryTitle}
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
                  <span className="whitespace-nowrap">
                    {formatDisplayPercent(primaryPercent)} of {useLegalFallback ? "legal limit" : "EWG guideline"}
                  </span>{" "}
                  <span className="whitespace-nowrap">{primaryOver ? "(Over)" : "(Within)"}</span>
                </p>
                {showLegalOverlay && !useLegalFallback ? (
                  row.hasFederalMcl ? (
                    <p className={palette.legalText}>
                      Legal view:{" "}
                      {row.legalPercent == null ? "N/A" : <span className="whitespace-nowrap">{`${formatDisplayPercent(row.legalPercent)} of MCL`}</span>}
                    </p>
                  ) : (
                    <p className={palette.legalText}>
                      Legal view: No federal limit. {row.legalReferenceLabel}
                    </p>
                  )
                ) : null}
                {showLegalOverlay && !useLegalFallback && row.key === "sodiumChloride" && chlorideLegalPercent != null ? (
                  <p className={palette.legalText}>
                    Chloride view: {formatDisplayPercent(chlorideLegalPercent)} of{" "}
                    <span className="whitespace-nowrap">250 mg/L</span> (secondary standard)
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
