import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDashboardData } from '../useDashboardData'
import { DashboardRequestError, fetchDashboardData } from '@/data/dashboardRepository'

vi.mock('@/data/dashboardRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/dashboardRepository')>()
  return { ...actual, fetchDashboardData: vi.fn() }
})

describe('useDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('exposes loading / data / error states through refresh()', async () => {
    const sample = {
      header: { brand: 'b', title: 't', hospital: 'h', subtitle: 's', updatedAt: 'u' },
      overview: {
        total: 0,
        available: 0,
        availability: 0,
        repairing: 0,
        maintenanceDue: 0,
        inspectionDue: 0,
      },
      repairOrders: [],
      inspectionOrders: {
        rate: 0,
        total: 0,
        finished: 0,
        waiting: 0,
        overdue: 0,
        rows: [],
      },
      lifeSupport: [{ name: '除颤仪', count: 4, value: 90 }],
      ultrasound: [],
      deviceDistribution: [{ name: '麻醉科', count: 125, rate: 50.5 }],
      repairStats: { labels: ['2025-07'], series: [{ name: 'x', data: [1] }] },
      maintenanceStats: { labels: ['2025-07'], data: [1] },
      inspectionStats: { labels: ['2025-07'], data: [1] },
      healthTrend: {
        online: 0,
        warning: 0,
        repairing: 0,
        pending: 0,
        score: 0,
        rows: [],
      },
    }

    let resolveFetch: (value: typeof sample) => void
    vi.mocked(fetchDashboardData).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        }),
    )

    const { data, loading, error, refresh } = useDashboardData()
    expect(loading.value).toBe(false)
    expect(data.value).toBeNull()

    const promise = refresh()
    expect(loading.value).toBe(true)

    resolveFetch!(sample)
    await promise

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(data.value?.lifeSupport[0]).toEqual({ name: '除颤仪', count: 4, value: 90 })
    expect(data.value?.deviceDistribution[0]).toEqual({ name: '麻醉科', count: 125, rate: 50.5 })
  })

  it('captures errors into error ref instead of throwing', async () => {
    vi.mocked(fetchDashboardData).mockRejectedValueOnce(new Error('boom'))

    const { data, loading, error, refresh } = useDashboardData()
    await refresh()

    expect(loading.value).toBe(false)
    expect(data.value).toBeNull()
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('boom')
  })

  it('deduplicates concurrent refresh() calls', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      header: { brand: '', title: '', hospital: '', subtitle: '', updatedAt: '' },
      overview: {
        total: 0,
        available: 0,
        availability: 0,
        repairing: 0,
        maintenanceDue: 0,
        inspectionDue: 0,
      },
      repairOrders: [],
      inspectionOrders: { rate: 0, total: 0, finished: 0, waiting: 0, overdue: 0, rows: [] },
      lifeSupport: [],
      ultrasound: [],
      deviceDistribution: [],
      repairStats: { labels: [], series: [] },
      maintenanceStats: { labels: [], data: [] },
      inspectionStats: { labels: [], data: [] },
      healthTrend: { online: 0, warning: 0, repairing: 0, pending: 0, score: 0, rows: [] },
    })

    const { refresh } = useDashboardData()
    const p1 = refresh()
    const p2 = refresh()

    expect(p1).toBe(p2)
    await p1
    expect(fetchDashboardData).toHaveBeenCalledTimes(1)
  })

  it('cancels the active request without exposing an error', async () => {
    vi.mocked(fetchDashboardData).mockImplementation(
      ({ signal } = {}) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener(
            'abort',
            () => reject(new DashboardRequestError('aborted', '已取消')),
            { once: true },
          )
        }),
    )

    const { loading, error, refresh, cancel } = useDashboardData()
    const request = refresh()
    cancel()
    await request

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })
})
