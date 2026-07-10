<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import { useInstrumentLoop } from '@/composables/useInstrumentLoop'
import { buildPie3DSegments, type Pie3DInputItem, type Pie3DSegment } from '@/utils/pie3dSegments'
import { pxToRem } from '@/utils/rem'
import type { Theme } from '@/types/theme'

const TAU = Math.PI * 2
const BASE_START_ANGLE = -Math.PI / 2
const VIEWBOX_WIDTH = 240
const VIEWBOX_HEIGHT = 188
const CENTER_X = 120
const CENTER_Y = 61
const OUTER_RX = 78
const OUTER_RY = 34
const INNER_RX = 41
const INNER_RY = 16.5
const DEPTH_STEP = 3.5
const ARC_POINT_DENSITY = 112
const TOOLTIP_WIDTH = 92
const TOOLTIP_HEIGHT = 38
const TOOLTIP_GAP = 8
const TOOLTIP_MARGIN = 6

const props = withDefaults(
  defineProps<{
    items: Pie3DInputItem[]
    height?: string
    thickness?: number
    theme?: Theme
    tone?: string
    accent?: string
    surface?: string
    text?: string
    autoRotate?: boolean
    rotation?: number
  }>(),
  {
    height: pxToRem(150),
    thickness: 8,
    autoRotate: false,
    rotation: 0,
  },
)

const rotationOffset = ref(0)

// 起始角度：基础 -90°（12 点方向）+ 顺时针旋转偏移（rotation 为正=顺时针）
const startAngle = computed(
  () =>
    normalizeAngle(BASE_START_ANGLE + ((props.rotation + rotationOffset.value) * Math.PI) / 180),
)

const { pause: pauseRotation, resume: resumeRotation } = useInstrumentLoop(
  (deltaMs) => {
    rotationOffset.value = (rotationOffset.value + deltaMs * 0.0025) % 360
  },
  () => props.autoRotate,
)

interface EllipsePoint {
  x: number
  y: number
}

interface RenderedSegment extends Pie3DSegment {
  index: number
  startAngle: number
  endAngle: number
  path: string
  topColor: string
  gradientId: string
  highlightColor: string
  shadowColor: string
  depthColor: string
  strokeColor: string
  labelX: number
  labelY: number
}

interface WallSegment {
  key: string
  path: string
  fill: string
  stroke: string
  opacity: number
}

interface DepthLayer {
  key: string
  offset: number
  opacity: number
}

const host = ref<HTMLDivElement | null>(null)
const activeSegmentIndex = ref<number | null>(null)
const focusedSegmentIndex = ref<number | null>(null)
let pointerInside = false
let focusWithin = false
const componentUid = getCurrentInstance()?.uid ?? 0
const filterId = `pie3d-ambient-shadow-${componentUid}`
const total = computed(() =>
  props.items.reduce((sum, item) => (Number.isFinite(item.value) && item.value > 0 ? sum + item.value : sum), 0),
)

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  value: 0,
  percent: '0.0',
})

const tooltipStyle = computed(() => ({
  transform: `translate(${pxToRem(tooltip.x)}, ${pxToRem(tooltip.y)})`,
}))

const shellStyle = computed(() => ({
  height: props.height,
  '--pie-tone': props.tone ?? props.theme?.variables['--data-pie-primary'] ?? 'var(--data-pie-primary)',
  '--pie-accent': props.accent ?? props.theme?.variables['--data-pie-pending'] ?? 'var(--data-pie-pending)',
  '--pie-surface':
    props.surface ?? props.theme?.variables['--instrument-base'] ?? 'var(--instrument-base)',
  '--pie-edge': props.theme?.variables['--glass-edge'] ?? 'var(--glass-edge)',
  '--pie-text': props.text ?? props.theme?.variables['--text'] ?? 'var(--text)',
}))

const depthLayerCount = computed(() => Math.max(4, Math.min(8, Math.round(props.thickness))))

const depthLayers = computed<DepthLayer[]>(() =>
  Array.from({ length: depthLayerCount.value }, (_, index) => {
    const layer = depthLayerCount.value - index
    const lightDepthOpacityBase = isLightTheme() ? 0.1 : 0.12
    const lightDepthOpacityRange = isLightTheme() ? 0.18 : 0.22
    return {
      key: `depth-${layer}`,
      offset: layer * DEPTH_STEP,
      opacity:
        lightDepthOpacityBase +
        (index / Math.max(1, depthLayerCount.value - 1)) * lightDepthOpacityRange,
    }
  }),
)

const rawSegments = computed<Pie3DSegment[]>(() => {
  const segments = buildPie3DSegments(props.items)
  if (segments.length > 0) return segments

  return [
    {
      name: '暂无数据',
      value: 1,
      color: props.theme?.variables['--surface-muted'] ?? 'var(--surface-muted)',
      startRatio: 0,
      endRatio: 1,
    },
  ]
})

