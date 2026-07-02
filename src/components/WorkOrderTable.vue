<script setup>
defineProps({
  headers: {
    type: Array,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
});

function statusStyle(value) {
  if (value.includes("维修")) return "color: var(--warn)";
  if (value.includes("配件")) return "color: var(--accent-3)";
  return "color: var(--good)";
}
</script>

<template>
  <div class="overflow-hidden">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="index">
          <td v-for="(cell, cellIndex) in row" :key="cellIndex">
            <span v-if="cellIndex === row.length - 1" class="status-pill" :style="statusStyle(String(cell))">{{ cell }}</span>
            <span v-else>{{ cell }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
