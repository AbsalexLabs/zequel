export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n)
}

export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export function formatCurrency(n: number, opts?: { compact?: boolean }): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: opts?.compact ? "compact" : "standard",
    maximumFractionDigits: opts?.compact ? 1 : n % 1 === 0 ? 0 : 2,
  }).format(n)
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(1)}%`
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.round((now - then) / 1000)
  const future = diff < 0
  const abs = Math.abs(diff)

  const units: [number, string][] = [
    [60, "s"],
    [3600, "m"],
    [86400, "h"],
    [604800, "d"],
    [2592000, "w"],
    [31536000, "mo"],
  ]
  let value = abs
  let unit = "s"
  if (abs < 60) {
    value = abs
    unit = "s"
  } else if (abs < 3600) {
    value = Math.round(abs / 60)
    unit = "m"
  } else if (abs < 86400) {
    value = Math.round(abs / 3600)
    unit = "h"
  } else if (abs < 604800) {
    value = Math.round(abs / 86400)
    unit = "d"
  } else if (abs < 2592000) {
    value = Math.round(abs / 604800)
    unit = "w"
  } else {
    value = Math.round(abs / 2592000)
    unit = "mo"
  }
  void units
  return future ? `in ${value}${unit}` : `${value}${unit} ago`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
