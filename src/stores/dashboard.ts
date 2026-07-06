import { computed, reactive, watch } from 'vue'
import { defineStore } from 'pinia'
import { themes } from '@/data/themes'
import { defaultConfig, defaultModuleSettings, moduleCatalog } from '@/data/modules'
import { readStorage, writeStorage } from '@/utils/storage'
import type { DashboardConfig, FieldConfig, LayoutType, ModuleSettingsMap } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

const STORAGE_KEY = 'medical-dashboard-config'

/** 合法的布局值,用于校验 localStorage 脏数据 */
const VALID_LAYOUTS: LayoutType[] = ['3x3']

type SavedConfig = Partial<DashboardConfig>

function cloneField(field: FieldConfig): FieldConfig {
  return { ...field }
}

function cloneModuleSettings(settings: ModuleSettingsMap): ModuleSettingsMap {
  return Object.fromEntries(
    moduleCatalog.map((item) => {
      const source = settings[item.id] ?? defaultModuleSettings[item.id]
      return [
        item.id,
        {
          title: source.title,
          subtitle: source.subtitle,
          fields: source.fields.map(cloneField),
        },
      ]
    }),
  )
}

function normalizeModuleOrder(savedOrder?: string[]): string[] {
  const catalogIds = new Set(moduleCatalog.map((item) => item.id))
  const configured = Array.isArray(savedOrder)
    ? savedOrder.filter((id, index, arr) => catalogIds.has(id) && arr.indexOf(id) === index)
    : []
  const configuredIds = new Set(configured)
  const missing = moduleCatalog.map((item) => item.id).filter((id) => !configuredIds.has(id))
  return [...configured, ...missing]
}

function normalizeModuleSettings(saved?: ModuleSettingsMap): ModuleSettingsMap {
  return Object.fromEntries(
    moduleCatalog.map((item) => {
      const fallback = defaultModuleSettings[item.id]
      const savedModule = saved?.[item.id]
      const savedFields = new Map(savedModule?.fields?.map((field) => [field.key, field]))

      return [
        item.id,
        {
          title:
            typeof savedModule?.title === 'string' && savedModule.title.trim()
              ? savedModule.title.trim()
              : fallback.title,
          subtitle:
            typeof savedModule?.subtitle === 'string' && savedModule.subtitle.trim()
              ? savedModule.subtitle.trim()
              : fallback.subtitle,
          fields: fallback.fields.map((field) => {
            const savedField = savedFields.get(field.key)
            return {
              ...field,
              label:
                typeof savedField?.label === 'string' && savedField.label.trim()
                  ? savedField.label.trim()
                  : field.label,
              visible:
                typeof savedField?.visible === 'boolean' ? savedField.visible : field.visible,
              unit:
                typeof savedField?.unit === 'string' && savedField.unit.trim()
                  ? savedField.unit.trim()
                  : field.unit,
            }
          }),
        },
      ]
    }),
  )
}

/** 从 localStorage 读取并校验配置,脏数据回退到默认值 */
function loadConfig(): DashboardConfig {
  const saved = readStorage<SavedConfig>(STORAGE_KEY)
  const validThemeIds = new Set(themes.map((t) => t.id))
  return {
    themeId:
      saved?.themeId && validThemeIds.has(saved.themeId) ? saved.themeId : defaultConfig.themeId,
    layout:
      saved?.layout && VALID_LAYOUTS.includes(saved.layout) ? saved.layout : defaultConfig.layout,
    moduleOrder: normalizeModuleOrder(saved?.moduleOrder),
    moduleSettings: normalizeModuleSettings(saved?.moduleSettings),
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
    return [...configured, ...missing].map((item) => {
      const settings = config.moduleSettings[item.id]
      return {
        ...item,
        title: settings?.title || item.title,
        subtitle: settings?.subtitle ?? item.subtitle,
      }
    })
  })

  function setTheme(themeId: ThemeId) {
    config.themeId = themeId
  }

  function setLayout(layout: LayoutType) {
    config.layout = VALID_LAYOUTS.includes(layout) ? layout : defaultConfig.layout
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
    config.moduleSettings = cloneModuleSettings(defaultModuleSettings)
  }

  function updateModuleTitle(moduleId: string, title: string) {
    const settings = config.moduleSettings[moduleId]
    const fallback = defaultModuleSettings[moduleId]
    if (!settings || !fallback) return
    settings.title = title.trim() || fallback.title
  }

  function updateModuleSubtitle(moduleId: string, subtitle: string) {
    const settings = config.moduleSettings[moduleId]
    if (!settings) return
    const next = subtitle.trim()
    settings.subtitle = next || undefined
  }

  function updateFieldLabel(moduleId: string, fieldKey: string, label: string) {
    const settings = config.moduleSettings[moduleId]
    const fallbackField = defaultModuleSettings[moduleId]?.fields.find(
      (field) => field.key === fieldKey,
    )
    const field = settings?.fields.find((item) => item.key === fieldKey)
    if (!field || !fallbackField) return
    field.label = label.trim() || fallbackField.label
  }

  function toggleField(moduleId: string, fieldKey: string, visible: boolean) {
    const field = config.moduleSettings[moduleId]?.fields.find((item) => item.key === fieldKey)
    if (!field) return
    field.visible = visible
  }

  // 持久化:配置变化即写入 localStorage(替代原 useDashboardConfig 中的 watch)
  watch(
    config,
    (value) => {
      writeStorage(STORAGE_KEY, {
        themeId: value.themeId,
        layout: value.layout,
        moduleOrder: value.moduleOrder,
        moduleSettings: value.moduleSettings,
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
    updateModuleTitle,
    updateModuleSubtitle,
    updateFieldLabel,
    toggleField,
  }
})
