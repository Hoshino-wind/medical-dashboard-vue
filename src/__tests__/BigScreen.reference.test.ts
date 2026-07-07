import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import BigScreen from '@/components/shared/BigScreen.vue'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'screen', component: { template: '<div />' } },
      { path: '/config', name: 'config', component: { template: '<div />' } },
    ],
  })
}

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

  it('provides a footer theme configuration action that opens the config route', async () => {
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
      .findAll('.screen-footer-action')
      .find((button) => button.text().includes('主题配置'))

    expect(themeConfigButton).toBeTruthy()
    await themeConfigButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('config')
  })
})
