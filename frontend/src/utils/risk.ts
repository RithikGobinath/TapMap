import type { PfasWellMetric } from "../types/phase2";

export function getRiskBand(metric: PfasWellMetric | undefined): "low" | "moderate" | "elevated" | "high" | "unknown" {
  const total = metric?.total_pfas_ppt;

  if (total == null || Number.isNaN(total)) return "unknown";
  if (total < 4) return "low";
  if (total < 8) return "moderate";
  if (total < 12) return "elevated";
  return "high";
}

export function getRiskColor(metric: PfasWellMetric | undefined): string {
  const band = getRiskBand(metric);

  switch (band) {
    case "low":
      return "#16a34a";
    case "moderate":
      return "#ca8a04";
    case "elevated":
      return "#ea580c";
    case "high":
      return "#dc2626";
    default:
      return "#64748b";
  }
}
