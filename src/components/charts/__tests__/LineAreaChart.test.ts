import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LineAreaChart from '@/components/charts/LineAreaChart.vue'
import { themes } from '@/data/themes'
import type { LineChartData } from '@/types/dashboard'

interface LineChartOption {
  yAxis: {
    max: number
    interval: number
  }
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
  it.each(['maintenance', 'inspection'])(
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
})
