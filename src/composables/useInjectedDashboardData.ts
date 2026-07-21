import { computed, inject, provide, ref } from 'vue'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { DashboardData } from '@/types/dashboard'

/**
 * 大屏业务数据的 provide/inject token。
 *
 * 数据加载由顶层 BigScreen 组件单点负责(useDashboardData + 守卫渲染),
 * 通过 provide 注入一个 Ref<DashboardData | null>。后代组件用
 * useInjectedDashboardData() 取到一个 ComputedRef<DashboardData>(非空),
 * 在数据就绪前 BigScreen 不会渲染 grid,因此 inject 端可安全解引用。
 *
 * 使用 ref 而非直接 provide 值,避免在 watch 回调中调用 provide()
 * 触发 Vue 的 "provide() can only be used inside setup()" 警告。
 */
export const DASHBOARD_DATA_KEY: InjectionKey<Ref<DashboardData | null>> =
  Symbol('dashboard-data')

/** 向后代注入大屏数据容器(在 setup 同步阶段调用一次) */
export function provideDashboardDataHolder(): Ref<DashboardData | null> {
  const holder = ref<DashboardData | null>(null)
  provide(DASHBOARD_DATA_KEY, holder)
  return holder
}

/** 后代组件读取大屏数据(非空计算属性;未注入时抛错以快速暴露调用链问题) */
export function useInjectedDashboardData(): ComputedRef<DashboardData> {
  const holder = inject(DASHBOARD_DATA_KEY, null)
  if (!holder) {
    throw new Error(
      '[useInjectedDashboardData] 未找到大屏数据注入,请确认上层 BigScreen 已 provideDashboardDataHolder()',
    )
  }
  return computed(() => {
    if (!holder.value) {
      throw new Error(
        '[useInjectedDashboardData] 数据尚未就绪——请确认 BigScreen 在 v-if="data" 守卫内才渲染子树',
      )
    }
    return holder.value
  })
}
