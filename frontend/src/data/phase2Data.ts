import serviceAreasRaw from "./well_service_areas.json";
import type { WellServiceAreasGeoJson } from "../types/phase2";

export const serviceAreas = serviceAreasRaw as WellServiceAreasGeoJson;
