import { readonly, ref } from 'vue'
import { fetchDashboardData } from '@/data/dashboardRepository'
import type { DashboardData } from '@/types/dashboard'

/**
 * 大屏数据统一访问入口(异步化版本)。
 *
 * 早期实现直接返回同步常量 `dashboardData`,组件层无 loading / error 概念。
 * 升级后改为:
 *   - `data: Readonly<Ref<DashboardData | null>>` —— 数据就绪前为 null
 *   - `loading: Readonly<Ref<boolean>>`           —— 请求进行中
 *   - `error: Readonly<Ref<Error | null>>`         —— 失败时填充
 *   - `refresh()`                                  —— 重新拉取
 *
 * 调用方约定:
 *   - 顶层组件(BigScreen)负责调用 useDashboardData() 并在 `v-if="data"` 守卫内向下传 data;
 *   - 业务子组件继续接收 `data: DashboardData` props,类型签名不变,无需逐个改造;
 *   - 同时保留同步导出 `dashboardData` 常量供单元测试/SSR 等极端场景使用。
 *
 * @example
 * const { data, loading, error, refresh } = useDashboardData()
 * <div v-if="loading">加载中...</div>
 * <div v-else-if="error">加载失败: {{ error.message }}</div>
 * <OverviewModule v-else-if="data" :data="data.overview" />
 */
export function useDashboardData() {
  const data = ref<DashboardData | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  let inflight: Promise<void> | null = null

  async function load() {
    loading.value = true
    error.value = null
    try {
      const result = await fetchDashboardData()
      data.value = result
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err))
    } finally {
      loading.value = false
      inflight = null
    }
  }

  /** 触发一次拉取;若已有 in-flight 请求则复用,避免重复请求 */
  function refresh(): Promise<void> {
    if (inflight) return inflight
    inflight = load()
    return inflight
  }

  // data 不使用 readonly 包装:DeepReadonly 会与业务可变类型(如 RepairOrder[])
  // 冲突并向上污染 provide/inject 链。约定:后代组件不得 mutate 此对象。
  return {
    data,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  }
}

