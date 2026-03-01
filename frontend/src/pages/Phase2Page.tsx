import { useMemo, useState } from "react";
import { serviceAreas, pfasWellMetrics } from "../data/phase2Data";
import { Phase2Map } from "../components/Phase2Map";
import { geocodeAddress } from "../services/geocoding";
import type { WellServiceAreaFeature } from "../types/phase2";
import { findZoneByPoint } from "../utils/geo";
import { getRiskBand } from "../utils/risk";
import { formatPfasStatus, formatPfasValue } from "../utils/pfas";

export function Phase2Page(): JSX.Element {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWellId, setSelectedWellId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<WellServiceAreaFeature | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  const pfasByWell = useMemo(
    () =>
      Object.fromEntries(
        pfasWellMetrics.map((entry) => [String(entry.well_id), entry])
      ),
    []
  );

  async function handleSearch(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setResolvedAddress(null);

    try {
      setLoading(true);
      const point = await geocodeAddress(address);
      setSelectedPoint({ lat: point.lat, lng: point.lng });
      setResolvedAddress(point.formattedAddress);

      const matched = findZoneByPoint(serviceAreas, point.lat, point.lng);
      if (!matched) {
        setSelectedFeature(null);
        setSelectedWellId(null);
        setError("Address geocoded successfully, but no well service zone matched this location.");
        return;
      }

      setSelectedFeature(matched);
      setSelectedWellId(String(matched.properties.well_id));
    } catch (searchError) {
      const message = searchError instanceof Error ? searchError.message : "Address lookup failed.";
      setError(message);
      setSelectedFeature(null);
      setSelectedWellId(null);
    } finally {
      setLoading(false);
    }
  }

  function handleZoneSelect(feature: WellServiceAreaFeature): void {
    setSelectedFeature(feature);
    setSelectedWellId(String(feature.properties.well_id));
    setError(null);
  }

  const selectedMetric = selectedWellId ? pfasByWell[selectedWellId] : undefined;
  const selectedRisk = getRiskBand(selectedMetric);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-amber-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">TapMap Phase 2</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Risk Map + Zone Lookup</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          This page implements Phase 2 frontend duties: map overlays from well service area GeoJSON, risk color coding,
          zone popups, and address geocoding to identify the serving zone.
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
          disabled={loading}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Geocoding..." : "Find Zone"}
        </button>
      </form>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Phase2Map
          geojson={serviceAreas}
          pfasByWell={pfasByWell}
          selectedWellId={selectedWellId}
          selectedPoint={selectedPoint}
          onZoneSelect={handleZoneSelect}
        />

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Lookup Result</h3>
            {resolvedAddress ? <p className="mt-2 text-sm text-slate-700">{resolvedAddress}</p> : <p className="mt-2 text-sm text-slate-500">No address searched yet.</p>}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Selected Zone</h3>
            {selectedFeature ? (
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p><span className="font-semibold">Well:</span> {selectedFeature.properties.well_name} (ID {selectedFeature.properties.well_id})</p>
                <p><span className="font-semibold">Area:</span> {selectedFeature.properties.area_served_label ?? "Unknown"}</p>
                <p><span className="font-semibold">Risk band:</span> {selectedRisk}</p>
                <p><span className="font-semibold">PFAS status:</span> {formatPfasStatus(selectedMetric?.pfas_status)}</p>
                <p><span className="font-semibold">PFAS total:</span> {formatPfasValue(selectedMetric?.total_pfas_ppt)}</p>
                <p><span className="font-semibold">Historical max:</span> {formatPfasValue(selectedMetric?.historical_max_pfas_ppt)}</p>
                <p><span className="font-semibold">Last sample:</span> {selectedMetric?.sample_date ?? "N/A"}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Click a zone or search an address to view details.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">Risk Legend</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li><span className="font-semibold text-green-700">Low</span>: &lt; 4 ppt total PFAS</li>
              <li><span className="font-semibold text-yellow-700">Moderate</span>: 4 - 7.99 ppt</li>
              <li><span className="font-semibold text-orange-700">Elevated</span>: 8 - 11.99 ppt</li>
              <li><span className="font-semibold text-red-700">High</span>: 12+ ppt</li>
              <li><span className="font-semibold text-slate-600">Unknown</span>: missing data</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
