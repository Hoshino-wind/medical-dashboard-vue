<script setup lang="ts">
import { storeToRefs } from 'pinia'
import FooterKpiBar from './FooterKpiBar.vue'
import HeaderBar from './HeaderBar.vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardData } from '@/composables/useDashboardData'

const store = useDashboardStore()
const { orderedModules, activeTheme } = storeToRefs(store)

const { data } = useDashboardData()
</script>

<template>
  <main class="screen-frame" data-reference-design="medical-equipment-1920x1080">
    <HeaderBar :data="data.header" />
    <section class="screen-grid" data-layout="3x3">
      <ModuleRenderer
        v-for="item in orderedModules"
        :key="item.id"
        :module="item"
        :theme="activeTheme"
      />
    </section>
    <FooterKpiBar :items="data.footerMetrics" />
  </main>
</template>
