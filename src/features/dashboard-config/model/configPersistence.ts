import { configurableChartModules, defaultConfig } from '@/data/modules'
import { themes } from '@/data/themes'
import { readStorage, writeStorage } from '@/utils/storage'
import {
  CHART_DISPLAY_TYPES,
  COLOR_MODES,
  CURRENT_DASHBOARD_CONFIG_VERSION,
  PANEL_STYLES,
  type ChartDisplayType,
  type ColorMode,
  type DashboardConfig,
  type LayoutType,
  type PanelStyle,
} from '@/types/config'
import type { ChartModuleId } from '@/types/module'
import type { ThemeId } from '@/types/theme'
import { catalogModuleIds, normalizeSlotIds } from './layoutRules'

export const DASHBOARD_CONFIG_STORAGE_KEY = 'medical-dashboard-config'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && themes.some((theme) => theme.id === value)
}

function isLayout(value: unknown): value is LayoutType {
  return value === '2x3' || value === '3x3'
}

function isPanelStyle(value: unknown): value is PanelStyle {
  return typeof value === 'string' && PANEL_STYLES.some((style) => style === value)
}

function isColorMode(value: unknown): value is ColorMode {
  return typeof value === 'string' && COLOR_MODES.some((mode) => mode === value)
}

function isChartDisplayType(value: unknown): value is ChartDisplayType {
  return typeof value === 'string' && CHART_DISPLAY_TYPES.some((type) => type === value)
}

function asSlotValues(value: unknown): Array<string | null> | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => (typeof item === 'string' ? item : null))
}

function normalizeChartTypes(value: unknown): Record<ChartModuleId, ChartDisplayType> {
  const savedTypes = isRecord(value) ? value : {}
  return Object.fromEntries(
    configurableChartModules.map((module) => {
      const savedType = savedTypes[module.id]
      return [
        module.id,
        isChartDisplayType(savedType) ? savedType : defaultConfig.chartTypes[module.id],
      ]
    }),
  ) as Record<ChartModuleId, ChartDisplayType>
}

/** 读取任意历史版本并归一化为当前配置；旧 moduleOrder 只用于一次性迁移槽位。 */
export function loadDashboardConfig(): DashboardConfig {
  const stored = readStorage<unknown>(DASHBOARD_CONFIG_STORAGE_KEY)
  const saved = isRecord(stored) ? stored : {}
  const layout = isLayout(saved.layout) ? saved.layout : defaultConfig.layout
  const legacyOrder = asSlotValues(saved.moduleOrder) ?? catalogModuleIds()
  const savedSlots = asSlotValues(saved.selectedModuleIds) ?? legacyOrder

  return {
    schemaVersion: CURRENT_DASHBOARD_CONFIG_VERSION,
    themeId: isThemeId(saved.themeId) ? saved.themeId : defaultConfig.themeId,
    panelStyle: isPanelStyle(saved.panelStyle) ? saved.panelStyle : defaultConfig.panelStyle,
    layout,
    ringColorMode: isColorMode(saved.ringColorMode)
      ? saved.ringColorMode
      : defaultConfig.ringColorMode,
    barColorMode: isColorMode(saved.barColorMode) ? saved.barColorMode : defaultConfig.barColorMode,
    chartTypes: normalizeChartTypes(saved.chartTypes),
    selectedModuleIds: normalizeSlotIds(savedSlots, layout),
  }
}

export function saveDashboardConfig(config: DashboardConfig): boolean {
  return writeStorage(DASHBOARD_CONFIG_STORAGE_KEY, {
    schemaVersion: CURRENT_DASHBOARD_CONFIG_VERSION,
    themeId: config.themeId,
    panelStyle: config.panelStyle,
    layout: config.layout,
    ringColorMode: config.ringColorMode,
    barColorMode: config.barColorMode,
    chartTypes: config.chartTypes,
    selectedModuleIds: config.selectedModuleIds,
  })
}
