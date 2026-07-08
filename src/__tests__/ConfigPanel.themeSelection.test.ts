import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ConfigPanel from '@/components/shared/ConfigPanel.vue'

describe('ConfigPanel theme selection feedback', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('moves the current-theme badge when a theme is selected', async () => {
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
      },
    })

    expect(wrapper.findAll('.theme-current-badge')).toHaveLength(1)
    expect(wrapper.find('.theme-card.active').text()).toContain('03 深海指挥蓝')
    expect(wrapper.find('.theme-card.active').text()).toContain('当前')

    const daylightTheme = wrapper
      .findAll('.theme-card')
      .find((card) => card.text().includes('01 日间医疗白'))

    expect(daylightTheme).toBeTruthy()
    await daylightTheme!.trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.theme-current-badge')).toHaveLength(1)
    expect(wrapper.find('.theme-card.active').text()).toContain('01 日间医疗白')
    expect(wrapper.find('.theme-card.active').text()).toContain('当前')
  })
})
