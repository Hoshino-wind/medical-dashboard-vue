<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  headers: string[]
  rows: string[][]
}>()

function statusStyle(value: string): string {
  if (value.includes('维修')) return 'color: var(--warn)'
  if (value.includes('配件')) return 'color: var(--accent-3)'
  return 'color: var(--good)'
}

function rowIconClass(index: number): string {
  return ['is-blue', 'is-purple', 'is-red', 'is-orange', 'is-cyan'][index % 5]
}

const displayRows = ref<string[][]>(props.rows.slice())

watch(
  () => props.rows,
  (value) => {
    displayRows.value = value.slice()
  },
)
</script>

<template>
  <div class="work-order-module">
    <div class="work-order-table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header">{{ header }}</th>
          </tr>
        </thead>
        <transition-group tag="tbody" name="row-rotate">
          <tr v-for="(row, index) in displayRows" :key="row[2]" :class="{ 'is-active': index === 0 }">
            <td v-for="(cell, cellIndex) in row" :key="cellIndex">
              <span v-if="cellIndex === 0" class="table-cell-leading">
                <span class="table-row-icon" :class="rowIconClass(index)">{{ index + 1 }}</span>
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
        </transition-group>
      </table>
    </div>
    <div class="work-order-summary">
      <div class="is-danger"><span>维修中</span><b>44</b><em>单</em></div>
      <div class="is-purple"><span>配件运输中</span><b>18</b><em>单</em></div>
      <div class="is-warn"><span>待处理</span><b>0</b><em>单</em></div>
      <div class="is-good"><span>已维修</span><b>1,326</b><em>单</em></div>
    </div>
  </div>
</template>
