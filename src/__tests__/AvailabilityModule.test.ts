import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AvailabilityModule from '@/components/modules/AvailabilityModule.vue'

const RingStub = {
  props: ['value', 'label', 'count'],
  template: '<div class="ring-stub">{{ label }} {{ value }} {{ count }}</div>',
}

describe('availability module carousel', () => {
  it('loops by pages of three when more availability items are provided', () => {
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

    expect(wrapper.find('.availability-window').classes()).toContain('is-looping')
    expect(wrapper.find('.availability-window').attributes('style')).toContain(
      '--availability-scroll-easing: linear',
    )
    expect(wrapper.find('.availability-window').attributes('style')).not.toContain('steps(')
    expect(wrapper.findAll('.availability-page')).toHaveLength(3)
    expect(wrapper.text()).toContain('注射泵')
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

    expect(wrapper.find('.availability-window').classes()).not.toContain('is-looping')
    expect(wrapper.findAll('.availability-page')).toHaveLength(1)
  })
})
