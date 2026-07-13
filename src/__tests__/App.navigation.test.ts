import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { themes } from '@/data/themes'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'screen', component: { template: '<div />' } },
      { path: '/config', name: 'config', component: { template: '<div />' } },
    ],
  })
}

describe('App view switch', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.removeAttribute('style')
  })

  it('navigates between dashboard and config routes', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    const configButton = wrapper.findAll('button').find((button) => button.text().includes('配置'))
    expect(configButton).toBeTruthy()
    await configButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('config')

    const screenButton = wrapper.findAll('button').find((button) => button.text().includes('大屏'))
    expect(screenButton).toBeTruthy()
    await screenButton!.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('screen')
  })

  it('keeps only fullscreen and config controls on the dashboard', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()
    const fullscreenListener = vi.fn()
    window.addEventListener('dashboard:toggle-fullscreen', fullscreenListener)

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    const buttons = wrapper.find('.view-switch').findAll('button')
    expect(buttons.map((button) => button.text().trim())).toEqual(['全屏', '配置'])

    await buttons[0].trigger('click')

    expect(fullscreenListener).toHaveBeenCalledTimes(1)
    window.removeEventListener('dashboard:toggle-fullscreen', fullscreenListener)
  })

  it('projects the active theme variables onto the document chrome', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()
    const pinia = createPinia()

    mount(App, {
      global: {
        plugins: [pinia, router],
      },
    })

    const store = useDashboardStore(pinia)
    const lightTheme = themes.find((theme) => theme.id === 'light-medical')

    expect(lightTheme).toBeTruthy()
    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(
      store.activeTheme.variables['--bg'],
    )

    store.setTheme('light-medical')
    await flushPromises()

    expect(document.documentElement.style.getPropertyValue('--bg')).toBe(
      lightTheme!.variables['--bg'],
    )
    expect(document.documentElement.style.getPropertyValue('--bg-top')).toBe(
      lightTheme!.variables['--bg-top'],
    )
  })

  it('projects the selected panel style onto the dashboard shell', async () => {
    const router = makeRouter()
    router.push('/')
    await router.isReady()
    const pinia = createPinia()

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router],
      },
    })

    const store = useDashboardStore(pinia)

    expect(wrapper.find('.dashboard-shell').attributes('data-panel-style')).toBe('glass-flow')

    store.setPanelStyle('chamfered-instrument')
    await flushPromises()

    expect(wrapper.find('.dashboard-shell').attributes('data-panel-style')).toBe(
      'chamfered-instrument',
    )
  })
})
