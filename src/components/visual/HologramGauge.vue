<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { pxToRem } from '@/utils/rem'
import HologramGaugeBase from './HologramGaugeBase.vue'

const props = withDefaults(
  defineProps<{
    value: number
    label?: string
    count?: string | number
    unit?: string
    size?: string
    tone?: string
    insideLabel?: string
    showFooter?: boolean
    large?: boolean
    baseDensity?: number
    baseSpeed?: number
    baseDirection?: 'clockwise' | 'counter-clockwise'
    baseIntensity?: number
    colorMode?: 'solid' | 'gradient'
  }>(),
  {
    unit: '台',
    size: pxToRem(118),
    insideLabel: '',
    showFooter: true,
    large: false,
    baseDensity: undefined,
    baseSpeed: 6.4,
    baseDirection: 'clockwise',
    baseIntensity: 1,
    colorMode: 'solid',
  },
)

const animated = ref(0)
let raf = 0

const RING_R = 50
const CIRCUMFERENCE = 2 * Math.PI * RING_R
// 需与 rings.css 中 .gauge-ring-progress 的 stroke-width 保持一致
const PROGRESS_STROKE_WIDTH = 10.6
const FULL_RING_THRESHOLD = 99.5

interface GaugePalette {
  tone: string
  toneSoft: string
  toneBright: string
  track: string
}

const GAUGE_PALETTES = [
  {
    max: 30,
    tone: '#e65b73',
    toneSoft: '#f18a9b',
    toneBright: '#ffd6dd',
    track: '#dfe8ec',
  },
  {
    max: 60,
    tone: '#f2b84b',
    toneSoft: '#f7cb74',
    toneBright: '#ffefc9',
    track: '#dfe8ec',
  },
  {
    max: 80,
    tone: '#e6b94a',
    toneSoft: '#f0d27e',
    toneBright: '#fff1c8',
    track: '#dfe8ec',
  },
  {
    max: 95,
    tone: '#24c78e',
    toneSoft: '#7ee1bd',
    toneBright: '#d8f6eb',
    track: '#dfe8ec',
  },
  {
    max: Number.POSITIVE_INFINITY,
    tone: '#24c78e',
    toneSoft: '#8de6c6',
    toneBright: '#ddf5f8',
    track: '#dfe8ec',
  },
] satisfies Array<GaugePalette & { max: number }>

// 每个实例唯一 id，避免多仪表盘共存时 SVG <defs> id 冲突
const uid = `gg-${Math.random().toString(36).slice(2, 8)}`

const strokeDashoffset = computed(() => {
  const normalized = Math.max(0, Math.min(100, animated.value || 0))
  if (normalized >= FULL_RING_THRESHOLD) return 0
  // stroke-linecap: round 让进度弧两端各延伸 strokeWidth/2，
  // 需在 offset 上补回 strokeWidth，否则视觉进度会比百分比偏大约 strokeWidth/CIRCUMFERENCE
  // 用 Math.min 钳制，避免极小值（<3.4%）时 offset 超过周长导致 dash 循环、错误显示一段弧
  return Math.min(
    CIRCUMFERENCE,
    CIRCUMFERENCE * (1 - normalized / 100) + PROGRESS_STROKE_WIDTH,
  )
})

const isComplete = computed(() => Math.max(0, Math.min(100, animated.value || 0)) >= FULL_RING_THRESHOLD)

const thresholdPalette = computed(() => {
  const normalized = Math.max(0, Math.min(100, props.value || 0))
  return (
    GAUGE_PALETTES.find((item) => normalized < item.max) ??
    GAUGE_PALETTES[GAUGE_PALETTES.length - 1]
  )
})

const palette = computed<GaugePalette>(() => {
  if (!props.tone) return thresholdPalette.value

  return {
    tone: props.tone,
    toneSoft: `color-mix(in srgb, ${props.tone} 80%, #ffffff 20%)`,
    toneBright: `color-mix(in srgb, ${props.tone} 52%, #ffffff 48%)`,
    track: thresholdPalette.value.track,
  }
})

const rootStyle = computed(() => ({
  '--gauge-size': props.size,
  '--gauge-value': animated.value,
  '--gauge-tone': palette.value.tone,
  '--gauge-tone-soft': palette.value.toneSoft,
  '--gauge-tone-bright': palette.value.toneBright,
  '--gauge-track-tone': palette.value.track,
  '--gauge-base-density': props.baseDensity ?? (props.large ? 1.12 : 0.92),
}))

function run() {
  cancelAnimationFrame(raf)
  const target = props.value || 0
  let start: number | null = null
  const step = (ts: number) => {
    if (start === null) start = ts
    const progress = Math.min(1, (ts - start) / 1200)
    const eased = 1 - Math.pow(1 - progress, 3)
    animated.value = target * eased
    if (progress < 1) raf = requestAnimationFrame(step)
    else animated.value = target
  }
  raf = requestAnimationFrame(step)
}

function displayValue(value: number): string {
  return Number.isInteger(props.value) ? Math.round(value).toString() : value.toFixed(1)
}

onMounted(() => {
  run()
})
watch(() => props.value, run)
onUnmounted(() => {
  cancelAnimationFrame(raf)
})
</script>

<template>
  <div
    class="hologram-gauge"
    :class="[
      `ring-${colorMode}`,
      { 'is-large': large, 'has-inside-label': insideLabel, 'is-complete': isComplete },
    ]"
    :style="rootStyle"
  >
    <div class="hologram-gauge-stage">
      <HologramGaugeBase
        :speed="baseSpeed"
        :direction="baseDirection"
        :intensity="baseIntensity"
      />

      <div class="hologram-gauge-ring">
        <svg class="hologram-gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient :id="`ring-progress-${uid}`" x1="0" y1="0" x2="1" y2="1">
              <stop class="gauge-grad-a" offset="0" />
              <stop class="gauge-grad-b" offset="0.42" />
              <stop class="gauge-grad-c" offset="0.72" />
              <stop class="gauge-grad-d" offset="1" />
            </linearGradient>
          </defs>
          <circle class="gauge-ring-track" cx="60" cy="60" :r="RING_R" />
          <circle
            class="gauge-ring-progress"
            cx="60"
            cy="60"
            :r="RING_R"
            :stroke="`url(#ring-progress-${uid})`"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 60 60)"
          />
        </svg>
      </div>

      <div class="hologram-gauge-content">
        <div v-if="insideLabel" class="hologram-gauge-label">{{ insideLabel }}</div>
        <div class="hologram-gauge-value">{{ displayValue(animated) }}%</div>
      </div>
    </div>

    <div v-if="showFooter" class="hologram-gauge-footer">
      <div class="hologram-gauge-title">{{ label }}</div>
      <div class="hologram-gauge-count">
        {{ count }}<span>{{ unit }}</span>
      </div>
    </div>
  </div>
</template>
