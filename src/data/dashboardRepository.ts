import { dashboardData } from './document/dashboardData'
import type { DashboardData } from '@/types/dashboard'

/**
 * 大屏数据仓库(Data Repository)。
 *
 * 当前实现从打包进 bundle 的 mock 文档解析数据;接入真实后端时,
 * 只需把 `fetchDashboardData` 替换为实际 API 请求,组件层无需任何改动。
 *
 * 设计要点:
 *   - 暴露统一异步接口 `fetchDashboardData(): Promise<DashboardData>`,
 *     即使现在是同步 mock,也保留 Promise 形态,避免日后切换 API 时调用方签名变更;
 *   - 通过 `latencyMs` 模拟网络延迟,使 UI 层的 loading / skeleton 分支可被验证;
 *   - 错误路径同样被模拟,方便测试与降级 UI 调试。
 */
export interface FetchOptions {
  /** 模拟网络延迟毫秒数;0 表示立即 resolve(默认) */
  latencyMs?: number
  /** 调试用:强制抛错以验证错误处理路径 */
  shouldFail?: boolean
}

const DEFAULT_LATENCY_MS = 0

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 异步获取大屏数据。
 *
 * @example
 * const data = await fetchDashboardData()
 *
 * // 模拟慢网络
 * const slow = await fetchDashboardData({ latencyMs: 800 })
 */
export async function fetchDashboardData(options: FetchOptions = {}): Promise<DashboardData> {
  const { latencyMs = DEFAULT_LATENCY_MS, shouldFail = false } = options

  await delay(latencyMs)

  if (shouldFail) {
    throw new Error('[dashboardRepository] 模拟数据请求失败(调试用)')
  }

  // 返回深拷贝,避免消费方意外修改污染下一次请求结果
  return structuredClone(dashboardData)
}

/**
 * 同步访问打包后的数据,保留给单元测试与极端场景使用。
 * 业务代码应优先使用 useDashboardData() composable。
 */
export function getDashboardDataSnapshot(): DashboardData {
  return dashboardData
}
