import type { ModuleCatalogItem } from '@/types/module'
import type { DashboardConfig } from '@/types/config'

/** 模块目录:定义大屏可用模块及其渲染元信息 */
export const moduleCatalog: ModuleCatalogItem[] = [
  { id: 'overview', number: '01', title: '设备总览', kind: 'overview', size: 'normal' },
  { id: 'repairOrders', number: '02', title: '维修工单', kind: 'table', size: 'wide' },
  { id: 'repairStats', number: '03', title: '保修统计', subtitle: '近7天', kind: 'bar', size: 'normal' },
  { id: 'lifeSupport', number: '04', title: '生命支持设备可用率', kind: 'availability', size: 'normal' },
  { id: 'inspectionOrders', number: '05', title: '巡检工单', kind: 'completion', size: 'wide' },
  { id: 'maintenanceStats', number: '06', title: '保养统计', subtitle: '近7天', kind: 'line', size: 'normal' },
  { id: 'ultrasound', number: '07', title: '超声设备可用率', kind: 'availability', size: 'normal' },
  { id: 'healthTrend', number: '08', title: '保养工单', kind: 'health', size: 'wide' },
  { id: 'inspectionStats', number: '09', title: '巡检统计', subtitle: '近7天', kind: 'line', size: 'normal' },
  { id: 'deviceDistribution', number: '10', title: '设备分布台数占比', kind: 'distribution', size: 'normal' },
]

/** 默认配置 */
export const defaultConfig: DashboardConfig = {
  themeId: 'deep-sea-instrument',
  layout: '3x3',
  selectedModuleIds: moduleCatalog.slice(0, 9).map((item) => item.id),
  moduleOrder: moduleCatalog.map((item) => item.id),
}
