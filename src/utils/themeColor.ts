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

interface RgbChannels {
  r: number
  g: number
  b: number
}

function parseRgbChannels(color: string): RgbChannels | null {
  const trimmed = color.trim()
  const hex = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const value = hex.length === 3 ? expandShortHex(hex) : hex
    return {
      r: parseHexChannel(value.slice(0, 2)),
      g: parseHexChannel(value.slice(2, 4)),
      b: parseHexChannel(value.slice(4, 6)),
    }
  }

  const rgb = trimmed.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i)
  if (!rgb) return null

  return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) }
}

/** 将主题色向另一个颜色混合，用于生成同一语义色的明暗材质层次。 */
export function mixColor(color: string, target: string, targetRatio: number): string {
  const sourceChannels = parseRgbChannels(color)
  const targetChannels = parseRgbChannels(target)
  if (!sourceChannels || !targetChannels) return color

  const ratio = clampAlpha(targetRatio)
  const mixChannel = (source: number, destination: number) =>
    Math.round(source + (destination - source) * ratio)

  return `rgb(${mixChannel(sourceChannels.r, targetChannels.r)}, ${mixChannel(sourceChannels.g, targetChannels.g)}, ${mixChannel(sourceChannels.b, targetChannels.b)})`
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

  const hsl = trimmed.match(
    /^hsla?\(\s*([0-9.]+)(?:deg)?\s*[,\s]\s*([0-9.]+)%\s*[,\s]\s*([0-9.]+)%/i,
  )
  if (hsl) {
    const [, h, s, l] = hsl
    return `hsla(${Number(h)}, ${Number(s)}%, ${Number(l)}%, ${normalizedAlpha})`
  }

  // 无法解析的颜色(如颜色名、var()、color-mix())无法套用 alpha。
  // 静默返回原值会让本应半透明的填充变不透明且无迹可循,dev 下显式告警。
  if (import.meta.env.DEV) {
    console.warn(
      `[colorWithAlpha] 无法解析颜色「${trimmed}」,alpha 被忽略;请使用 hex / rgb(a) / hsl(a)`,
    )
  }
  return trimmed
}
