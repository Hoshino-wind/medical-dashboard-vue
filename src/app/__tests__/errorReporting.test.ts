import { describe, expect, it, vi } from 'vitest'
import { reportFrontendError } from '../errorReporting'

describe('frontend error reporting', () => {
  it('normalizes errors and emits an integration event', () => {
    const listener = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    window.addEventListener('dashboard:error', listener)

    const report = reportFrontendError('promise', new Error('boom'))

    expect(report).toMatchObject({ source: 'promise', message: 'boom' })
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('dashboard:error', listener)
    consoleError.mockRestore()
  })
})
