<script setup lang="ts">
import { computed } from 'vue'
import CountUp from './CountUp.vue'
import { usePagedList } from '@/composables/usePagedList'

const props = defineProps<{
  headers: string[]
  rows: string[][]
}>()

function statusStyle(value: string): string {
  if (value.includes('维修')) return 'color: color-mix(in srgb, var(--warn) 74%, var(--muted) 26%)'
  if (value.includes('配件'))
    return 'color: color-mix(in srgb, var(--accent-3) 74%, var(--muted) 26%)'
  return 'color: color-mix(in srgb, var(--good) 72%, var(--muted) 28%)'
}

function rowIconClass(index: number): string {
  return ['is-blue', 'is-purple', 'is-red', 'is-orange', 'is-cyan'][index % 5]
}

const { viewportRef, trackRef, renderPages, trackStyle, pageStart, onFlipEnd } = usePagedList(
  computed(() => props.rows),
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
      <div ref="viewportRef" class="paged-viewport">
        <div ref="trackRef" class="paged-track" :style="trackStyle" @transitionend="onFlipEnd">
          <div v-for="(page, pageIndex) in renderPages" :key="pageIndex" class="paged-page">
            <table class="data-table">
              <tbody>
                <tr
                  v-for="(row, rowIndex) in page"
                  :key="rowIndex"
                  :class="{ 'is-active': pageStart(pageIndex) + rowIndex === 0 }"
                >
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                    <span v-if="cellIndex === 0" class="table-cell-leading">
                      <span
                        class="table-row-icon"
                        :class="rowIconClass(pageStart(pageIndex) + rowIndex)"
                        >{{ pageStart(pageIndex) + rowIndex + 1 }}</span
                      >
                      <span>{{ cell }}</span>
                    </span>
                    <span
                      v-if="cellIndex === row.length - 1"
                      class="status-pill"
                      :style="statusStyle(String(cell))"
                      >{{ cell }}</span
                    >
                    <span v-else-if="cellIndex !== 0">{{ cell }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="work-order-summary">
      <div class="is-danger"><span>维修中</span><b><CountUp :value="44" /></b><em>单</em></div>
      <div class="is-purple"><span>配件运输中</span><b><CountUp :value="18" /></b><em>单</em></div>
      <div class="is-warn"><span>待处理</span><b><CountUp :value="0" /></b><em>单</em></div>
      <div class="is-good"><span>已维修</span><b><CountUp :value="1326" /></b><em>单</em></div>
    </div>
  </div>
</template>
