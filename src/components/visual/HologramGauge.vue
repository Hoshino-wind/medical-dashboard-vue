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
  }>(),
  {
    unit: '台',
    size: pxToRem(118),
    tone: 'var(--data-ring)',
    insideLabel: '',
    showFooter: true,
    large: false,
    baseDensity: undefined,
  },
)

const animated = ref(0)
let raf = 0

const ringEl = ref<HTMLDivElement | null>(null)
const ringPx = ref(0)
let ringObserver: ResizeObserver | null = null

const RING_R = 50
const CIRCUMFERENCE = 2 * Math.PI * RING_R
// 与 rings.css `.gauge-ring-progress` 的 stroke-width 保持一致（px，且使用 non-scaling-stroke）
const PROGRESS_STROKE = 10.6

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
  const ratio = Math.max(0, Math.min(100, animated.value || 0)) / 100
  if (ratio <= 0) return CIRCUMFERENCE
  // 圆头端帽会在弧两端各多出半个描边宽度；non-scaling-stroke 下端帽是固定 px，
  // 需按当前渲染尺寸换算回 viewBox 单位再从可见弧长中扣除，让弧长精确等于数值。
  const scale = ringPx.value > 0 ? ringPx.value / 120 : 1
  const capComp = PROGRESS_STROKE / scale
  const geometric = Math.max(0, ratio * CIRCUMFERENCE - capComp)
  return CIRCUMFERENCE - geometric
})

const palette = computed(() => {
  const normalized = Math.max(0, Math.min(100, props.value || 0))
  return (
    GAUGE_PALETTES.find((item) => normalized < item.max) ??
    GAUGE_PALETTES[GAUGE_PALETTES.length - 1]
  )
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
  if (ringEl.value) {
    ringPx.value = ringEl.value.clientWidth
    ringObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) ringPx.value = width
    })
    ringObserver.observe(ringEl.value)
  }
})
watch(() => props.value, run)
onUnmounted(() => {
  cancelAnimationFrame(raf)
  ringObserver?.disconnect()
})
</script>

<template>
  <div
    class="hologram-gauge"
    :class="{ 'is-large': large, 'has-inside-label': insideLabel }"
    :style="rootStyle"
  >
    <div class="hologram-gauge-stage">
      <HologramGaugeBase />

      <div ref="ringEl" class="hologram-gauge-ring">
        <svg class="hologram-gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient :id="`ring-progress-${uid}`" x1="0" y1="0" x2="1" y2="1">
              <stop class="gauge-grad-a" offset="0" />
              <stop class="gauge-grad-b" offset="0.5" />
              <stop class="gauge-grad-c" offset="0.82" />
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
