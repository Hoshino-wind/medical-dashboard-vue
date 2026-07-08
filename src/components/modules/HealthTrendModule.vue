<script setup lang="ts">
import { computed } from 'vue'
import CountUp from '../shared/CountUp.vue'
import HealthPieChart from '../charts/HealthPieChart.vue'
import { usePagedList } from '@/composables/usePagedList'
import type { HealthTrendData } from '@/types/dashboard'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: HealthTrendData
  theme: Theme
}>()

const healthHeaders = ['设备范围', '健康状态', '数量', '处置建议']

const { viewportRef, trackRef, renderPages, trackStyle, onFlipEnd } = usePagedList(
  computed(() => props.data.rows),
)

const pieItems = computed(() => {
  return [
    { name: '运行正常', value: props.data.online, color: props.theme.variables['--data-health-pie-good'] },
    { name: '维保预警', value: props.data.warning, color: props.theme.variables['--data-health-pie-warning'] },
    { name: '维修中', value: props.data.repairing, color: props.theme.variables['--data-health-pie-repairing'] },
    { name: '即将保养', value: props.data.pending, color: props.theme.variables['--data-health-pie-pending'] },
  ]
})

const pieTotal = computed(
  () => props.data.online + props.data.warning + props.data.repairing + props.data.pending,
)

</script>

<template>
  <div class="health-status-grid">
    <div class="order-list-panel health-status-list">
      <table class="data-table compact-order-table health-status-table paged-head-table">
        <thead>
          <tr>
            <th v-for="header in healthHeaders" :key="header">{{ header }}</th>
          </tr>
        </thead>
      </table>
      <div ref="viewportRef" class="paged-viewport">
        <div ref="trackRef" class="paged-track" :style="trackStyle" @transitionend="onFlipEnd">
          <div v-for="(page, pageIndex) in renderPages" :key="pageIndex" class="paged-page">
            <table class="data-table compact-order-table health-status-table">
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

    <aside class="pie-summary-panel health-pie-panel" aria-label="设备健康状态">
      <div class="pie-summary-title">设备健康状态</div>
      <HealthPieChart
        :items="pieItems"
        :total="pieTotal"
        :tone="theme.variables['--data-health-pie-good']"
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
