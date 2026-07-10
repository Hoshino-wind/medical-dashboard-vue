import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Pie3D from '@/components/charts/Pie3D.vue'
import { themes } from '@/data/themes'

const items = [
  { name: '运行', value: 60, color: '#19d7c1' },
  { name: '待机', value: 30, color: '#7c6dff' },
  { name: '离线', value: 10, color: '#f06578' },
]

function stubRaf() {
  let nextFrameId = 1
  const pending = new Map<number, FrameRequestCallback>()
  const requestFrame = vi.fn((callback: FrameRequestCallback) => {
    const frameId = nextFrameId++
    pending.set(frameId, callback)
    return frameId
  })
  const cancelFrame = vi.fn((frameId: number) => pending.delete(frameId))

  vi.stubGlobal('requestAnimationFrame', requestFrame)
  vi.stubGlobal('cancelAnimationFrame', cancelFrame)

  return {
    cancelFrame,
    pending,
    runFrame(time: number) {
      const entry = pending.entries().next().value as [number, FrameRequestCallback] | undefined
      if (!entry) throw new Error(`No animation frame is pending at ${time}ms`)

      const [frameId, callback] = entry
      pending.delete(frameId)
      callback(time)
    },
  }
}

function dispatchFocusEvent(
  target: Element,
  type: 'focusin' | 'focusout',
  relatedTarget: EventTarget | null = null,
) {
  target.dispatchEvent(new FocusEvent(type, { bubbles: true, relatedTarget }))
}

describe('Pie3D', () => {
  const wrappers: VueWrapper[] = []
  let raf: ReturnType<typeof stubRaf>

  function mountPie(props: Partial<InstanceType<typeof Pie3D>['$props']> = {}) {
    const wrapper = mount(Pie3D, {
      props: {
        items,
        ...props,
      },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  beforeEach(() => {
    raf = stubRaf()
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  })

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('changes segment geometry when autoRotate is enabled', async () => {
    const wrapper = mountPie({ autoRotate: true })
    const before = wrapper.find('.pie3d-top-segment').attributes('d')

    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()

    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(before)
  })

  it('keeps segment geometry stable when autoRotate is disabled', async () => {
    const wrapper = mountPie({ autoRotate: false })
    const before = wrapper.find('.pie3d-top-segment').attributes('d')

    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()

    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(before)
  })

  it('reacts to autoRotate changes while keeping the rotation prop additive', async () => {
    const wrapper = mountPie({ autoRotate: false, rotation: 0 })
    const initial = wrapper.find('.pie3d-top-segment').attributes('d')

    await wrapper.setProps({ rotation: 45 })
    const rotatedByProp = wrapper.find('.pie3d-top-segment').attributes('d')
    expect(rotatedByProp).not.toBe(initial)

    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(rotatedByProp)

    await wrapper.setProps({ autoRotate: true })
    raf.runFrame(132)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(rotatedByProp)
  })

  it('keeps focus-driven rotation and tooltip paused after the pointer leaves', async () => {
    const wrapper = mountPie({ autoRotate: true })
    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()
    const beforeInteraction = wrapper.find('.pie3d-top-segment').attributes('d')
    const segment = wrapper.find('.pie3d-top-segment')

    await segment.trigger('focus')
    dispatchFocusEvent(segment.element, 'focusin')
    await wrapper.trigger('pointerenter')
    raf.runFrame(132)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(beforeInteraction)

    await wrapper.trigger('pointerleave')
    expect(wrapper.find('.pie3d-three-tooltip').exists()).toBe(true)
    raf.runFrame(148)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(beforeInteraction)

    dispatchFocusEvent(segment.element, 'focusout')
    await segment.trigger('blur')
    raf.runFrame(164)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(beforeInteraction)
  })

  it('keeps pointer-driven rotation paused after focus leaves', async () => {
    const wrapper = mountPie({ autoRotate: true })
    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()
    const beforeInteraction = wrapper.find('.pie3d-top-segment').attributes('d')
    const segment = wrapper.find('.pie3d-top-segment')

    dispatchFocusEvent(segment.element, 'focusin')
    await wrapper.trigger('pointerenter')
    dispatchFocusEvent(segment.element, 'focusout')
    raf.runFrame(132)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(beforeInteraction)

    await wrapper.trigger('pointerleave')
    raf.runFrame(148)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(beforeInteraction)
  })

  it('does not resume rotation when focus moves between segments', async () => {
    const wrapper = mountPie({ autoRotate: true })
    raf.runFrame(100)
    raf.runFrame(116)
    await nextTick()
    const beforeFocus = wrapper.find('.pie3d-top-segment').attributes('d')
    const [firstSegment, secondSegment] = wrapper.findAll('.pie3d-top-segment')

    dispatchFocusEvent(firstSegment.element, 'focusin')
    raf.runFrame(132)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(beforeFocus)

    dispatchFocusEvent(firstSegment.element, 'focusout', secondSegment.element)
    raf.runFrame(148)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(beforeFocus)

    dispatchFocusEvent(secondSegment.element, 'focusout')
    raf.runFrame(164)
    await nextTick()
    expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(beforeFocus)
  })

  it('uses disjoint theme-derived top-light gradients across component instances', () => {
    const first = mountPie({ theme: themes[1] })
    const second = mountPie({ theme: themes[1] })
    const gradients = [...first.findAll('.pie3d-top-light'), ...second.findAll('.pie3d-top-light')]
    const gradientIds = gradients.map((gradient) => gradient.attributes('id'))

    expect(gradients).toHaveLength(items.length * 2)
    expect(new Set(gradientIds).size).toBe(items.length * 2)

    for (const wrapper of [first, second]) {
      const instanceGradients = wrapper.findAll('.pie3d-top-light')
      const topSegments = wrapper.findAll('.pie3d-top-segment')
      topSegments.forEach((segment, index) => {
        const gradient = instanceGradients[index]
        const stops = gradient.findAll('stop')
        expect(segment.attributes('fill')).toBe(`url(#${gradient.attributes('id')})`)
        expect(stops[0].attributes('stop-color')).toContain(themes[1].variables['--instrument-rim'])
        expect(stops.at(-1)?.attributes('stop-color')).toContain(themes[1].variables['--bg'])
      })
    }
  })

  it('cancels its pending frame when unmounted', () => {
    const wrapper = mountPie({ autoRotate: true })

    wrapper.unmount()

    expect(raf.cancelFrame).toHaveBeenCalledTimes(1)
    expect(raf.pending).toHaveLength(0)
  })
})
