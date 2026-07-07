import { computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { themes } from '@/data/themes'
import { defaultConfig, moduleCatalog } from '@/data/modules'
import { readStorage, writeStorage } from '@/utils/storage'
import type { LayoutType } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

const STORAGE_KEY = 'medical-dashboard-config'

/** 合法的布局值,用于校验 localStorage 脏数据 */
const VALID_LAYOUTS: LayoutType[] = ['2x3', '3x3']

/** 从 localStorage 读取并校验配置,脏数据回退到默认值 */
function loadConfig() {
  const saved = readStorage<Partial<{ themeId: ThemeId; layout: LayoutType; moduleOrder: string[] }>>(
    STORAGE_KEY,
  )
  const validThemeIds = new Set(themes.map((t) => t.id))
  return {
    themeId:
      saved?.themeId && validThemeIds.has(saved.themeId) ? saved.themeId : defaultConfig.themeId,
    layout:
      saved?.layout && VALID_LAYOUTS.includes(saved.layout) ? saved.layout : defaultConfig.layout,
    moduleOrder:
      Array.isArray(saved?.moduleOrder) && saved!.moduleOrder.length > 0
        ? saved!.moduleOrder
        : [...defaultConfig.moduleOrder],
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  const config = reactive(loadConfig())

  /** 当前生效的主题对象 */
  const activeTheme = computed<Theme>(
    () => themes.find((t) => t.id === config.themeId) ?? themes[0],
  )

  /** 按 moduleOrder 排列后的模块列表(自动补齐 catalog 中缺失的模块) */
  const orderedModules = computed<ModuleCatalogItem[]>(() => {
    const orderedIds = new Set(config.moduleOrder)
    const configured = config.moduleOrder
      .map((id) => moduleCatalog.find((item) => item.id === id))
      .filter((item): item is ModuleCatalogItem => Boolean(item))
    const missing = moduleCatalog.filter((item) => !orderedIds.has(item.id))
    return [...configured, ...missing]
  })

  function setTheme(themeId: ThemeId) {
    config.themeId = themeId
  }

  function setLayout(layout: LayoutType) {
    config.layout = layout
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
  }

  function resetConfig() {
    config.themeId = defaultConfig.themeId
    config.layout = defaultConfig.layout
    config.moduleOrder = [...defaultConfig.moduleOrder]
  }

  // 持久化:配置变化即写入 localStorage(替代原 useDashboardConfig 中的 watch)
  watch(
    config,
    (value) => {
      writeStorage(STORAGE_KEY, {
        themeId: value.themeId,
        layout: value.layout,
        moduleOrder: value.moduleOrder,
      })
    },
    { deep: true },
  )

  return {
    config,
    activeTheme,
    orderedModules,
    setTheme,
    setLayout,
    moveModule,
    resetConfig,
  }
})
