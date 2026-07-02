<script setup>
import * as echarts from "echarts";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
  height: {
    type: String,
    default: "170px",
  },
});

const chartEl = ref(null);
let chart;
let observer;

function render() {
  if (!chartEl.value) return;
  if (!chart) {
    chart = echarts.init(chartEl.value);
  }
  chart.setOption(props.option, true);
}

onMounted(() => {
  nextTick(() => {
    render();
    requestAnimationFrame(() => {
      chart?.resize();
      chart?.setOption(props.option, true);
    });
  });
  observer = new ResizeObserver(() => chart?.resize());
  observer.observe(chartEl.value);
});

watch(() => props.option, render, { deep: true });

onUnmounted(() => {
  observer?.disconnect();
  chart?.dispose();
});
</script>

<template>
  <div ref="chartEl" class="w-full" :style="{ height }" />
</template>
