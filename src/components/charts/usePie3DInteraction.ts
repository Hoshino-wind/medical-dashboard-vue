import { computed, onMounted, onUnmounted, reactive, ref, watch, type Ref } from 'vue'
import { pxToRem } from '@/utils/rem'
import { VIEWBOX_HEIGHT, VIEWBOX_WIDTH, type RenderedSegment } from './pie3dGeometry'

const TOOLTIP_WIDTH = 92
const TOOLTIP_HEIGHT = 38
const TOOLTIP_GAP = 8
const TOOLTIP_MARGIN = 6
const AUTO_ROTATION_DEGREES_PER_MS = 0.012
const AUTO_ROTATION_FRAME_MS = 32

interface Pie3DInteractionOptions {
  host: Ref<HTMLDivElement | null>
  total: Readonly<Ref<number>>
  rotationOffset: Ref<number>
  autoRotate: () => boolean
}

export function usePie3DInteraction({
  host,
  total,
  rotationOffset,
  autoRotate,
}: Pie3DInteractionOptions) {
  const activeSegmentIndex = ref<number | null>(null)
  const isInteracting = ref(false)
  const tooltip = reactive({ visible: false, x: 0, y: 0, name: '', value: 0, percent: '0.0' })
  let rotationFrame = 0
  let previousRotationTimestamp: number | null = null
  let accumulatedRotationMs = 0

  const tooltipStyle = computed(() => ({
    transform: `translate(${pxToRem(tooltip.x)}, ${pxToRem(tooltip.y)})`,
  }))

  function clampTooltipPosition(x: number, y: number, rect: DOMRect) {
    const maxX = rect.width - TOOLTIP_WIDTH - TOOLTIP_MARGIN
    const maxY = rect.height - TOOLTIP_HEIGHT - TOOLTIP_MARGIN
    return {
      x: Math.min(Math.max(x, TOOLTIP_MARGIN), Math.max(TOOLTIP_MARGIN, maxX)),
      y: Math.min(Math.max(y, TOOLTIP_MARGIN), Math.max(TOOLTIP_MARGIN, maxY)),
    }
  }

  function moveTooltip(event: PointerEvent) {
    const rect = host.value?.getBoundingClientRect()
    if (!rect) return

    const pointerX = event.clientX - rect.left
    const rawX = pointerX + TOOLTIP_GAP
    const rawY = event.clientY - rect.top - TOOLTIP_GAP
    const x =
      rawX + TOOLTIP_WIDTH + TOOLTIP_MARGIN > rect.width
        ? pointerX - TOOLTIP_WIDTH - TOOLTIP_GAP
        : rawX
    Object.assign(tooltip, clampTooltipPosition(x, rawY, rect))
  }

  function fillTooltip(segment: RenderedSegment) {
    activeSegmentIndex.value = segment.index
    tooltip.visible = true
    tooltip.name = segment.name
    tooltip.value = segment.value
    tooltip.percent = total.value > 0 ? ((segment.value / total.value) * 100).toFixed(1) : '0.0'
  }

  function showTooltip(segment: RenderedSegment, event: PointerEvent) {
    isInteracting.value = true
    fillTooltip(segment)
    moveTooltip(event)
  }

  function showKeyboardTooltip(segment: RenderedSegment) {
    isInteracting.value = true
    fillTooltip(segment)
    const rect = host.value?.getBoundingClientRect()
    if (!rect) {
      tooltip.x = segment.labelX + TOOLTIP_GAP
      tooltip.y = segment.labelY - TOOLTIP_GAP
      return
    }

    Object.assign(
      tooltip,
      clampTooltipPosition(
        segment.labelX * (rect.width / VIEWBOX_WIDTH) + TOOLTIP_GAP,
        segment.labelY * (rect.height / VIEWBOX_HEIGHT) - TOOLTIP_GAP,
        rect,
      ),
    )
  }

  function hideTooltip() {
    isInteracting.value = false
    activeSegmentIndex.value = null
    tooltip.visible = false
  }

  function stopAutoRotation() {
    cancelAnimationFrame(rotationFrame)
    rotationFrame = 0
    previousRotationTimestamp = null
    accumulatedRotationMs = 0
  }

  function runAutoRotation(timestamp: number) {
    if (previousRotationTimestamp === null) {
      previousRotationTimestamp = timestamp
    } else {
      const delta = Math.min(100, Math.max(0, timestamp - previousRotationTimestamp))
      previousRotationTimestamp = timestamp
      if (!isInteracting.value) {
        accumulatedRotationMs += delta
        if (accumulatedRotationMs >= AUTO_ROTATION_FRAME_MS) {
          rotationOffset.value =
            (rotationOffset.value + accumulatedRotationMs * AUTO_ROTATION_DEGREES_PER_MS) % 360
          accumulatedRotationMs = 0
        }
      }
    }
    rotationFrame = requestAnimationFrame(runAutoRotation)
  }

  function syncAutoRotation() {
    stopAutoRotation()
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (autoRotate() && !reducedMotion) rotationFrame = requestAnimationFrame(runAutoRotation)
  }

  onMounted(syncAutoRotation)
  watch(autoRotate, syncAutoRotation)
  onUnmounted(stopAutoRotation)

  return {
    activeSegmentIndex,
    hideTooltip,
    isInteracting,
    moveTooltip,
    showKeyboardTooltip,
    showTooltip,
    tooltip,
    tooltipStyle,
  }
}
