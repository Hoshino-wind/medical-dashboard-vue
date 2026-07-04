import type { Component } from 'vue'

/**
 * 大屏模块相关类型。
 *
 * `ModuleKind` 是驱动渲染的核心:ModuleRenderer 基于 kind 在
 * moduleRegistry 中查找对应组件,而非用一长串 `v-if` 判断模块 id。
 */
export type ModuleKind =
  | 'overview'
  | 'table'
  | 'bar'
  | 'line'
  | 'availability'
  | 'completion'
  | 'health'

/** 模块占位尺寸:wide 表示跨列布局 */
export type ModuleSize = 'normal' | 'wide'

/**
 * 模块目录项。
 * `title` 为主标题,`subtitle` 为可选副标题(如"近7天"),
 * 替代原先用正则解析 `（xxx）` 的脆弱实现。
 */
export interface ModuleCatalogItem {
  id: string
  /** 模块序号,显示在面板左上角,如 "01" */
  number: string
  title: string
  subtitle?: string
  kind: ModuleKind
  size: ModuleSize
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
