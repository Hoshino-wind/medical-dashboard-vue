<script setup lang="ts">
import CountUp from '../CountUp.vue'
import Pie3D from '../Pie3D.vue'
import ThreeHologramBase from '../visual/ThreeHologramBase.vue'

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
    <ThreeHologramBase class="health-pie-base" :tone="tone ?? 'var(--accent)'" :density="1.2" />
    <div class="health-pie-core">
      <Pie3D :items="items" height="174px" />
    </div>
    <div class="pie3d-caption">待处理 <b><CountUp :value="total" /></b> 台</div>
  </div>
</template>
