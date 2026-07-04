import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'
import type { ModuleCatalogItem, ModuleKind } from '@/types/module'
import type { DashboardData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

/**
 * 大屏模块组件采用 defineAsyncComponent 懒加载,
 * 使每个业务模块(含其依赖的图表/可视化库)拆分为独立 chunk,
 * 减小首屏 JS 体积,模块按需加载。
 */
const OverviewModule = defineAsyncComponent(() => import('@/components/modules/OverviewModule.vue'))
const WorkOrderTable = defineAsyncComponent(() => import('@/components/WorkOrderTable.vue'))
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
}

export interface ModuleRenderEntry {
  component: Component
  resolveProps: (
    module: ModuleCatalogItem,
    ctx: ModuleRenderContext,
  ) => Record<string, unknown>
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

function resolveLine(
  module: ModuleCatalogItem,
  ctx: ModuleRenderContext,
): Record<string, unknown> {
  if (module.id === 'inspectionStats') {
    return { type: 'inspection', data: ctx.data.inspectionStats, theme: ctx.theme }
  }
  return { type: 'maintenance', data: ctx.data.maintenanceStats, theme: ctx.theme }
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
    resolveProps: (_module, ctx) => ({
      type: 'bar',
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
    resolveProps: (_module, ctx) => ({ data: ctx.data.inspectionOrders }),
  },
  line: {
    component: ChartModule,
    resolveProps: resolveLine,
  },
  health: {
    component: HealthTrendModule,
    resolveProps: (_module, ctx) => ({ data: ctx.data.healthTrend, theme: ctx.theme }),
  },
}
