import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'
import type { ModuleCatalogItem, ModuleKind } from '@/types/module'
import type { DashboardData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import type { FieldConfig, ModuleSettings } from '@/types/config'

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
  settings?: ModuleSettings
}

export interface ModuleRenderEntry {
  component: Component
  resolveProps: (module: ModuleCatalogItem, ctx: ModuleRenderContext) => Record<string, unknown>
}

const REPAIR_FIELD_ORDER = ['department', 'equipment', 'code', 'duration', 'owner', 'status']
const REPAIR_FALLBACK_HEADERS = ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态']
const REPAIR_STAT_FIELD_ORDER = ['fullService', 'techService', 'vendorService']

function visibleFields(settings?: ModuleSettings): FieldConfig[] {
  return settings?.fields.filter((field) => field.visible) ?? []
}

function fieldLabel(settings: ModuleSettings | undefined, key: string, fallback: string): string {
  return settings?.fields.find((field) => field.key === key)?.label || fallback
}

function projectRows(rows: string[][], fields: FieldConfig[], order: string[]): string[][] {
  const indexes = fields.map((field) => order.indexOf(field.key)).filter((index) => index >= 0)

  if (indexes.length === 0) return []
  return rows.map((row) => indexes.map((index) => row[index] ?? ''))
}

function resolveTable(ctx: ModuleRenderContext): Record<string, unknown> {
  const fields = visibleFields(ctx.settings)
  const resolvedFields =
    fields.length > 0
      ? fields
      : REPAIR_FIELD_ORDER.map((key, index) => ({
          key,
          label: REPAIR_FALLBACK_HEADERS[index],
          visible: true,
        }))

  return {
    headers: resolvedFields.map((field) => field.label),
    rows: projectRows(ctx.data.repairOrders, resolvedFields, REPAIR_FIELD_ORDER),
  }
}

function applyAvailabilityFields(
  items: DashboardData['lifeSupport'],
  settings?: ModuleSettings,
): DashboardData['lifeSupport'] {
  const fields = visibleFields(settings)
  if (fields.length === 0) return []
  return fields
    .map((field, index) => {
      const source = items[index]
      return source ? { ...source, name: field.label } : null
    })
    .filter((item): item is DashboardData['lifeSupport'][number] => Boolean(item))
}

function applyBarFields(
  data: DashboardData['repairStats'],
  settings?: ModuleSettings,
): DashboardData['repairStats'] {
  const fields = visibleFields(settings)
  const series = data.series
    .map((item, index) => {
      const field = fields.find((candidate) => candidate.key === REPAIR_STAT_FIELD_ORDER[index])
      return field ? { ...item, name: field.label } : null
    })
    .filter((item): item is DashboardData['repairStats']['series'][number] => Boolean(item))

  return { ...data, series }
}

function resolveAvailability(
  module: ModuleCatalogItem,
  ctx: ModuleRenderContext,
): Record<string, unknown> {
  if (module.id === 'ultrasound') {
    return {
      items: applyAvailabilityFields(ctx.data.ultrasound, ctx.settings),
      variant: 'ultrasound',
    }
  }
  return {
    items: applyAvailabilityFields(ctx.data.lifeSupport, ctx.settings),
    variant: 'life',
  }
}

function resolveLine(module: ModuleCatalogItem, ctx: ModuleRenderContext): Record<string, unknown> {
  if (module.id === 'inspectionStats') {
    return {
      type: 'inspection',
      data: ctx.data.inspectionStats,
      theme: ctx.theme,
      metricLabel: fieldLabel(ctx.settings, 'count', '巡检数量'),
    }
  }
  return {
    type: 'maintenance',
    data: ctx.data.maintenanceStats,
    theme: ctx.theme,
    metricLabel: fieldLabel(ctx.settings, 'count', '保养数量'),
  }
}

export const moduleRegistry: Record<ModuleKind, ModuleRenderEntry> = {
  overview: {
    component: OverviewModule,
    resolveProps: (_module, ctx) => ({ data: ctx.data.overview, fields: ctx.settings?.fields }),
  },
  table: {
    component: WorkOrderTable,
    resolveProps: (_module, ctx) => resolveTable(ctx),
  },
  bar: {
    component: ChartModule,
    resolveProps: (_module, ctx) => ({
      type: 'bar',
      data: applyBarFields(ctx.data.repairStats, ctx.settings),
      theme: ctx.theme,
    }),
  },
  availability: {
    component: AvailabilityModule,
    resolveProps: resolveAvailability,
  },
  completion: {
    component: CompletionModule,
    resolveProps: (_module, ctx) => ({
      data: ctx.data.inspectionOrders,
      fields: ctx.settings?.fields,
    }),
  },
  line: {
    component: ChartModule,
    resolveProps: resolveLine,
  },
  health: {
    component: HealthTrendModule,
    resolveProps: (_module, ctx) => ({
      data: ctx.data.healthTrend,
      theme: ctx.theme,
      fields: ctx.settings?.fields,
    }),
  },
}
