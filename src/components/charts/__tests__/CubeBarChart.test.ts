import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CubeBarChart from '@/components/charts/CubeBarChart.vue'
import { BAR_ANIMATION_DURATION } from '@/components/charts/cubeBarGeometry'
import { themes } from '@/data/themes'
import type { BarChartData } from '@/types/dashboard'

interface CustomChartSeries {
  data: number[][]
  renderItem: (
    params: { coordSys: { y: number } },
    api: {
      value: (dimension: number) => number
      coord: (value: number[]) => number[]
      size: (value: number[]) => number[]
    },
  ) => {
    children: Array<{
      type: string
      shape?: { x?: number }
      style?: { shadowBlur?: number; shadowColor?: string }
    }>
  }
}

interface CustomChartOption {
  series: CustomChartSeries[]
}

const chartData: BarChartData = {
  labels: ['07-01', '07-02'],
  series: [
    { name: '全保', data: [12, 8] },
    { name: '技保', data: [4, 2] },
    { name: '厂保', data: [1, 0] },
  ],
}

const EChartStub = {
  name: 'EChart',
  props: ['option', 'height'],
  template: '<div data-test="echart"></div>',
}

const chartStyles = readFileSync('src/styles/charts.css', 'utf8')

describe('CubeBarChart', () => {
  beforeEach(() => {
    let frameIndex = 0

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = window.setTimeout(() => {
        callback(frameIndex === 0 ? 0 : BAR_ANIMATION_DURATION)
        frameIndex += 1
      }, 0)

      return Number(id)
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function finishAnimation() {
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await nextTick()
  }

  it('renders warranty series names with distinct legend colors', () => {
    const wrapper = mount(CubeBarChart, {
      props: {
        data: chartData,
        theme: themes[1],
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    expect(wrapper.findAll('.cube-bar-legend span').map((item) => item.text())).toEqual([
      '全保',
      '技保',
      '厂保',
    ])
    expect(wrapper.find('.cube-bar-legend').text()).not.toContain('全部')
    expect(wrapper.find('.cube-bar-legend').text()).not.toContain('现场')
    expect(wrapper.find('.cube-bar-legend').text()).not.toContain('厂家')

    const swatchStyles = wrapper
      .findAll('.cube-bar-legend i')
      .map((item) => item.attributes('style') ?? '')

    expect(new Set(swatchStyles).size).toBe(3)

    wrapper.unmount()
  })

  it('renders each warranty type as a separate grouped column', async () => {
    const wrapper = mount(CubeBarChart, {
      props: {
        data: chartData,
        theme: themes[1],
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    await finishAnimation()

    const option = wrapper.findComponent(EChartStub).props('option') as CustomChartOption
    const seriesOption = option.series[0]

    expect(seriesOption.data).toEqual([
      [0, 12],
      [1, 8],
    ])

    const datum = seriesOption.data[0]
    const rendered = seriesOption.renderItem(
      { coordSys: { y: 0 } },
      {
        value: (dimension) => datum[dimension],
        coord: ([x, y]) => [100 + x * 50, 220 - y * 0.4],
        size: () => [50, 0],
      },
    )
    const columnBodies = rendered.children.filter((child) => child.type === 'GlassColumnLeft')
    const columnXs = columnBodies.map((child) => child.shape?.x)
    const columnTops = rendered.children.filter((child) => child.type === 'GlassColumnTop')

    expect(columnBodies).toHaveLength(3)
    expect(new Set(columnXs).size).toBe(3)
    expect(columnTops[0].style?.shadowBlur ?? 0).toBeGreaterThan(0)
    expect(columnTops[0].style?.shadowColor).toBeTruthy()
    expect(columnTops.slice(1).every((child) => child.style?.shadowBlur === undefined)).toBe(true)

    wrapper.unmount()
  })

  it('exposes the highest aggregate warranty series after the opening animation', async () => {
    const wrapper = mount(CubeBarChart, {
      props: {
        data: chartData,
        theme: themes[1],
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    await finishAnimation()

    expect(wrapper.find('.cube-bar-chart').attributes('data-peak-series')).toBe('0')

    wrapper.unmount()
  })

  it('keeps a persistent decorative perspective scan beneath the interactive chart', async () => {
    const wrapper = mount(CubeBarChart, {
      props: {
        data: chartData,
        theme: themes[1],
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    await finishAnimation()

    const groundScan = wrapper.find('.cube-bar-ground-scan')
    const groundScanBlock = chartStyles.match(/\.cube-bar-ground-scan\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const groundScanAfterBlock =
      chartStyles.match(/\.cube-bar-ground-scan::after\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const groundScanReducedMotionBlock =
      chartStyles.match(
        /@media \(prefers-reduced-motion: reduce\) \{\s*\.cube-bar-ground-scan::after\s*\{[\s\S]*?\n\s*\}\s*\}/,
      )?.[0] ?? ''
    const chartBarBlock = chartStyles.match(/\.chart-bar\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(groundScan.exists()).toBe(true)
    expect(groundScan.attributes('aria-hidden')).toBe('true')
    expect(groundScanBlock).toContain('z-index: 0')
    expect(groundScanBlock).toContain('pointer-events: none')
    expect(groundScanBlock).toContain('perspective(')
    expect(groundScanBlock).toContain('var(--instrument-structure)')
    expect(groundScanAfterBlock).toContain('var(--instrument-core)')
    expect(groundScanAfterBlock).toContain('var(--motion-loop-background)')
    expect(chartBarBlock).toContain('z-index: 1')
    expect(`${groundScanBlock}\n${groundScanAfterBlock}`).not.toMatch(/#[\da-f]{3,8}|rgba?\(/i)
    expect(groundScanReducedMotionBlock).toContain('animation: none')

    wrapper.unmount()
  })
})
