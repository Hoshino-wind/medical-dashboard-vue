import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OverviewModule from '@/components/modules/OverviewModule.vue'
import PanelShell from '@/components/shared/PanelShell.vue'
import MechanicalFrame from '@/components/visual/MechanicalFrame.vue'

const CountUpStub = {
  props: ['value'],
  template: '<span class="count-up-stub">{{ value }}</span>',
}

describe('rendered dashboard structure', () => {
  it('renders the panel title, ornaments and frame layers through component APIs', () => {
    const wrapper = mount(PanelShell, {
      props: { title: '保修统计', subtitle: '近7天', variant: 'line' },
      slots: { default: '<div data-test="body">内容</div>' },
    })

    expect(wrapper.classes()).toContain('panel--line')
    expect(wrapper.get('.panel-title-text').text()).toBe('保修统计')
    expect(wrapper.get('.panel-title-suffix').text()).toBe('（近7天）')
    expect(wrapper.findAll('.panel-title-ornament')).toHaveLength(2)
    expect(
      wrapper
        .findAll('.panel-title-ornament')
        .every((item) => item.attributes('aria-hidden') === 'true'),
    ).toBe(true)
    expect(wrapper.findAllComponents(MechanicalFrame)).toHaveLength(2)
    expect(wrapper.get('[data-test="body"]').text()).toBe('内容')
  })

  it('renders five overview status entities with explicit semantic tone classes', () => {
    const wrapper = mount(OverviewModule, {
      props: {
        data: {
          total: 100,
          available: 88,
          availability: 88,
          repairing: 5,
          maintenanceDue: 4,
          inspectionDue: 3,
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          MetricRing: { template: '<div data-test="metric-ring"></div>' },
        },
      },
    })

    expect(wrapper.findAll('.overview-stat')).toHaveLength(5)
    expect(wrapper.findAll('.overview-unit')).toHaveLength(5)
    expect(wrapper.findAll('.overview-stat .mechanical-frame--compact')).toHaveLength(5)
    expect(wrapper.get('.overview-stat--repair').classes()).toContain('is-danger')
    expect(wrapper.get('.overview-stat--maintenance').classes()).toContain('is-warn')
    expect(wrapper.get('.overview-stat--available').text()).toContain('88台')
    expect(wrapper.findAll('.table-row-icon')).toHaveLength(0)
  })
})
