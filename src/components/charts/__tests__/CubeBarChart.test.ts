import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CubeBarChart from '@/components/charts/CubeBarChart.vue'
import { BAR_ANIMATION_DURATION } from '@/components/charts/cubeBarGeometry'
import { themes } from '@/data/themes'
import type { BarChartData, LineChartData } from '@/types/dashboard'

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
      name?: string
      shape?: { x?: number; cubeHalf?: number }
      style?: {
        shadowBlur?: number
        fill?: { colorStops?: Array<{ color: string }> }
        text?: string
        y?: number
      }
    }>
  }
}

interface CustomChartOption {
  grid: {
    top: number
    bottom: number
  }
  yAxis: {
    max: number
    interval: number
  }
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

    expect(option.grid).toMatchObject({ top: 50, bottom: 55 })
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
    const jellyHighlights = rendered.children.filter((child) => child.name === 'jelly-specular')
    const firstBodyStops = columnBodies[0].style?.fill?.colorStops ?? []

    expect(columnBodies).toHaveLength(3)
    expect(new Set(columnXs).size).toBe(3)
    expect(jellyHighlights).toHaveLength(3)
    expect(firstBodyStops).toHaveLength(5)
    expect(new Set(firstBodyStops.map((stop) => stop.color)).size).toBeGreaterThan(3)
    expect(columnBodies.every((child) => Number(child.style?.shadowBlur) > 0)).toBe(true)

    wrapper.unmount()
  })

  it('scales the y axis to the warranty data maximum with compact headroom', () => {
    const warrantyAxisData: BarChartData = {
      labels: ['2025-07', '2025-08'],
      series: [
        { name: '全保', data: [23, 11] },
        { name: '技保', data: [10, 48] },
        { name: '厂保', data: [12, 36] },
      ],
    }
    const wrapper = mount(CubeBarChart, {
      props: {
        data: warrantyAxisData,
        theme: themes[1],
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    const option = wrapper.findComponent(EChartStub).props('option') as CustomChartOption

    expect(option.yAxis.max).toBe(60)
    expect(option.yAxis.interval).toBe(20)

    wrapper.unmount()
  })

  it('normalizes single-series line data into columns when the display type changes', async () => {
    const lineData: LineChartData = {
      labels: ['07-01', '07-02'],
      data: [20, 18],
    }
    const wrapper = mount(CubeBarChart, {
      props: {
        data: lineData,
        theme: themes[1],
        seriesName: '保养台次',
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    await finishAnimation()

    const option = wrapper.findComponent(EChartStub).props('option') as CustomChartOption

    expect(wrapper.find('.cube-bar-legend').text()).toContain('保养台次')
    expect(option.series[0].data).toEqual([
      [0, 20],
      [1, 18],
    ])

    const datum = option.series[0].data[0]
    const rendered = option.series[0].renderItem(
      { coordSys: { y: 0 } },
      {
        value: (dimension) => datum[dimension],
        coord: ([x, y]) => [100 + x * 60, 220 - y * 0.4],
        size: () => [60, 0],
      },
    )
    const singleColumn = rendered.children.find((child) => child.type === 'GlassColumnLeft')
    const valueLabel = rendered.children.find(
      (child) => child.type === 'text' && child.style?.text === '20',
    )

    expect(option.grid).toMatchObject({ top: 30, bottom: 42 })
    expect(singleColumn?.shape?.cubeHalf).toBe(10)
    expect(valueLabel?.style?.y).toBe(196)

    wrapper.unmount()
  })
})
