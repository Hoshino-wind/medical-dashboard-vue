import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HologramGauge from '@/components/visual/HologramGauge.vue'

describe('HologramGauge', () => {
  beforeEach(() => {
    let frameIndex = 0

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = window.setTimeout(() => {
        callback(frameIndex === 0 ? 0 : 700)
        frameIndex += 1
      }, 0)

      return Number(id)
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function finishAnimation() {
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await nextTick()
  }

  it('renders near-complete availability as a full ring while keeping the precise label', async () => {
    const wrapper = mount(HologramGauge, {
      props: {
        value: 99.9,
        insideLabel: '设备可用率',
        showFooter: false,
        large: true,
      },
    })

    await finishAnimation()

    const valueText = wrapper.find('.hologram-gauge-value').text()
    const progress = wrapper.find('.gauge-ring-progress')
    const circumference = Number(progress.attributes('stroke-dasharray'))
    const dashOffset = Number(progress.attributes('stroke-dashoffset'))
    const visiblePercent = ((circumference - dashOffset) / circumference) * 100

    expect(valueText).toBe('99.9%')
    expect(dashOffset).toBe(0)
    expect(visiblePercent).toBe(100)
    expect(wrapper.classes()).toContain('is-complete')

    wrapper.unmount()
  })

  it('uses the provided tone for near-complete themed gauges', () => {
    const wrapper = mount(HologramGauge, {
      props: {
        value: 99.9,
        tone: '#1677ff',
      },
    })

    expect(wrapper.attributes('style')).toContain('--gauge-tone: #1677ff')

    wrapper.unmount()
  })

  it('keeps a zero-value gauge alive as an idle instrument', () => {
    const wrapper = mount(HologramGauge, { props: { value: 0 } })

    expect(wrapper.classes()).toContain('is-idle')
    expect(wrapper.find('.gauge-base-scan').exists()).toBe(true)
    expect(wrapper.find('.hologram-gauge-value').text()).toBe('0%')

    wrapper.unmount()
  })

  it('renders the requested theme-aware light curtain above its pedestal', () => {
    const wrapper = mount(HologramGauge, {
      props: {
        value: 96.8,
        curtainVariant: 'cylinder',
      },
    })

    expect(wrapper.find('.hologram-light-curtain--cylinder').exists()).toBe(true)
    expect(wrapper.find('.hologram-light-curtain--fan').exists()).toBe(false)

    wrapper.unmount()
  })
})
