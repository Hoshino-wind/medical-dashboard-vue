import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import App from '../App.vue'

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
})