const renderedSegments = computed<RenderedSegment[]>(() => {
  const gap = rawSegments.value.length > 1 ? 0.012 : 0

  return rawSegments.value.map((segment, index) => {
    const startRaw = startAngle.value + segment.startRatio * TAU
    const endRaw = startAngle.value + segment.endRatio * TAU
    const arc = Math.max(0, endRaw - startRaw)
    const segmentGap = Math.min(gap, Math.max(0, arc * 0.16))
    const start = startRaw + segmentGap
    const end = endRaw - segmentGap
    const mid = (start + end) / 2
    const label = pointOnTiltedEllipse(mid, (OUTER_RX + INNER_RX) / 2, (OUTER_RY + INNER_RY) / 2)

    return {
      ...segment,
      index,
      startAngle: start,
      endAngle: Math.max(start + 0.001, end),
      path: annularSectorPath(start, Math.max(start + 0.001, end)),
      topColor: segment.color,
      gradientId: `pie3d-top-${componentUid}-${index}`,
      highlightColor: colorMix(
        segment.color,
        58,
        props.theme?.variables['--instrument-rim'] ?? '#d7fbff',
      ),
      shadowColor: colorMix(segment.color, 68, props.theme?.variables['--bg'] ?? '#020814'),
      depthColor: colorMix(segment.color, isLightTheme() ? 64 : 48, isLightTheme() ? '#c3dbe1' : '#020814'),
      strokeColor: colorMix(segment.color, isLightTheme() ? 70 : 72, props.theme?.variables['--instrument-rim'] ?? '#d7fbff'),
      labelX: label.x,
      labelY: label.y,
    }
  })
})

const chartLabel = computed(() =>
  renderedSegments.value
    .map((segment) => `${segment.name} ${segment.value}`)
    .join('，'),
)

const centerCapPath = computed(() => closedTiltedEllipsePath(INNER_RX - 3, INNER_RY - 1.5, 0.8))
const innerRimPath = computed(() => closedTiltedEllipsePath(INNER_RX, INNER_RY, 0))
const totalDepth = computed(() => depthLayerCount.value * DEPTH_STEP)
const frontWallSegments = computed<WallSegment[]>(() =>
  renderedSegments.value.flatMap((segment) => frontWallForSegment(segment)),
)

function isLightTheme(): boolean {
  return props.theme?.id.startsWith('light-') ?? false
}

function colorMix(color: string, colorPercent: number, mixColor: string): string {
  return `color-mix(in srgb, ${color} ${colorPercent}%, ${mixColor})`
}

function normalizeAngle(angle: number): number {
  return ((angle % TAU) + TAU) % TAU
}

function pointOnTiltedEllipse(angle: number, rx: number, ry: number, yOffset = 0): EllipsePoint {
  const sin = Math.sin(angle)
  const frontRatio = (sin + 1) / 2
  const xPerspective = 0.86 + frontRatio * 0.3
  const yPerspective = 0.68 + frontRatio * 0.3

  return {
    x: CENTER_X + Math.cos(angle) * rx * xPerspective,
    y: CENTER_Y + sin * ry * yPerspective + yOffset,
  }
}

function frontWallForSegment(segment: RenderedSegment): WallSegment[] {
  const normalizedStart = normalizeAngle(segment.startAngle)
  const normalizedEnd = normalizedStart + Math.max(0, segment.endAngle - segment.startAngle)
  const lastCycle = Math.floor(normalizedEnd / TAU)

  return Array.from({ length: lastCycle + 1 }, (_, cycle) => {
    const frontStart = cycle * TAU
    const frontEnd = frontStart + Math.PI
    const start = Math.max(normalizedStart, frontStart)
    const end = Math.min(normalizedEnd, frontEnd)

    if (end - start <= 0.01) return null

    return {
      key: `front-wall-${segment.index}-${cycle}`,
      path: sideWallPath(start, end, OUTER_RX, OUTER_RY, totalDepth.value),
      fill: colorMix(segment.topColor, isLightTheme() ? 56 : 42, isLightTheme() ? '#b9d6df' : '#020814'),
      stroke: segment.strokeColor,
      opacity: isLightTheme() ? 0.76 : 0.94,
    }
  }).filter((wall): wall is WallSegment => wall !== null)
}

function formatPoint(point: EllipsePoint): string {
  return `${point.x.toFixed(3)} ${point.y.toFixed(3)}`
}

function sampledArcPoints(start: number, end: number, rx: number, ry: number): EllipsePoint[] {
  const arc = Math.max(0.001, end - start)
  const steps = Math.max(8, Math.ceil((arc / TAU) * ARC_POINT_DENSITY))

  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = start + (arc * index) / steps
    return pointOnTiltedEllipse(angle, rx, ry)
  })
}

