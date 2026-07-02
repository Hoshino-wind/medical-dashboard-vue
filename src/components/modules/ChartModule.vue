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
    const barColors = [accent, accent3, accent2];
    return {
      color: barColors,
      grid: { left: 38, right: 12, top: 26, bottom: 26 },
      legend: {
        top: 0,
        right: 6,
        textStyle: { color: text, fontSize: 11, fontWeight: 800 },
        itemWidth: 10,
        itemHeight: 10,
      },
      xAxis: {
        type: "category",
        data: props.data.labels,
        axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
        axisLine: { lineStyle: { color: grid } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        max: 400,
        axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
        splitLine: { lineStyle: { color: grid, width: 1.2 } },
      },
      series: props.data.series.map((series, index) => ({
        ...series,
        type: "bar",
        barWidth: 14,
        barMinHeight: 2,
        barGap: "20%",
        barCategoryGap: "46%",
        itemStyle: {
          borderRadius: [7, 7, 2, 2],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${barColors[index]}ff` },
              { offset: 0.42, color: `${barColors[index]}cc` },
              { offset: 1, color: `${barColors[index]}55` },
            ],
          },
          shadowBlur: 10,
          shadowColor: `${barColors[index]}80`,
          borderColor: `${barColors[index]}aa`,
          borderWidth: 1.2,
        },
        label: {
          show: true,
          position: "top",
          formatter: ({ value }) => (value > 0 ? value : ""),
          color: text,
          fontSize: 12,
          fontWeight: 900,
        },
      })),
      tooltip: { trigger: "axis" },
    };
  }

  return {
    color: [props.type === "inspection" ? accent2 : accent3],
    grid: { left: 44, right: 16, top: 22, bottom: 28 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.data.labels,
      axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
      axisLine: { lineStyle: { color: grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: muted, fontSize: 11, fontWeight: 800 },
      splitLine: { lineStyle: { color: grid, width: 1.2 } },
    },
    series: [
      {
        data: props.data.data,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 7.5,
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 1.2,
          shadowBlur: 10,
          shadowColor: `${props.type === "inspection" ? accent2 : accent3}88`,
        },
        lineStyle: {
          width: 3.2,
          shadowBlur: 10,
          shadowColor: `${props.type === "inspection" ? accent2 : accent3}88`,
        },
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
  <EChart :class="`chart-${type}`" :option="option" height="100%" />
</template>
