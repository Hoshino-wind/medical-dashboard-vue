<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import ThreeHologramBase from './ThreeHologramBase.vue'

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
    size: '118px',
    tone: 'var(--accent)',
    insideLabel: '',
    showFooter: true,
    large: false,
    baseDensity: undefined,
  },
)

const animated = ref(0)
let raf = 0

const rootStyle = computed(() => ({
  '--gauge-size': props.size,
  '--gauge-value': animated.value,
  '--gauge-tone': props.tone,
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
    <!-- 第 1 层：Three.js 底座，全息发光圆盘 -->
    <ThreeHologramBase
      class="hologram-gauge-base"
      :tone="tone"
      :density="baseDensity ?? (large ? 1.2 : 1)"
    />

    <!-- 第 2 层：CSS 动态进度环 -->
    <div class="hologram-gauge-ring">
      <span class="hologram-gauge-ring-track"></span>
      <span class="hologram-gauge-ring-progress"></span>
    </div>

    <!-- 第 3 层：Vue 文本，便于真实数据接入和国际化 -->
    <div class="hologram-gauge-content">
      <div v-if="insideLabel" class="hologram-gauge-label">{{ insideLabel }}</div>
      <div class="hologram-gauge-value">{{ displayValue(animated) }}%</div>
    </div>

    <!-- 第 4 层：前景高光，增强玻璃/扫描质感 -->
    <div class="hologram-gauge-gloss" aria-hidden="true"></div>

    <div v-if="showFooter" class="hologram-gauge-footer">
      <div class="hologram-gauge-title">{{ label }}</div>
      <div class="hologram-gauge-count">
        {{ count }}<span>{{ unit }}</span>
      </div>
    </div>
  </div>
</template>
