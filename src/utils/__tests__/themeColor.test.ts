import { describe, expect, it } from 'vitest'
import { colorWithAlpha } from '../themeColor'

describe('theme color helpers', () => {
  it('applies alpha to hex colors', () => {
    expect(colorWithAlpha('#2b6dff', 0.42)).toBe('rgba(43, 109, 255, 0.42)')
    expect(colorWithAlpha('#0af', 0.8)).toBe('rgba(0, 170, 255, 0.8)')
  })

  it('applies alpha to rgb and rgba colors', () => {
    expect(colorWithAlpha('rgb(10, 20, 30)', 0.5)).toBe('rgba(10, 20, 30, 0.5)')
    expect(colorWithAlpha('rgba(10, 20, 30, 0.9)', 0.2)).toBe('rgba(10, 20, 30, 0.2)')
  })
})
