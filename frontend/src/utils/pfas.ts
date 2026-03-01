export function formatPfasValue(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "Not reported / Not available";
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
    default:
      return "Not reported / Not available";
  }
}
