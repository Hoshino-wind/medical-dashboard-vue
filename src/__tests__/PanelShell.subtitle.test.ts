import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelShell from '@/components/shared/PanelShell.vue'

describe('PanelShell subtitle', () => {
  it('renders the time range outside the title frame', () => {
    const wrapper = mount(PanelShell, {
      props: {
        title: '保修统计',
        subtitle: '近7天',
      },
    })

    expect(wrapper.get('.panel-title-frame').text()).toBe('保修统计')
    expect(wrapper.get('.panel-header--main > .panel-title-suffix').text()).toBe('（近7天）')
    expect(wrapper.find('.panel-title-frame .panel-title-suffix').exists()).toBe(false)
  })
})
