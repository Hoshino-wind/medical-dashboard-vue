<script setup lang="ts">
import { computed } from 'vue'
import Pie3D from '../charts/Pie3D.vue'
import CountUp from '../shared/CountUp.vue'
import { pxToRem } from '@/utils/rem'
import type { InspectionOrders } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: InspectionOrders
  theme?: Theme
}>()

const inspectionHeaders = ['所属科室', '设备名称', '剩余时间', '负责人']
const chartHeight = pxToRem(136)

function themeColor(token: `--${string}`, fallback: string): string {
  return props.theme?.variables[token] ?? fallback
}

function rowIconClass(index: number): string {
  return ['is-blue', 'is-purple', 'is-red', 'is-orange', 'is-cyan'][index % 5]
}

// 同色系明度分层：以主题亮蓝为基准派生蓝青梯度，取代信号色大面积填充带来的廉价感
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

const inspectionPieItems = computed(() => {
  const base = themeColor('--accent-2', '#1a9bff')
  return [
    { name: '已完成', value: props.data.finished, color: shade(base, 0.34) },
    { name: '待巡检', value: props.data.waiting, color: base },
    { name: '逾期未检', value: props.data.overdue, color: shade(base, -0.42) },
  ]
})

</script>

<template>
  <div class="inspection-order-grid">
    <div class="order-list-panel">
      <table class="data-table compact-order-table inspection-order-table">
        <thead>
          <tr>
            <th v-for="header in inspectionHeaders" :key="header">{{ header }}</th>
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

    <aside class="pie-summary-panel inspection-pie-panel" aria-label="本月巡检完成率">
      <div class="pie-summary-title">本月巡检完成率</div>
      <div class="pie-chart-shell inspection-pie-shell">
        <Pie3D
          :items="inspectionPieItems"
          :height="chartHeight"
          :thickness="7"
          :theme="theme"
          :tone="themeColor('--accent', '#000000')"
        />
        <div class="pie-center-value"><CountUp :value="data.rate" :decimals="1" />%</div>
      </div>
    </aside>

    <div class="module-status-summary inspection-status-summary">
      <div>
        <span>总数</span><b><CountUp :value="data.total" /></b><em>单</em>
      </div>
      <div class="is-good">
        <span>已完成</span><b><CountUp :value="data.finished" /></b><em>单</em>
      </div>
      <div class="is-purple">
        <span>待巡检</span><b><CountUp :value="data.waiting" /></b><em>单</em>
      </div>
      <div class="is-warn">
        <span>逾期未检</span><b><CountUp :value="data.overdue" /></b><em>单</em>
      </div>
    </div>
  </div>
</template>
