<script setup lang="ts">
import CountUp from '../shared/CountUp.vue'
import Pie3D from './Pie3D.vue'
import ThreePiePedestal from '../visual/ThreePiePedestal.vue'

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
      <Pie3D :items="items" height="140px" />
    </div>
    <div class="pie3d-caption">待处理 <b><CountUp :value="total" /></b> 台</div>
  </div>
</template>
