import { useEffect } from "react";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Layer } from "leaflet";
import type { PfasWellMetric, WellServiceAreaFeature, WellServiceAreasGeoJson } from "../types/phase2";
import { getRiskColor } from "../utils/risk";
import { formatPfasStatus, formatPfasValue } from "../utils/pfas";

interface Phase2MapProps {
  geojson: WellServiceAreasGeoJson;
  pfasByWell: Record<string, PfasWellMetric>;
  selectedWellId: string | null;
  selectedPoint: { lat: number; lng: number } | null;
  onZoneSelect: (feature: WellServiceAreaFeature) => void;
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

export function Phase2Map({ geojson, pfasByWell, selectedWellId, selectedPoint, onZoneSelect }: Phase2MapProps): JSX.Element {
  const madisonCenter: [number, number] = [43.0731, -89.4012];

  function onEachFeature(feature: any, layer: Layer): void {
    const typedFeature = feature as WellServiceAreaFeature;
    const props = typedFeature.properties;
    const metric = pfasByWell[String(props.well_id)];

    layer.bindPopup(`
      <div style="font-family: Inter, sans-serif; min-width: 220px; line-height: 1.35;">
        <strong>${props.well_name}</strong><br/>
        Well ID: ${props.well_id}<br/>
        Area: ${props.area_served_label ?? "Unknown"}<br/>
        PFAS Status: ${formatPfasStatus(metric?.pfas_status)}<br/>
        PFAS Total: ${formatPfasValue(metric?.total_pfas_ppt)}<br/>
        Historical Max: ${formatPfasValue(metric?.historical_max_pfas_ppt)}<br/>
        PFOA: ${formatPfasValue(metric?.pfoa_ppt)}<br/>
        PFOS: ${formatPfasValue(metric?.pfos_ppt)}<br/>
        PFHxS: ${formatPfasValue(metric?.pfhxs_ppt)}<br/>
        Last sample: ${metric?.sample_date ?? "N/A"}
      </div>
    `);

    layer.on({
      click: () => onZoneSelect(typedFeature)
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-base font-semibold text-slate-900">Well Service Areas - Risk Overlay</h3>
      </div>
      <div className="h-[520px] w-full">
        <MapContainer center={madisonCenter} zoom={11} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFocus point={selectedPoint} />

          <GeoJSON
            data={geojson as any}
            style={(feature: any) => {
              const typedFeature = feature as unknown as WellServiceAreaFeature;
              const wellId = String(typedFeature.properties.well_id);
              const metric = pfasByWell[wellId];
              const selected = selectedWellId === wellId;
              const color = getRiskColor(metric);

              return {
                color,
                fillColor: color,
                fillOpacity: selected ? 0.38 : 0.22,
                weight: selected ? 3 : 2
              };
            }}
            onEachFeature={onEachFeature}
          />

          {selectedPoint ? (
            <CircleMarker center={[selectedPoint.lat, selectedPoint.lng]} radius={8} pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.9 }}>
              <Popup>Searched address location</Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}
