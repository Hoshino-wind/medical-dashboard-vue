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
  a: number
}

function parseRgbChannels(color: string): RgbChannels | null {
  const trimmed = color.trim()
  const hex = trimmed.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i)?.[1]
  if (hex) {
    const value = hex.length <= 4 ? expandShortHex(hex) : hex
    return {
      r: parseHexChannel(value.slice(0, 2)),
      g: parseHexChannel(value.slice(2, 4)),
      b: parseHexChannel(value.slice(4, 6)),
      a: value.length === 8 ? parseHexChannel(value.slice(6, 8)) / 255 : 1,
    }
  }

  const rgb = trimmed.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+)(%)?)?\s*\)$/i,
  )
  if (!rgb) return null

  const parsedAlpha = rgb[4] ? Number(rgb[4]) / (rgb[5] ? 100 : 1) : 1
  return {
    r: Number(rgb[1]),
    g: Number(rgb[2]),
    b: Number(rgb[3]),
    a: clampAlpha(parsedAlpha),
  }
}

function formatAlpha(alpha: number): string {
  return String(Number(clampAlpha(alpha).toFixed(4)))
}

/** 将主题色向另一个颜色混合，用于生成同一语义色的明暗材质层次。 */
export function mixColor(color: string, target: string, targetRatio: number): string {
  const sourceChannels = parseRgbChannels(color)
  const targetChannels = parseRgbChannels(target)
  if (!sourceChannels || !targetChannels) return color

  const ratio = clampAlpha(targetRatio)
  const mixChannel = (source: number, destination: number) =>
    Math.round(source + (destination - source) * ratio)

  const mixed = `${mixChannel(sourceChannels.r, targetChannels.r)}, ${mixChannel(
    sourceChannels.g,
    targetChannels.g,
  )}, ${mixChannel(sourceChannels.b, targetChannels.b)}`
  return sourceChannels.a < 1 ? `rgba(${mixed}, ${formatAlpha(sourceChannels.a)})` : `rgb(${mixed})`
}

export function colorWithAlpha(color: string, alpha: number): string {
  const normalizedAlpha = clampAlpha(alpha)
  const trimmed = color.trim()
  const channels = parseRgbChannels(trimmed)
  if (channels) {
    return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${formatAlpha(
      channels.a * normalizedAlpha,
    )})`
  }

  const hsl = trimmed.match(
    /^hsla?\(\s*([0-9.]+)(?:deg)?\s*[,\s]\s*([0-9.]+)%\s*[,\s]\s*([0-9.]+)%(?:\s*[,/]\s*([0-9.]+)(%)?)?\s*\)$/i,
  )
  if (hsl) {
    const [, h, s, l, sourceAlpha, sourceAlphaPercent] = hsl
    const parsedAlpha = sourceAlpha ? Number(sourceAlpha) / (sourceAlphaPercent ? 100 : 1) : 1
    return `hsla(${Number(h)}, ${Number(s)}%, ${Number(l)}%, ${formatAlpha(
      parsedAlpha * normalizedAlpha,
    )})`
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
