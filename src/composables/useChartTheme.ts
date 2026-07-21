import { toValue, type MaybeRefOrGetter } from 'vue'
import type { Theme, ThemeVariables } from '@/types/theme'

/**
 * 图表主题读取工具,收敛各图表组件里重复的 token() / isLight 样板。
 *
 * 早先每个图表组件都各自声明一份 `token()` 访问器和
 * 主题明暗也由显式 mode 提供，不再依赖 ID 命名约定。
 * 统一到此 composable 后,新增图表直接复用同一套读取逻辑。
 *
 * @param theme 主题对象,可为 ref / getter / 原值(允许为空)
 * @example
 * const { token, isLight } = useChartTheme(() => props.theme)
 * const barColor = token('--data-bar')
 */
export function useChartTheme(theme: MaybeRefOrGetter<Theme | undefined>) {
  /** 读取主题 CSS 变量;主题或该变量缺失时回退到 fallback(默认空串) */
  function token(name: keyof ThemeVariables, fallback = ''): string {
    return toValue(theme)?.variables[name] ?? fallback
  }

  /** 当前是否为浅色主题 */
  function isLight(): boolean {
    return toValue(theme)?.mode === 'light'
  }

  return { token, isLight }
}
