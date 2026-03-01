import { useEffect, useMemo } from "react";
import { CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, Tooltip, ZoomControl, useMap } from "react-leaflet";
import { divIcon, type Layer } from "leaflet";
import type { WellServiceAreaFeature, WellServiceAreasGeoJson, WellSummary } from "../types/phase2";
import { getColorFromScore } from "../utils/risk";
import { formatPfasStatus, formatPfasValue } from "../utils/pfas";

interface Phase2MapProps {
  geojson: WellServiceAreasGeoJson;
  wellsById: Record<string, WellSummary>;
  selectedWellId: string | null;
  selectedWellIds?: string[];
  selectedPoint: { lat: number; lng: number } | null;
  onZoneSelect: (feature: WellServiceAreaFeature) => void;
  immersive?: boolean;
  theme?: "dark" | "light";
}

interface WellMarkerRow {
  feature: WellServiceAreaFeature;
  wellId: string;
  well: WellSummary | undefined;
  lat: number;
  lng: number;
}

function formatNumber(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(value)) return "Not reported";
  return `${value} ${unit}`;
}

type BoundsTuple = [[number, number], [number, number]];

function computeGeoJsonBounds(geojson: WellServiceAreasGeoJson): BoundsTuple | null {
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  const visit = (coords: any): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      return;
    }
    for (const nested of coords) {
      visit(nested);
    }
  };

  for (const feature of geojson.features) {
    visit((feature as WellServiceAreaFeature).geometry.coordinates);
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(maxLat)
  ) {
    return null;
  }

  const latMargin = 0.015;
  const lngMargin = 0.02;
  return [
    [minLat - latMargin, minLng - lngMargin],
    [maxLat + latMargin, maxLng + lngMargin]
  ];
}

