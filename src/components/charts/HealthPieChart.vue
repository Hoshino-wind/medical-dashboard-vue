<script setup lang="ts">
import { HeartPulse } from 'lucide-vue-next'
import Pie3D from './Pie3D.vue'
import ThreePiePedestal from '../visual/ThreePiePedestal.vue'
import { pxToRem } from '@/utils/rem'

interface PieItem {
  name: string
  value: number
  color: string
}

defineProps<{
  items: PieItem[]
  total: number
  tone?: string
}>()

const chartHeight = pxToRem(166)
</script>

<template>
  <div class="health-pie-chart">
    <ThreePiePedestal
      class="health-pie-base"
      :color="tone ?? 'var(--accent)'"
      accent="var(--accent-2)"
      :intensity="1.16"
    />
    <div class="health-pie-core">
      <Pie3D :items="items" :height="chartHeight" />
    </div>
    <div class="health-pie-heart" aria-hidden="true">
      <HeartPulse />
    </div>
  </div>
</template>
