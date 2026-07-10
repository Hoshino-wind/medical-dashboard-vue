<script setup lang="ts">
import { computed } from 'vue'
import Pie3D from '../charts/Pie3D.vue'
import CountUp from '../shared/CountUp.vue'
import ThreePiePedestal from '../visual/ThreePiePedestal.vue'
import { pxToRem } from '@/utils/rem'
import { usePagedList } from '@/composables/usePagedList'
import type { InspectionOrders, OrderCompletionVariant } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = withDefaults(
  defineProps<{
    data: InspectionOrders
    theme?: Theme
    variant?: OrderCompletionVariant
  }>(),
  {
    variant: 'inspection',
  },
)

const inspectionHeaders = ['所属科室', '设备名称', '剩余时间', '负责人']
const chartHeight = pxToRem(136)
const copy = computed(() =>
  props.variant === 'maintenance'
    ? { rate: '本月保养完成率', waiting: '待保养' }
    : { rate: '本月巡检完成率', waiting: '待巡检' },
)

const { viewportRef, trackRef, renderPages, trackStyle, onFlipEnd } = usePagedList(
  computed(() => props.data.rows),
)

function themeColor(token: `--${string}`, fallback: string): string {
  return props.theme?.variables[token] ?? fallback
}

function isLightTheme(theme: Theme | undefined): boolean {
  return theme?.id.startsWith('light-') ?? false
}

const inspectionPieItems = computed(() => {
  return [
    {
      name: '已完成',
      value: props.data.finished,
      color: themeColor('--data-inspection-pie-finished', '#20e8ff'),
    },
    {
      name: copy.value.waiting,
      value: props.data.waiting,
      color: themeColor('--data-inspection-pie-waiting', '#7efcff'),
    },
    {
      name: '逾期未检',
      value: props.data.overdue,
      color: themeColor('--data-inspection-pie-overdue', '#ff5a92'),
    },
  ]
})
</script>

<template>
  <div class="inspection-order-grid">
    <div class="order-list-panel">
      <table class="data-table compact-order-table inspection-order-table paged-head-table">
        <thead>
          <tr>
            <th v-for="header in inspectionHeaders" :key="header">{{ header }}</th>
          </tr>
        </thead>
      </table>
      <div ref="viewportRef" class="paged-viewport">
        <div ref="trackRef" class="paged-track" :style="trackStyle" @transitionend="onFlipEnd">
          <div v-for="(page, pageIndex) in renderPages" :key="pageIndex" class="paged-page">
            <table class="data-table compact-order-table inspection-order-table">
              <tbody>
                <tr v-for="(row, rowIndex) in page" :key="rowIndex">
                  <td>{{ row[0] }}</td>
                  <td>{{ row[1] }}</td>
                  <td class="order-time-cell">{{ row[2] }}</td>
                  <td>{{ row[3] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <aside class="pie-summary-panel inspection-pie-panel" :aria-label="copy.rate">
      <div class="pie-summary-title">{{ copy.rate }}</div>
      <div class="pie-chart-shell inspection-pie-shell">
        <ThreePiePedestal
          class="inspection-pie-base"
          :color="themeColor('--instrument-base', '#33566c')"
          :accent="themeColor('--data-inspection-pie-finished', '#20e8ff')"
          :intensity="isLightTheme(theme) ? 0.72 : 0.96"
        />
        <Pie3D
          :auto-rotate="true"
          :items="inspectionPieItems"
          :height="chartHeight"
          :thickness="7"
          :rotation="150"
          :theme="theme"
          :tone="themeColor('--data-inspection-pie-finished', '#20e8ff')"
          :accent="themeColor('--data-inspection-pie-waiting', '#7efcff')"
        />
        <div class="pie-center-value"><CountUp :value="data.rate" :decimals="1" />%</div>
      </div>
    </aside>

    <div class="module-status-summary inspection-status-summary">
      <div class="module-status-metric is-total">
        <span>总数</span><b><CountUp :value="data.total" /></b><em>单</em>
      </div>
      <div class="module-status-metric is-good">
        <span>已完成</span><b><CountUp :value="data.finished" /></b><em>单</em>
      </div>
      <div class="module-status-metric is-purple">
        <span>{{ copy.waiting }}</span><b><CountUp :value="data.waiting" /></b><em>单</em>
      </div>
    </div>
  </div>
</template>
