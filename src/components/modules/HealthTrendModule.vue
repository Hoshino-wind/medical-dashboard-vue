<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, BadgeCheck, Wrench } from 'lucide-vue-next'
import CountUp from '../shared/CountUp.vue'
import HealthPieChart from '../charts/HealthPieChart.vue'
import type { HealthTrendData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: HealthTrendData
  theme: Theme
}>()

// 待处理设备构成 → echarts-gl 真 3D 饼图（运行正常量级过大不适合入饼，仅取三类异常/待办）
const pieItems = computed(() => [
  { name: '维保预警', value: props.data.warning, color: props.theme.variables['--warn'] },
  { name: '维修中', value: props.data.repairing, color: props.theme.variables['--danger'] },
  { name: '即将保养', value: props.data.pending, color: props.theme.variables['--accent-3'] },
])

const pieTotal = computed(() => props.data.warning + props.data.repairing + props.data.pending)
</script>

<template>
  <div class="health-layout">
    <div class="health-side">
      <div class="kpi-card flex items-center gap-3">
        <BadgeCheck class="h-5 w-5 text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">运行正常</div>
          <div class="text-xl font-black text-[color:var(--good)]">
            <CountUp :value="data.online" /><span class="ml-1 text-xs">台</span>
          </div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">维保预警</div>
          <div class="text-xl font-black text-[color:var(--warn)]">
            <CountUp :value="data.warning" /><span class="ml-1 text-xs">台</span>
          </div>
        </div>
      </div>
    </div>

    <div class="health-stage">
      <HealthPieChart :items="pieItems" :total="pieTotal" :tone="theme.variables['--accent']" />
    </div>

    <div class="health-side">
      <div class="kpi-card flex items-center gap-3">
        <Wrench class="h-5 w-5 text-[color:var(--danger)]" />
        <div>
          <div class="kpi-label">维修中</div>
          <div class="text-xl font-black text-[color:var(--danger)]">
            <CountUp :value="data.repairing" /><span class="ml-1 text-xs">台</span>
          </div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 text-[color:var(--accent-3)]" />
        <div>
          <div class="kpi-label">即将保养</div>
          <div class="text-xl font-black text-[color:var(--accent-3)]">
            <CountUp :value="data.pending" /><span class="ml-1 text-xs">台</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
