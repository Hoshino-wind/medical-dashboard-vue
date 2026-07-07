<script setup lang="ts">
import { computed, type Component } from 'vue'
import { storeToRefs } from 'pinia'
import { Bell, Database, Expand, MapPinned, Monitor, SwatchBook } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import HeaderBar from './HeaderBar.vue'
import ModuleRenderer from './ModuleRenderer.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useDashboardData } from '@/composables/useDashboardData'

type FooterAction = {
  label: string
  icon: Component
  badge?: string
  route?: string
}

const store = useDashboardStore()
const { orderedModules, activeTheme } = storeToRefs(store)
const router = useRouter()

const { data } = useDashboardData()

const layout = computed(() => store.config.layout)

const visibleModules = computed(() =>
  layout.value === '2x3' ? orderedModules.value.slice(0, 6) : orderedModules.value,
)

const footerActions: FooterAction[] = [
  { label: '大屏模式', icon: Monitor },
  { label: '全屏显示', icon: Expand },
  { label: '数据导出', icon: Database },
  { label: '设备地图', icon: MapPinned },
  { label: '告警中心', icon: Bell, badge: '12' },
  { label: '主题配置', icon: SwatchBook, route: '/config' },
]

function runFooterAction(action: FooterAction) {
  if (action.route) {
    void router.push(action.route)
  }
}
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
    <footer class="screen-footer-nav" aria-label="大屏快捷操作">
      <button
        v-for="action in footerActions"
        :key="action.label"
        class="screen-footer-action"
        type="button"
        @click="runFooterAction(action)"
      >
        <component :is="action.icon" class="screen-footer-icon" aria-hidden="true" />
        <span>{{ action.label }}</span>
        <i v-if="action.badge" class="screen-footer-badge">{{ action.badge }}</i>
      </button>
    </footer>
  </main>
</template>
