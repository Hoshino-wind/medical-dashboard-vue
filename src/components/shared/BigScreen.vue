<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import FooterKpiBar from './FooterKpiBar.vue'
import HeaderBar from './HeaderBar.vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardData } from '@/composables/useDashboardData'

const store = useDashboardStore()
const { orderedModules, activeTheme } = storeToRefs(store)

const { data } = useDashboardData()

const layout = computed(() => store.config.layout)

const visibleModules = computed(() =>
  layout.value === '2x3' ? orderedModules.value.slice(0, 6) : orderedModules.value,
)
</script>

<template>
  <main class="screen-frame" data-reference-design="medical-equipment-1920x1080">
    <HeaderBar :data="data.header" />
    <section class="screen-grid" :class="{ 'layout-2x3': layout === '2x3' }" :data-layout="layout">
      <ModuleRenderer
        v-for="item in visibleModules"
        :key="item.id"
        :module="item"
        :theme="activeTheme"
      />
    </section>
    <FooterKpiBar :items="data.footerMetrics" />
  </main>
</template>
