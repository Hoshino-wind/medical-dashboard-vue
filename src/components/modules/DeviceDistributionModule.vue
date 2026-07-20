<script setup lang="ts">
import { computed } from 'vue'
import { usePagedCarousel } from '@/composables/usePagedCarousel'
import type { DeviceDistributionItem } from '@/types/dashboard'
import type { ColorMode } from '@/types/config'

const PAGE_SIZE = 4
const PAGE_INTERVAL = 5000

const props = withDefaults(
  defineProps<{
    items: DeviceDistributionItem[]
    /** 进度条配色模式,由上层配置(moduleRegistry)注入,不再直接读 store */
    barColorMode?: ColorMode
  }>(),
  {
    barColorMode: 'gradient',
  },
)

const rows = computed(() =>
  props.items.map((item) => ({
    ...item,
    rate: Number.isFinite(item.rate) ? item.rate : 0,
    progress: `${Math.min(Math.max(item.rate, 0), 100)}%`,
  })),
)

/** 按每页 PAGE_SIZE 条切片 */
const pages = computed(() => {
  const list = rows.value
  if (list.length <= PAGE_SIZE) return [list]
  const result: (typeof list)[] = []
  for (let i = 0; i < list.length; i += PAGE_SIZE) {
    result.push(list.slice(i, i + PAGE_SIZE))
  }
  return result
})

const { currentIndex } = usePagedCarousel({
  pageCount: () => pages.value.length,
  interval: PAGE_INTERVAL,
})
</script>

<template>
  <div
    class="device-distribution"
    :class="`bar-${barColorMode}`"
    aria-label="设备分布台数占比"
  >
    <Transition name="dist-flip" mode="out-in">
      <div :key="currentIndex" class="device-distribution-page">
        <div
          v-for="item in pages[currentIndex]"
          :key="item.name"
          class="device-distribution-row"
        >
          <div class="device-distribution-meta">
            <span class="device-distribution-name">{{ item.name }}</span>
            <span class="device-distribution-value">
              <b>{{ item.count.toLocaleString('zh-CN') }}</b><em>台</em>
              <span>({{ item.rate.toFixed(2) }}%)</span>
            </span>
          </div>
          <div
            class="device-distribution-track"
            role="meter"
            :aria-label="`${item.name}设备占比`"
            :aria-valuenow="item.rate"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="device-distribution-bar" :style="{ width: item.progress }"></span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.device-distribution {
  height: 100%;
  min-height: 0;
  padding: 0.3rem 0.7rem;
  box-sizing: border-box;
  overflow: hidden;
}
.device-distribution-page {
  display: grid;
  height: 100%;
  align-content: space-evenly;
  gap: 0.5rem;
}
.device-distribution-row {
  display: grid;
  min-width: 0;
  gap: 0.32rem;
}
/* 翻页动画 */
.dist-flip-enter-active,
.dist-flip-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.dist-flip-enter-from {
  opacity: 0;
  transform: translateY(0.6rem);
}
.dist-flip-leave-to {
  opacity: 0;
  transform: translateY(-0.6rem);
}
.device-distribution-meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0.75rem;
  color: var(--text);
  font-weight: 900;
  line-height: 1;
}
.device-distribution-name {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--text) 90%, var(--accent-3) 10%);
  font-size: calc(0.74rem * var(--dashboard-font-scale, 1.45));
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.device-distribution-value {
  display: inline-flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: 0.12rem;
  color: color-mix(in srgb, var(--accent-2) 88%, var(--chart-primary) 12%);
  font-size: calc(0.7rem * var(--dashboard-font-scale, 1.45));
  white-space: nowrap;
}
.device-distribution-value b {
  font-weight: 950;
}
.device-distribution-value em {
  color: currentColor;
  font-style: normal;
  font-weight: 900;
}
.device-distribution-value span {
  margin-left: 0.18rem;
  color: color-mix(in srgb, var(--text) 78%, var(--muted) 22%);
  font-size: calc(0.69rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
}
.device-distribution-track {
  position: relative;
  height: 0.46rem;
  overflow: hidden;
  border-radius: 999rem;
  background: color-mix(in srgb, var(--surface-strong) 42%, transparent);
  box-shadow:
    inset 0 0 0 0.0625rem color-mix(in srgb, var(--instrument-rim) 14%, transparent);
}
/* 默认（渐变色模式）：0°→ 280° 色相渐变，让进度条色彩更丰富 */
.device-distribution-bar {
  position: absolute;
  inset: 0 auto 0 0;
  min-width: 0.14rem;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    hsl(180, 90%, 55%),
    hsl(150, 85%, 52%),
    hsl(210, 88%, 58%),
    hsl(280, 82%, 62%)
  );
  box-shadow:
    0 0 0.5rem color-mix(in srgb, hsl(200, 90%, 55%) 40%, transparent),
    inset 0 0.0625rem 0 color-mix(in srgb, #ffffff 42%, transparent);
}
/* 纯色模式：整条统一主题数据色，去掉跨色相渐变 */
.device-distribution.bar-solid .device-distribution-bar {
  background: var(--data-bar);
  box-shadow:
    0 0 0.5rem color-mix(in srgb, var(--data-bar) 40%, transparent),
    inset 0 0.0625rem 0 color-mix(in srgb, #ffffff 42%, transparent);
}
</style>

<!-- 浅色主题覆盖:引用祖先 .dashboard-shell,必须走全局(scoped 会把祖先也加 data-v 而失配) -->
<style>
.dashboard-shell[data-theme-mode='light'] .device-distribution {
  padding-inline: 0.85rem;
}
.dashboard-shell[data-theme-mode='light'] .device-distribution-name {
  color: color-mix(in srgb, #24175e 84%, var(--text) 16%);
}
.dashboard-shell[data-theme-mode='light'] .device-distribution-value {
  color: #03b8ff;
}
.dashboard-shell[data-theme-mode='light'] .device-distribution-value span {
  color: color-mix(in srgb, #24175e 78%, var(--text) 22%);
}
.dashboard-shell[data-theme-mode='light'] .device-distribution-track {
  background: color-mix(in srgb, #bfeaff 84%, #ffffff 16%);
  box-shadow:
    inset 0 0 0 0.0625rem rgba(112, 205, 242, 0.18),
    0 0.18rem 0.55rem rgba(19, 153, 216, 0.05);
}
.dashboard-shell[data-theme-mode='light'] .device-distribution-bar {
  background: linear-gradient(90deg, hsl(195, 92%, 50%), hsl(165, 85%, 48%), hsl(225, 88%, 55%), hsl(280, 75%, 58%));
  box-shadow: 0 0 0.65rem rgba(8, 184, 255, 0.28);
}
/* 浅色主题纯色模式 */
.dashboard-shell[data-theme-mode='light'] .device-distribution.bar-solid .device-distribution-bar {
  background: var(--data-bar);
  box-shadow: 0 0 0.65rem color-mix(in srgb, var(--data-bar) 32%, transparent);
}
</style>
