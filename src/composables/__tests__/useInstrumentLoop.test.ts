import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInstrumentLoop } from '@/composables/useInstrumentLoop'

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
    requestFrame,
    runFrame(time: number) {
      const entry = pending.entries().next().value as [number, FrameRequestCallback] | undefined
      if (!entry) throw new Error(`No animation frame is pending at ${time}ms`)

      const [frameId, callback] = entry
      pending.delete(frameId)
      callback(time)
    },
  }
}

function stubMotionPreference(initialMatches = false) {
  let listener: (() => void) | undefined
  const media = {
    matches: initialMatches,
    addEventListener: vi.fn((_type: string, nextListener: () => void) => {
      listener = nextListener
    }),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )

  return {
    media,
    setMatches(matches: boolean) {
      media.matches = matches
      listener?.()
    },
    get listener() {
      return listener
    },
  }
}

function stubDocumentVisibility(initialHidden = false) {
  let hidden = initialHidden
  vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)

  return {
    setHidden(nextHidden: boolean) {
      hidden = nextHidden
      document.dispatchEvent(new Event('visibilitychange'))
    },
  }
}

describe('useInstrumentLoop', () => {
  const wrappers: VueWrapper[] = []

  function mountLoop(step: (deltaMs: number) => void, enabled: () => boolean = () => true) {
    let controls!: ReturnType<typeof useInstrumentLoop>
    const Host = defineComponent({
      setup() {
        controls = useInstrumentLoop(step, enabled)
        return () => null
      },
    })
    const wrapper = mount(Host)
    wrappers.push(wrapper)
    return { controls, wrapper }
  }

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('runs, pauses, resumes, and cancels the animation frame', () => {
    const raf = stubRaf()
    stubMotionPreference()
    stubDocumentVisibility()
    const step = vi.fn()
    const { controls, wrapper } = mountLoop(step)

    raf.runFrame(100)
    raf.runFrame(116)
    expect(step).toHaveBeenLastCalledWith(16)

    controls.pause()
    raf.runFrame(132)
    expect(step).toHaveBeenCalledTimes(1)

    controls.resume()
    raf.runFrame(148)
    expect(step).toHaveBeenLastCalledWith(16)

    wrapper.unmount()
    expect(raf.cancelFrame).toHaveBeenCalledTimes(1)
    expect(raf.pending).toHaveLength(0)
  })

  it('stays paused while the document is hidden and keeps manual pause independent', () => {
    const raf = stubRaf()
    stubMotionPreference()
    const visibility = stubDocumentVisibility(true)
    const removeEventListener = vi.spyOn(document, 'removeEventListener')
    const step = vi.fn()
    const { controls, wrapper } = mountLoop(step)

    raf.runFrame(100)
    raf.runFrame(116)
    expect(step).not.toHaveBeenCalled()

    controls.pause()
    controls.resume()
    raf.runFrame(132)
    expect(step).not.toHaveBeenCalled()

    visibility.setHidden(false)
    raf.runFrame(148)
    expect(step).not.toHaveBeenCalled()
    raf.runFrame(164)
    expect(step).toHaveBeenLastCalledWith(16)

    controls.pause()
    visibility.setHidden(true)
    raf.runFrame(180)
    visibility.setHidden(false)
    raf.runFrame(196)
    expect(step).toHaveBeenCalledTimes(1)

    controls.resume()
    raf.runFrame(212)
    expect(step).toHaveBeenLastCalledWith(16)

    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(raf.pending).toHaveLength(0)
  })

  it('rebases frame time after a suspended visibility interval', () => {
    const raf = stubRaf()
    stubMotionPreference()
    const visibility = stubDocumentVisibility()
    const step = vi.fn()
    mountLoop(step)

    raf.runFrame(0)
    raf.runFrame(16)
    expect(step).toHaveBeenLastCalledWith(16)

    visibility.setHidden(true)
    visibility.setHidden(false)
    raf.runFrame(10_000)
    expect(step).toHaveBeenCalledTimes(1)

    raf.runFrame(10_016)
    expect(step).toHaveBeenLastCalledWith(16)
  })

  it('reacts to reduced-motion changes without stopping the frame lifecycle', () => {
    const raf = stubRaf()
    const motion = stubMotionPreference(true)
    stubDocumentVisibility()
    const step = vi.fn()
    const { controls, wrapper } = mountLoop(step)

    expect(controls.isReducedMotion.value).toBe(true)
    raf.runFrame(0)
    raf.runFrame(16)
    expect(step).not.toHaveBeenCalled()
    expect(raf.requestFrame).toHaveBeenCalledTimes(3)

    motion.setMatches(false)
    expect(controls.isReducedMotion.value).toBe(false)
    raf.runFrame(32)
    expect(step).toHaveBeenLastCalledWith(16)

    motion.setMatches(true)
    raf.runFrame(48)
    expect(step).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    expect(motion.media.removeEventListener).toHaveBeenCalledWith('change', motion.listener)
    expect(raf.pending).toHaveLength(0)
  })

  it('accepts zero as the initial timestamp and caps long frame deltas', () => {
    const raf = stubRaf()
    stubMotionPreference()
    stubDocumentVisibility()
    const step = vi.fn()
    mountLoop(step)

    raf.runFrame(0)
    raf.runFrame(16)
    expect(step).toHaveBeenLastCalledWith(16)

    raf.runFrame(160)
    expect(step).toHaveBeenLastCalledWith(64)
  })

  it('does not queue another frame when a step unmounts its host', () => {
    const raf = stubRaf()
    stubMotionPreference()
    stubDocumentVisibility()
    const step = vi.fn(() => wrapper.unmount())
    const { wrapper } = mountLoop(step)

    raf.runFrame(100)
    raf.runFrame(116)

    expect(step).toHaveBeenCalledTimes(1)
    expect(raf.cancelFrame).toHaveBeenCalledTimes(1)
    expect(raf.pending).toHaveLength(0)
  })
})
