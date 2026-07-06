import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { moduleCatalog } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'

describe('dashboard configuration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('normalizes saved config to the fixed nine-module field-configurable screen', () => {
    window.localStorage.setItem(
      'medical-dashboard-config',
      JSON.stringify({
        themeId: 'clinical-command',
        layout: '2x3',
        moduleOrder: ['healthTrend', 'unknown-module', 'overview'],
        moduleSettings: {
          overview: {
            title: '资产运行概览',
            fields: [
              { key: 'total', label: '资产总数', visible: false },
              { key: 'unknown', label: '无效字段', visible: true },
            ],
          },
        },
      }),
    )

    const store = useDashboardStore()
    const totalField = store.config.moduleSettings.overview.fields.find(
      (field) => field.key === 'total',
    )
    const availableField = store.config.moduleSettings.overview.fields.find(
      (field) => field.key === 'available',
    )

    expect(store.config.layout).toBe('3x3')
    expect(store.orderedModules).toHaveLength(9)
    expect(store.orderedModules.map((item) => item.id)).toEqual([
      'healthTrend',
      'overview',
      ...moduleCatalog
        .map((item) => item.id)
        .filter((id) => id !== 'healthTrend' && id !== 'overview'),
    ])
    expect(store.orderedModules.find((item) => item.id === 'overview')?.title).toBe('资产运行概览')
    expect(totalField?.label).toBe('资产总数')
    expect(totalField?.visible).toBe(false)
    expect(availableField?.label).toBe('可用设备')
  })
})
