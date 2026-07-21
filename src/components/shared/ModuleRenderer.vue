<script setup lang="ts">
import { computed } from 'vue'
import PanelShell from './PanelShell.vue'
import { resolveModuleRender, type ModuleRenderContext } from '@/config/moduleRegistry'
import { useDashboardStore } from '@/stores/dashboard'
import type { DashboardData } from '@/types/dashboard'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  module: ModuleCatalogItem
  theme: Theme
  data: DashboardData
}>()
const store = useDashboardStore()

const ctx = computed<ModuleRenderContext>(() => ({
  data: props.data,
  theme: props.theme,
  config: store.config,
}))

const resolved = computed(() => resolveModuleRender(props.module, ctx.value))
</script>

<template>
  <PanelShell
    :title="module.title"
    :subtitle="module.subtitle"
    :variant="module.kind"
    :class="{ 'module-wide': module.size === 'wide' }"
  >
    <component :is="resolved.component" v-bind="resolved.props" />
  </PanelShell>
</template>

<!-- module-wide 由本组件加到子组件 PanelShell 的根上,走全局(非 scoped) -->
<style>
.module-wide {
  min-width: 0;
}
</style>
