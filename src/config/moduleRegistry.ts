import { defineAsyncComponent } from 'vue'
import type { Component } from 'vue'
import type { DashboardConfig } from '@/types/config'
import type { DashboardData } from '@/types/dashboard'
import type { ModuleByKind, ModuleCatalogItem, ModuleKind } from '@/types/module'
import type { Theme } from '@/types/theme'

const OverviewModule = defineAsyncComponent(() => import('@/components/modules/OverviewModule.vue'))
const WorkOrderTable = defineAsyncComponent(() => import('@/components/modules/WorkOrderTable.vue'))
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

export interface ModuleRenderContext {
  data: DashboardData
  theme: Theme
  config: DashboardConfig
}

interface ModuleRenderEntry<Kind extends ModuleKind> {
  component: Component
  resolveProps: (module: ModuleByKind<Kind>, ctx: ModuleRenderContext) => Record<string, unknown>
}

type ModuleRegistry = {
  [Kind in ModuleKind]: ModuleRenderEntry<Kind>
}

function resolveAvailability(
  module: ModuleByKind<'availability'>,
  ctx: ModuleRenderContext,
): Record<string, unknown> {
  return {
    items: ctx.data[module.dataKey],
    variant: module.variant,
    ringColorMode: ctx.config.ringColorMode,
  }
}

function resolveCartesian(
  module: ModuleByKind<'bar' | 'line'>,
  ctx: ModuleRenderContext,
): Record<string, unknown> {
  return {
    variant: module.variant,
    chartType: ctx.config.chartTypes[module.id] ?? module.chart.defaultType,
    seriesName: module.chart.seriesName,
    data: ctx.data[module.dataKey],
    theme: ctx.theme,
  }
}

export const moduleRegistry: ModuleRegistry = {
  overview: {
    component: OverviewModule,
    resolveProps: (module, ctx) => ({ data: ctx.data[module.dataKey] }),
  },
  table: {
    component: WorkOrderTable,
    resolveProps: (module, ctx) => ({ rows: ctx.data[module.dataKey] }),
  },
  bar: { component: ChartModule, resolveProps: resolveCartesian },
  availability: { component: AvailabilityModule, resolveProps: resolveAvailability },
  completion: {
    component: CompletionModule,
    resolveProps: (module, ctx) => ({ data: ctx.data[module.dataKey], theme: ctx.theme }),
  },
  line: { component: ChartModule, resolveProps: resolveCartesian },
  health: {
    component: HealthTrendModule,
    resolveProps: (module, ctx) => ({ data: ctx.data[module.dataKey], theme: ctx.theme }),
  },
  distribution: {
    component: DeviceDistributionModule,
    resolveProps: (module, ctx) => ({
      items: ctx.data[module.dataKey],
      barColorMode: ctx.config.barColorMode,
    }),
  },
}

export interface ResolvedModuleRender {
  component: Component
  props: Record<string, unknown>
}

function resolveEntry<Kind extends ModuleKind>(
  entry: ModuleRenderEntry<Kind>,
  module: ModuleByKind<Kind>,
  ctx: ModuleRenderContext,
): ResolvedModuleRender {
  return { component: entry.component, props: entry.resolveProps(module, ctx) }
}

/** switch 负责收窄判别联合，避免动态注册表在调用端退化为类型断言。 */
export function resolveModuleRender(
  module: ModuleCatalogItem,
  ctx: ModuleRenderContext,
): ResolvedModuleRender {
  switch (module.kind) {
    case 'overview':
      return resolveEntry(moduleRegistry.overview, module, ctx)
    case 'table':
      return resolveEntry(moduleRegistry.table, module, ctx)
    case 'bar':
      return resolveEntry(moduleRegistry.bar, module, ctx)
    case 'availability':
      return resolveEntry(moduleRegistry.availability, module, ctx)
    case 'completion':
      return resolveEntry(moduleRegistry.completion, module, ctx)
    case 'line':
      return resolveEntry(moduleRegistry.line, module, ctx)
    case 'health':
      return resolveEntry(moduleRegistry.health, module, ctx)
    case 'distribution':
      return resolveEntry(moduleRegistry.distribution, module, ctx)
  }
}
