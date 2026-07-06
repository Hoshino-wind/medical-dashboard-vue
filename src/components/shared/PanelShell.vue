<script setup lang="ts">
defineProps<{
  number?: string
  title?: string
  /** 副标题(如"近7天"),替代原先用正则解析 `（xxx）` 的脆弱实现 */
  subtitle?: string
}>()
</script>

<template>
  <section class="panel">
    <span class="panel-corner tl"></span>
    <span class="panel-corner tr"></span>
    <span class="panel-corner bl"></span>
    <span class="panel-corner br"></span>
    <span class="panel-scan"></span>
    <div class="panel-header">
      <span class="panel-number">{{ number }}</span>
      <h2 class="truncate text-[1.0625rem]">
        {{ title }}
        <span v-if="subtitle" class="panel-title-suffix">（{{ subtitle }}）</span>
      </h2>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>
