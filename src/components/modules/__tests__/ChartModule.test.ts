import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ChartModule from '@/components/modules/ChartModule.vue'
import { themes } from '@/data/themes'
import type { LineChartData } from '@/types/dashboard'

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
        CubeBarChart: true,
        LineAreaChart: true,
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
