import type { ThemeId } from './theme'

/** 当前大屏固定为九模块九宫格,保留布局字段用于持久化兼容。 */
export type LayoutType = '3x3'

/** 单个可配置字段:用于控制标签与是否展示。 */
export interface FieldConfig {
  key: string
  label: string
  visible: boolean
  unit?: string
}

/** 单个模块的可配置项。 */
export interface ModuleSettings {
  title: string
  subtitle?: string
  fields: FieldConfig[]
}

/** 模块配置映射,key 为 module id。 */
export type ModuleSettingsMap = Record<string, ModuleSettings>

/** 大屏配置(可序列化、可持久化到 localStorage) */
export interface DashboardConfig {
  themeId: ThemeId
  layout: LayoutType
  moduleOrder: string[]
  moduleSettings: ModuleSettingsMap
}
