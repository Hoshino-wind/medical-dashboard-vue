import type { Component } from 'vue'
import type { ChartDisplayType } from './config'
import type { DashboardData } from './dashboard'

/**
 * 大屏模块相关类型。
 *
 * `ModuleKind` 是驱动渲染的核心:ModuleRenderer 基于 kind 在
 * moduleRegistry 中查找对应组件,而非用一长串 `v-if` 判断模块 id。
 */
export type ModuleKind =
  'overview' | 'table' | 'bar' | 'line' | 'availability' | 'completion' | 'health' | 'distribution'

/** 模块占位尺寸:wide 表示跨列布局 */
export type ModuleSize = 'normal' | 'wide'

/**
 * 业务变体联合类型。
 *
 * 用于区分模块消费的数据切片与展示形态(如生命支持/超声、报修/保养/巡检),
 * 替代原先散落在各组件 props 中的裸 `string` 声明——
 * 后者无法在编译期拦截拼写错误,且与 catalog 中的 variant 字段失去契约。
 *
 * 命名规则:沿用各模块在 `moduleCatalog` 中已使用的字符串字面量,
 * 新增业务场景时请同步扩展本联合与对应组件的运行时分支。
 */
export type ModuleVariant = 'repair' | 'maintenance' | 'inspection' | 'life' | 'ultrasound'

/** 笛卡尔坐标图表(报修/保养/巡检统计)允许的业务变体 */
export type CartesianChartVariant = Extract<
  ModuleVariant,
  'repair' | 'maintenance' | 'inspection'
>

/** 可用率模块(生命支持/超声)允许的业务变体 */
export type AvailabilityVariant = Extract<ModuleVariant, 'life' | 'ultrasound'>

/**
 * 模块目录项。
 * `title` 为主标题,`subtitle` 为可选副标题(如"近7天"),
 * 替代原先用正则解析 `（xxx）` 的脆弱实现。
 */
export interface ModuleCatalogItem {
  id: string
  /** 模块序号,用于配置页排序/预览展示,不再渲染在大屏卡片标题 */
  number: string
  title: string
  subtitle?: string
  kind: ModuleKind
  size: ModuleSize
  /**
   * 该模块消费的 DashboardData 数据切片键。
   * 供 moduleRegistry 数据驱动取数(`ctx.data[dataKey]`),
   * 替代早先按 `module.id === '...'` 的硬编码分支。
   * 单一数据源、由 kind 直接决定取数的模块可省略。
   */
  dataKey?: keyof DashboardData
  /**
   * 业务变体,透传给展示组件区分呈现(如 life / ultrasound / repair / maintenance / inspection)。
   * 类型收紧为 `ModuleVariant` 联合,新增业务场景需同步扩展该联合。
   */
  variant?: ModuleVariant
  /** 仅统计图表模块提供；声明默认展示形态和单系列图例名称。 */
  chart?: {
    defaultType: ChartDisplayType
    seriesName: string
  }
}

/**
 * 运行时模块:在目录项(ModuleCatalogItem)基础上携带解析后的组件引用。
 *
 * 当前配置驱动架构下,组件与 props 的映射由 `config/moduleRegistry.ts`
 * 集中维护(基于 kind 查表),故 ModuleCatalogItem 已足够描述大屏数据。
 * 此类型保留为运行期扩展契约:未来若需要把组件引用直接挂在模块上
 * (例如动态装配 / 外部插件注入模块),可直接使用本类型。
 */
export interface DashboardModule extends ModuleCatalogItem {
  component?: Component
}
