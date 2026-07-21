import { describe, expect, it } from 'vitest'
import { dashboardData } from '../document/dashboardData'
import { DashboardDataValidationError, parseDashboardData } from '../dashboardDataContract'

describe('dashboard data contract', () => {
  it('accepts and clones the bundled prototype data', () => {
    const parsed = parseDashboardData(dashboardData)

    expect(parsed).toEqual(dashboardData)
    expect(parsed).not.toBe(dashboardData)
    expect(parsed.repairOrders[0]).toHaveProperty('repairCode')
  })

  it('reports the exact path for malformed external data', () => {
    const invalid = structuredClone(dashboardData) as unknown as Record<string, unknown>
    const overview = invalid.overview as Record<string, unknown>
    overview.total = '16592'

    expect(() => parseDashboardData(invalid)).toThrow(DashboardDataValidationError)
    expect(() => parseDashboardData(invalid)).toThrow('overview.total')
  })

  it('rejects chart series that do not align with labels', () => {
    const invalid = structuredClone(dashboardData)
    invalid.maintenanceStats.data.pop()

    expect(() => parseDashboardData(invalid)).toThrow('maintenanceStats.data')
  })
})
