<script setup lang="ts">
import { computed } from 'vue'
import Pie3D from '../charts/Pie3D.vue'
import CountUp from '../shared/CountUp.vue'
import ThreePiePedestal from '../visual/ThreePiePedestal.vue'
import { pxToRem } from '@/utils/rem'
import { usePagedList } from '@/composables/usePagedList'
import type { InspectionOrders } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: InspectionOrders
  theme?: Theme
}>()

const inspectionHeaders = ['所属科室', '设备名称', '剩余时间', '负责人']
const chartHeight = pxToRem(136)

const { viewportRef, trackRef, renderPages, trackStyle, pageStart, onFlipEnd } = usePagedList(
  computed(() => props.data.rows),
)

function themeColor(token: `--${string}`, fallback: string): string {
  return props.theme?.variables[token] ?? fallback
}

function rowIconClass(index: number): string {
  return ['is-blue', 'is-purple', 'is-red', 'is-orange', 'is-cyan'][index % 5]
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
      name: '待巡检',
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
                <tr
                  v-for="(row, rowIndex) in page"
                  :key="rowIndex"
                  :class="{ 'is-active': pageStart(pageIndex) + rowIndex === 0 }"
                >
                  <td>
                    <span class="table-cell-leading">
                      <span
                        class="table-row-icon"
                        :class="rowIconClass(pageStart(pageIndex) + rowIndex)"
                        >{{ pageStart(pageIndex) + rowIndex + 1 }}</span
                      >
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
        </div>
      </div>
    </div>

    <aside class="pie-summary-panel inspection-pie-panel" aria-label="本月巡检完成率">
      <div class="pie-summary-title">本月巡检完成率</div>
      <div class="pie-chart-shell inspection-pie-shell">
        <ThreePiePedestal
          class="inspection-pie-base"
          :color="themeColor('--instrument-base', '#33566c')"
          :accent="themeColor('--data-inspection-pie-finished', '#20e8ff')"
          :intensity="isLightTheme(theme) ? 0.72 : 0.96"
          label-deck
        />
        <Pie3D
          :items="inspectionPieItems"
          :height="chartHeight"
          :thickness="7"
          :theme="theme"
          :tone="themeColor('--data-inspection-pie-finished', '#20e8ff')"
          :accent="themeColor('--data-inspection-pie-waiting', '#7efcff')"
        />
        <div class="pie-center-value"><CountUp :value="data.rate" :decimals="1" />%</div>
      </div>
    </aside>

    <div class="module-status-summary inspection-status-summary">
      <div class="is-total">
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
