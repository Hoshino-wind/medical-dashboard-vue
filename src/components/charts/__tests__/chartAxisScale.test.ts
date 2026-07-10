import { describe, expect, it } from 'vitest'
import {
  formatMonthAxisLabel,
  resolveCountAxisScale,
} from '@/components/charts/chartAxisScale'

describe('resolveCountAxisScale', () => {
  it('adds headroom above a two-digit peak', () => {
    expect(resolveCountAxisScale([48])).toEqual({ max: 60, interval: 10 })
  })

  it('uses a 1/2/5 interval for a three-digit peak', () => {
    expect(resolveCountAxisScale([250])).toEqual({ max: 300, interval: 50 })
  })

  it('provides a usable count axis for an empty series', () => {
    expect(resolveCountAxisScale([])).toEqual({ max: 5, interval: 1 })
  })

  it('compacts full year-month labels for a 500px chart without changing other labels', () => {
    expect(formatMonthAxisLabel('2025-07')).toBe('07月')
    expect(formatMonthAxisLabel('07-01')).toBe('07-01')
  })
})
