export interface WellServiceAreaProperties {
  well_id: string;
  well_name: string;
  area_served_label?: string;
  geometry_basis?: string;
  source_map_url?: string;
}

export interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

export interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export type ZoneGeometry = PolygonGeometry | MultiPolygonGeometry;

export interface WellServiceAreaFeature {
  type: "Feature";
  properties: WellServiceAreaProperties;
  geometry: ZoneGeometry;
}

export interface WellServiceAreasGeoJson {
  type: "FeatureCollection";
  features: WellServiceAreaFeature[];
}

export type PfasStatus = "detected" | "not_detected" | "no_current_sample" | "unknown";

export interface PfasWellMetric {
  well_id: string;
  sample_date: string | null;
  pfoa_ppt: number | null;
  pfos_ppt: number | null;
  pfhxs_ppt: number | null;
  total_pfas_ppt: number | null;
  historical_max_pfas_ppt?: number | null;
  pfas_status?: PfasStatus | null;
  source_url: string | null;
}

export interface GeocodedPoint {
  formattedAddress: string;
  lat: number;
  lng: number;
}
