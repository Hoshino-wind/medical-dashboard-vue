import {
  CURRENT_DASHBOARD_CONFIG_VERSION,
  type ChartDisplayType,
  type DashboardConfig,
} from '@/types/config'
import type {
  ChartModuleCatalogItem,
  ChartModuleId,
  ModuleCatalogItem,
  ModuleId,
} from '@/types/module'

/** 模块目录是渲染、配置面板和布局规则共同使用的唯一元数据来源。 */
export const moduleCatalog = [
  {
    id: 'overview',
    number: '01',
    title: '设备总览',
    kind: 'overview',
    dataKey: 'overview',
    size: 'normal',
    displayType: 'chart',
  },
  {
    id: 'repairOrders',
    number: '02',
    title: '维修工单',
    kind: 'table',
    dataKey: 'repairOrders',
    size: 'wide',
    displayType: 'table',
  },
  {
    id: 'repairStats',
    number: '03',
    title: '保修统计',
    subtitle: '近7天',
    kind: 'bar',
    dataKey: 'repairStats',
    size: 'normal',
    displayType: 'chart',
    variant: 'repair',
    chart: { defaultType: 'bar', seriesName: '报修台次' },
  },
  {
    id: 'lifeSupport',
    number: '04',
    title: '生命支持设备可用率',
    kind: 'availability',
    dataKey: 'lifeSupport',
    size: 'normal',
    displayType: 'chart',
    variant: 'life',
  },
  {
    id: 'inspectionOrders',
    number: '05',
    title: '巡检工单',
    kind: 'completion',
    dataKey: 'inspectionOrders',
    size: 'wide',
    displayType: 'table',
  },
  {
    id: 'maintenanceStats',
    number: '06',
    title: '保养统计',
    subtitle: '近7天',
    kind: 'line',
    dataKey: 'maintenanceStats',
    size: 'normal',
    displayType: 'chart',
    variant: 'maintenance',
    chart: { defaultType: 'line', seriesName: '保养台次' },
  },
  {
    id: 'ultrasound',
    number: '07',
    title: '超声设备可用率',
    kind: 'availability',
    dataKey: 'ultrasound',
    size: 'normal',
    displayType: 'chart',
    variant: 'ultrasound',
  },
  {
    id: 'healthTrend',
    number: '08',
    title: '保养工单',
    kind: 'health',
    dataKey: 'healthTrend',
    size: 'wide',
    displayType: 'table',
  },
  {
    id: 'inspectionStats',
    number: '09',
    title: '巡检统计',
    subtitle: '近7天',
    kind: 'line',
    dataKey: 'inspectionStats',
    size: 'normal',
    displayType: 'chart',
    variant: 'inspection',
    chart: { defaultType: 'line', seriesName: '巡检台次' },
  },
  {
    id: 'deviceDistribution',
    number: '10',
    title: '设备分布台数占比',
    kind: 'distribution',
    dataKey: 'deviceDistribution',
    size: 'normal',
    displayType: 'chart',
  },
] as const satisfies readonly ModuleCatalogItem[]

const moduleIds = new Set<ModuleId>(moduleCatalog.map((item) => item.id))

export function isModuleId(value: unknown): value is ModuleId {
  return typeof value === 'string' && moduleIds.has(value as ModuleId)
}

export function findModuleById(moduleId: ModuleId): ModuleCatalogItem {
  const module = moduleCatalog.find((item) => item.id === moduleId)
  if (!module) throw new Error(`未知大屏模块：${moduleId}`)
  return module
}

export function isConfigurableChartModule(
  module: ModuleCatalogItem,
): module is ChartModuleCatalogItem {
  return 'chart' in module
}

export const configurableChartModules = moduleCatalog.filter(
  (module): module is Extract<(typeof moduleCatalog)[number], { readonly chart: unknown }> =>
    'chart' in module,
)

const chartTypes = Object.fromEntries(
  configurableChartModules.map((module) => [module.id, module.chart.defaultType]),
) as Record<ChartModuleId, ChartDisplayType>

export const defaultConfig: DashboardConfig = {
  schemaVersion: CURRENT_DASHBOARD_CONFIG_VERSION,
  themeId: 'deep-sea-instrument',
  panelStyle: 'glass-flow',
  layout: '3x3',
  ringColorMode: 'solid',
  barColorMode: 'gradient',
  chartTypes,
  selectedModuleIds: moduleCatalog.slice(0, 9).map((item) => item.id),
}
