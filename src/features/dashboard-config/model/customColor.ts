const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i

/** 配置层只接收可序列化、浏览器颜色控件稳定支持的六位十六进制色值。 */
export function isDashboardCustomColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value)
}

export function normalizeDashboardCustomColor(value: unknown, fallback: string): string {
  return isDashboardCustomColor(value) ? value.toLowerCase() : fallback
}
