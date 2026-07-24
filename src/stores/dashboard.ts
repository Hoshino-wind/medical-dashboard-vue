import { computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import {
  findAvailableSlot,
  getLayoutCapacity,
  hasRowTableConflict,
  isDashboardCustomColor,
  loadDashboardConfig,
  normalizeSlotIds,
  saveDashboardConfig,
} from '@/features/dashboard-config'
import {
  defaultConfig,
  findModuleById,
  isConfigurableChartModule,
  isModuleId,
  moduleCatalog,
} from '@/data/modules'
import { themes } from '@/data/themes'
import {
  CHART_DISPLAY_TYPES,
  type ChartDisplayType,
  type LayoutType,
  type PanelStyle,
  type ColorMode,
} from '@/types/config'
import type { ModuleCatalogItem, ModuleId } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

const validChartDisplayTypes = new Set<ChartDisplayType>(CHART_DISPLAY_TYPES)

export const useDashboardStore = defineStore('dashboard', () => {
  const config = reactive(loadDashboardConfig())

  const activeTheme = computed<Theme>(
    () => themes.find((theme) => theme.id === config.themeId) ?? themes[0],
  )
  const slotCount = computed(() => getLayoutCapacity(config.layout))
  const selectedModules = computed<ModuleCatalogItem[]>(() =>
    config.selectedModuleIds
      .filter((id): id is ModuleId => id !== null)
      .map((id) => findModuleById(id)),
  )
  const selectedSlotModules = computed<Array<ModuleCatalogItem | null>>(() =>
    normalizeSlotIds(config.selectedModuleIds, config.layout).map((id) =>
      id ? findModuleById(id) : null,
    ),
  )
  const availableModules = computed<ModuleCatalogItem[]>(() => {
    const selectedIds = new Set(config.selectedModuleIds)
    return moduleCatalog.filter((module) => !selectedIds.has(module.id))
  })

  function setTheme(themeId: ThemeId) {
    config.themeId = themeId
  }

  function setPanelStyle(panelStyle: PanelStyle) {
    config.panelStyle = panelStyle
  }

  function setRingColorMode(mode: ColorMode) {
    config.ringColorMode = mode
  }

  function setBarColorMode(mode: ColorMode) {
    config.barColorMode = mode
  }

  function setRingCustomColor(color: string) {
    if (!isDashboardCustomColor(color)) return false
    config.ringCustomColor = color.toLowerCase()
    return true
  }

  function setBarCustomColor(color: string) {
    if (!isDashboardCustomColor(color)) return false
    config.barCustomColor = color.toLowerCase()
    return true
  }

  function setModuleChartType(moduleId: ModuleId, type: ChartDisplayType) {
    const module = findModuleById(moduleId)
    if (!isConfigurableChartModule(module) || !validChartDisplayTypes.has(type)) return false
    config.chartTypes[module.id] = type
    return true
  }

  function setLayout(layout: LayoutType) {
    config.layout = layout
    config.selectedModuleIds = normalizeSlotIds(config.selectedModuleIds, layout)
  }

  function addModuleToLayout(moduleId: ModuleId) {
    if (!isModuleId(moduleId) || config.selectedModuleIds.includes(moduleId)) return false
    const currentSlots = normalizeSlotIds(config.selectedModuleIds, config.layout)
    const targetIndex = findAvailableSlot(currentSlots, moduleId)
    if (targetIndex === -1) return false
    currentSlots[targetIndex] = moduleId
    config.selectedModuleIds = currentSlots
    return true
  }

  function placeModuleInSlot(moduleId: ModuleId, slotIndex: number) {
    if (!isModuleId(moduleId) || slotIndex < 0 || slotIndex >= slotCount.value) return false
    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    const currentIndex = next.indexOf(moduleId)
    if (currentIndex >= 0) next[currentIndex] = null
    next[slotIndex] = moduleId
    if (hasRowTableConflict(next)) return false
    config.selectedModuleIds = next
    return true
  }

  function removeModuleFromLayout(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= slotCount.value) return
    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    next[slotIndex] = null
    config.selectedModuleIds = next
  }

  function moveSelectedModule(fromIndex: number, toIndex: number) {
    const currentSlots = normalizeSlotIds(config.selectedModuleIds, config.layout)
    if (
      fromIndex < 0 ||
      fromIndex >= currentSlots.length ||
      toIndex < 0 ||
      toIndex >= currentSlots.length
    ) {
      return false
    }
    const moved = currentSlots[fromIndex]
    if (!moved) return false
    if (fromIndex === toIndex) return true

    const next = [...currentSlots]
    const target = next[toIndex]
    next[toIndex] = moved
    next[fromIndex] = target
    if (hasRowTableConflict(next)) return false
    config.selectedModuleIds = next
    return true
  }

  function clearSelectedModules() {
    config.selectedModuleIds = normalizeSlotIds([], config.layout)
  }

  function resetConfig() {
    Object.assign(config, {
      ...defaultConfig,
      chartTypes: { ...defaultConfig.chartTypes },
      selectedModuleIds: [...defaultConfig.selectedModuleIds],
    })
  }

  function persistConfig() {
    return saveDashboardConfig(config)
  }

  watch(config, persistConfig, { deep: true })

  return {
    config,
    activeTheme,
    slotCount,
    selectedModules,
    selectedSlotModules,
    availableModules,
    setTheme,
    setPanelStyle,
    setRingColorMode,
    setBarColorMode,
    setRingCustomColor,
    setBarCustomColor,
    setModuleChartType,
    setLayout,
    addModuleToLayout,
    placeModuleInSlot,
    removeModuleFromLayout,
    moveSelectedModule,
    clearSelectedModules,
    resetConfig,
    persistConfig,
  }
})
