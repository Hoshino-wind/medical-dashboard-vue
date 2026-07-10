import { readFileSync } from 'node:fs'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SVGRenderer } from 'echarts/renderers'
import EChart from '@/components/charts/EChart.vue'
import LineAreaChart from '@/components/charts/LineAreaChart.vue'
import ChartModule from '@/components/modules/ChartModule.vue'
import { themes } from '@/data/themes'
import echarts from '@/utils/echarts'

interface TerminalSeries {
  type: string
  data: Array<[string, number]> | number[]
  symbolSize?: number
  rippleEffect?: {
    period: number
    scale: number
    brushType: string
  }
  itemStyle?: {
    color?: string
    shadowColor?: string
  }
}

interface LineOption {
  animationDuration: number
  grid: { left: number; right: number }
  series: TerminalSeries[]
}

interface EChartsModelInspector {
  getModel(): {
    getSeriesByType(type: string): unknown[]
  }
}

const chartData = {
  labels: ['2025-10', '2025-11', '2025-12'],
  data: [18, 25, 32],
}

const EChartStub = {
  name: 'EChart',
  props: ['option', 'height', 'ariaLabel'],
  template: '<div data-test="echart"></div>',
}

function stubMotionPreference(initialMatches = false) {
  let listener: ((event: MediaQueryListEvent) => void) | undefined
  const media = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: vi.fn(
      (_type: string, nextListener: (event: MediaQueryListEvent) => void) => {
        listener = nextListener
      },
    ),
    removeEventListener: vi.fn(),
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )

  return {
    media,
    setMatches(matches: boolean) {
      media.matches = matches
      listener?.({ matches } as MediaQueryListEvent)
    },
    get listener() {
      return listener
    },
  }
}

