<script setup lang="ts">
import { computed } from 'vue'
import Pie3D from '../charts/Pie3D.vue'
import CountUp from '../shared/CountUp.vue'
import HologramGaugeBase from '../visual/HologramGaugeBase.vue'
import MechanicalFrame from '../visual/MechanicalFrame.vue'
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

const { viewportRef, trackRef, renderPages, trackStyle, onFlipEnd } = usePagedList(
  computed(() => props.data.rows),
)

function themeColor(token: `--${string}`, fallback: string): string {
  return props.theme?.variables[token] ?? fallback
}

function isLightTheme(theme: Theme | undefined): boolean {
  return theme?.id.startsWith('light-') ?? false
}

// 完成率进度环:亮弧 = 本月保养完成率(data.rate = 已完成÷总数),其余为暗色空轨道。
// 与中心百分比同源(data.rate),保证「环的填充比例」与「中心数字」严格一致。
const inspectionPieItems = computed(() => {
  const rate = Math.min(100, Math.max(0, props.data.rate))
  return [
    {
      name: '已完成',
      value: rate,
      color: themeColor('--data-inspection-pie-finished', '#20e8ff'),
    },
    {
      name: '未完成',
      value: 100 - rate,
      color: themeColor('--instrument-base', '#33566c'),
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

    <aside class="pie-summary-panel inspection-pie-panel" aria-label="本月保养完成率">
      <div class="pie-summary-title">本月保养完成率</div>
      <div class="pie-chart-shell inspection-pie-shell">
        <HologramGaugeBase
          class="inspection-pie-base"
          :tone="themeColor('--data-inspection-pie-finished', '#20e8ff')"
          :intensity="isLightTheme(theme) ? 0.72 : 0.96"
          :speed="7.2"
          direction="clockwise"
        />
        <Pie3D
          :items="inspectionPieItems"
          auto-rotate
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
      <div class="is-total mechanical-frame-host">
        <MechanicalFrame variant="compact" />
        <span>总数</span><b><CountUp :value="data.total" /></b><em>单</em>
      </div>
      <div class="is-good mechanical-frame-host">
        <MechanicalFrame variant="compact" />
        <span>已完成</span><b><CountUp :value="data.finished" /></b><em>单</em>
      </div>
      <div class="is-purple mechanical-frame-host">
        <MechanicalFrame variant="compact" />
        <span>待保养</span><b><CountUp :value="data.waiting" /></b><em>单</em>
      </div>
    </div>
  </div>
</template>
