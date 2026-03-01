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

export type CategoryKey =
  | "pfas"
  | "nitrate"
  | "chromium6"
  | "radionuclides"
  | "sodiumChloride"
  | "violations"
  | "voc";

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

export interface AddressWellUsage {
  wellId: string;
  percentUsageRange: string;
  qualityReportUrl: string | null;
}

export interface AddressWellLookupResponse {
  source: string;
  queryAddress: string;
  request: {
    housenum: string;
    streetdir: string;
    streetname: string;
    streettype: string;
    municipality: string;
    submit: string;
  };
  notFound: boolean;
  parcelId: string | null;
  matchedAddress: string | null;
  wellIds: string[];
  wellUsage: AddressWellUsage[];
}

export interface CategoryComparison {
  label: string;
  unit: string;
  yourValue: number | null;
  madisonAverage: number | null;
  ewgGuideline: number | null;
  legalLimit: number | null;
  nationalReference: number | null;
  categoryScore?: number | null;
  available?: boolean;
}

export interface WorstContaminant {
  key: CategoryKey;
  label: string;
  score: number;
  risk: number;
}

export interface MultiContaminantSnapshot {
  total_pfas_ppt: number | null;
  pfoa_ppt: number | null;
  pfos_ppt: number | null;
  pfhxs_ppt: number | null;
  historical_max_pfas_ppt: number | null;
  pfas_status: string | null;
  nitrate_mg_l: number | null;
  chromium6_ug_l: number | null;
  sodium_mg_l: number | null;
  chloride_mg_l: number | null;
  radium_pci_l: number | null;
  voc_ug_l: number | null;
}

export interface WellSummary {
  id: string;
  name: string;
  lat: number;
  lng: number;
  score: number;
  grade: string;
  riskLevel: number;
  status: string;
  latestTestDate: string;
  violationCount: number;
  contaminants: MultiContaminantSnapshot;
  quality: Record<string, string>;
  availableCategories: CategoryKey[];
  categoryScores: Partial<Record<CategoryKey, number>>;
  worstContaminant: WorstContaminant;
  comparisons: Partial<Record<CategoryKey, CategoryComparison>>;
}

export interface WellsResponse {
  wells: WellSummary[];
}

export interface ScoreResponse {
  score: number;
  grade: string;
  wellIds: string[];
  zoneId: string;
  breakdown: Record<string, number>;
  limits: Partial<Record<CategoryKey, number>>;
  lastUpdated: string;
  outOfZone: boolean;
  availableCategories: CategoryKey[];
  categoryScores: Partial<Record<CategoryKey, number>>;
  contaminants: MultiContaminantSnapshot;
  worstContaminant: WorstContaminant;
  comparisons: Partial<Record<CategoryKey, CategoryComparison>>;
}
