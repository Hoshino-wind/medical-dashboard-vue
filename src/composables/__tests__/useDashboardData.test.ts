import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { useDashboardData } from '../useDashboardData'

const testDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(testDir, '../../..')

describe('useDashboardData', () => {
  it('returns dashboard data parsed from the bundled document source', () => {
    const { data } = useDashboardData()

    expect(data.lifeSupport[0]).toEqual({ name: '除颤仪', count: 4, value: 90 })
    expect(data.deviceDistribution[0]).toEqual({ name: '麻醉科', count: 125, rate: 50.5 })
    expect(data.repairOrders[0]).toEqual([
      '手术麻醉中心',
      '史塞克台车',
      '00001',
      '0天0小时23分',
      '/',
      '待响应',
    ])
    expect(data.inspectionOrders.rows[0]).toEqual(['紧急医学救援队', '呼吸机', '0天', '/'])
    expect(data.repairStats.labels).toEqual([
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
    ])
  })

  it('removes the legacy hand-written mock data module', () => {
    expect(existsSync(join(projectRoot, 'src/data/mock/dashboardData.ts'))).toBe(false)
  })
})