function geometryCenter(feature: WellServiceAreaFeature): [number, number] | null {
  const geometry = feature.geometry;
  const ring =
    geometry.type === "Polygon"
      ? geometry.coordinates?.[0]
      : geometry.coordinates?.[0]?.[0];
  if (!Array.isArray(ring) || ring.length === 0) return null;

  let latSum = 0;
  let lngSum = 0;
  let count = 0;
  for (const pair of ring) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const lng = Number(pair[0]);
    const lat = Number(pair[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    latSum += lat;
    lngSum += lng;
    count += 1;
  }
  if (count === 0) return null;
  return [latSum / count, lngSum / count];
}

function createWellMarkerIcon(color: string, selected: boolean, theme: "dark" | "light") {
  const ring = selected
    ? theme === "light"
      ? "#0369a1"
      : "#67e8f9"
    : theme === "light"
      ? "#1f2937"
      : "#e2e8f0";

  const glow = selected
    ? theme === "light"
      ? "0 0 0 4px rgba(2,132,199,0.22)"
      : "0 0 0 4px rgba(103,232,249,0.22)"
    : "none";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 28 34" aria-hidden="true">
      <path d="M14 32s10-9.2 10-17A10 10 0 1 0 4 15c0 7.8 10 17 10 17Z" fill="${color}" stroke="${ring}" stroke-width="2" style="filter: drop-shadow(${glow});"/>
      <rect x="9" y="12" width="10" height="7" rx="1.4" fill="rgba(255,255,255,0.92)" stroke="${ring}" stroke-width="1"/>
      <rect x="13" y="9" width="2" height="10" fill="${ring}"/>
      <rect x="8" y="12" width="12" height="2" fill="${ring}"/>
      <circle cx="14" cy="22" r="2.2" fill="${ring}"/>
    </svg>
  `;

  return divIcon({
    html: svg,
    className: "tapmap-well-marker-wrap",
    iconSize: [28, 34],
    iconAnchor: [14, 32],
    popupAnchor: [0, -28],
    tooltipAnchor: [0, -26]
  });
}

function MapFocus({ point }: { point: { lat: number; lng: number } | null }): null {
  const map = useMap();

  useEffect(() => {
    if (point) {
      map.flyTo([point.lat, point.lng], 12, { duration: 0.8 });
    }
  }, [map, point]);

  return null;
}

export function Phase2Map({
  geojson,
  wellsById,
  selectedWellId,
  selectedWellIds,
  selectedPoint,
  onZoneSelect,
  immersive = false,
  theme = "dark"
}: Phase2MapProps): JSX.Element {
  const madisonCenter: [number, number] = [43.0731, -89.4012];
  const isLight = theme === "light";
  const mapBounds = useMemo(() => computeGeoJsonBounds(geojson), [geojson]);
  const geoJsonVersionKey = useMemo(() => {
    const ids = Object.keys(wellsById).sort();
    return ids.join("|");
  }, [wellsById]);
  const highlightedWellIds = useMemo(() => {
    const ids = (selectedWellIds ?? []).map((value) => String(value));
    if (ids.length === 0 && selectedWellId) ids.push(String(selectedWellId));
    return new Set(ids);
  }, [selectedWellId, selectedWellIds]);
  const markerRows = useMemo<WellMarkerRow[]>(() => {
    const rows: WellMarkerRow[] = [];
    for (const feature of geojson.features) {
      const wellId = String(feature.properties.well_id);
      const well = wellsById[wellId];
      const geometryPoint = geometryCenter(feature);
      const lat = well?.lat ?? geometryPoint?.[0] ?? null;
      const lng = well?.lng ?? geometryPoint?.[1] ?? null;
      if (lat == null || lng == null) continue;
      rows.push({ feature, wellId, well, lat, lng });
    }
    return rows;
  }, [geojson.features, wellsById]);

  function onEachFeature(feature: any, layer: Layer): void {
    const typedFeature = feature as WellServiceAreaFeature;
    const props = typedFeature.properties;
    const well = wellsById[String(props.well_id)];

    if (!well) {
      layer.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 220px; line-height: 1.35;">
          <strong>${props.well_name}</strong><br/>
          Well ID: ${props.well_id}<br/>
          Area: ${props.area_served_label ?? "Unknown"}<br/>
          No backend well details loaded.
        </div>
      `);
    } else {
      const showPfas = well.availableCategories.includes("pfas");
      layer.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 240px; line-height: 1.35;">
          <strong>${props.well_name}</strong><br/>
          Well ID: ${props.well_id}<br/>
          Score: ${well.score} (${well.grade})<br/>
          Worst: ${well.worstContaminant.label}<br/>
          PFAS Status: ${showPfas ? formatPfasStatus(well.contaminants.pfas_status) : "Not reported / Not available"}<br/>
          PFAS Total: ${showPfas ? formatPfasValue(well.contaminants.total_pfas_ppt) : "Not reported / Not available"}<br/>
          Nitrate: ${formatNumber(well.contaminants.nitrate_mg_l, "mg/L")}<br/>
          Chromium-6: ${formatNumber(well.contaminants.chromium6_ug_l, "ug/L")}<br/>
          Radium: ${formatNumber(well.contaminants.radium_pci_l, "pCi/L")}<br/>
          Sodium: ${formatNumber(well.contaminants.sodium_mg_l, "mg/L")}<br/>
          Last sample: ${well.latestTestDate || "N/A"}
        </div>
      `);
    }

    layer.on({
      click: () => onZoneSelect(typedFeature)
    });
  }

  const mapContent = (
    <div className={`${immersive ? "h-full w-full" : "h-[520px] w-full"} ${isLight ? "tapmap-map-light" : "tapmap-map-dark"}`}>
      <MapContainer
        center={madisonCenter}
        zoom={11}
        className="h-full w-full"
        zoomControl={!immersive}
        bounds={mapBounds ?? undefined}
        maxBounds={mapBounds ?? undefined}
        maxBoundsViscosity={0.95}
      >
        <TileLayer
          attribution={
            immersive
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url={
            immersive
              ? isLight
                ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />

        {immersive ? <ZoomControl position="bottomright" /> : null}
        <MapFocus point={selectedPoint} />

        <GeoJSON
          key={`well-zones-${geoJsonVersionKey || "empty"}`}
          data={geojson as any}
          style={(feature: any) => {
            const typedFeature = feature as unknown as WellServiceAreaFeature;
            const wellId = String(typedFeature.properties.well_id);
            const well = wellsById[wellId];
            const selected = highlightedWellIds.has(wellId);
            const color = getColorFromScore(well?.score ?? null);

            return {
              color: selected && immersive ? (isLight ? "#0284c7" : "#7dd3fc") : color,
              fillColor: color,
              fillOpacity: selected ? (immersive ? 0.44 : 0.42) : immersive ? 0.18 : 0.24,
              weight: selected ? (immersive ? 3.2 : 3) : immersive ? 1.6 : 2
            };
          }}
          onEachFeature={onEachFeature}
        />

        {markerRows.map((row) => {
          const selected = highlightedWellIds.has(row.wellId);
          const color = getColorFromScore(row.well?.score ?? null);
          const showPfas = row.well?.availableCategories.includes("pfas") ?? false;

          return (
            <Marker
              key={`well-marker-${row.wellId}`}
              position={[row.lat, row.lng]}
              icon={createWellMarkerIcon(color, selected, theme)}
              eventHandlers={{
                click: () => onZoneSelect(row.feature)
              }}
            >
              <Tooltip direction="top" opacity={0.92} offset={[0, -24]}>
                {row.feature.properties.well_name}
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 240, lineHeight: 1.35 }}>
                  <strong>{row.feature.properties.well_name}</strong><br />
                  Well ID: {row.feature.properties.well_id}<br />
                  Area: {row.feature.properties.area_served_label ?? "Unknown"}<br />
                  {row.well ? (
                    <>
                      Score: {row.well.score} ({row.well.grade})<br />
                      Worst: {row.well.worstContaminant.label}<br />
                      PFAS Status: {showPfas ? formatPfasStatus(row.well.contaminants.pfas_status) : "Not reported / Not available"}<br />
                      PFAS Total: {showPfas ? formatPfasValue(row.well.contaminants.total_pfas_ppt) : "Not reported / Not available"}<br />
                      Nitrate: {formatNumber(row.well.contaminants.nitrate_mg_l, "mg/L")}<br />
                      Chromium-6: {formatNumber(row.well.contaminants.chromium6_ug_l, "ug/L")}<br />
                      Radium: {formatNumber(row.well.contaminants.radium_pci_l, "pCi/L")}<br />
                      Sodium: {formatNumber(row.well.contaminants.sodium_mg_l, "mg/L")}<br />
                      Last sample: {row.well.latestTestDate || "N/A"}
                    </>
                  ) : (
                    <>No backend well details loaded.</>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {selectedPoint ? (
          <CircleMarker
            center={[selectedPoint.lat, selectedPoint.lng]}
            radius={immersive ? 9 : 8}
            pathOptions={{
              color: isLight ? "#0369a1" : "#38bdf8",
              fillColor: isLight ? "#0ea5e9" : "#7dd3fc",
              fillOpacity: 0.95
            }}
          >
            <Popup>Searched address location</Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
    </div>
  );

  if (immersive) return mapContent;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">Well Service Areas - Composite Risk Overlay</h3>
      </div>
      {mapContent}
    </div>
  );
}
