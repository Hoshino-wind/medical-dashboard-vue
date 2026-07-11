<script setup lang="ts">
import { computed } from 'vue'
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
  </div>
</template>
