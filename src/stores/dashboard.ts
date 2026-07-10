import { computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { themes } from '@/data/themes'
import { defaultConfig, moduleCatalog } from '@/data/modules'
import { readStorage, writeStorage } from '@/utils/storage'
import type { DashboardConfig, LayoutType } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

const STORAGE_KEY = 'medical-dashboard-config'

/** 合法的布局值,用于校验 localStorage 脏数据 */
const VALID_LAYOUTS: LayoutType[] = ['2x3', '3x3']

type SavedDashboardConfig = Partial<{
  themeId: ThemeId
  layout: LayoutType
  selectedModuleIds: Array<string | null>
  moduleOrder: string[]
}>

function getLayoutCapacity(layout: LayoutType) {
  return layout === '2x3' ? 6 : 9
}

const TABLE_MODULE_IDS = new Set(['repairOrders', 'inspectionOrders', 'healthTrend'])

function isTableModule(moduleId: string | null | undefined) {
  return Boolean(moduleId && TABLE_MODULE_IDS.has(moduleId))
}

function normalizeSlotIds(
  selectedIds: Array<string | null> | undefined,
  layout: LayoutType,
) {
  const capacity = getLayoutCapacity(layout)
  const validIds = new Set(moduleCatalog.map((item) => item.id))
  const seen = new Set<string>()
  const slots = Array.from({ length: capacity }, (_, index) => {
    const id = selectedIds?.[index] ?? null
    if (!id || !validIds.has(id) || seen.has(id)) return null
    seen.add(id)
    return id
  })

  return slots
}

function hasRowTableConflict(selectedIds: Array<string | null>) {
  for (let rowIndex = 0; rowIndex < selectedIds.length; rowIndex += 3) {
    const tableCount = selectedIds
      .slice(rowIndex, rowIndex + 3)
      .filter((moduleId) => isTableModule(moduleId)).length
    if (tableCount > 1) return true
  }

  return false
}

/** 按当前模块目录归一化保存顺序,兼容旧配置缺少新增模块的情况 */
function normalizeModuleOrder(savedOrder?: string[]) {
  const catalogIds = moduleCatalog.map((item) => item.id)
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) {
    return [...catalogIds]
  }

  const validIds = new Set(catalogIds)
  const seen = new Set<string>()
  const configured = savedOrder.filter((id) => {
    if (!validIds.has(id) || seen.has(id)) return false
    seen.add(id)
    return true
  })
  const missing = catalogIds.filter((id) => !seen.has(id))
  return [...configured, ...missing]
}

/** 归一化已放入大屏槽位的模块,兼容没有 selectedModuleIds 的旧配置 */
function normalizeSelectedModuleIds(
  savedSelectedIds: Array<string | null> | undefined,
  moduleOrder: string[],
  layout: LayoutType,
) {
  if (!Array.isArray(savedSelectedIds)) {
    return moduleOrder.slice(0, getLayoutCapacity(layout))
  }

  return normalizeSlotIds(savedSelectedIds, layout)
}

