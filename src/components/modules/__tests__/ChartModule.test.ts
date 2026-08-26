import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChartModule from '@/components/modules/ChartModule.vue'
import { themes } from '@/data/themes'
import type { BarChartData, LineChartData } from '@/types/dashboard'

const CubeBarChartStub = {
  name: 'CubeBarChart',
  props: ['data'],
  template: '<div data-test="cube-bar-chart"></div>',
}

const LineAreaChartStub = {
  name: 'LineAreaChart',
  props: ['data'],
  template: '<div data-test="line-area-chart"></div>',
}

const commonProps = {
  chartType: 'line' as const,
  variant: 'maintenance' as const,
  seriesName: '保养次数',
  theme: themes[1],
}

function mountChart(data: LineChartData) {
  return mount(ChartModule, {
    props: { ...commonProps, data },
    global: {
      stubs: {
        CountUp: { props: ['value'], template: '<span>{{ value }}</span>' },
        CubeBarChart: CubeBarChartStub,
        LineAreaChart: LineAreaChartStub,
      },
    },
  })
}

describe('ChartModule trend semantics', () => {
  it('uses Chinese market convention: rising is red and falling is green', () => {
    const rising = mountChart({ labels: ['上周', '本周'], data: [100, 120] })
    const falling = mountChart({ labels: ['上周', '本周'], data: [120, 100] })

    expect(rising.find('.line-chart-trend').classes()).toContain('is-up')
    expect(rising.find('.line-chart-trend b').text()).toBe('↑')
    expect(falling.find('.line-chart-trend').classes()).toContain('is-down')
    expect(falling.find('.line-chart-trend b').text()).toBe('↓')

    rising.unmount()
    falling.unmount()
  })

  it('renders an unchanged period as a neutral state', () => {
    const wrapper = mountChart({ labels: ['上周', '本周'], data: [100, 100] })

    expect(wrapper.find('.line-chart-trend').classes()).toContain('is-stable')
    expect(wrapper.find('.line-chart-trend b').text()).toBe('—')

    wrapper.unmount()
  })
})

describe('ChartModule repair-series visibility', () => {
  function mountRepairChart(chartType: 'bar' | 'line', factoryData: number[]) {
    const repairData: BarChartData = {
      labels: ['2026-03', '2026-04'],
      series: [
        { name: '全保', data: [320, 300] },
        { name: '技保', data: [100, 80] },
        { name: '厂保', data: factoryData },
      ],
    }

    const wrapper = mount(ChartModule, {
      props: {
        chartType,
        variant: 'repair',
        seriesName: '报修台次',
        data: repairData,
        theme: themes[1],
      },
      global: {
        stubs: {
          CountUp: true,
          CubeBarChart: CubeBarChartStub,
          LineAreaChart: LineAreaChartStub,
        },
      },
    })

    return { repairData, wrapper }
  }

  it.each([
    ['bar', CubeBarChartStub],
    ['line', LineAreaChartStub],
  ] as const)(
    'shows two series in the %s display when factory warranty is all zero',
    (chartType, chartStub) => {
      const { repairData, wrapper } = mountRepairChart(chartType, [0, 0])

      const displayData = wrapper.findComponent(chartStub).props('data') as BarChartData

      expect(displayData.series.map((series) => series.name)).toEqual(['全保', '技保'])
      expect(repairData.series.map((series) => series.name)).toEqual(['全保', '技保', '厂保'])

      wrapper.unmount()
    },
  )

  it.each([
    ['bar', CubeBarChartStub],
    ['line', LineAreaChartStub],
  ] as const)(
    'shows three series in the %s display when factory warranty has data',
    (chartType, chartStub) => {
      const { wrapper } = mountRepairChart(chartType, [0, 12])

      const displayData = wrapper.findComponent(chartStub).props('data') as BarChartData

      expect(displayData.series.map((series) => series.name)).toEqual(['全保', '技保', '厂保'])

      wrapper.unmount()
    },
  )
})
