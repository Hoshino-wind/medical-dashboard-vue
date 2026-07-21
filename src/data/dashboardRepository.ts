import { dashboardData as prototypeDashboardData } from './document/dashboardData'
import { DashboardDataValidationError, parseDashboardData } from './dashboardDataContract'
import type { DashboardData } from '@/types/dashboard'

export type DashboardDataSource = 'http' | 'prototype-mock'
export type DashboardRequestErrorCode = 'aborted' | 'http' | 'invalid-data' | 'network' | 'timeout'

export class DashboardRequestError extends Error {
  constructor(
    public readonly code: DashboardRequestErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'DashboardRequestError'
  }
}

export interface FetchDashboardOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 8_000

export function getDashboardDataSource(): DashboardDataSource {
  return import.meta.env.VITE_DASHBOARD_API_URL?.trim() ? 'http' : 'prototype-mock'
}

function requestContext(externalSignal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController()
  let timedOut = false
  const abortFromCaller = () => controller.abort(externalSignal?.reason)
  externalSignal?.addEventListener('abort', abortFromCaller, { once: true })
  const timeoutId = window.setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      window.clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortFromCaller)
    },
  }
}

async function fetchRemoteDashboardData(
  endpoint: string,
  options: FetchDashboardOptions,
): Promise<DashboardData> {
  const context = requestContext(options.signal, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: context.signal,
    })
    if (!response.ok) {
      throw new DashboardRequestError('http', `大屏数据请求失败：HTTP ${response.status}`)
    }
    return parseDashboardData(await response.json())
  } catch (error) {
    if (error instanceof DashboardRequestError) throw error
    if (error instanceof DashboardDataValidationError) {
      throw new DashboardRequestError('invalid-data', error.message, error)
    }
    if (context.didTimeOut()) {
      throw new DashboardRequestError('timeout', '大屏数据请求超时', error)
    }
    if (options.signal?.aborted || context.signal.aborted) {
      throw new DashboardRequestError('aborted', '大屏数据请求已取消', error)
    }
    throw new DashboardRequestError('network', '大屏数据网络请求失败', error)
  } finally {
    context.cleanup()
  }
}

/** 未配置 API 时明确使用内置原型数据；配置后统一走 HTTP 和运行时校验。 */
export async function fetchDashboardData(
  options: FetchDashboardOptions = {},
): Promise<DashboardData> {
  const endpoint = import.meta.env.VITE_DASHBOARD_API_URL?.trim()
  if (endpoint) return fetchRemoteDashboardData(endpoint, options)
  if (options.signal?.aborted) {
    throw new DashboardRequestError('aborted', '大屏数据请求已取消')
  }
  return parseDashboardData(structuredClone(prototypeDashboardData))
}