/** 从 localStorage 读取并校验配置,脏数据回退到默认值 */
function loadConfig(): DashboardConfig {
  const saved = readStorage<SavedDashboardConfig>(STORAGE_KEY)
  const validThemeIds = new Set(themes.map((t) => t.id))
  const layout =
    saved?.layout && VALID_LAYOUTS.includes(saved.layout) ? saved.layout : defaultConfig.layout
  const moduleOrder = normalizeModuleOrder(saved?.moduleOrder)

  return {
    themeId:
      saved?.themeId && validThemeIds.has(saved.themeId) ? saved.themeId : defaultConfig.themeId,
    layout,
    selectedModuleIds: normalizeSelectedModuleIds(
      saved?.selectedModuleIds,
      moduleOrder,
      layout,
    ),
    moduleOrder,
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const config = reactive(loadConfig())

  /** 当前生效的主题对象 */
  const activeTheme = computed<Theme>(
    () => themes.find((t) => t.id === config.themeId) ?? themes[0],
  )

  const slotCount = computed(() => getLayoutCapacity(config.layout))

  /** 按 moduleOrder 排列后的模块列表(自动补齐 catalog 中缺失的模块) */
  const orderedModules = computed<ModuleCatalogItem[]>(() => {
    const orderedIds = new Set(config.moduleOrder)
    const configured = config.moduleOrder
      .map((id) => moduleCatalog.find((item) => item.id === id))
      .filter((item): item is ModuleCatalogItem => Boolean(item))
    const missing = moduleCatalog.filter((item) => !orderedIds.has(item.id))
    return [...configured, ...missing]
  })

  const selectedModules = computed<ModuleCatalogItem[]>(() =>
    config.selectedModuleIds
      .map((id) => moduleCatalog.find((item) => item.id === id))
      .filter((item): item is ModuleCatalogItem => Boolean(item)),
  )

  const selectedSlotModules = computed<Array<ModuleCatalogItem | null>>(() =>
    normalizeSlotIds(config.selectedModuleIds, config.layout).map(
      (id) => moduleCatalog.find((item) => item.id === id) ?? null,
    ),
  )

  const availableModules = computed<ModuleCatalogItem[]>(() => {
    const selectedIds = new Set(config.selectedModuleIds)
    return orderedModules.value.filter((item) => !selectedIds.has(item.id))
  })

  function syncModuleOrder(selectedIds = config.selectedModuleIds) {
    const compactSelectedIds = selectedIds.filter((id): id is string => Boolean(id))
    const selectedSet = new Set(compactSelectedIds)
    const remainingIds = normalizeModuleOrder(config.moduleOrder).filter((id) => !selectedSet.has(id))
    config.moduleOrder = [...compactSelectedIds, ...remainingIds]
  }

  function setTheme(themeId: ThemeId) {
    config.themeId = themeId
  }

  function setLayout(layout: LayoutType) {
    config.layout = layout
    config.selectedModuleIds = normalizeSlotIds(config.selectedModuleIds, layout)
    syncModuleOrder()
  }

  function moveModule(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= config.moduleOrder.length ||
      toIndex < 0 ||
      toIndex >= config.moduleOrder.length
    ) {
      return
    }
    const next = [...config.moduleOrder]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    config.moduleOrder = next
    config.selectedModuleIds = normalizeSlotIds(next.slice(0, slotCount.value), config.layout)
  }

  function addModuleToLayout(moduleId: string) {
    if (config.selectedModuleIds.includes(moduleId)) return false

    const currentSlots = normalizeSlotIds(config.selectedModuleIds, config.layout)
    const targetIndex = currentSlots.findIndex((slotId, index) => {
      if (slotId) return false
      const next = [...currentSlots]
      next[index] = moduleId
      return !hasRowTableConflict(next)
    })
    if (targetIndex === -1) return false

    currentSlots[targetIndex] = moduleId
    config.selectedModuleIds = currentSlots
    syncModuleOrder()
    return true
  }

  function canPlaceModuleInSlot(moduleId: string, slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= slotCount.value) return false
    if (!moduleCatalog.some((item) => item.id === moduleId)) return false

    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    const currentIndex = next.indexOf(moduleId)
    if (currentIndex >= 0) next[currentIndex] = null
    next[slotIndex] = moduleId
    return !hasRowTableConflict(next)
  }

  function placeModuleInSlot(moduleId: string, slotIndex: number) {
    if (!canPlaceModuleInSlot(moduleId, slotIndex)) return false

    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    const currentIndex = next.indexOf(moduleId)
    if (currentIndex >= 0) next[currentIndex] = null
    next[slotIndex] = moduleId
    config.selectedModuleIds = next
    syncModuleOrder()
    return true
  }

  function removeModuleFromLayout(slotIndex: number) {
    if (slotIndex < 0 || slotIndex >= slotCount.value) return

    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    next[slotIndex] = null
    config.selectedModuleIds = next
    syncModuleOrder()
  }

  function canMoveSelectedModule(fromIndex: number, toIndex: number) {
    const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
    if (
      fromIndex < 0 ||
      fromIndex >= next.length ||
      toIndex < 0 ||
      toIndex >= next.length
    ) {
      return false
    }

    if (!next[fromIndex]) return false
    ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
    return !hasRowTableConflict(next)
  }

  function moveSelectedModule(fromIndex: number, toIndex: number) {
    if (!canMoveSelectedModule(fromIndex, toIndex)) return false

    const currentSlots = normalizeSlotIds(config.selectedModuleIds, config.layout)
    if (fromIndex === toIndex) return true

    const next = [...currentSlots]
    const moved = next[fromIndex]
    const target = next[toIndex] ?? null
    next[toIndex] = moved
    next[fromIndex] = target

    config.selectedModuleIds = next
    syncModuleOrder()
    return true
  }

  function clearSelectedModules() {
    config.selectedModuleIds = normalizeSlotIds([], config.layout)
    syncModuleOrder()
  }

  function resetConfig() {
    config.themeId = defaultConfig.themeId
    config.layout = defaultConfig.layout
    config.selectedModuleIds = [...defaultConfig.selectedModuleIds]
    config.moduleOrder = [...defaultConfig.moduleOrder]
  }

  // 持久化:配置变化即写入 localStorage(替代原 useDashboardConfig 中的 watch)
  watch(
    config,
    (value) => {
      writeStorage(STORAGE_KEY, {
        themeId: value.themeId,
        layout: value.layout,
        selectedModuleIds: value.selectedModuleIds,
        moduleOrder: value.moduleOrder,
      })
    },
    { deep: true },
  )

  return {
    config,
    activeTheme,
    slotCount,
    orderedModules,
    selectedModules,
    selectedSlotModules,
    availableModules,
    setTheme,
    setLayout,
    moveModule,
    addModuleToLayout,
    canPlaceModuleInSlot,
    placeModuleInSlot,
    removeModuleFromLayout,
    canMoveSelectedModule,
    moveSelectedModule,
    clearSelectedModules,
    resetConfig,
  }
})
