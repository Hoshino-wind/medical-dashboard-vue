export function resolveCountAxisScale(values: number[]): { max: number; interval: number } {
  const peak = Math.max(
    0,
    ...values.filter((value) => Number.isFinite(value) && value >= 0),
  )

  if (peak <= 0) return { max: 5, interval: 1 }

  const rawStep = peak / 5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => candidate >= normalized) ?? 10
  const interval = Math.max(1, Math.ceil(factor * magnitude))
  let max = Math.ceil(peak / interval) * interval

  if (max - peak < interval / 2) max += interval

  return { max, interval }
}

export function formatMonthAxisLabel(label: string): string {
  const match = /^(?:\d{4})-(\d{2})$/.exec(label)
  return match ? `${match[1]}月` : label
}
