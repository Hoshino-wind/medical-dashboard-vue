<script setup lang="ts">
import { computed } from 'vue'
import CountUp from '../shared/CountUp.vue'
import HealthPieChart from '../charts/HealthPieChart.vue'
import type { HealthTrendData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: HealthTrendData
  theme: Theme
}>()

const healthHeaders = ['设备范围', '健康状态', '数量', '处置建议']

// 同色系明度分层：以主题亮蓝为基准派生蓝青梯度，取代原先绿/黄/红/紫多色相拼盘
function shade(hex: string, amount: number): string {
  const value = hex.trim().replace('#', '')
  const full = value.length === 3 ? value.replace(/(.)/g, '$1$1') : value
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  const target = amount >= 0 ? 255 : 0
  const k = Math.min(1, Math.abs(amount))
  const mix = (channel: number) => Math.round(channel + (target - channel) * k)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

const pieItems = computed(() => {
  const base = props.theme.variables['--accent-2']
  return [
    { name: '运行正常', value: props.data.online, color: shade(base, 0.34) },
    { name: '维保预警', value: props.data.warning, color: base },
    { name: '维修中', value: props.data.repairing, color: shade(base, -0.42) },
    { name: '即将保养', value: props.data.pending, color: shade(base, -0.2) },
  ]
})

const pieTotal = computed(
  () => props.data.online + props.data.warning + props.data.repairing + props.data.pending,
)

function rowIconClass(index: number): string {
  return ['is-blue', 'is-orange', 'is-red', 'is-purple'][index % 4]
}
</script>

<template>
  <div class="health-status-grid">
    <div class="order-list-panel health-status-list">
      <table class="data-table compact-order-table health-status-table">
        <thead>
          <tr>
            <th v-for="header in healthHeaders" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in data.rows" :key="`${row[0]}-${row[1]}-${index}`" :class="{ 'is-active': index === 0 }">
            <td>
              <span class="table-cell-leading">
                <span class="table-row-icon" :class="rowIconClass(index)">{{ index + 1 }}</span>
                <span>{{ row[0] }}</span>
              </span>
            </td>
            <td>{{ row[1] }}</td>
            <td class="order-time-cell">{{ row[2] }}</td>
            <td>{{ row[3] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <aside class="pie-summary-panel health-pie-panel" aria-label="设备健康态势">
      <div class="pie-summary-title">设备健康态势</div>
      <HealthPieChart
        :items="pieItems"
        :total="pieTotal"
        :tone="theme.variables['--accent']"
        :theme="theme"
      />
    </aside>

    <div class="module-status-summary health-status-summary">
      <div class="is-good">
        <span>运行正常</span><b><CountUp :value="data.online" /></b><em>台</em>
      </div>
      <div class="is-warn">
        <span>维保预警</span><b><CountUp :value="data.warning" /></b><em>台</em>
      </div>
      <div class="is-danger">
        <span>维修中</span><b><CountUp :value="data.repairing" /></b><em>台</em>
      </div>
      <div class="is-purple">
        <span>即将保养</span><b><CountUp :value="data.pending" /></b><em>台</em>
      </div>
    </div>
  </div>
</template>
