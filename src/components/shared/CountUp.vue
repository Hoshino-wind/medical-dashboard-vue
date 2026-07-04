<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    decimals?: number
    duration?: number
    separator?: boolean
  }>(),
  {
    decimals: 0,
    duration: 1300,
    separator: true,
  },
)

const display = ref(0)
let raf: number | null = null

function format(n: number): string {
  const fixed = Number(n).toFixed(props.decimals)
  if (!props.separator) return fixed
  const [int, dec] = fixed.split('.')
  const withSep = Number(int).toLocaleString('en-US')
  return dec != null ? `${withSep}.${dec}` : withSep
}

function run() {
  if (raf) cancelAnimationFrame(raf)
  const to = props.value || 0
  let startTs: number | null = null
  const step = (ts: number) => {
    if (startTs === null) startTs = ts
    const t = Math.min(1, (ts - startTs) / props.duration)
    const eased = 1 - Math.pow(1 - t, 3) // cubic-out
    display.value = to * eased
    if (t < 1) raf = requestAnimationFrame(step)
    else display.value = to
  }
  raf = requestAnimationFrame(step)
}

onMounted(run)
watch(() => props.value, run)
onUnmounted(() => {
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <span>{{ format(display) }}</span>
</template>
