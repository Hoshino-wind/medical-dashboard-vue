import type { App } from 'vue'

export interface FrontendErrorReport {
  source: 'vue' | 'window' | 'promise'
  message: string
  detail?: string
}

function normalizeError(
  source: FrontendErrorReport['source'],
  error: unknown,
): FrontendErrorReport {
  const normalized = error instanceof Error ? error : new Error(String(error))
  return { source, message: normalized.message, detail: normalized.stack }
}

/** 统一发出可观测事件，宿主系统可监听 dashboard:error 并接入现有监控平台。 */
export function reportFrontendError(
  source: FrontendErrorReport['source'],
  error: unknown,
): FrontendErrorReport {
  const report = normalizeError(source, error)
  console.error(`[dashboard:${source}]`, error)
  window.dispatchEvent(new CustomEvent<FrontendErrorReport>('dashboard:error', { detail: report }))
  return report
}

export function installGlobalErrorReporting(app: App) {
  app.config.errorHandler = (error: unknown) => {
    reportFrontendError('vue', error)
  }
  window.addEventListener('error', (event) =>
    reportFrontendError('window', event.error ?? event.message),
  )
  window.addEventListener('unhandledrejection', (event) =>
    reportFrontendError('promise', event.reason),
  )
}