function closedTiltedEllipsePath(rx: number, ry: number, yOffset: number): string {
  const points = Array.from({ length: ARC_POINT_DENSITY }, (_, index) =>
    pointOnTiltedEllipse((TAU * index) / ARC_POINT_DENSITY, rx, ry, yOffset),
  )
  return [`M ${formatPoint(points[0])}`, ...points.slice(1).map((point) => `L ${formatPoint(point)}`), 'Z'].join(' ')
}

function sideWallPath(start: number, end: number, rx: number, ry: number, depth: number): string {
  const topPoints = sampledArcPoints(start, end, rx, ry)
  const bottomPoints = topPoints
    .map((point) => ({ x: point.x, y: point.y + depth }))
    .reverse()

  return [
    `M ${formatPoint(topPoints[0])}`,
    ...topPoints.slice(1).map((point) => `L ${formatPoint(point)}`),
    ...bottomPoints.map((point) => `L ${formatPoint(point)}`),
    'Z',
  ].join(' ')
}

function annularSectorPath(start: number, end: number): string {
  const outerPoints = sampledArcPoints(start, end, OUTER_RX, OUTER_RY)
  const innerPoints = sampledArcPoints(start, end, INNER_RX, INNER_RY).reverse()

  return [
    `M ${formatPoint(outerPoints[0])}`,
    ...outerPoints.slice(1).map((point) => `L ${formatPoint(point)}`),
    ...innerPoints.map((point) => `L ${formatPoint(point)}`),
    'Z',
  ].join(' ')
}

function clampTooltipPosition(x: number, y: number, rect: DOMRect): { x: number; y: number } {
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
  const next = clampTooltipPosition(x, rawY, rect)

  tooltip.x = next.x
  tooltip.y = next.y
}

function showTooltip(segment: RenderedSegment, event: PointerEvent) {
  activeSegmentIndex.value = segment.index
  tooltip.visible = true
  tooltip.name = segment.name
  tooltip.value = segment.value
  tooltip.percent = total.value > 0 ? ((segment.value / total.value) * 100).toFixed(1) : '0.0'
  moveTooltip(event)
}

function showKeyboardTooltip(segment: RenderedSegment) {
  const rect = host.value?.getBoundingClientRect()
  focusedSegmentIndex.value = segment.index
  activeSegmentIndex.value = segment.index
  tooltip.visible = true
  tooltip.name = segment.name
  tooltip.value = segment.value
  tooltip.percent = total.value > 0 ? ((segment.value / total.value) * 100).toFixed(1) : '0.0'

  if (!rect) {
    tooltip.x = segment.labelX + TOOLTIP_GAP
    tooltip.y = segment.labelY - TOOLTIP_GAP
    return
  }

  const next = clampTooltipPosition(
    segment.labelX * (rect.width / VIEWBOX_WIDTH) + TOOLTIP_GAP,
    segment.labelY * (rect.height / VIEWBOX_HEIGHT) - TOOLTIP_GAP,
    rect,
  )
  tooltip.x = next.x
  tooltip.y = next.y
}

function hideTooltip() {
  activeSegmentIndex.value = null
  tooltip.visible = false
}

function hideKeyboardTooltip(segment: RenderedSegment) {
  if (focusedSegmentIndex.value !== segment.index) return

  focusedSegmentIndex.value = null
  hideTooltip()
}

function syncInteractionRotation() {
  if (pointerInside || focusWithin) {
    pauseRotation()
  } else {
    resumeRotation()
  }
}

function handlePointerEnter() {
  pointerInside = true
  syncInteractionRotation()
}

function handlePointerLeave() {
  pointerInside = false
  const focusedSegment = renderedSegments.value.find(
    (segment) => segment.index === focusedSegmentIndex.value,
  )
  if (focusWithin && focusedSegment) {
    showKeyboardTooltip(focusedSegment)
  } else {
    hideTooltip()
  }
  syncInteractionRotation()
}

function handleFocusIn() {
  focusWithin = true
  syncInteractionRotation()
}

function handleFocusOut(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && host.value?.contains(event.relatedTarget)) return

  focusWithin = false
  syncInteractionRotation()
}
</script>

