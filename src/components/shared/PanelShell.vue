<script setup lang="ts">
import { computed } from 'vue'
import type { ModuleKind } from '@/types/module'

const props = withDefaults(
  defineProps<{
    title?: string
    /** 副标题(如"近7天"),替代原先用正则解析 `（xxx）` 的脆弱实现 */
    subtitle?: string
    variant?: ModuleKind
  }>(),
  {
    variant: 'overview',
  },
)

const panelVariantClass = computed(() => `panel--${props.variant}`)
</script>

<template>
  <section class="panel" :class="panelVariantClass">
    <span class="panel-border-flow"></span>
    <div class="panel-header panel-header--main">
      <h2 class="panel-title-frame">
        <span class="panel-title-mini-bars panel-title-mini-bars--left" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="panel-title-text">
          {{ title }}
          <span v-if="subtitle" class="panel-title-suffix">（{{ subtitle }}）</span>
        </span>
        <span class="panel-title-mini-bars panel-title-mini-bars--right" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </h2>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>
