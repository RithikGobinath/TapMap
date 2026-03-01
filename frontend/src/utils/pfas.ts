export function formatPfasValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "Not reported";
  }

  if (value === 0) {
    return "Not detected";
  }

  return `${value} ppt`;
}

export function formatPfasStatus(status: string | null | undefined): string {
  switch (status) {
    case "detected":
      return "Detected";
    case "not_detected":
      return "Not detected";
    case "no_current_sample":
      return "No current sample";
    default:
      return "Unknown";
  }
}
