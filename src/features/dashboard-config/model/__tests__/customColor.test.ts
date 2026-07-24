import { describe, expect, it } from 'vitest'
import { dashboardColorToHsva, dashboardHsvaToColor, isDashboardCustomColor } from '../customColor'

describe('dashboard custom color', () => {
  it('accepts opaque HEX and alpha-enabled HEXA values', () => {
    expect(isDashboardCustomColor('#1677ff')).toBe(true)
    expect(isDashboardCustomColor('#1677ff80')).toBe(true)
    expect(isDashboardCustomColor('#1677')).toBe(false)
    expect(isDashboardCustomColor('rgba(22, 119, 255, 0.5)')).toBe(false)
  })

  it('round-trips hue, saturation, brightness, and alpha', () => {
    const hsva = dashboardColorToHsva('#1677ff80')

    expect(hsva).toMatchObject({ a: 128 / 255 })
    expect(dashboardHsvaToColor(hsva!)).toBe('#1677ff80')
  })

  it('omits the alpha bytes when opacity is 100 percent', () => {
    expect(dashboardHsvaToColor({ h: 217, s: 91, v: 100, a: 1 })).toMatch(/^#[0-9a-f]{6}$/)
  })
})
