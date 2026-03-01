import { useEffect, useMemo, useRef, useState } from "react";
import { serviceAreas } from "../data/phase2Data";
import { Phase2Map } from "../components/Phase2Map";
import { geocodeAddress } from "../services/geocoding";
import { fetchAddressWells, fetchScore, fetchScoreByWells, fetchWells } from "../services/api";
import type {
  AddressWellLookupResponse,
  CategoryComparison,
  CategoryKey,
  ScoreResponse,
  WellServiceAreaFeature,
  WellSummary
} from "../types/phase2";
import { findZoneByPoint } from "../utils/geo";
import { CATEGORY_LABELS, getColorFromScore } from "../utils/risk";
import { formatPfasStatus, formatPfasValue } from "../utils/pfas";

function formatNumber(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) return "Not reported";
  return `${value} ${unit}`;
}

function formatComparison(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value} ${unit}`;
}

function formatComparisonByCategory(
  key: CategoryKey,
  value: number | null | undefined,
  unit: string,
  pfasStatus: string | null | undefined,
  isYourValue: boolean
): string {
  if (key === "pfas" && isYourValue) {
    if (pfasStatus === "not_detected") return "Not detected";
    if (pfasStatus === "no_current_sample" || pfasStatus === "unknown" || value == null) return "Not reported / Not available";
  }
  return formatComparison(value, unit);
}

const categoryOrder: CategoryKey[] = [
  "pfas",
  "nitrate",
  "chromium6",
  "radionuclides",
  "sodiumChloride",
  "violations",
  "voc"
];

export function Phase2Page(): JSX.Element {
  const [address, setAddress] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<WellServiceAreaFeature | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  const [wells, setWells] = useState<WellSummary[]>([]);
  const [wellsLoading, setWellsLoading] = useState(true);
  const [wellsError, setWellsError] = useState<string | null>(null);

  const [scoreResponse, setScoreResponse] = useState<ScoreResponse | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [addressMapping, setAddressMapping] = useState<AddressWellLookupResponse | null>(null);
  const [addressMappingError, setAddressMappingError] = useState<string | null>(null);
  const [selectedComparisonCategory, setSelectedComparisonCategory] = useState<CategoryKey | "">("");
  const searchRequestRef = useRef(0);

  const wellsById = useMemo(() => Object.fromEntries(wells.map((well) => [well.id, well])), [wells]);

  useEffect(() => {
    let mounted = true;

    async function loadWells(): Promise<void> {
      setWellsLoading(true);
      setWellsError(null);
      try {
        const response = await fetchWells();
        if (!mounted) return;
        setWells(response.wells);
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Failed to load well data.";
        setWellsError(message);
      } finally {
        if (mounted) setWellsLoading(false);
      }
    }

    loadWells();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    setSearchError(null);
    setScoreError(null);
    setAddressMappingError(null);
    setResolvedAddress(null);
    setScoreResponse(null);
    setAddressMapping(null);

    try {
      setLoadingSearch(true);
      const point = await geocodeAddress(address);
      if (requestId !== searchRequestRef.current) return;
      setSelectedPoint({ lat: point.lat, lng: point.lng });
      setResolvedAddress(point.formattedAddress);

      let mapping: AddressWellLookupResponse | null = null;
      try {
        mapping = await fetchAddressWells(point.formattedAddress);
        if (requestId !== searchRequestRef.current) return;
        setAddressMapping(mapping);
      } catch (mappingError) {
        if (requestId !== searchRequestRef.current) return;
        const message = mappingError instanceof Error ? mappingError.message : "Failed to map address to city wells.";
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
          if (requestId !== searchRequestRef.current) return;
          setScoreResponse(score);
        } catch (apiError) {
          if (requestId !== searchRequestRef.current) return;
          const message = apiError instanceof Error ? apiError.message : "Failed to fetch weighted score.";
          setScoreError(message);
        }
      }

      if (!score) {
        try {
          score = await fetchScore(point.lat, point.lng);
          if (requestId !== searchRequestRef.current) return;
          setScoreResponse(score);
        } catch (apiError) {
          if (requestId !== searchRequestRef.current) return;
          const message = apiError instanceof Error ? apiError.message : "Failed to fetch score.";
          setScoreError(message);
        }
      }

      const mappedWellId = mapping?.wellIds?.find((wellId) =>
        serviceAreas.features.some((feature) => String(feature.properties.well_id) === String(wellId))
      );
      if (mappedWellId) {
        const mappedFeature = serviceAreas.features.find(
          (feature) => String(feature.properties.well_id) === String(mappedWellId)
        ) ?? null;
        if (mappedFeature) {
          setSelectedFeature(mappedFeature);
          setSelectedWellId(String(mappedWellId));
          return;
        }
      }

      const matched = findZoneByPoint(serviceAreas, point.lat, point.lng);
      if (requestId !== searchRequestRef.current) return;
      if (matched) {
        setSelectedFeature(matched);
        setSelectedWellId(String(matched.properties.well_id));
      } else if (score?.wellIds?.length) {
        const fallbackWellId = String(score.wellIds[0]);
        setSelectedWellId(fallbackWellId);
        const fallbackFeature = serviceAreas.features.find((feature) => String(feature.properties.well_id) === fallbackWellId) ?? null;
        setSelectedFeature(fallbackFeature);
        setSearchError("Address resolved, but local zone geometry had no direct match. Showing nearest scored well.");
      } else {
        setSelectedFeature(null);
        setSelectedWellId(null);
        setSearchError("Address geocoded successfully, but no well service zone matched this location.");
      }
    } catch (lookupError) {
      if (requestId !== searchRequestRef.current) return;
      const message = lookupError instanceof Error ? lookupError.message : "Address lookup failed.";
      setSearchError(message);
      setSelectedFeature(null);
      setSelectedWellId(null);
      setScoreResponse(null);
    } finally {
      setLoadingSearch(false);
    }
  }

  function handleZoneSelect(feature: WellServiceAreaFeature): void {
    const wellId = String(feature.properties.well_id);
    setScoreResponse(null);
    setAddressMapping(null);
    setAddressMappingError(null);
    setResolvedAddress(null);
    setSelectedFeature(feature);
    setSelectedWellId(wellId);
    setSearchError(null);
  }

  const selectedWell = selectedWellId ? wellsById[selectedWellId] : undefined;
  const effectiveCategoryScores = scoreResponse?.categoryScores ?? selectedWell?.categoryScores;
  const effectiveWorst = scoreResponse?.worstContaminant ?? selectedWell?.worstContaminant;
  const effectiveComparisons = scoreResponse?.comparisons ?? selectedWell?.comparisons;
  const effectiveAvailableCategories = useMemo(
    () =>
      (scoreResponse?.availableCategories ?? selectedWell?.availableCategories ?? []).filter((key): key is CategoryKey =>
        categoryOrder.includes(key)
      ),
    [scoreResponse, selectedWell]
  );
  const scoreColor = getColorFromScore(scoreResponse?.score ?? selectedWell?.score ?? null);
  const selectedWellHasPfas = Boolean(selectedWell?.availableCategories?.includes("pfas"));

  useEffect(() => {
    if (effectiveAvailableCategories.length === 0) {
      setSelectedComparisonCategory("");
      return;
    }
    if (!selectedComparisonCategory || !effectiveAvailableCategories.includes(selectedComparisonCategory)) {
      setSelectedComparisonCategory(effectiveAvailableCategories[0]);
    }
  }, [effectiveAvailableCategories, selectedComparisonCategory]);

  const comparisonCategories = effectiveAvailableCategories.filter((key) => Boolean(effectiveComparisons?.[key]));
  const comparisonCategory = selectedComparisonCategory && comparisonCategories.includes(selectedComparisonCategory)
    ? selectedComparisonCategory
    : comparisonCategories[0];
  const comparisonItem = comparisonCategory ? (effectiveComparisons?.[comparisonCategory] as CategoryComparison | undefined) : undefined;
  const comparisonScore = comparisonCategory ? effectiveCategoryScores?.[comparisonCategory] : undefined;

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">TapMap Phase 2.1</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Multi-Contaminant Risk Intelligence</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          This upgrade adds real backend-scored risk for PFAS, nitrate, chromium-6, radionuclides, sodium/chloride,
          violations, and VOC context with per-address callouts.
        </p>
      </header>

      <form onSubmit={handleSearch} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto]">
        <input
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Enter Madison address (ex: 600 N Park St, Madison, WI)"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        <button
          type="submit"
          disabled={loadingSearch}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingSearch ? "Scoring..." : "Score Address"}
        </button>
      </form>

      {wellsLoading ? <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Loading backend well dataset...</div> : null}
      {wellsError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{wellsError}</div> : null}
      {searchError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{searchError}</div> : null}
      {scoreError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{scoreError}</div> : null}
      {addressMappingError ? <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{addressMappingError}</div> : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Phase2Map
          geojson={serviceAreas}
          wellsById={wellsById}
          selectedWellId={selectedWellId}
          selectedPoint={selectedPoint}
          onZoneSelect={handleZoneSelect}
        />

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Score Snapshot</h3>
            {(scoreResponse || selectedWell) ? (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ backgroundColor: scoreColor }}>
                  Score {(scoreResponse?.score ?? selectedWell?.score)?.toFixed(1)} ({scoreResponse?.grade ?? selectedWell?.grade})
                </div>
                <p><span className="font-semibold">Zone:</span> {scoreResponse?.zoneId ?? selectedWell?.id}</p>
                <p><span className="font-semibold">Wells:</span> {(scoreResponse?.wellIds ?? (selectedWell ? [selectedWell.id] : [])).join(", ")}</p>
                <p><span className="font-semibold">Out of zone fallback:</span> {scoreResponse?.outOfZone ? "Yes" : "No"}</p>
                <p><span className="font-semibold">Last updated:</span> {scoreResponse?.lastUpdated ?? selectedWell?.latestTestDate ?? "N/A"}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Search an address or click a zone to view score context.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Address-to-Well Mapping</h3>
            {addressMapping ? (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p><span className="font-semibold">Source:</span> City of Madison MyWells</p>
                <p><span className="font-semibold">Matched address:</span> {addressMapping.matchedAddress ?? "Not available"}</p>
                <p><span className="font-semibold">Parcel:</span> {addressMapping.parcelId ?? "Not available"}</p>
                {addressMapping.wellUsage.length > 0 ? (
                  <div className="space-y-1">
                    {addressMapping.wellUsage.map((row) => (
                      <p key={`${row.wellId}-${row.percentUsageRange}`}>
                        <span className="font-semibold">Well {row.wellId}:</span> {row.percentUsageRange}%
                        {row.qualityReportUrl ? (
                          <>
                            {" "}
                            <a className="text-sky-700 underline" href={row.qualityReportUrl} target="_blank" rel="noreferrer">
                              report
                            </a>
                          </>
                        ) : null}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No city well usage rows returned for this address.</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Search an address to fetch city well-service mapping.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Worst Contaminant</h3>
            {effectiveWorst ? (
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p className="text-base font-semibold text-slate-900">{effectiveWorst.label}</p>
                <p><span className="font-semibold">Category score:</span> {effectiveWorst.score.toFixed(1)}</p>
                <p><span className="font-semibold">Risk index:</span> {effectiveWorst.risk.toFixed(3)}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Worst-contaminant callout appears after scoring.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Selected Zone Details</h3>
            {selectedFeature ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p><span className="font-semibold">Well:</span> {selectedFeature.properties.well_name} (ID {selectedFeature.properties.well_id})</p>
                <p><span className="font-semibold">Area:</span> {selectedFeature.properties.area_served_label ?? "Unknown"}</p>
                <p>
                  <span className="font-semibold">PFAS status:</span>{" "}
                  {selectedWellHasPfas ? formatPfasStatus(selectedWell?.contaminants.pfas_status) : "Not reported / Not available"}
                </p>
                <p>
                  <span className="font-semibold">PFAS total:</span>{" "}
                  {selectedWellHasPfas ? formatPfasValue(selectedWell?.contaminants.total_pfas_ppt) : "Not reported / Not available"}
                </p>
                <p><span className="font-semibold">Nitrate:</span> {formatNumber(selectedWell?.contaminants.nitrate_mg_l, "mg/L")}</p>
                <p><span className="font-semibold">Chromium-6:</span> {formatNumber(selectedWell?.contaminants.chromium6_ug_l, "ug/L")}</p>
                <p><span className="font-semibold">Radium:</span> {formatNumber(selectedWell?.contaminants.radium_pci_l, "pCi/L")}</p>
                <p><span className="font-semibold">Sodium:</span> {formatNumber(selectedWell?.contaminants.sodium_mg_l, "mg/L")}</p>
                <p><span className="font-semibold">VOC Index:</span> {formatNumber(selectedWell?.contaminants.voc_ug_l, "ug/L")}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Click a zone or search an address to view details.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">7-Category Breakdown</h3>
          {effectiveCategoryScores ? (
            <div className="mt-4 space-y-3">
              {categoryOrder.map((key) => {
                const score = effectiveCategoryScores[key];
                const hasData = score != null && effectiveAvailableCategories.includes(key);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-slate-700">
                      <span>{CATEGORY_LABELS[key]}</span>
                      <span className="font-semibold">{hasData ? score.toFixed(1) : "N/A"}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      {hasData ? (
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: getColorFromScore(score) }}
                        />
                      ) : (
                        <div className="h-2 rounded-full bg-slate-300" style={{ width: "0%" }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Category bars populate after score load.</p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Well vs Madison vs Guideline</h3>
          {effectiveComparisons && comparisonItem && comparisonCategory ? (
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Category
                <select
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                  value={comparisonCategory}
                  onChange={(event) => setSelectedComparisonCategory(event.target.value as CategoryKey)}
                >
                  {comparisonCategories.map((key) => (
                    <option key={key} value={key}>
                      {CATEGORY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{comparisonItem.label}</p>
                <p>
                  Category score:{" "}
                  <span className="font-semibold">
                    {comparisonScore == null ? "N/A" : comparisonScore.toFixed(1)}
                  </span>
                </p>
                <p>
                  Your:{" "}
                  {formatComparisonByCategory(
                    comparisonCategory,
                    comparisonItem.yourValue,
                    comparisonItem.unit,
                    scoreResponse?.contaminants?.pfas_status ?? selectedWell?.contaminants?.pfas_status,
                    true
                  )}
                </p>
                <p>Madison avg: {formatComparison(comparisonItem.madisonAverage, comparisonItem.unit)}</p>
                <p>EWG guideline: {formatComparison(comparisonItem.ewgGuideline, comparisonItem.unit)}</p>
                <p>Legal limit: {formatComparison(comparisonItem.legalLimit, comparisonItem.unit)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Comparison panel appears after score load.</p>
          )}
        </section>
      </div>
    </section>
  );
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
