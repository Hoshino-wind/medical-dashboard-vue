<script setup lang="ts">
import { HeartPulse } from 'lucide-vue-next'
import Pie3D from './Pie3D.vue'
import ThreePiePedestal from '../visual/ThreePiePedestal.vue'
import { pxToRem } from '@/utils/rem'
import type { Theme } from '@/types/theme'

interface PieItem {
  name: string
  value: number
  color: string
}

defineProps<{
  items: PieItem[]
  total: number
  tone?: string
  theme?: Theme
}>()

const chartHeight = pxToRem(136)

function themeColor(theme: Theme | undefined, token: `--${string}`, fallback: string): string {
  return theme?.variables[token] ?? fallback
}

function isLightTheme(theme: Theme | undefined): boolean {
  return theme?.id.startsWith('light-') ?? false
}
</script>

<template>
  <div class="health-pie-chart">
    <ThreePiePedestal
      class="health-pie-base"
      :color="themeColor(theme, '--instrument-base', '#33566c')"
      :accent="tone ?? themeColor(theme, '--data-health-pie-good', '#1cf3ff')"
      :intensity="isLightTheme(theme) ? 0.72 : 0.96"
    />
    <div class="health-pie-core">
      <Pie3D
        :items="items"
        :height="chartHeight"
        :thickness="7"
        :rotation="150"
        :theme="theme"
        :tone="tone ?? themeColor(theme, '--data-health-pie-good', '#1cf3ff')"
        :accent="themeColor(theme, '--data-health-pie-warning', '#6ef5ff')"
        :surface="themeColor(theme, '--instrument-base', '#33566c')"
      />
      <div class="health-pie-heart" aria-hidden="true">
        <HeartPulse />
      </div>
    </div>
  </div>
</template>
