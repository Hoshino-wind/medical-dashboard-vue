function clampAlpha(alpha: number): number {
  if (!Number.isFinite(alpha)) return 1
  return Math.max(0, Math.min(1, alpha))
}

function parseHexChannel(value: string): number {
  return Number.parseInt(value, 16)
}

function expandShortHex(value: string): string {
  return value
    .split('')
    .map((char) => char + char)
    .join('')
}

export function colorWithAlpha(color: string, alpha: number): string {
  const normalizedAlpha = clampAlpha(alpha)
  const trimmed = color.trim()
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const value = hex.length === 3 ? expandShortHex(hex) : hex
    const r = parseHexChannel(value.slice(0, 2))
    const g = parseHexChannel(value.slice(2, 4))
    const b = parseHexChannel(value.slice(4, 6))
    return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`
  }

  const rgb = trimmed.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i)
  if (rgb) {
    const [, r, g, b] = rgb
    return `rgba(${Number(r)}, ${Number(g)}, ${Number(b)}, ${normalizedAlpha})`
  }

  return trimmed
}
