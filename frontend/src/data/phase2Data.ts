import serviceAreasRaw from "./well_service_areas.json";
import pfasRaw from "./pfas_well_latest.json";
import type { PfasWellMetric, WellServiceAreasGeoJson } from "../types/phase2";

export const serviceAreas = serviceAreasRaw as WellServiceAreasGeoJson;
export const pfasWellMetrics = pfasRaw as PfasWellMetric[];