<template>
  <div
    ref="host"
    class="pie3d-three-shell pie3d-25d-shell"
    :style="shellStyle"
    @pointerenter="handlePointerEnter"
    @pointerleave="handlePointerLeave"
    @focusin="handleFocusIn"
    @focusout="handleFocusOut"
  >
    <svg
      class="pie3d-25d-svg"
      :viewBox="`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`"
      role="img"
      :aria-label="chartLabel"
    >
      <defs>
        <filter :id="filterId" x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" />
          <feOffset dx="0" dy="6" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.28" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient
          v-for="segment in renderedSegments"
          :id="segment.gradientId"
          :key="segment.gradientId"
          class="pie3d-top-light"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" :stop-color="segment.highlightColor" />
          <stop offset="0.48" :stop-color="segment.topColor" />
          <stop offset="1" :stop-color="segment.shadowColor" />
        </linearGradient>
      </defs>

      <ellipse
        class="pie3d-ground"
        :cx="CENTER_X"
        :cy="CENTER_Y + totalDepth + 12"
        rx="90"
        ry="26"
      />

      <g class="pie3d-depth-stack" aria-hidden="true" :filter="`url(#${filterId})`">
        <g
          v-for="layer in depthLayers"
          :key="layer.key"
          class="pie3d-depth-layer"
          :style="{ transform: `translateY(${layer.offset}px)`, opacity: layer.opacity }"
        >
          <path
            v-for="segment in renderedSegments"
            :key="`${layer.key}-${segment.index}`"
            :d="segment.path"
            :fill="segment.depthColor"
            :stroke="segment.strokeColor"
            stroke-width="0.75"
          />
        </g>
      </g>

      <g class="pie3d-front-wall-stack" aria-hidden="true">
        <path
          v-for="wall in frontWallSegments"
          :key="wall.key"
          class="pie3d-front-wall"
          :d="wall.path"
          :fill="wall.fill"
          :stroke="wall.stroke"
          :opacity="wall.opacity"
          stroke-width="0.9"
        />
      </g>

      <g class="pie3d-top-stack" :filter="`url(#${filterId})`">
        <path
          v-for="segment in renderedSegments"
          :key="segment.index"
          class="pie3d-top-segment"
          :class="{ 'is-active': activeSegmentIndex === segment.index }"
          :d="segment.path"
          :fill="`url(#${segment.gradientId})`"
          :stroke="segment.strokeColor"
          stroke-width="1.15"
          :style="{ opacity: isLightTheme() ? 0.76 : 1 }"
          tabindex="0"
          :data-segment-name="segment.name"
          @pointerenter="showTooltip(segment, $event)"
          @pointermove="moveTooltip"
          @focus="showKeyboardTooltip(segment)"
          @blur="hideKeyboardTooltip(segment)"
        />
      </g>

      <path
        class="pie3d-center-cap"
        :d="centerCapPath"
      />
      <path
        class="pie3d-inner-rim"
        :d="innerRimPath"
      />
    </svg>

    <div
      v-if="tooltip.visible"
      class="pie3d-three-tooltip"
      :style="tooltipStyle"
    >
      <div>{{ tooltip.name }}：{{ tooltip.value }}</div>
      <div>占比：{{ tooltip.percent }}%</div>
    </div>
  </div>
</template>

<style scoped>
.pie3d-three-shell {
  position: relative;
  width: 100%;
  overflow: visible;
}

.pie3d-25d-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.pie3d-ground {
  fill: color-mix(in srgb, var(--pie-surface) 46%, transparent);
  opacity: 0.36;
}

.pie3d-depth-layer {
  transform-box: view-box;
}

.pie3d-depth-layer path {
  vector-effect: non-scaling-stroke;
}

.pie3d-front-wall {
  filter: saturate(0.95) brightness(0.88);
  vector-effect: non-scaling-stroke;
}

.pie3d-top-segment {
  cursor: default;
  outline: none;
  transition:
    filter 180ms ease,
    transform 180ms ease;
  transform-box: fill-box;
  transform-origin: center;
  vector-effect: non-scaling-stroke;
}

.pie3d-top-segment:hover,
.pie3d-top-segment:focus,
.pie3d-top-segment.is-active {
  filter: brightness(1.11) saturate(1.08);
  transform: translateY(-0.125rem);
}

.pie3d-center-cap {
  fill: color-mix(in srgb, var(--pie-surface) 72%, transparent);
  stroke: color-mix(in srgb, var(--pie-edge) 40%, transparent);
  stroke-width: 1;
}

.pie3d-inner-rim {
  fill: transparent;
  stroke: color-mix(in srgb, var(--pie-accent) 44%, transparent);
  stroke-width: 1.2;
}

.pie3d-three-tooltip {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 4;
  box-sizing: border-box;
  min-width: 5.25rem;
  max-width: 5.75rem;
  padding: 0.3125rem 0.4375rem;
  border: 0.0625rem solid color-mix(in srgb, var(--pie-edge) 74%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pie-surface) 72%, #020814);
  color: var(--pie-text);
  font-size: 0.875rem;
  font-weight: 780;
  line-height: 1.32;
  pointer-events: none;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .pie3d-top-segment {
    transition: none;
  }
}
</style>
