import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LineAreaChart from '@/components/charts/LineAreaChart.vue'
import { themes } from '@/data/themes'
import type { BarChartData, LineChartData } from '@/types/dashboard'
import type { CartesianChartVariant } from '@/types/module'

interface LineChartOption {
  yAxis: {
    max: number
    interval: number
  }
  series: Array<{
    name: string
    type: string
    data: number[]
    label: { show: boolean }
  }>
}

const EChartStub = {
  name: 'EChart',
  props: ['option', 'height'],
  template: '<div data-test="echart"></div>',
}

const chartData: LineChartData = {
  labels: ['2025-07', '2025-08', '2025-09'],
  data: [200, 180, 250],
}

describe('LineAreaChart', () => {
  it.each<CartesianChartVariant>(['maintenance', 'inspection'])(
    'scales the %s y axis from the actual line data maximum',
    (variant) => {
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

      const option = wrapper.findComponent(EChartStub).props('option') as LineChartOption

      expect(option.yAxis.max).toBe(300)
      expect(option.yAxis.interval).toBe(100)

      wrapper.unmount()
    },
  )

  it('renders multi-series repair data as separate lines with a matching legend', () => {
    const repairData: BarChartData = {
      labels: ['07-01', '07-02'],
      series: [
        { name: '全保', data: [12, 8] },
        { name: '技保', data: [4, 2] },
        { name: '厂保', data: [1, 0] },
      ],
    }
    const wrapper = mount(LineAreaChart, {
      props: {
        data: repairData,
        theme: themes[1],
        variant: 'repair',
      },
      global: {
        stubs: {
          EChart: EChartStub,
        },
      },
    })

    const option = wrapper.findComponent(EChartStub).props('option') as LineChartOption

    expect(option.series.map((series) => series.name)).toEqual(['全保', '技保', '厂保'])
    expect(option.series.every((series) => series.type === 'line')).toBe(true)
    expect(option.series.every((series) => series.label.show === false)).toBe(true)
    expect(wrapper.findAll('.line-area-legend span').map((item) => item.text())).toEqual([
      '全保',
      '技保',
      '厂保',
    ])

    wrapper.unmount()
  })
})
