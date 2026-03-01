import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AddressAutocompleteSearch } from "../components/AddressAutocompleteSearch";
import { ContaminantBarChart } from "../components/ContaminantBarChart";
import { Phase2Map } from "../components/Phase2Map";
import { ScoreDisplayCard } from "../components/ScoreDisplayCard";
import { serviceAreas } from "../data/phase2Data";
import { fetchAddressWells, fetchScore, fetchScoreByWells, fetchWells } from "../services/api";
import { geocodeAddress } from "../services/geocoding";
import type {
  AddressWellLookupResponse,
  CategoryComparison,
  CategoryKey,
  ContaminantBarDatum,
  MultiContaminantSnapshot,
  ScoreResponse,
  WellServiceAreaFeature,
  WellSummary
} from "../types/phase2";
import { findZoneByPoint } from "../utils/geo";
import { formatPfasValue } from "../utils/pfas";
import { getColorFromScore } from "../utils/risk";
import { useThemeMode } from "../hooks/useThemeMode";

const chartCategoryOrder: CategoryKey[] = [
  "pfas",
  "nitrate",
  "chromium6",
  "radionuclides",
  "sodiumChloride",
  "voc"
];

function asNumber(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  return value;
}

function qualitySuffix(quality: string | undefined): string {
  switch ((quality || "").toLowerCase()) {
    case "measured":
      return " (measured)";
    case "estimated":
      return " (estimated)";
    case "upper_bound":
      return " (upper bound)";
    case "not_detected":
      return " (not detected)";
    case "not_reported":
      return " (not reported)";
    default:
      return "";
  }
}

function formatMeasurement(value: number | null | undefined, unit: string, quality?: string): string {
  if (value == null || Number.isNaN(value)) return "Not reported / Not available";
  return `${value} ${unit}${qualitySuffix(quality)}`;
}

