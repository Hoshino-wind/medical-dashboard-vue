export interface Pie3DInputItem {
  name: string
  value: number
  color: string
}

export interface Pie3DSegment extends Pie3DInputItem {
  startRatio: number
  endRatio: number
}

export function buildPie3DSegments(items: Pie3DInputItem[]): Pie3DSegment[] {
  const normalized = items.filter((item) => Number.isFinite(item.value) && item.value > 0)
  const total = normalized.reduce((sum, item) => sum + item.value, 0)

  if (total <= 0) return []

  let cursor = 0
  return normalized.map((item, index) => {
    const startRatio = cursor / total
    cursor += item.value
    return {
      ...item,
      startRatio,
      endRatio: index === normalized.length - 1 ? 1 : cursor / total,
    }
  })
}
