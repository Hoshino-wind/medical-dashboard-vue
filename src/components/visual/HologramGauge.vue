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

const RING_R = 50
const CIRCUMFERENCE = 2 * Math.PI * RING_R

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

const strokeDashoffset = computed(() => CIRCUMFERENCE * (1 - (animated.value || 0) / 100))

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

onMounted(run)
watch(() => props.value, run)
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <div
    class="hologram-gauge"
    :class="{ 'is-large': large, 'has-inside-label': insideLabel }"
    :style="rootStyle"
  >
    <div class="hologram-gauge-stage">
      <HologramGaugeBase />

      <div class="hologram-gauge-ring">
        <svg class="hologram-gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient :id="`ring-progress-${uid}`" x1="0" y1="0" x2="1" y2="1">
              <stop class="gauge-grad-a" offset="0" />
              <stop class="gauge-grad-b" offset="0.36" />
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
