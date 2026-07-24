import { describe, expect, it } from 'vitest'
import { resolveModuleRender, type ModuleRenderContext } from '@/config/moduleRegistry'
import { dashboardData } from '@/data/document/dashboardData'
import { defaultConfig, findModuleById } from '@/data/modules'
import { themes } from '@/data/themes'

describe('module registry chart color overrides', () => {
  const context: ModuleRenderContext = {
    data: dashboardData,
    theme: themes[1],
    config: {
      ...defaultConfig,
      chartColors: {
        ring: '#f05a28',
        pie: '#20b486',
        bar: '#3456c8',
      },
    },
  }

  it('routes each configured color to the matching chart family', () => {
    expect(resolveModuleRender(findModuleById('lifeSupport'), context).props).toMatchObject({
      ringColorMode: 'custom',
      ringCustomColor: '#f05a28',
    })
    expect(resolveModuleRender(findModuleById('inspectionOrders'), context).props).toMatchObject({
      pieColor: '#20b486',
    })
    expect(resolveModuleRender(findModuleById('repairStats'), context).props).toMatchObject({
      barColor: '#3456c8',
    })
    expect(resolveModuleRender(findModuleById('deviceDistribution'), context).props).toMatchObject({
      barColorMode: 'custom',
      barCustomColor: '#3456c8',
    })
  })
})
