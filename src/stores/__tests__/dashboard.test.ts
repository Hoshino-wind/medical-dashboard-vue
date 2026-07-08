import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { moduleCatalog } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'

const STORAGE_KEY = 'medical-dashboard-config'

describe('dashboard store configuration', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setActivePinia(createPinia())
  })

  it('normalizes old saved module order so newly added modules stay configurable', () => {
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

    expect(store.config.moduleOrder).toHaveLength(moduleCatalog.length)
    expect(store.config.moduleOrder.at(-1)).toBe('deviceDistribution')

    store.moveModule(9, 8)

    expect(store.config.moduleOrder[8]).toBe('deviceDistribution')
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
