/**
 * Parses payment cycle from stored string (e.g. "1,5,15" or legacy free text).
 * Returns sorted unique day numbers in 1–31, or empty if none valid.
 */
export function parsePaymentCycleDays(paymentDate: string): number[] {
  if (!paymentDate?.trim()) return []
  const parts = paymentDate.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean)
  const days: number[] = []
  for (const p of parts) {
    const n = parseInt(p, 10)
    if (!Number.isNaN(n) && n >= 1 && n <= 31) days.push(n)
  }
  return [...new Set(days)].sort((a, b) => a - b)
}

/** Serializes selected days for API / form (comma-separated, sorted). */
export function serializePaymentCycleDays(days: number[]): string {
  return parsePaymentCycleDays(days.join(",")).join(",")
}

/**
 * Human-readable label for list/detail UI (Mongolian).
 */
export function formatPaymentCycleLabel(paymentDate: string): string {
  const days = parsePaymentCycleDays(paymentDate)
  if (days.length === 0) {
    return paymentDate.trim() || "—"
  }
  return `Сар бүрийн ${days.join(", ")}`
}
