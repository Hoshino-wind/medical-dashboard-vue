const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i

export interface DashboardHsvaColor {
  h: number
  s: number
  v: number
  a: number
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function toHexByte(value: number): string {
  return Math.round(clamp(value, 0, 255))
    .toString(16)
    .padStart(2, '0')
}

/** 配置层接收六位 HEX，或带透明度的八位 HEXA。 */
export function isDashboardCustomColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value)
}

export function normalizeDashboardCustomColor(value: unknown, fallback: string): string {
  return isDashboardCustomColor(value) ? value.toLowerCase() : fallback
}

export function dashboardColorToHsva(value: string): DashboardHsvaColor | null {
  if (!isDashboardCustomColor(value)) return null

  const hex = value.slice(1)
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta > 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6)
    else if (max === g) h = 60 * ((b - r) / delta + 2)
    else h = 60 * ((r - g) / delta + 4)
  }
  if (h < 0) h += 360

  return {
    h,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
    a: hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1,
  }
}

export function dashboardHsvaToColor({ h, s, v, a }: DashboardHsvaColor): string {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const value = clamp(v, 0, 100) / 100
  const chroma = value * saturation
  const segment = hue / 60
  const x = chroma * (1 - Math.abs((segment % 2) - 1))
  const offset = value - chroma

  let red = 0
  let green = 0
  let blue = 0
  if (segment < 1) [red, green] = [chroma, x]
  else if (segment < 2) [red, green] = [x, chroma]
  else if (segment < 3) [green, blue] = [chroma, x]
  else if (segment < 4) [green, blue] = [x, chroma]
  else if (segment < 5) [red, blue] = [x, chroma]
  else [red, blue] = [chroma, x]

  const opaqueHex = `#${toHexByte((red + offset) * 255)}${toHexByte(
    (green + offset) * 255,
  )}${toHexByte((blue + offset) * 255)}`
  const alphaByte = Math.round(clamp(a, 0, 1) * 255)
  return alphaByte === 255 ? opaqueHex : `${opaqueHex}${toHexByte(alphaByte)}`
}
