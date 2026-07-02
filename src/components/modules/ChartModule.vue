<script setup>
import { computed } from "vue";
import EChart from "../EChart.vue";

const props = defineProps({
  type: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
  theme: {
    type: Object,
    required: true,
  },
});

function v(name) {
  return props.theme.variables[name];
}

const option = computed(() => {
  const text = v("--text");
  const muted = v("--muted");
  const grid = v("--chart-grid");
  const accent = v("--accent");
  const accent2 = v("--accent-2");
  const accent3 = v("--accent-3");

  if (props.type === "bar") {
    return {
      color: [accent3, v("--warn"), accent2],
      grid: { left: 36, right: 14, top: 24, bottom: 26 },
      legend: {
        top: 0,
        right: 6,
        textStyle: { color: muted, fontSize: 10 },
        itemWidth: 9,
        itemHeight: 9,
      },
      xAxis: {
        type: "category",
        data: props.data.labels,
        axisLabel: { color: muted, fontSize: 10 },
        axisLine: { lineStyle: { color: grid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: muted, fontSize: 10 },
        splitLine: { lineStyle: { color: grid } },
      },
      series: props.data.series.map((series) => ({
        ...series,
        type: "bar",
        barWidth: 14,
        stack: "total",
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          shadowBlur: 12,
          shadowColor: "rgba(0,0,0,.18)",
        },
        label: {
          show: true,
          position: "top",
          color: text,
          fontSize: 10,
        },
      })),
      tooltip: { trigger: "axis" },
    };
  }

  return {
    color: [props.type === "inspection" ? accent2 : accent3],
    grid: { left: 42, right: 16, top: 22, bottom: 28 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.data.labels,
      axisLabel: { color: muted, fontSize: 10 },
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: muted, fontSize: 10 },
      splitLine: { lineStyle: { color: grid } },
    },
    series: [
      {
        data: props.data.data,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { width: 3 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${props.type === "inspection" ? accent2 : accent3}88` },
              { offset: 1, color: `${props.type === "inspection" ? accent2 : accent3}00` },
            ],
          },
        },
      },
    ],
    tooltip: { trigger: "axis" },
  };
});
</script>

<template>
  <EChart :option="option" height="100%" />
</template>
