import { configurableChartModules, defaultConfig } from '@/data/modules'
import { themes } from '@/data/themes'
import { readStorage, writeStorage } from '@/utils/storage'
import {
  CHART_DISPLAY_TYPES,
  CURRENT_DASHBOARD_CONFIG_VERSION,
  PANEL_STYLES,
  type ChartDisplayType,
  type ChartColorOverrides,
  type DashboardConfig,
  type LayoutType,
  type PanelStyle,
} from '@/types/config'
import type { ChartModuleId } from '@/types/module'
import type { ThemeId } from '@/types/theme'
import { catalogModuleIds, normalizeSlotIds } from './layoutRules'
import { isDashboardCustomColor } from './customColor'

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

function normalizeOptionalColor(value: unknown): string | null {
  return isDashboardCustomColor(value) ? value.toLowerCase() : null
}

function normalizeChartColors(saved: Record<string, unknown>): ChartColorOverrides {
  const savedColors = isRecord(saved.chartColors) ? saved.chartColors : null

  if (savedColors) {
    const bar = normalizeOptionalColor(savedColors.bar)
    return {
      ring: normalizeOptionalColor(savedColors.ring),
      pie: normalizeOptionalColor(savedColors.pie),
      bar,
      // v4 的 bar 同时控制柱状图和条形图；仅在新字段缺失时复制旧值。
      horizontalBar: Object.prototype.hasOwnProperty.call(savedColors, 'horizontalBar')
        ? normalizeOptionalColor(savedColors.horizontalBar)
        : bar,
    }
  }

  // v3 及更早版本只有环图/进度条的 custom 模式；仅迁移真正生效的覆盖色。
  const legacyBar =
    saved.barColorMode === 'custom' ? normalizeOptionalColor(saved.barCustomColor) : null
  return {
    ring: saved.ringColorMode === 'custom' ? normalizeOptionalColor(saved.ringCustomColor) : null,
    pie: null,
    bar: legacyBar,
    horizontalBar: legacyBar,
  }
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
    chartColors: normalizeChartColors(saved),
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
    chartColors: { ...config.chartColors },
    chartTypes: config.chartTypes,
    selectedModuleIds: config.selectedModuleIds,
  })
}
