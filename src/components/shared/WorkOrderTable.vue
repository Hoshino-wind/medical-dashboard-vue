<script setup lang="ts">
import { computed } from 'vue'
import CountUp from './CountUp.vue'
import { usePagedList } from '@/composables/usePagedList'

const props = defineProps<{
  headers: string[]
  rows: string[][]
}>()

const PENDING_REPAIR_STATUS = '待接修'

function isPendingRepairRow(row: string[]): boolean {
  return row[row.length - 1] === PENDING_REPAIR_STATUS
}

function statusStyle(value: string): string {
  if (value === PENDING_REPAIR_STATUS)
    return 'color: color-mix(in srgb, var(--warn) 86%, var(--text) 14%)'
  if (value.includes('维修')) return 'color: color-mix(in srgb, var(--danger) 74%, var(--muted) 26%)'
  if (value.includes('配件'))
    return 'color: color-mix(in srgb, var(--accent-3) 74%, var(--muted) 26%)'
  return 'color: color-mix(in srgb, var(--good) 72%, var(--muted) 28%)'
}

const pendingRepairRows = computed(() => props.rows.filter(isPendingRepairRow))
const scrollingRows = computed(() => props.rows.filter((row) => !isPendingRepairRow(row)))

const { viewportRef, trackRef, renderPages, trackStyle, onFlipEnd } = usePagedList(
  scrollingRows,
)
</script>

<template>
  <div class="work-order-module">
    <div class="work-order-table-wrap">
      <table class="data-table paged-head-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header">{{ header }}</th>
          </tr>
        </thead>
      </table>
      <table v-if="pendingRepairRows.length" class="data-table work-order-pinned-table">
        <tbody>
          <tr
            v-for="(row, rowIndex) in pendingRepairRows"
            :key="`${row[2]}-${rowIndex}`"
            class="is-pending-repair"
          >
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">
              <span
                v-if="cellIndex === row.length - 1"
                class="status-pill"
                :style="statusStyle(String(cell))"
                >{{ cell }}</span
              >
              <span v-else>{{ cell }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div ref="viewportRef" class="paged-viewport">
        <div ref="trackRef" class="paged-track" :style="trackStyle" @transitionend="onFlipEnd">
          <div v-for="(page, pageIndex) in renderPages" :key="pageIndex" class="paged-page">
            <table class="data-table">
              <tbody>
                <tr v-for="(row, rowIndex) in page" :key="rowIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <span
                      v-if="cellIndex === row.length - 1"
                      class="status-pill"
                      :style="statusStyle(String(cell))"
                      >{{ cell }}</span
                    >
                    <span v-else>{{ cell }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="work-order-summary">
      <div><span>维修中</span><b><CountUp :value="44" /></b><em>单</em></div>
      <div><span>配件运输中</span><b><CountUp :value="18" /></b><em>单</em></div>
      <div><span>待接修</span><b><CountUp :value="1" /></b><em>单</em></div>
      <div><span>已维修</span><b><CountUp :value="1326" /></b><em>单</em></div>
    </div>
  </div>
</template>

<style scoped>
/* Data tables */
.work-order-module {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0;
}
/* 底部静态工单汇总条:数值为固定示意数据,用 CountUp 做入场动画 */
.work-order-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: baseline;
  justify-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.2rem 0;
  color: var(--muted);
}
.work-order-summary > div {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  min-width: 0;
  white-space: nowrap;
}
.work-order-summary span {
  font-size: calc(0.62rem * var(--dashboard-list-font-scale, 1.18));
  font-weight: 850;
}
.work-order-summary b {
  color: var(--text);
  font-size: calc(0.8rem * var(--dashboard-list-font-scale, 1.18));
  font-weight: 950;
}
.work-order-summary em {
  font-size: calc(0.56rem * var(--dashboard-list-font-scale, 1.18));
  font-style: normal;
  font-weight: 850;
}
.work-order-table-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.work-order-pinned-table {
  flex: none;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--warn) 12%, transparent), color-mix(in srgb, var(--warn) 5%, transparent));
}
.work-order-pinned-table .is-pending-repair td {
  border-bottom-color: color-mix(in srgb, var(--warn) 50%, transparent);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--warn) 24%, transparent), color-mix(in srgb, var(--warn) 8%, transparent));
  box-shadow: inset 0 0.0625rem 0 color-mix(in srgb, var(--warn) 18%, transparent);
}
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: auto;
  padding: 0;
  border-radius: 0;
  font-size: calc(0.85rem * var(--dashboard-list-font-scale, 1.18));
  font-weight: 900;
}
</style>
