import { onMounted, onUnmounted, ref } from 'vue'

export function useInstrumentLoop(step: (deltaMs: number) => void, enabled: () => boolean) {
  const isReducedMotion = ref(false)
  let frame = 0
  let previous: number | null = null
  let manuallyPaused = false
  let documentHidden = false
  let media: MediaQueryList | null = null
  let active = false

  const tick = (time: number) => {
    if (!active) return

    if (!manuallyPaused && !documentHidden && !isReducedMotion.value && enabled()) {
      if (previous !== null) step(Math.min(64, time - previous))
      previous = time
    } else {
      previous = time
    }
    if (active) frame = requestAnimationFrame(tick)
  }

  const pause = () => {
    manuallyPaused = true
  }
  const resume = () => {
    manuallyPaused = false
  }
  const syncVisibility = () => {
    documentHidden = document.hidden
    previous = null
  }
  const syncMotionPreference = () => {
    isReducedMotion.value = media?.matches ?? false
  }

  onMounted(() => {
    active = true
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncMotionPreference()
    syncVisibility()
    media.addEventListener('change', syncMotionPreference)
    document.addEventListener('visibilitychange', syncVisibility)
    frame = requestAnimationFrame(tick)
  })

  onUnmounted(() => {
    active = false
    cancelAnimationFrame(frame)
    media?.removeEventListener('change', syncMotionPreference)
    document.removeEventListener('visibilitychange', syncVisibility)
  })

  return { pause, resume, isReducedMotion }
}
