/** 主题标识 */
export type ThemeId =
  'clinical-command' | 'light-medical' | 'deep-blue' | 'aurora-purple' | 'teal-future'

/** 全部主题 ID 常量,可用于遍历或校验 */
export const THEME_IDS: ThemeId[] = [
  'clinical-command',
  'light-medical',
  'deep-blue',
  'aurora-purple',
  'teal-future',
]

/**
 * 主题注入到根节点的 CSS 变量集合。
 * 变量名为合法 CSS 自定义属性名,值统一为字符串(颜色 / 阴影)。
 */
export interface ThemeVariables {
  '--bg': string
  '--bg-soft': string
  '--surface': string
  '--surface-strong': string
  '--surface-muted': string
  '--border': string
  '--border-strong': string
  '--text': string
  '--muted': string
  '--accent': string
  '--accent-2': string
  '--accent-3': string
  '--good': string
  '--warn': string
  '--danger': string
  '--chart-grid': string
  '--panel-shadow': string
  /** 允许任意 CSS 自定义属性,以便赋值给 Vue 的 style(CSSProperties) */
  [key: `--${string}`]: string
}

/** 主题定义 */
export interface Theme {
  id: ThemeId
  name: string
  description: string
  /** 主题预览配色,用于配置页色块展示 */
  preview: string[]
  variables: ThemeVariables
}
