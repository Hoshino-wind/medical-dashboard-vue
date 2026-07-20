<script setup lang="ts">
import { computed } from 'vue'
import MechanicalFrame from '../visual/MechanicalFrame.vue'
import panelTitleOrnamentLeftUrl from '@/assets/panel-titles/medical-pulse-title-left-v3.png'
import panelTitleOrnamentRightUrl from '@/assets/panel-titles/medical-pulse-title-right-v6.png'
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
  <section class="panel mechanical-frame-host" :class="panelVariantClass">
    <MechanicalFrame variant="panel" />
    <span class="panel-border-flow"></span>
    <div class="panel-header panel-header--main">
      <h2 class="panel-title-frame mechanical-frame-host">
        <MechanicalFrame variant="compact" />
        <img
          class="panel-title-ornament panel-title-ornament--left"
          :src="panelTitleOrnamentLeftUrl"
          alt=""
          aria-hidden="true"
        />
        <span class="panel-title-mini-bars panel-title-mini-bars--left" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="panel-title-text">
          {{ title }}
        </span>
        <img
          class="panel-title-ornament panel-title-ornament--right"
          :src="panelTitleOrnamentRightUrl"
          alt=""
          aria-hidden="true"
        />
        <span class="panel-title-mini-bars panel-title-mini-bars--right" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
      </h2>
      <span v-if="subtitle" class="panel-title-suffix">（{{ subtitle }}）</span>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>
