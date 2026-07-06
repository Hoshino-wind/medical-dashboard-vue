<script setup lang="ts">
import { computed } from 'vue'
import PanelShell from './PanelShell.vue'
import { moduleRegistry, type ModuleRenderContext } from '@/config/moduleRegistry'
import { useDashboardData } from '@/composables/useDashboardData'
import { useDashboardStore } from '@/stores/dashboard'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  module: ModuleCatalogItem
  theme: Theme
}>()

const { data } = useDashboardData()
const store = useDashboardStore()

const entry = computed(() => moduleRegistry[props.module.kind])
const settings = computed(() => store.config.moduleSettings[props.module.id])

const ctx = computed<ModuleRenderContext>(() => ({
  data: data,
  theme: props.theme,
  settings: settings.value,
}))

/** 该模块要传给业务组件的 props,由注册表解析 */
const resolvedProps = computed(() => entry.value.resolveProps(props.module, ctx.value))
</script>

<template>
  <PanelShell
    :number="module.number"
    :title="module.title"
    :subtitle="module.subtitle"
    :class="{ 'module-wide': module.size === 'wide' }"
  >
    <component :is="entry.component" v-bind="resolvedProps" />
  </PanelShell>
</template>
