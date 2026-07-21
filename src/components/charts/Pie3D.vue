<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue'
import { buildPie3DSegments, type Pie3DInputItem, type Pie3DSegment } from '@/utils/pie3dSegments'
import { pxToRem } from '@/utils/rem'
import type { Theme } from '@/types/theme'
import {
  BASE_START_ANGLE,
  CENTER_X,
  CENTER_Y,
  DEPTH_STEP,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  buildBottomRimPath,
  buildCenterCapPath,
  buildDepthLayers,
  buildFrontWalls,
  buildInnerRimPath,
  buildRenderedSegments,
} from './pie3dGeometry'
import { usePie3DInteraction } from './usePie3DInteraction'

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

const host = ref<HTMLDivElement | null>(null)
const rotationOffset = ref(0)
const componentUid = getCurrentInstance()?.uid ?? 0
const filterId = `pie3d-ambient-shadow-${componentUid}`
const isLightTheme = () => props.theme?.mode === 'light'

const total = computed(() =>
  props.items.reduce(
    (sum, item) => (Number.isFinite(item.value) && item.value > 0 ? sum + item.value : sum),
    0,
  ),
)

const startAngle = computed(
  () => BASE_START_ANGLE + ((props.rotation + rotationOffset.value) * Math.PI) / 180,
)

const shellStyle = computed(() => ({
  height: props.height,
  '--pie-tone':
    props.tone ?? props.theme?.variables['--data-pie-primary'] ?? 'var(--data-pie-primary)',
  '--pie-accent':
    props.accent ?? props.theme?.variables['--data-pie-pending'] ?? 'var(--data-pie-pending)',
  '--pie-surface':
    props.surface ?? props.theme?.variables['--instrument-base'] ?? 'var(--instrument-base)',
  '--pie-edge': props.theme?.variables['--glass-edge'] ?? 'var(--glass-edge)',
  '--pie-text': props.text ?? props.theme?.variables['--text'] ?? 'var(--text)',
}))

const depthLayerCount = computed(() => Math.max(4, Math.min(8, Math.round(props.thickness))))
const depthLayers = computed(() => buildDepthLayers(depthLayerCount.value, isLightTheme()))
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
const renderedSegments = computed(() =>
  buildRenderedSegments(rawSegments.value, startAngle.value, props.theme),
)
const chartLabel = computed(() =>
  renderedSegments.value.map((segment) => `${segment.name} ${segment.value}`).join('，'),
)
const totalDepth = computed(() => depthLayerCount.value * DEPTH_STEP)
const centerCapPath = buildCenterCapPath()
const innerRimPath = buildInnerRimPath()
const frontWallSegments = computed(() =>
  buildFrontWalls(renderedSegments.value, totalDepth.value, isLightTheme()),
)
const bottomRimPath = computed(() => buildBottomRimPath(totalDepth.value))

const {
  activeSegmentIndex,
  hideTooltip,
  isInteracting,
  moveTooltip,
  showKeyboardTooltip,
  showTooltip,
  tooltip,
  tooltipStyle,
} = usePie3DInteraction({
  host,
  total,
  rotationOffset,
  autoRotate: () => props.autoRotate,
})
</script>

<template>
  <div
    ref="host"
    class="pie3d-three-shell pie3d-25d-shell"
    :style="shellStyle"
    @pointerenter="isInteracting = true"
    @pointerleave="hideTooltip"
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

      <!-- 连续底部外缘弧线：弥补扇区间隙导致的边界线缺失 -->
      <path class="pie3d-bottom-rim" :d="bottomRimPath" />

      <g class="pie3d-top-stack" :filter="`url(#${filterId})`">
        <path
          v-for="segment in renderedSegments"
          :key="segment.index"
          class="pie3d-top-segment"
          :class="{ 'is-active': activeSegmentIndex === segment.index }"
          :d="segment.path"
          :fill="segment.topColor"
          :stroke="segment.strokeColor"
          stroke-width="1.15"
          :style="{ opacity: isLightTheme() ? 0.76 : 1 }"
          tabindex="0"
          :data-segment-name="segment.name"
          @pointerenter="showTooltip(segment, $event)"
          @pointermove="moveTooltip"
          @focus="showKeyboardTooltip(segment)"
          @blur="hideTooltip"
        />
      </g>

      <path class="pie3d-center-cap" :d="centerCapPath" />
      <path class="pie3d-inner-rim" :d="innerRimPath" />
    </svg>

    <div v-if="tooltip.visible" class="pie3d-three-tooltip" :style="tooltipStyle">
      <div>{{ tooltip.name }}：{{ tooltip.value }}</div>
      <div>占比：{{ tooltip.percent }}%</div>
    </div>
  </div>
</template>

<style scoped src="./Pie3D.css"></style>