function midpointFromRange(rangeText: string): number | null {
  const raw = (rangeText || "").trim();
  if (!raw) return null;

  const pairMatch = raw.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  if (pairMatch) {
    const low = Number.parseFloat(pairMatch[1]);
    const high = Number.parseFloat(pairMatch[2]);
    if (Number.isFinite(low) && Number.isFinite(high)) return (low + high) / 2;
  }

  const singleMatch = raw.match(/(\d+(?:\.\d+)?)/);
  if (singleMatch) {
    const value = Number.parseFloat(singleMatch[1]);
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function buildContaminantChartData(
  comparisons: Partial<Record<CategoryKey, CategoryComparison>> | undefined,
  availableCategories: CategoryKey[],
  contaminants: MultiContaminantSnapshot | null | undefined
): { data: ContaminantBarDatum[]; missingLabels: string[] } {
  const data: ContaminantBarDatum[] = [];
  const missingLabels: string[] = [];

  for (const key of chartCategoryOrder) {
    if (!availableCategories.includes(key)) continue;
    const comparison = comparisons?.[key];
    if (!comparison) {
      missingLabels.push(key.toUpperCase());
      continue;
    }

    const measured = asNumber(comparison.yourValue);
    const ewgGuideline = asNumber(comparison.ewgGuideline);
    const legalLimit = asNumber(comparison.legalLimit);
    if (measured == null) {
      missingLabels.push(`${comparison.label} (not reported)`);
      continue;
    }
    if (ewgGuideline == null && legalLimit == null) {
      missingLabels.push(`${comparison.label} (guidelines unavailable)`);
      continue;
    }

    data.push({
      key,
      label: comparison.label,
      unit: comparison.unit,
      measured: Number(measured.toFixed(4)),
      ewgGuideline: ewgGuideline == null ? null : Number(ewgGuideline.toFixed(4)),
      legalLimit: legalLimit == null ? null : Number(legalLimit.toFixed(4)),
      secondaryMeasured:
        key === "sodiumChloride" && asNumber(contaminants?.chloride_mg_l) != null
          ? Number((asNumber(contaminants?.chloride_mg_l) ?? 0).toFixed(4))
          : null,
      secondaryLabel: key === "sodiumChloride" ? "Chloride" : undefined,
      secondaryUnit: key === "sodiumChloride" ? "mg/L" : undefined,
      secondaryEwgGuideline: key === "sodiumChloride" ? null : undefined,
      secondaryLegalLimit: key === "sodiumChloride" ? 250 : undefined
    });
  }

  data.sort((a, b) => {
    const aRef = a.ewgGuideline ?? a.legalLimit ?? 0;
    const bRef = b.ewgGuideline ?? b.legalLimit ?? 0;
    const aRatio = aRef > 0 ? a.measured / aRef : 0;
    const bRatio = bRef > 0 ? b.measured / bRef : 0;
    return bRatio - aRatio;
  });
  return { data, missingLabels };
}

const METRIC_HELP: Record<string, string> = {
  "PFAS total": "Sum of reported PFAS compounds in parts per trillion (ppt).",
  Nitrate: "Nitrate concentration in mg/L. Higher values increase risk.",
  "Chromium-6": "Hexavalent chromium concentration in ug/L.",
  Radium: "Combined radium radioactivity in pCi/L.",
  "VOC index": "Aggregate volatile-organic-compound indicator in ug/L.",
  "Safety score (lower is worse)": "Category safety score normalized to 0-100. Lower means worse water quality.",
  "Risk score": "Risk index shown on a 0-100 scale for easier comparison."
};

function MetricLabel({
  label,
  isLight
}: {
  label: keyof typeof METRIC_HELP;
  isLight: boolean;
}): JSX.Element {
  const tooltipId = `metric-tip-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const tooltipClass = isLight
    ? "pointer-events-none absolute left-0 top-full z-[1400] mt-1 w-44 rounded-md border border-slate-300/85 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-800 opacity-0 shadow-lg shadow-slate-300/30 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
    : "pointer-events-none absolute left-0 top-full z-[1400] mt-1 w-44 rounded-md border border-slate-600/70 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-100 opacity-0 shadow-lg shadow-black/35 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100";
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>
      <span className="group relative inline-flex items-center">
        <span
          className={`inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold ${
            isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-200"
          }`}
          tabIndex={0}
          aria-label={`${label} info`}
          aria-describedby={tooltipId}
        >
          i
        </span>
        <span
          id={tooltipId}
          role="tooltip"
          className={tooltipClass}
        >
          {METRIC_HELP[label]}
        </span>
      </span>
      {label}:
    </span>
  );
}

export function Phase3Page(): JSX.Element {
  const [themeMode, setThemeMode] = useThemeMode();
  const [addressInput, setAddressInput] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<WellServiceAreaFeature | null>(null);
  const [scoreResponse, setScoreResponse] = useState<ScoreResponse | null>(null);
  const [addressMapping, setAddressMapping] = useState<AddressWellLookupResponse | null>(null);
  const [addressMappingError, setAddressMappingError] = useState<string | null>(null);

  const [wells, setWells] = useState<WellSummary[]>([]);
  const [wellsLoading, setWellsLoading] = useState(true);
  const [wellsError, setWellsError] = useState<string | null>(null);
  const searchRequestRef = useRef(0);
  const isLight = themeMode === "light";

  const wellsById = useMemo(() => Object.fromEntries(wells.map((well) => [well.id, well])), [wells]);

  useEffect(() => {
    let mounted = true;
    async function load(): Promise<void> {
      setWellsLoading(true);
      setWellsError(null);
      try {
        const response = await fetchWells();
        if (!mounted) return;
        setWells(response.wells);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Failed to load well dataset.";
        setWellsError(message);
      } finally {
        if (mounted) setWellsLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleAddressSubmit(address: string): Promise<void> {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setSearchError("Enter an address to score.");
      return;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearchLoading(true);
    setSearchError(null);
    setScoreError(null);
    setAddressMappingError(null);
    setScoreResponse(null);
    setAddressMapping(null);
    setResolvedAddress(null);
    setSelectedFeature(null);
    setSelectedWellId(null);

    try {
      const point = await geocodeAddress(trimmedAddress);
      if (requestId !== searchRequestRef.current) return;
      setSelectedPoint({ lat: point.lat, lng: point.lng });
      setResolvedAddress(point.formattedAddress);

      let mapping: AddressWellLookupResponse | null = null;
      try {
        mapping = await fetchAddressWells(point.formattedAddress);
        if (requestId !== searchRequestRef.current) return;
        setAddressMapping(mapping);
      } catch (error) {
        if (requestId !== searchRequestRef.current) return;
        const message = error instanceof Error ? error.message : "Failed to map address to city wells.";
        setAddressMappingError(message);
      }

      let score: ScoreResponse | null = null;
      const mappedWellIds = (mapping?.wellIds ?? []).filter((wellId) => Boolean(wellsById[String(wellId)]));
      if (mappedWellIds.length > 0) {
        const weightRows = mapping?.wellUsage ?? [];
        const rawWeights: Record<string, number> = {};
        for (const row of weightRows) {
          const wellId = String(row.wellId);
          if (!mappedWellIds.includes(wellId)) continue;
          const midpoint = midpointFromRange(row.percentUsageRange);
          rawWeights[wellId] = midpoint == null ? 0 : midpoint;
        }

        const hasValidWeights = Object.values(rawWeights).some((value) => Number.isFinite(value) && value > 0);
        const wellWeights: Record<string, number> = {};
        if (hasValidWeights) {
          for (const wellId of mappedWellIds) {
            wellWeights[wellId] = rawWeights[wellId] ?? 0;
          }
        } else {
          for (const wellId of mappedWellIds) {
            wellWeights[wellId] = 1;
          }
        }

        try {
          score = await fetchScoreByWells(mappedWellIds, wellWeights, `city-map:${mappedWellIds.join("-")}`);
        } catch (error) {
          if (requestId !== searchRequestRef.current) return;
          const message = error instanceof Error ? error.message : "Failed to load weighted score data.";
          setScoreError(message);
        }
      }

      if (!score) {
        try {
          score = await fetchScore(point.lat, point.lng);
        } catch (error) {
          if (requestId !== searchRequestRef.current) return;
          const message = error instanceof Error ? error.message : "Failed to load score data.";
          setScoreError(message);
          setScoreResponse(null);
          return;
        }
      }

      if (requestId !== searchRequestRef.current) return;
      setScoreResponse(score);

      const primaryWellId =
        (mapping?.wellIds ?? []).find((wellId) => serviceAreas.features.some((feature) => String(feature.properties.well_id) === String(wellId))) ??
        score.wellIds.find((wellId) => serviceAreas.features.some((feature) => String(feature.properties.well_id) === String(wellId))) ??
        null;
      if (primaryWellId) {
        setSelectedWellId(String(primaryWellId));
        const feature =
          serviceAreas.features.find((item) => String(item.properties.well_id) === String(primaryWellId)) ?? null;
        setSelectedFeature(feature);
      } else {
        const matched = findZoneByPoint(serviceAreas, point.lat, point.lng);
        if (matched) {
          setSelectedFeature(matched);
          setSelectedWellId(String(matched.properties.well_id));
        } else {
          setSelectedFeature(null);
          setSelectedWellId(null);
          setSearchError("Address scored successfully, but local service-area geometry had no direct match.");
        }
      }
    } catch (error) {
      if (requestId !== searchRequestRef.current) return;
      const message = error instanceof Error ? error.message : "Address lookup failed.";
      setSearchError(message);
      setScoreResponse(null);
      setSelectedPoint(null);
      setSelectedFeature(null);
      setSelectedWellId(null);
      setResolvedAddress(null);
    } finally {
      if (requestId === searchRequestRef.current) {
        setSearchLoading(false);
      }
    }
  }

  function handleZoneSelect(feature: WellServiceAreaFeature): void {
    const wellId = String(feature.properties.well_id);
    setSelectedFeature(feature);
    setSelectedWellId(wellId);
    setResolvedAddress(null);
    setSelectedPoint(null);
    setSearchError(null);
    setScoreError(null);
    setAddressMapping(null);
    setAddressMappingError(null);
    setScoreResponse(null);
  }

  const selectedWell = selectedWellId ? wellsById[selectedWellId] : undefined;
  const effectiveScore = scoreResponse?.score ?? selectedWell?.score ?? null;
  const effectiveGrade = scoreResponse?.grade ?? selectedWell?.grade ?? null;
  const effectiveZoneId = scoreResponse?.zoneId ?? selectedWell?.id ?? null;
  const effectiveWellIds = scoreResponse?.wellIds ?? (selectedWell ? [selectedWell.id] : []);
  const effectiveLastUpdated = scoreResponse?.lastUpdated ?? selectedWell?.latestTestDate ?? null;
  const effectiveComparisons = scoreResponse?.comparisons ?? selectedWell?.comparisons;
  const effectiveAvailableCategories = scoreResponse?.availableCategories ?? selectedWell?.availableCategories ?? [];
  const effectiveContaminants = scoreResponse?.contaminants ?? selectedWell?.contaminants ?? null;
  const effectiveWorstContaminant = scoreResponse?.worstContaminant ?? selectedWell?.worstContaminant ?? null;
  const chartModel = useMemo(
    () => buildContaminantChartData(effectiveComparisons, effectiveAvailableCategories, effectiveContaminants),
    [effectiveComparisons, effectiveAvailableCategories, effectiveContaminants]
  );

  const scoreColor = getColorFromScore(effectiveScore);
  const scoreSource = scoreResponse
    ? addressMapping?.wellIds?.length
      ? "City well mix (weighted)"
      : "Address geocode + /api/score"
    : selectedWell
      ? "Selected well"
      : "Not selected";
  const selectedWellHasPfas = Boolean(selectedWell?.availableCategories?.includes("pfas"));
  const panelClass = isLight
    ? "overflow-visible rounded-2xl border border-slate-300/90 bg-white/88 p-3 shadow-xl shadow-slate-300/40 backdrop-blur-md"
    : "overflow-visible rounded-2xl border border-slate-700/70 bg-slate-950/75 p-3 shadow-xl backdrop-blur-md";
  const topShellClass = isLight
    ? "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-300/90 bg-white/88 px-3 py-2 shadow-2xl shadow-slate-300/50 backdrop-blur-md"
    : "mx-auto flex max-w-[1280px] items-center justify-between rounded-2xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 shadow-2xl backdrop-blur-md";
  const overlayClass = isLight
    ? "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.14),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.12),transparent_28%),linear-gradient(to_bottom,rgba(248,250,252,0.34),rgba(241,245,249,0.18)_22%,rgba(226,232,240,0.28))]"
    : "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,165,233,0.2),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(34,197,94,0.14),transparent_28%),linear-gradient(to_bottom,rgba(2,6,23,0.45),rgba(2,6,23,0.25)_20%,rgba(2,6,23,0.55))]";
  const navLinkClass = isLight
    ? "rounded-lg border border-slate-300 bg-white/90 px-2 py-1 text-slate-700 hover:border-slate-400 hover:text-slate-900"
    : "rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 text-slate-200 hover:border-slate-500";
  const infoPillClass = isLight
    ? "pointer-events-none absolute bottom-4 left-4 z-[740] rounded-xl border border-slate-300/90 bg-white/88 px-3 py-2 text-xs text-slate-700 backdrop-blur-md"
    : "pointer-events-none absolute bottom-4 left-4 z-[740] rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 backdrop-blur-md";
  const detailsPanel = (
    <section className={`${panelClass} relative z-40`}>
      <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${isLight ? "text-slate-500" : "text-slate-300"}`}>
        Selected Zone Details
      </h3>
      {selectedFeature ? (
        <div className={`mt-2 space-y-0.5 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
          <p>
            <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Well:</span>{" "}
            {selectedFeature.properties.well_name} (ID{" "}
            {selectedFeature.properties.well_id})
          </p>
          <p>
            <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Area served:</span>{" "}
            {selectedFeature.properties.area_served_label ?? "Unknown"}
          </p>
          <p>
            <MetricLabel label="PFAS total" isLight={isLight} />{" "}
            {selectedWellHasPfas
              ? `${formatPfasValue(selectedWell?.contaminants.total_pfas_ppt)}${qualitySuffix(selectedWell?.quality?.pfas_total_ppt)}`
              : "Not reported / Not available"}
          </p>
          {selectedWell?.contaminants?.pfas_source_url ? (
            <p>
              <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>PFAS source:</span>{" "}
              <a
                className={isLight ? "text-sky-700 underline" : "text-cyan-300 underline"}
                href={selectedWell.contaminants.pfas_source_url}
                target="_blank"
                rel="noreferrer"
              >
                quality report
              </a>
            </p>
          ) : null}
          <p>
            <MetricLabel label="Nitrate" isLight={isLight} />{" "}
            {formatMeasurement(selectedWell?.contaminants.nitrate_mg_l, "mg/L", selectedWell?.quality?.nitrate_mg_l)}
          </p>
          <p>
            <MetricLabel label="Chromium-6" isLight={isLight} />{" "}
            {formatMeasurement(selectedWell?.contaminants.chromium6_ug_l, "ug/L", selectedWell?.quality?.chromium6_ug_l)}
          </p>
          <p>
            <MetricLabel label="Radium" isLight={isLight} />{" "}
            {formatMeasurement(selectedWell?.contaminants.radium_pci_l, "pCi/L", selectedWell?.quality?.radium_pci_l)}
          </p>
          <p>
            <MetricLabel label="VOC index" isLight={isLight} />{" "}
            {formatMeasurement(selectedWell?.contaminants.voc_ug_l, "ug/L", selectedWell?.quality?.voc_ug_l)}
          </p>
        </div>
      ) : (
        <p className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
          Search an address or click a zone to inspect details.
        </p>
      )}
    </section>
  );

  return (
    <section className={`relative h-screen w-screen overflow-hidden ${isLight ? "text-slate-900" : "text-slate-100"}`}>
      <Phase2Map
        geojson={serviceAreas}
        wellsById={wellsById}
        selectedWellId={selectedWellId}
        selectedWellIds={effectiveWellIds}
        selectedPoint={selectedPoint}
        onZoneSelect={handleZoneSelect}
        immersive
        theme={themeMode}
      />

      <div className={overlayClass} />

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-[900] p-2 md:p-3">
        <div className={`pointer-events-auto ${topShellClass}`}>
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
            <Link className={navLinkClass} to="/">
              Map
            </Link>
            <Link className={navLinkClass} to="/metrics">
              Metrics
            </Link>
            <Link className={navLinkClass} to="/scoring">
              Scoring
            </Link>
          </nav>
        </div>
      </header>

      <div className="pointer-events-none absolute left-0 right-0 top-[86px] z-[800] px-3 md:left-4 md:right-auto md:w-[340px] md:px-0">
        <div className="pointer-events-auto space-y-2">
          <section className={`relative z-[220] ${panelClass}`}>
            <AddressAutocompleteSearch
              value={addressInput}
              onValueChange={setAddressInput}
              onSubmit={handleAddressSubmit}
              isSubmitting={searchLoading}
              disabled={wellsLoading}
              theme={themeMode}
            />
          </section>

          {wellsLoading ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isLight ? "border-slate-300 bg-white/90 text-slate-600" : "border-slate-700 bg-slate-950/70 text-slate-300"
              }`}
            >
              Loading backend well dataset...
            </div>
          ) : null}
          {wellsError ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isLight ? "border-rose-500/40 bg-rose-100 text-rose-700" : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }`}
            >
              {wellsError}
            </div>
          ) : null}
          {searchError ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isLight ? "border-amber-500/40 bg-amber-100 text-amber-700" : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              {searchError}
            </div>
          ) : null}
          {addressMappingError ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isLight ? "border-amber-500/40 bg-amber-100 text-amber-700" : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              {addressMappingError}
            </div>
          ) : null}
          {scoreError ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isLight ? "border-rose-500/40 bg-rose-100 text-rose-700" : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }`}
            >
              {scoreError}
            </div>
          ) : null}

          {addressMapping?.wellUsage?.length ? (
            <section className={panelClass}>
              <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${isLight ? "text-slate-500" : "text-slate-300"}`}>
                Address-Well Mix
              </h3>
              <div className={`mt-2 space-y-0.5 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                {addressMapping.wellUsage.map((row) => (
                  <p key={`${row.wellId}-${row.percentUsageRange}`}>
                    <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Well {row.wellId}:</span>{" "}
                    {row.percentUsageRange}%
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <ScoreDisplayCard
            loading={searchLoading}
            error={scoreError}
            score={effectiveScore}
            grade={effectiveGrade}
            scoreColor={scoreColor}
            sourceLabel={scoreSource}
            resolvedAddress={resolvedAddress}
            zoneId={effectiveZoneId}
            wellIds={effectiveWellIds}
            lastUpdated={effectiveLastUpdated}
            theme={themeMode}
          />

          <section className={panelClass}>
            <h3 className={`text-xs font-semibold uppercase tracking-[0.14em] ${isLight ? "text-slate-500" : "text-slate-300"}`}>
              Worst Contaminant
            </h3>
            {effectiveWorstContaminant ? (
              <div className={`mt-2 space-y-0.5 text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                <p className={`text-base font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>{effectiveWorstContaminant.label}</p>
                <p>
                  <MetricLabel label="Risk score" isLight={isLight} />{" "}
                  {(effectiveWorstContaminant.risk * 100).toFixed(1)}
                </p>
              </div>
            ) : (
              <p className={`mt-2 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Worst-contaminant callout appears after score load.
              </p>
            )}
          </section>
        </div>
      </div>

      <aside className="pointer-events-none absolute bottom-4 right-4 top-[86px] z-[780] hidden w-[372px] lg:block">
        <div className="pointer-events-auto h-full space-y-2 overflow-y-auto pr-1">
          {detailsPanel}
          <ContaminantBarChart loading={searchLoading} data={chartModel.data} missingLabels={chartModel.missingLabels} theme={themeMode} />
        </div>
      </aside>

      <aside className="pointer-events-none absolute bottom-3 left-3 right-3 z-[820] max-h-[44vh] lg:hidden">
        <div className="pointer-events-auto h-full space-y-3 overflow-y-auto rounded-2xl">
          {detailsPanel}
          <ContaminantBarChart loading={searchLoading} data={chartModel.data} missingLabels={chartModel.missingLabels} theme={themeMode} />
        </div>
      </aside>

      <div className={infoPillClass}>
        Click a zone or well marker to inspect details. Search to re-center map.
      </div>
    </section>
  );
}
