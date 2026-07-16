import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'

/**
 * 配置访问 composable(瘦身版)。
 *
 * 早期版本是一个自管理 localStorage 的独立 composable,
 * 存在非单例隐患与 props 透传问题。重构后配置状态统一由
 * Pinia store(`src/stores/dashboard.ts`)托管,
 * 本 composable 退化为 store 的薄封装,保留既有调用入口,
 * 使历史代码可平滑迁移,同时保证全局单例语义。
 *
 * @example
 * const { themeId, layout, activeTheme, orderedModules, selectedModules } = useDashboardConfig()
 * const { setTheme, setLayout, moveModule, resetConfig } = useDashboardConfig()
 */
export function useDashboardConfig() {
  const store = useDashboardStore()
  const {
    config,
    activeTheme,
    orderedModules,
    selectedModules,
    selectedSlotModules,
    availableModules,
  } = storeToRefs(store)

  return {
    // 响应式状态(来自 store)
    config,
    themeId: config.value.themeId,
    panelStyle: config.value.panelStyle,
    chartTypes: config.value.chartTypes,
    layout: config.value.layout,
    selectedModuleIds: config.value.selectedModuleIds,
    moduleOrder: config.value.moduleOrder,
    activeTheme,
    orderedModules,
    selectedModules,
    selectedSlotModules,
    availableModules,
    // actions(直接透传 store 方法)
    setTheme: store.setTheme,
    setPanelStyle: store.setPanelStyle,
    setModuleChartType: store.setModuleChartType,
    setLayout: store.setLayout,
    moveModule: store.moveModule,
    addModuleToLayout: store.addModuleToLayout,
    placeModuleInSlot: store.placeModuleInSlot,
    removeModuleFromLayout: store.removeModuleFromLayout,
    moveSelectedModule: store.moveSelectedModule,
    clearSelectedModules: store.clearSelectedModules,
    resetConfig: store.resetConfig,
  }
}
