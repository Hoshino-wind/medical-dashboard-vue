/** 主题标识 */
export type ThemeId =
  | 'light-medical'
  | 'deep-sea-instrument'
  | 'ink-blue-medical'
  | 'midnight-violet'
  | 'black-gold-blue'

/** 全部主题 ID 常量,可用于遍历或校验 */
export const THEME_IDS: ThemeId[] = [
  'light-medical',
  'deep-sea-instrument',
  'ink-blue-medical',
  'midnight-violet',
  'black-gold-blue',
]

/**
 * 主题注入到根节点的 CSS 变量集合。
 * 变量名为合法 CSS 自定义属性名,值统一为字符串(颜色 / 阴影)。
 */
export interface ThemeVariables {
  '--bg-top': string
  '--bg-bottom': string
  '--backdrop': string
  '--bg': string
  '--bg-soft': string
  '--surface': string
  '--surface-strong': string
  '--surface-muted': string
  '--glass': string
  '--glass-strong': string
  '--glass-edge': string
  '--glass-highlight': string
  '--border': string
  '--border-strong': string
  '--text': string
  '--muted': string
  '--accent': string
  '--accent-2': string
  '--accent-3': string
  '--chart-primary': string
  '--chart-secondary': string
  '--chart-tertiary': string
  '--data-bar': string
  '--data-bar-secondary': string
  '--data-bar-2': string
  '--data-bar-3': string
  '--data-maintenance-line': string
  '--data-inspection-line': string
  '--data-ring': string
  '--data-ring-secondary': string
  '--data-pie-primary': string
  '--data-pie-pending': string
  '--data-health-pie-good': string
  '--data-health-pie-warning': string
  '--data-health-pie-repairing': string
  '--data-health-pie-pending': string
  '--data-inspection-pie-finished': string
  '--data-inspection-pie-waiting': string
  '--data-inspection-pie-overdue': string
  '--instrument-base': string
  '--instrument-base-rim': string
  '--instrument-rim': string
  '--good': string
  '--warn': string
  '--danger': string
  '--chart-grid': string
  '--star-white': string
  '--star-accent': string
  '--star-opacity': string
  '--grid-opacity': string
  '--grid-blend-mode': string
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
