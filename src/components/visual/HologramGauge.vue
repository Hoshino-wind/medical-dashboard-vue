<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { pxToRem } from '@/utils/rem'

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
    tone: 'var(--accent)',
    insideLabel: '',
    showFooter: true,
    large: false,
    baseDensity: undefined,
  },
)

const animated = ref(0)
let raf = 0

// SVG 环形水管常量：viewBox 120×120，环半径 50，描边通过 CSS 控制管壁厚度。
const TUBE_R = 50
const CIRCUMFERENCE = 2 * Math.PI * TUBE_R
const WATER_HIGHLIGHT_R = 46.2
const WATER_HIGHLIGHT_CIRCUMFERENCE = 2 * Math.PI * WATER_HIGHLIGHT_R

// 每个实例唯一 id，避免多仪表盘共存时 SVG <defs> id 冲突
const uid = `gg-${Math.random().toString(36).slice(2, 8)}`

const strokeDashoffset = computed(
  () => CIRCUMFERENCE * (1 - (animated.value || 0) / 100),
)

const rootStyle = computed(() => ({
  '--gauge-size': props.size,
  '--gauge-value': animated.value,
  '--gauge-tone': props.tone,
  '--gauge-base-density': props.baseDensity ?? (props.large ? 1.2 : 1),
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
  <div class="hologram-gauge" :class="{ 'is-large': large }" :style="rootStyle">
    <div class="hologram-gauge-stage">
      <div class="hologram-gauge-base" aria-hidden="true">
        <span class="hologram-base-orbit orbit-a"></span>
        <span class="hologram-base-orbit orbit-b"></span>
        <span class="hologram-base-orbit orbit-c"></span>
        <span class="hologram-base-core"></span>
      </div>
      <div class="hologram-gauge-beam" aria-hidden="true"></div>

      <!-- 第 2 层：SVG 环形水管进度（矢量描边，无外发光） -->
      <div class="hologram-gauge-ring">
        <svg class="hologram-gauge-svg" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient :id="`pipe-shell-${uid}`" x1="0" y1="0" x2="0" y2="1">
              <stop class="gauge-shell-a" offset="0" />
              <stop class="gauge-shell-b" offset="0.42" />
              <stop class="gauge-shell-c" offset="1" />
            </linearGradient>
            <linearGradient :id="`tube-${uid}`" x1="0" y1="0" x2="1" y2="1">
              <stop class="gauge-grad-a" offset="0" />
              <stop class="gauge-grad-b" offset="0.55" />
              <stop class="gauge-grad-c" offset="1" />
            </linearGradient>
            <linearGradient :id="`tube-depth-${uid}`" x1="0" y1="0" x2="0" y2="1">
              <stop class="gauge-depth-a" offset="0" />
              <stop class="gauge-depth-b" offset="1" />
            </linearGradient>
          </defs>

          <!-- 下沿厚度层：制造管壁纵深，不做外发光 -->
          <circle class="gauge-tube-depth" cx="60" cy="62.5" :r="TUBE_R" />
          <circle
            class="gauge-water-depth"
            cx="60"
            cy="62.5"
            :r="TUBE_R"
            :stroke="`url(#tube-depth-${uid})`"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 60 60)"
          />
          <!-- 透明管壁 -->
          <circle
            class="gauge-tube-shell"
            cx="60"
            cy="60"
            :r="TUBE_R"
            :stroke="`url(#pipe-shell-${uid})`"
          />
          <!-- 空管底色 -->
          <circle class="gauge-tube-track" cx="60" cy="60" :r="TUBE_R" />
          <!-- 管内水色进度（从顶部 12 点起，顺时针填充） -->
          <circle
            class="gauge-tube-progress"
            cx="60"
            cy="60"
            :r="TUBE_R"
            :stroke="`url(#tube-${uid})`"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="strokeDashoffset"
            transform="rotate(-90 60 60)"
          />
          <!-- 管内边缘高光，不放在管道中线 -->
          <circle
            class="gauge-water-highlight"
            cx="60"
            cy="60"
            :r="WATER_HIGHLIGHT_R"
            :stroke-dasharray="WATER_HIGHLIGHT_CIRCUMFERENCE"
            :stroke-dashoffset="WATER_HIGHLIGHT_CIRCUMFERENCE * (1 - (animated || 0) / 100)"
            transform="rotate(-90 60 60)"
          />
          <circle class="gauge-tube-outer-edge" cx="60" cy="60" r="58.4" />
          <circle class="gauge-tube-inner-edge" cx="60" cy="60" r="41.6" />
          <circle
            class="gauge-glass-top-highlight"
            cx="60"
            cy="60"
            r="53.6"
            pathLength="100"
            stroke-dasharray="30 70"
            stroke-dashoffset="5"
            transform="rotate(-34 60 60)"
          />
          <circle
            class="gauge-glass-bottom-shade"
            cx="60"
            cy="60"
            r="52.8"
            pathLength="100"
            stroke-dasharray="34 66"
            stroke-dashoffset="-43"
            transform="rotate(12 60 60)"
          />
        </svg>
      </div>

      <!-- 第 3 层：Vue 文本，便于真实数据接入和国际化 -->
      <div class="hologram-gauge-content">
        <div v-if="insideLabel" class="hologram-gauge-label">{{ insideLabel }}</div>
        <div class="hologram-gauge-value">{{ displayValue(animated) }}%</div>
      </div>

      <!-- 第 4 层：前景高光，增强玻璃/扫描质感 -->
      <div class="hologram-gauge-gloss" aria-hidden="true"></div>
    </div>

    <div v-if="showFooter" class="hologram-gauge-footer">
      <div class="hologram-gauge-title">{{ label }}</div>
      <div class="hologram-gauge-count">
        {{ count }}<span>{{ unit }}</span>
      </div>
    </div>
  </div>
</template>