describe('LineAreaChart', () => {
  const wrappers: VueWrapper[] = []

  function mountLine(variant: 'maintenance' | 'inspection' = 'maintenance') {
    const wrapper = mount(LineAreaChart, {
      props: {
        data: chartData,
        theme: themes[1],
        variant,
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps the line series and adds an accessible maintenance terminal pulse', () => {
    stubMotionPreference()
    const wrapper = mountLine()
    const chart = wrapper.findComponent(EChartStub)
    const option = chart.props('option') as LineOption

    expect(option.series[0].type).toBe('line')
    expect(option.series[1].type).toBe('effectScatter')
    expect(option.series[1].data).toEqual([['2025-12', 32]])
    expect(option.series[1].rippleEffect).toEqual({
      period: 5,
      scale: 2.4,
      brushType: 'stroke',
    })
    expect(option.series[0].itemStyle?.color).toBe(
      themes[1].variables['--data-maintenance-line'],
    )
    expect(option.series[1].itemStyle?.shadowColor).toBe(
      themes[1].variables['--data-maintenance-line'],
    )
    expect(option.grid.left).toBeGreaterThanOrEqual(64)
    expect(option.grid.right).toBeGreaterThanOrEqual(40)
    expect(chart.props('ariaLabel')).toContain('保养统计')
  })

  it('uses the inspection trajectory token and accessible name', () => {
    stubMotionPreference()
    const wrapper = mountLine('inspection')
    const chart = wrapper.findComponent(EChartStub)
    const option = chart.props('option') as LineOption

    expect(option.series[0].itemStyle?.color).toBe(
      themes[1].variables['--data-inspection-line'],
    )
    expect(option.series[0].itemStyle?.color).not.toBe(
      themes[1].variables['--data-maintenance-line'],
    )
    expect(option.series[1].itemStyle?.shadowColor).toBe(
      themes[1].variables['--data-inspection-line'],
    )
    expect(chart.props('ariaLabel')).toContain('巡检统计')
  })

  it('renders a static visible terminal point when reduced motion is initially enabled', () => {
    stubMotionPreference(true)
    const wrapper = mountLine()
    const option = wrapper.findComponent(EChartStub).props('option') as LineOption

    expect(option.series[0].type).toBe('line')
    expect(option.series[1].type).toBe('scatter')
    expect(option.series[1].data).toEqual([['2025-12', 32]])
    expect(option.series[1].symbolSize).toBe(10)
    expect(option.series[1].rippleEffect).toBeUndefined()
    expect(option.animationDuration).toBe(1000)
  })

  it('reacts to reduced-motion changes without reload and removes its listener', async () => {
    const motion = stubMotionPreference()
    const wrapper = mountLine()

    expect((wrapper.findComponent(EChartStub).props('option') as LineOption).series[1].type).toBe(
      'effectScatter',
    )

    motion.setMatches(true)
    await nextTick()
    let terminal = (wrapper.findComponent(EChartStub).props('option') as LineOption).series[1]
    expect(terminal.type).toBe('scatter')
    expect(terminal.rippleEffect).toBeUndefined()

    motion.setMatches(false)
    await nextTick()
    terminal = (wrapper.findComponent(EChartStub).props('option') as LineOption).series[1]
    expect(terminal.type).toBe('effectScatter')
    expect(terminal.rippleEffect?.period).toBe(5)

    wrapper.unmount()
    expect(motion.media.removeEventListener).toHaveBeenCalledWith('change', motion.listener)
  })

  it('forwards the chart description to the rendered image shell', () => {
    class ResizeObserverStub {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    const wrapper = mount(EChart, {
      props: {
        option: {},
        ariaLabel: '保养统计时间轨迹图',
      } as unknown as InstanceType<typeof EChart>['$props'],
    })
    wrappers.push(wrapper)

    expect(wrapper.find('.chart-shell').attributes('role')).toBe('img')
    expect(wrapper.find('.chart-shell').attributes('aria-label')).toBe('保养统计时间轨迹图')
  })

  it('registers both animated and reduced-motion terminal series with ECharts core', () => {
    echarts.use([SVGRenderer])
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 8 }),
    } as unknown as CanvasRenderingContext2D)
    const chart = echarts.init(null, undefined, {
      renderer: 'svg',
      ssr: true,
      width: 320,
      height: 180,
    })

    try {
      chart.setOption({
        xAxis: { type: 'category', data: ['2025-12'], show: false },
        yAxis: { type: 'value', show: false },
        series: [
          { type: 'effectScatter', data: [['2025-12', 32]] },
          { type: 'scatter', data: [['2025-12', 32]] },
        ],
      })

      const model = (chart as unknown as EChartsModelInspector).getModel()
      expect(model.getSeriesByType('effectScatter')).toHaveLength(1)
      expect(model.getSeriesByType('scatter')).toHaveLength(1)
    } finally {
      chart.dispose()
    }
  })

  it('shares a theme-aware ambient track and disables only its CSS pulse for reduced motion', () => {
    stubMotionPreference()
    const wrapper = mount(ChartModule, {
      props: {
        type: 'inspection',
        data: chartData,
        theme: themes[1],
      },
      global: {
        stubs: {
          CountUp: true,
          LineAreaChart: true,
        },
      },
    })
    wrappers.push(wrapper)
    const chartStyles = readFileSync('src/styles/charts.css', 'utf8')
    const bodyBlock = chartStyles.match(/\.line-chart-body\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const inspectionBlock =
      chartStyles.match(/\.line-chart-body--inspection\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const ambientBlock =
      chartStyles.match(/\.line-chart-body::after\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const reducedMotionBlock =
      chartStyles.match(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.line-chart-body::after\s*\{[\s\S]*?\n\s*\}\s*\}/,
      )?.[0] ?? ''

    expect(wrapper.find('.line-chart-body').classes()).toContain('line-chart-body--inspection')
    expect(bodyBlock).toContain('--line-track-color: var(--data-maintenance-line)')
    expect(bodyBlock).toContain('isolation: isolate')
    expect(inspectionBlock).toContain('--line-track-color: var(--data-inspection-line)')
    expect(ambientBlock).toContain('var(--line-track-color)')
    expect(ambientBlock).toContain('var(--motion-loop-instrument)')
    expect(ambientBlock).toContain('var(--motion-phase)')
    expect(reducedMotionBlock).toContain('animation: none')
  })
})
