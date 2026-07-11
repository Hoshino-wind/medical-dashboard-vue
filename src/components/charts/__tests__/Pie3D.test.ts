import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Pie3D from '@/components/charts/Pie3D.vue'

describe('Pie3D', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('updates segment geometry when auto rotation is enabled', async () => {
    let frameCallback: FrameRequestCallback | undefined

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallback = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(Pie3D, {
      props: {
        items: [
          { name: '已完成', value: 3, color: '#20e8ff' },
          { name: '待处理', value: 2, color: '#7efcff' },
        ],
        autoRotate: true,
        rotation: 150,
      },
    })

    const before = wrapper.find('.pie3d-top-segment').attributes('d')

    expect(frameCallback).toBeTypeOf('function')
    frameCallback?.(0)
    frameCallback?.(40)
    await nextTick()

    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(before)

    wrapper.unmount()
  })

  it('pauses rotation while the chart is being inspected', async () => {
    let frameCallback: FrameRequestCallback | undefined

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frameCallback = callback
      return 1
    })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    const wrapper = mount(Pie3D, {
      props: {
        items: [
          { name: '已完成', value: 3, color: '#20e8ff' },
          { name: '待处理', value: 2, color: '#7efcff' },
        ],
        autoRotate: true,
      },
    })

    const runFrame = async (timestamp: number) => {
      frameCallback?.(timestamp)
      await nextTick()
    }

    await runFrame(0)
    await runFrame(40)
    await wrapper.trigger('pointerenter')
    const pausedPath = wrapper.find('.pie3d-top-segment').attributes('d')
    await runFrame(80)

    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(pausedPath)

    await wrapper.trigger('pointerleave')
    await runFrame(120)
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(pausedPath)

    wrapper.unmount()
  })
})
