import { describe, expect, it } from 'vitest'
import { dashboardData } from '../dashboardData'

const RECENT_SEVEN_DAY_LABELS = [
  '07-18',
  '07-19',
  '07-20',
  '07-21',
  '07-22',
  '07-23',
  '07-24',
]

describe('built-in dashboard statistics data', () => {
  it('uses seven consecutive daily labels for every near-seven-day chart', () => {
    expect(dashboardData.repairStats.labels).toEqual(RECENT_SEVEN_DAY_LABELS)
    expect(dashboardData.maintenanceStats.labels).toEqual(RECENT_SEVEN_DAY_LABELS)
    expect(dashboardData.inspectionStats.labels).toEqual(RECENT_SEVEN_DAY_LABELS)

    expect(dashboardData.repairStats.series.every((series) => series.data.length === 7)).toBe(true)
    expect(dashboardData.maintenanceStats.data).toHaveLength(7)
    expect(dashboardData.inspectionStats.data).toHaveLength(7)
  })
})
