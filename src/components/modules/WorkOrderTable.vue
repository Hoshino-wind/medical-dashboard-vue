<script setup lang="ts">
import { computed } from 'vue'
import { usePagedList } from '@/composables/usePagedList'
import type { RepairOrder } from '@/types/dashboard'

const props = defineProps<{
  rows: RepairOrder[]
}>()

const PENDING_REPAIR_STATUS = '待接修'
const headers = ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态']

function isPendingRepairRow(row: RepairOrder): boolean {
  return row.status === PENDING_REPAIR_STATUS
}

function rowCells(row: RepairOrder): string[] {
  return [
    row.department,
    row.equipName,
    row.repairCode,
    row.reportDuration,
    row.responder,
    row.status,
  ]
}

function statusStyle(value: string): string {
  if (value === PENDING_REPAIR_STATUS)
    return 'color: color-mix(in srgb, var(--warn) 86%, var(--text) 14%)'
  if (value.includes('维修'))
    return 'color: color-mix(in srgb, var(--danger) 74%, var(--muted) 26%)'
  if (value.includes('配件'))
    return 'color: color-mix(in srgb, var(--accent-3) 74%, var(--muted) 26%)'
  return 'color: color-mix(in srgb, var(--good) 72%, var(--muted) 28%)'
}

const pendingRepairRows = computed(() => props.rows.filter(isPendingRepairRow))
const scrollingRows = computed(() => props.rows.filter((row) => !isPendingRepairRow(row)))

const { viewportRef, trackRef, renderPages, trackStyle, onFlipEnd } = usePagedList(scrollingRows)
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
            :key="`${row.repairCode}-${rowIndex}`"
            class="is-pending-repair"
          >
            <td v-for="(cell, cellIndex) in rowCells(row)" :key="cellIndex">
              <span
                v-if="cellIndex === headers.length - 1"
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
                  <td v-for="(cell, cellIndex) in rowCells(row)" :key="cellIndex">
                    <span
                      v-if="cellIndex === headers.length - 1"
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
  </div>
</template>

<style scoped>
/* Data tables */
.work-order-module {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(0, 1fr);
}
.work-order-table-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.work-order-pinned-table {
  flex: none;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--warn) 12%, transparent),
    color-mix(in srgb, var(--warn) 5%, transparent)
  );
}
.work-order-pinned-table .is-pending-repair td {
  border-bottom-color: color-mix(in srgb, var(--warn) 50%, transparent);
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--warn) 24%, transparent),
    color-mix(in srgb, var(--warn) 8%, transparent)
  );
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
