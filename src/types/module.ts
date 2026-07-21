import type { ChartDisplayType } from './config'
import type { DashboardData } from './dashboard'

export type ModuleSize = 'normal' | 'wide'
export type ModuleDisplayType = 'chart' | 'table'

interface ModuleBase<
  Id extends string,
  Kind extends string,
  DataKey extends keyof DashboardData,
  Size extends ModuleSize,
  Display extends ModuleDisplayType,
> {
  id: Id
  number: string
  title: string
  subtitle?: string
  kind: Kind
  dataKey: DataKey
  size: Size
  displayType: Display
}

type OverviewModule = ModuleBase<'overview', 'overview', 'overview', 'normal', 'chart'>
type RepairOrdersModule = ModuleBase<'repairOrders', 'table', 'repairOrders', 'wide', 'table'>

type RepairStatsModule = ModuleBase<'repairStats', 'bar', 'repairStats', 'normal', 'chart'> & {
  variant: 'repair'
  chart: { defaultType: ChartDisplayType; seriesName: string }
}

type LifeSupportModule = ModuleBase<
  'lifeSupport',
  'availability',
  'lifeSupport',
  'normal',
  'chart'
> & { variant: 'life' }

type InspectionOrdersModule = ModuleBase<
  'inspectionOrders',
  'completion',
  'inspectionOrders',
  'wide',
  'table'
>

type MaintenanceStatsModule = ModuleBase<
  'maintenanceStats',
  'line',
  'maintenanceStats',
  'normal',
  'chart'
> & {
  variant: 'maintenance'
  chart: { defaultType: ChartDisplayType; seriesName: string }
}

type UltrasoundModule = ModuleBase<
  'ultrasound',
  'availability',
  'ultrasound',
  'normal',
  'chart'
> & { variant: 'ultrasound' }

type HealthTrendModule = ModuleBase<'healthTrend', 'health', 'healthTrend', 'wide', 'table'>

type InspectionStatsModule = ModuleBase<
  'inspectionStats',
  'line',
  'inspectionStats',
  'normal',
  'chart'
> & {
  variant: 'inspection'
  chart: { defaultType: ChartDisplayType; seriesName: string }
}

type DeviceDistributionModule = ModuleBase<
  'deviceDistribution',
  'distribution',
  'deviceDistribution',
  'normal',
  'chart'
>

/** 每种模块的 ID、数据键、变体和布局能力在编译期保持一一对应。 */
export type ModuleCatalogItem =
  | OverviewModule
  | RepairOrdersModule
  | RepairStatsModule
  | LifeSupportModule
  | InspectionOrdersModule
  | MaintenanceStatsModule
  | UltrasoundModule
  | HealthTrendModule
  | InspectionStatsModule
  | DeviceDistributionModule

export type ModuleId = ModuleCatalogItem['id']
export type ModuleKind = ModuleCatalogItem['kind']
export type ModuleByKind<Kind extends ModuleKind> = Extract<ModuleCatalogItem, { kind: Kind }>
export type ChartModuleCatalogItem = Extract<ModuleCatalogItem, { chart: unknown }>
export type ChartModuleId = ChartModuleCatalogItem['id']
export type CartesianChartModule = Extract<ModuleCatalogItem, { kind: 'bar' | 'line' }>
export type AvailabilityModule = Extract<ModuleCatalogItem, { kind: 'availability' }>
export type CartesianChartVariant = CartesianChartModule['variant']
export type AvailabilityVariant = AvailabilityModule['variant']
