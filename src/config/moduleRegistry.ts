import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'
import type { ModuleCatalogItem, ModuleKind } from '@/types/module'
import type { DashboardConfig } from '@/types/config'
import type { DashboardData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

/**
 * 大屏模块组件采用 defineAsyncComponent 懒加载,
 * 使每个业务模块(含其依赖的图表/可视化库)拆分为独立 chunk,
 * 减小首屏 JS 体积,模块按需加载。
 */
const OverviewModule = defineAsyncComponent(() => import('@/components/modules/OverviewModule.vue'))
const WorkOrderTable = defineAsyncComponent(() => import('@/components/shared/WorkOrderTable.vue'))
const ChartModule = defineAsyncComponent(() => import('@/components/modules/ChartModule.vue'))
const AvailabilityModule = defineAsyncComponent(
  () => import('@/components/modules/AvailabilityModule.vue'),
)
const CompletionModule = defineAsyncComponent(
  () => import('@/components/modules/CompletionModule.vue'),
)
const HealthTrendModule = defineAsyncComponent(
  () => import('@/components/modules/HealthTrendModule.vue'),
)
const DeviceDistributionModule = defineAsyncComponent(
  () => import('@/components/modules/DeviceDistributionModule.vue'),
)

/**
 * 模块渲染注册表 —— 配置驱动的核心。
 *
 * ModuleRenderer 不再用一长串 `v-if (module.id === '...')` 判断,
 * 而是根据 `module.kind` 在此注册表查找对应组件与 props 解析逻辑。
 *
 * 新增模块只需:
 *   1. 在 moduleCatalog 增加一项(含 kind);
 *   2. 若引入新组件,在此注册表对应 kind 增加/调整映射。
 */
export interface ModuleRenderContext {
  data: DashboardData
  theme: Theme
  config: DashboardConfig
}

export interface ModuleRenderEntry {
  component: Component
  resolveProps: (module: ModuleCatalogItem, ctx: ModuleRenderContext) => Record<string, unknown>
}

const REPAIR_HEADERS = ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态']

function resolveAvailability(
  module: ModuleCatalogItem,
  ctx: ModuleRenderContext,
): Record<string, unknown> {
  if (module.id === 'ultrasound') {
    return { items: ctx.data.ultrasound, variant: 'ultrasound' }
  }
  return { items: ctx.data.lifeSupport, variant: 'life' }
}

function resolveLine(module: ModuleCatalogItem, ctx: ModuleRenderContext): Record<string, unknown> {
  if (module.id === 'inspectionStats') {
    return {
      variant: 'inspection',
      chartType: ctx.config.chartTypes[module.id] ?? module.chart?.defaultType,
      seriesName: module.chart?.seriesName,
      data: ctx.data.inspectionStats,
      theme: ctx.theme,
    }
  }
  return {
    variant: 'maintenance',
    chartType: ctx.config.chartTypes[module.id] ?? module.chart?.defaultType,
    seriesName: module.chart?.seriesName,
    data: ctx.data.maintenanceStats,
    theme: ctx.theme,
  }
}

export const moduleRegistry: Record<ModuleKind, ModuleRenderEntry> = {
  overview: {
    component: OverviewModule,
    resolveProps: (_module, ctx) => ({ data: ctx.data.overview }),
  },
  table: {
    component: WorkOrderTable,
    resolveProps: (_module, ctx) => ({ headers: REPAIR_HEADERS, rows: ctx.data.repairOrders }),
  },
  bar: {
    component: ChartModule,
    resolveProps: (module, ctx) => ({
      variant: 'repair',
      chartType: ctx.config.chartTypes[module.id] ?? module.chart?.defaultType,
      seriesName: module.chart?.seriesName,
      data: ctx.data.repairStats,
      theme: ctx.theme,
    }),
  },
  availability: {
    component: AvailabilityModule,
    resolveProps: resolveAvailability,
  },
  completion: {
    component: CompletionModule,
    resolveProps: (_module, ctx) => ({ data: ctx.data.inspectionOrders, theme: ctx.theme }),
  },
  line: {
    component: ChartModule,
    resolveProps: resolveLine,
  },
  health: {
    component: HealthTrendModule,
    resolveProps: (_module, ctx) => ({ data: ctx.data.healthTrend, theme: ctx.theme }),
  },
  distribution: {
    component: DeviceDistributionModule,
    resolveProps: (_module, ctx) => ({ items: ctx.data.deviceDistribution }),
  },
}
