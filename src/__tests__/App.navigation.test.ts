import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it } from 'vitest'
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
})
