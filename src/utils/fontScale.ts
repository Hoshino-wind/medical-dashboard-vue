export const DASHBOARD_FONT_SCALE = 1.45

export function chartFontSize(size: number): number {
  return Math.round(size * DASHBOARD_FONT_SCALE)
}
