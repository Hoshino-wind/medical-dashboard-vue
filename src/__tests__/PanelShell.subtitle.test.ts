import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelShell from '@/components/shared/PanelShell.vue'

describe('PanelShell subtitle', () => {
  it('renders the time range directly after the title text inside the title frame', () => {
    const wrapper = mount(PanelShell, {
      props: {
        title: '保修统计',
        subtitle: '近7天',
      },
    })

    const titleFrame = wrapper.get('.panel-title-frame')
    const titleText = titleFrame.get('.panel-title-text')
    const titleSuffix = titleFrame.get('.panel-title-suffix')

    expect(titleFrame.text()).toBe('保修统计（近7天）')
    expect(titleSuffix.text()).toBe('（近7天）')
    expect(titleText.element.nextElementSibling).toBe(titleSuffix.element)
    expect(wrapper.find('.panel-header--main > .panel-title-suffix').exists()).toBe(false)
  })
})
