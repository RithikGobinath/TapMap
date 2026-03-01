import type { CategoryKey, PfasWellMetric } from "../types/phase2";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  pfas: "PFAS",
  nitrate: "Nitrate",
  chromium6: "Chromium-6",
  radionuclides: "Radionuclides",
  sodiumChloride: "Sodium/Chloride",
  violations: "Violation History",
  voc: "VOCs/Solvents"
};

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

export function getColorFromScore(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "#64748b";
  if (score >= 90) return "#166534";
  if (score >= 80) return "#15803d";
  if (score >= 70) return "#65a30d";
  if (score >= 60) return "#ca8a04";
  if (score >= 50) return "#ea580c";
  return "#dc2626";
}
