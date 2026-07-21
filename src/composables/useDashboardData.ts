import { getCurrentScope, onScopeDispose, readonly, shallowReadonly, shallowRef } from 'vue'
import { DashboardRequestError, fetchDashboardData } from '@/data/dashboardRepository'
import type { DashboardData } from '@/types/dashboard'

/** 页面级服务端状态：负责去重、取消和保留最近一次成功数据。 */
export function useDashboardData() {
  const data = shallowRef<DashboardData | null>(null)
  const loading = shallowRef(false)
  const error = shallowRef<Error | null>(null)

  let inflight: Promise<void> | null = null
  let activeController: AbortController | null = null

  async function load(controller: AbortController) {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchDashboardData({ signal: controller.signal })
    } catch (caught) {
      const requestError = caught instanceof Error ? caught : new Error(String(caught))
      if (!(requestError instanceof DashboardRequestError && requestError.code === 'aborted')) {
        error.value = requestError
      }
    } finally {
      if (activeController === controller) {
        loading.value = false
        activeController = null
        inflight = null
      }
    }
  }

  function refresh(): Promise<void> {
    if (inflight) return inflight
    activeController = new AbortController()
    inflight = load(activeController)
    return inflight
  }

  function cancel() {
    activeController?.abort()
  }

  if (getCurrentScope()) onScopeDispose(cancel)

  return {
    data: shallowReadonly(data),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
    cancel,
  }
}
