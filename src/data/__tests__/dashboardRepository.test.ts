import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dashboardData } from '../document/dashboardData'
import {
  DashboardRequestError,
  fetchDashboardData,
  getDashboardDataSource,
} from '../dashboardRepository'

describe('dashboard repository', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_DASHBOARD_API_URL', 'https://example.test/api/dashboard/data')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('loads and validates remote JSON when an endpoint is configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(dashboardData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchDashboardData()).resolves.toEqual(dashboardData)
    expect(getDashboardDataSource()).toBe('http')
  })

  it('classifies malformed remote data as invalid-data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ header: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    const error = await fetchDashboardData().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(DashboardRequestError)
    expect(error).toMatchObject({ code: 'invalid-data' })
  })

  it('classifies non-success responses as http errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

    const error = await fetchDashboardData().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(DashboardRequestError)
    expect(error).toMatchObject({ code: 'http' })
  })
})
