<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, type CSSProperties } from 'vue'
import EChart from './EChart.vue'
import type { CartesianChartData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'
import { normalizeCartesianChartData } from '@/utils/chartData'
import { useChartTheme } from '@/composables/useChartTheme'
import { pxToRem } from '@/utils/rem'
import { colorWithAlpha } from '@/utils/themeColor'
import { BAR_ANIMATION_DURATION } from './cubeBarGeometry'
import { buildCubeBarOption, type SeriesTone } from './cubeBarOption'
import { registerCubeBarShapes } from './cubeBarShapes'

interface LegendItem {
  name: string
  tone: SeriesTone
  textStyle: CSSProperties
  swatchStyle: CSSProperties
}

registerCubeBarShapes()

const props = withDefaults(
  defineProps<{
    data: CartesianChartData
    theme: Theme
    seriesName?: string
  }>(),
  {
    seriesName: '数量',
  },
)

const normalizedData = computed(() => normalizeCartesianChartData(props.data, props.seriesName))

const animationProgress = ref(0)
let animationFrame = 0

const { token, isLight: isLightTheme } = useChartTheme(() => props.theme)

// 柱状图 3 系列使用独立的柱色(与语义状态色解耦),每套主题各不相同以增强区分度
const seriesTonePalette = computed<SeriesTone[]>(() => [
  { base: token('--data-bar'), accent: token('--data-bar-secondary') },
  { base: token('--data-bar-2'), accent: token('--data-bar-2') },
  { base: token('--data-bar-3'), accent: token('--data-bar-3') },
])

const legendItems = computed<LegendItem[]>(() => {
  const palette = seriesTonePalette.value

  return normalizedData.value.series.map((item, index) => {
    const tone = palette[index % palette.length]

    return {
      name: item.name,
      tone,
      textStyle: {
        color: colorWithAlpha(tone.base, 0.96),
      },
      swatchStyle: {
        color: colorWithAlpha(tone.base, 0.96),
        background: `linear-gradient(135deg, ${colorWithAlpha(tone.accent, 0.88)}, ${colorWithAlpha(tone.base, 0.46)})`,
        boxShadow: `0 0 ${pxToRem(8)} ${colorWithAlpha(tone.base, 0.3)}`,
      },
    }
  })
})

function runColumnAnimation() {
  cancelAnimationFrame(animationFrame)
  animationProgress.value = 0
  let start: number | null = null

  const step = (timestamp: number) => {
    if (start === null) start = timestamp
    const progress = Math.min(1, (timestamp - start) / BAR_ANIMATION_DURATION)
    animationProgress.value = progress
    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    }
  }

  animationFrame = requestAnimationFrame(step)
}

onMounted(runColumnAnimation)
watch(() => props.data, runColumnAnimation, { deep: true })
onUnmounted(() => cancelAnimationFrame(animationFrame))

const option = computed(() =>
  buildCubeBarOption({
    data: normalizedData.value,
    animationProgress: animationProgress.value,
    token,
    isLight: isLightTheme(),
    seriesTones: legendItems.value.map((item) => item.tone),
    fallbackTones: seriesTonePalette.value,
  }),
)
</script>

<template>
  <div class="cube-bar-chart">
    <div class="cube-bar-legend" aria-hidden="true">
      <span v-for="item in legendItems" :key="item.name" :style="item.textStyle">
        <i :style="item.swatchStyle"></i>{{ item.name }}
      </span>
    </div>
    <EChart class="chart-bar" :option="option" height="100%" />
  </div>
</template>

<style scoped src="./CubeBarChart.css"></style>
