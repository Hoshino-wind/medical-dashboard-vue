<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DeviceDistributionItem } from '@/types/dashboard'

const PAGE_SIZE = 4
const PAGE_INTERVAL = 5000

const props = defineProps<{
  items: DeviceDistributionItem[]
}>()

const currentIndex = ref(0)
let pageTimer: ReturnType<typeof setInterval> | null = null

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

const shouldPaginate = computed(() => pages.value.length > 1)

function nextPage() {
  if (!shouldPaginate.value) return
  currentIndex.value = (currentIndex.value + 1) % pages.value.length
}

function startTimer() {
  stopTimer()
  if (!shouldPaginate.value) return
  pageTimer = setInterval(nextPage, PAGE_INTERVAL)
}

function stopTimer() {
  if (pageTimer) {
    clearInterval(pageTimer)
    pageTimer = null
  }
}

watch(() => props.items, () => {
  currentIndex.value = 0
})

onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="device-distribution" aria-label="设备分布台数占比">
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
