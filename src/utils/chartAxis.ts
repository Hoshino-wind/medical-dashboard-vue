const DEFAULT_AXIS_HEADROOM = 1.2
const DEFAULT_SPLIT_COUNT = 4

export interface ChartAxisRange {
  max: number
  interval: number
}

interface ResolveChartAxisRangeOptions {
  headroom?: number
  splitCount?: number
  fallbackMax?: number
  minInterval?: number
}

function toFinitePositive(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function toSafeNumber(value: number): number {
  return Number(value.toPrecision(12))
}

function resolveNiceInterval(roughInterval: number): number {
  const safeInterval = toFinitePositive(roughInterval, 1)
  const magnitude = 10 ** Math.floor(Math.log10(safeInterval))
  const normalized = safeInterval / magnitude
  const niceNormalized =
    normalized <= 1
      ? 1
      : normalized <= 2
        ? 2
        : normalized <= 3
          ? 3
          : normalized <= 5
            ? 5
            : 10

  return toSafeNumber(niceNormalized * magnitude)
}

export function resolveChartAxisRange(
  maxValue: number,
  options: ResolveChartAxisRangeOptions = {},
): ChartAxisRange {
  const headroom = toFinitePositive(options.headroom ?? DEFAULT_AXIS_HEADROOM, DEFAULT_AXIS_HEADROOM)
  const splitCount = Math.max(
    1,
    Math.round(toFinitePositive(options.splitCount ?? DEFAULT_SPLIT_COUNT, DEFAULT_SPLIT_COUNT)),
  )
  const fallbackMax = toFinitePositive(options.fallbackMax ?? 1, 1)
  const minInterval = toFinitePositive(options.minInterval ?? 1, 1)
  const safeMaxValue = Number.isFinite(maxValue) ? Math.max(0, maxValue) : 0

  if (safeMaxValue === 0) {
    return {
      max: Math.max(fallbackMax, minInterval),
      interval: minInterval,
    }
  }

  const targetMax = safeMaxValue * headroom
  const interval = Math.max(minInterval, resolveNiceInterval(targetMax / splitCount))
  const axisMax = toSafeNumber(Math.max(interval, Math.ceil(targetMax / interval) * interval))

  return { max: axisMax, interval }
}
