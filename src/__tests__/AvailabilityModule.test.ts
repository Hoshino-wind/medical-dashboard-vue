import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import AvailabilityModule from '@/components/modules/AvailabilityModule.vue'

const RingStub = {
  props: ['value', 'label', 'count'],
  template: '<div class="ring-stub" v-bind="$attrs">{{ label }} {{ value }} {{ count }}</div>',
}

describe('availability module pagination', () => {
  it('marks the window as paginating and renders only the current page when more items are provided', () => {
    const wrapper = mount(AvailabilityModule, {
      props: {
        items: [
          { name: '除颤监护仪', value: 92.6, count: 68 },
          { name: '呼吸机', value: 94.7, count: 717 },
          { name: '监护仪', value: 94.8, count: 210 },
          { name: '注射泵', value: 95.6, count: 86 },
        ],
      },
      global: {
        stubs: {
          AvailabilityMetricRing: RingStub,
        },
      },
    })

    expect(wrapper.find('.availability-window').classes()).toContain('is-paginating')
    // 翻页模式下同一时间只渲染当前页（第一页）
    expect(wrapper.findAll('.availability-page')).toHaveLength(1)
    // 第一页只包含前 3 项
    expect(wrapper.text()).toContain('除颤监护仪')
    expect(wrapper.text()).toContain('呼吸机')
    expect(wrapper.text()).toContain('监护仪')
    // 第 4 项在第二页，初始不显示
    expect(wrapper.text()).not.toContain('注射泵')
  })

  it('stays static when a single page of availability items is provided', () => {
    const wrapper = mount(AvailabilityModule, {
      props: {
        items: [
          { name: '眼科门诊', value: 100, count: 46 },
          { name: '健康管理中心', value: 66.7, count: 1 },
          { name: '消毒供应中心', value: 0, count: 2 },
        ],
      },
      global: {
        stubs: {
          AvailabilityMetricRing: RingStub,
        },
      },
    })

    expect(wrapper.find('.availability-window').classes()).not.toContain('is-paginating')
    expect(wrapper.findAll('.availability-page')).toHaveLength(1)
  })

  it('assigns staggered loop phases without changing the three-item page', () => {
    const wrapper = mount(AvailabilityModule, {
      props: {
        items: [
          { name: '除颤仪', value: 90, count: 4 },
          { name: '呼吸机', value: 90, count: 3 },
          { name: '监护仪', value: 90, count: 32 },
        ],
      },
      global: { stubs: { AvailabilityMetricRing: RingStub } },
    })

    expect(wrapper.findAll('.ring-stub').map((item) => item.attributes('style'))).toEqual([
      '--motion-local-phase: 0s;',
      '--motion-local-phase: -1.4s;',
      '--motion-local-phase: -2.8s;',
    ])
  })

  it('advances to the next page on each interval tick, cycling back to the first page', async () => {
    vi.useFakeTimers()
    const wrapper = mount(AvailabilityModule, {
      props: {
        items: [
          { name: '除颤监护仪', value: 92.6, count: 68 },
          { name: '呼吸机', value: 94.7, count: 717 },
          { name: '监护仪', value: 94.8, count: 210 },
          { name: '注射泵', value: 95.6, count: 86 },
        ],
      },
      global: {
        stubs: {
          AvailabilityMetricRing: RingStub,
        },
      },
    })

    // 第一页
    expect(wrapper.text()).toContain('除颤监护仪')
    expect(wrapper.text()).not.toContain('注射泵')

    // 翻到第二页
    vi.advanceTimersByTime(5500)
    await nextTick()
    expect(wrapper.text()).toContain('注射泵')
    expect(wrapper.text()).not.toContain('除颤监护仪')

    // 再翻一次回到第一页（循环）
    vi.advanceTimersByTime(5500)
    await nextTick()
    expect(wrapper.text()).toContain('除颤监护仪')

    vi.useRealTimers()
  })
})
