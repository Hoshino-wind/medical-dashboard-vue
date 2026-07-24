import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import DashboardColorPicker from '../DashboardColorPicker.vue'

describe('DashboardColorPicker', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('renders an Ant Design-style panel and emits HEXA when opacity changes', async () => {
    const wrapper = mount(DashboardColorPicker, {
      attachTo: document.body,
      props: {
        label: '环图颜色',
        description: '设备可用率环图',
        value: '#1677ff',
        overridden: false,
        testId: 'ring-color-picker',
        dark: true,
      },
    })

    await wrapper.get('[data-testid="ring-color-picker"]').trigger('click')

    const panel = document.querySelector<HTMLElement>('[data-testid="ring-color-picker-panel"]')
    expect(panel?.classList.contains('is-dark')).toBe(true)
    expect(panel?.querySelectorAll('[role="slider"]')).toHaveLength(1)
    expect(panel?.querySelectorAll('input[type="range"]')).toHaveLength(2)
    expect(panel?.textContent).toContain('HEX')

    const alphaInput = panel?.querySelector<HTMLInputElement>('input[aria-label="透明度百分比"]')
    expect(alphaInput).toBeTruthy()
    alphaInput!.value = '50'
    alphaInput!.dispatchEvent(new Event('input', { bubbles: true }))
    alphaInput!.dispatchEvent(new Event('change', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('change')?.at(-1)).toEqual(['#1677ff80'])
    expect(wrapper.get('[data-testid="ring-color-picker"]').text()).toContain('50%')
    wrapper.unmount()
  })
})
