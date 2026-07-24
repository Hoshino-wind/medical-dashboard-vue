import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { moduleCatalog } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'
import { nextTick } from 'vue'

const STORAGE_KEY = 'medical-dashboard-config'

describe('dashboard store configuration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('migrates legacy moduleOrder into versioned slot configuration', async () => {
    const oldModuleOrder = moduleCatalog
      .filter((item) => item.id !== 'deviceDistribution')
      .map((item) => item.id)

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId: 'deep-sea-instrument',
        layout: '3x3',
        moduleOrder: oldModuleOrder,
      }),
    )

    const store = useDashboardStore()

    expect(store.config.schemaVersion).toBe(3)
    expect(store.config.selectedModuleIds).toEqual(oldModuleOrder.slice(0, 9))
    expect(store.availableModules.map((module) => module.id)).toContain('deviceDistribution')

    store.persistConfig()
    await nextTick()
    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(persisted.schemaVersion).toBe(3)
    expect(persisted).not.toHaveProperty('moduleOrder')
  })

  it('defaults old saved configs to the glass panel style and persists borderless selection', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId: 'deep-sea-instrument',
        layout: '3x3',
      }),
    )

    const store = useDashboardStore()

    expect(store.config.panelStyle).toBe('glass-flow')

    store.setPanelStyle('borderless')
    await nextTick()

    expect(store.config.panelStyle).toBe('borderless')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').panelStyle).toBe(
      'borderless',
    )
  })

  it('migrates old configs to per-card chart defaults and persists chart switches', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId: 'deep-sea-instrument',
        layout: '3x3',
      }),
    )

    const store = useDashboardStore()

    expect(store.config.chartTypes).toEqual({
      repairStats: 'bar',
      maintenanceStats: 'line',
      inspectionStats: 'line',
    })

    expect(store.setModuleChartType('repairStats', 'line')).toBe(true)
    expect(store.setModuleChartType('overview', 'bar')).toBe(false)
    await nextTick()

    expect(store.config.chartTypes.repairStats).toBe('line')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').chartTypes).toEqual({
      repairStats: 'line',
      maintenanceStats: 'line',
      inspectionStats: 'line',
    })
  })

  it('migrates and validates custom ring and progress colors', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        themeId: 'light-medical',
        layout: '3x3',
        ringColorMode: 'custom',
        ringCustomColor: '#AABBCC',
        barColorMode: 'custom',
        barCustomColor: 'not-a-color',
      }),
    )

    const store = useDashboardStore()

    expect(store.config.ringColorMode).toBe('custom')
    expect(store.config.ringCustomColor).toBe('#aabbcc')
    expect(store.config.barColorMode).toBe('custom')
    expect(store.config.barCustomColor).toBe('#20b486')
    expect(store.setRingCustomColor('#F05A28')).toBe(true)
    expect(store.setBarCustomColor('#123')).toBe(false)
    await nextTick()

    const persisted = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(persisted.ringCustomColor).toBe('#f05a28')
    expect(persisted.barCustomColor).toBe('#20b486')
  })

  it('replaces an occupied layout slot when placing an available module into it', () => {
    const store = useDashboardStore()

    expect(store.config.selectedModuleIds[0]).toBe('overview')

    store.placeModuleInSlot('deviceDistribution', 0)

    expect(store.config.selectedModuleIds).toHaveLength(9)
    expect(store.config.selectedModuleIds[0]).toBe('deviceDistribution')
    expect(store.availableModules.map((item) => item.id)).toContain('overview')
  })

  it('keeps an empty slot when a module is removed from the layout', () => {
    const store = useDashboardStore()

    store.removeModuleFromLayout(1)

    expect(store.config.selectedModuleIds).toHaveLength(9)
    expect(store.config.selectedModuleIds[1]).toBeNull()
    expect(store.selectedSlotModules[1]).toBeNull()
    expect(store.availableModules.map((item) => item.id)).toContain('repairOrders')
  })

  it('swaps two occupied layout slots when moving a selected module inside the layout', () => {
    const store = useDashboardStore()

    expect(store.config.selectedModuleIds.slice(0, 3)).toEqual([
      'overview',
      'repairOrders',
      'repairStats',
    ])

    expect(store.moveSelectedModule(0, 2)).toBe(true)

    expect(store.config.selectedModuleIds.slice(0, 3)).toEqual([
      'repairStats',
      'repairOrders',
      'overview',
    ])
  })

  it('rejects more than one table component in the same row', () => {
    const store = useDashboardStore()

    store.clearSelectedModules()

    expect(store.placeModuleInSlot('repairOrders', 0)).toBe(true)
    expect(store.placeModuleInSlot('inspectionOrders', 2)).toBe(false)
    expect(store.placeModuleInSlot('inspectionOrders', 3)).toBe(true)
    expect(store.config.selectedModuleIds.slice(0, 6)).toEqual([
      'repairOrders',
      null,
      null,
      'inspectionOrders',
      null,
      null,
    ])
  })
})
