import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BigScreen from '@/components/shared/BigScreen.vue'

const originalRequestFullscreen = Element.prototype.requestFullscreen

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'screen', component: { template: '<div />' } },
      { path: '/config', name: 'config', component: { template: '<div />' } },
    ],
  })
}

afterEach(() => {
  Element.prototype.requestFullscreen = originalRequestFullscreen
  vi.restoreAllMocks()
})

describe('BigScreen reference layout', () => {
  it('marks the default screen as aligned to the 1920x1080 3x3 reference', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(BigScreen, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          HeaderBar: true,
          ModuleRenderer: true,
        },
      },
    })

    expect(wrapper.find('.screen-frame').attributes('data-reference-design')).toBe(
      'medical-equipment-1920x1080',
    )
    expect(wrapper.find('.screen-grid').attributes('data-layout')).toBe('3x3')
    expect(wrapper.find('.footer-kpi-bar').exists()).toBe(false)
  })

  it('provides a theme configuration action that opens the config route', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(BigScreen, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          HeaderBar: true,
          ModuleRenderer: true,
        },
      },
    })

    const themeConfigButton = wrapper
      .findAll('.screen-action')
      .find((button) => button.text().includes('主题配置'))

    expect(themeConfigButton).toBeTruthy()
    await themeConfigButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('config')
  })

  it('keeps only the screen, fullscreen and theme actions and opens fullscreen', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()

    let fullscreenTarget: Element | null = null
    Element.prototype.requestFullscreen = vi.fn(function (this: Element) {
      fullscreenTarget = this
      return Promise.resolve()
    })

    const wrapper = mount(BigScreen, {
      global: {
        plugins: [createPinia(), router],
        stubs: {
          HeaderBar: true,
          ModuleRenderer: true,
        },
      },
    })

    const screenButtons = wrapper.findAll('.screen-action')
    const screenLabels = screenButtons.map((button) => button.text())

    expect(wrapper.find('footer').exists()).toBe(false)
    expect(wrapper.find('.screen-footer-nav').exists()).toBe(false)
    expect(screenLabels).toEqual(['大屏模式', '全屏显示', '主题配置'])
    expect(screenLabels).not.toContain('数据导出')
    expect(screenLabels).not.toContain('设备地图')
    expect(screenLabels).not.toContain('告警中心')

    await screenButtons[1].trigger('click')
    await flushPromises()

    expect(Element.prototype.requestFullscreen).toHaveBeenCalledTimes(1)
    expect(fullscreenTarget).toBe(wrapper.find('.screen-frame').element)
    expect(wrapper.find('.screen-frame').classes()).toContain('is-faux-fullscreen')
    expect(screenButtons[1].attributes('aria-pressed')).toBe('true')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.find('.screen-frame').classes()).not.toContain('is-faux-fullscreen')
  })
})
