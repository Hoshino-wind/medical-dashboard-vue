import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
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

  it('preflights table placement without mutating config, storage, or selection state', async () => {
    const store = useDashboardStore()
    store.clearSelectedModules()
    store.placeModuleInSlot('repairOrders', 0)
    await nextTick()

    const configBefore = JSON.stringify(store.config)
    const storageBefore = window.localStorage.getItem(STORAGE_KEY)
    const selectedBefore = store.selectedSlotModules.map((item) => item?.id ?? null)
    const availableBefore = store.availableModules.map((item) => item.id)

    expect(store.canPlaceModuleInSlot('inspectionOrders', 1)).toBe(false)
    expect(store.canPlaceModuleInSlot('inspectionOrders', 3)).toBe(true)
    await nextTick()

    expect(JSON.stringify(store.config)).toBe(configBefore)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(storageBefore)
    expect(store.selectedSlotModules.map((item) => item?.id ?? null)).toEqual(selectedBefore)
    expect(store.availableModules.map((item) => item.id)).toEqual(availableBefore)
  })

  it('preflights a selected-module move without mutating config, storage, or selection state', async () => {
    const store = useDashboardStore()
    await nextTick()

    const configBefore = JSON.stringify(store.config)
    const storageBefore = window.localStorage.getItem(STORAGE_KEY)
    const selectedBefore = store.selectedSlotModules.map((item) => item?.id ?? null)
    const availableBefore = store.availableModules.map((item) => item.id)

    expect(store.canMoveSelectedModule(0, 2)).toBe(true)
    await nextTick()

    expect(JSON.stringify(store.config)).toBe(configBefore)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(storageBefore)
    expect(store.selectedSlotModules.map((item) => item?.id ?? null)).toEqual(selectedBefore)
    expect(store.availableModules.map((item) => item.id)).toEqual(availableBefore)
  })

  it('rejects unknown modules and slot indexes outside the active layout', () => {
    const store = useDashboardStore()
    store.setLayout('2x3')

    expect(store.canPlaceModuleInSlot('unknown-module', 0)).toBe(false)
    expect(store.canPlaceModuleInSlot('overview', -1)).toBe(false)
    expect(store.canPlaceModuleInSlot('overview', 5)).toBe(true)
    expect(store.canPlaceModuleInSlot('overview', 6)).toBe(false)
  })

  it('rejects invalid or empty move sources while allowing an occupied module to stay put', () => {
    const store = useDashboardStore()
    store.setLayout('2x3')
    store.clearSelectedModules()
    store.placeModuleInSlot('overview', 5)

    expect(store.canMoveSelectedModule(-1, 0)).toBe(false)
    expect(store.canMoveSelectedModule(5, 6)).toBe(false)
    expect(store.canMoveSelectedModule(6, 0)).toBe(false)
    expect(store.canMoveSelectedModule(0, 1)).toBe(false)
    expect(store.canMoveSelectedModule(5, 5)).toBe(true)
  })

  it('preflights and rejects a move that would create a table-row conflict', () => {
    const store = useDashboardStore()
    store.clearSelectedModules()
    store.placeModuleInSlot('repairOrders', 0)
    store.placeModuleInSlot('inspectionOrders', 3)
    store.placeModuleInSlot('overview', 4)
    const before = [...store.config.selectedModuleIds]

    expect(store.canMoveSelectedModule(0, 4)).toBe(false)
    expect(store.config.selectedModuleIds).toEqual(before)
    expect(store.moveSelectedModule(0, 4)).toBe(false)
    expect(store.config.selectedModuleIds).toEqual(before)
  })

  it('preflights and allows a move that resolves a table-row conflict', () => {
    const store = useDashboardStore()
    store.config.selectedModuleIds = [
      'repairOrders',
      'inspectionOrders',
      'overview',
      'repairStats',
      null,
      null,
      null,
      null,
      null,
    ]
    const before = [...store.config.selectedModuleIds]

    expect(store.canMoveSelectedModule(1, 3)).toBe(true)
    expect(store.config.selectedModuleIds).toEqual(before)
    expect(store.moveSelectedModule(1, 3)).toBe(true)
    expect(store.config.selectedModuleIds.slice(0, 6)).toEqual([
      'repairOrders',
      'repairStats',
      'overview',
      'inspectionOrders',
      null,
      null,
    ])
  })
})
