<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertCircle, Check, ChevronDown, RotateCcw, Save, X } from 'lucide-vue-next'
import { themes } from '@/data/themes'
import { moduleCatalog } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'
import BigScreen from './BigScreen.vue'
import type { ChartDisplayType, ColorMode, LayoutType, PanelStyle } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

type ModuleDisplayType = 'table' | 'chart'

const store = useDashboardStore()
const { config, availableModules, selectedModules, selectedSlotModules, activeTheme } =
  storeToRefs(store)

// 效果预览等比缩小：基于 1920 基准宽度计算 scale
const PREVIEW_BASE_WIDTH = 1920
const PREVIEW_BASE_HEIGHT = 1080
const previewRef = ref<HTMLElement | null>(null)
const previewScale = ref(1)
let previewObserver: ResizeObserver | undefined

function measurePreview() {
  const el = previewRef.value
  if (!el) return
  // 同时考虑宽高约束，确保完整显示（等比缩小）
  const widthScale = el.clientWidth / PREVIEW_BASE_WIDTH
  const heightScale = el.clientHeight / PREVIEW_BASE_HEIGHT
  previewScale.value = Math.min(widthScale, heightScale)
}

const draggedModuleId = ref<string | null>(null)
const draggedSlotIndex = ref<number | null>(null)
const dragOverSlot = ref<number | null>(null)
const isComponentPoolActive = ref(false)
const savedAt = ref('')
const layoutWarning = ref('')
let warningTimer: number | undefined

const tableModuleIds = new Set(['repairOrders', 'inspectionOrders', 'healthTrend'])

const panelStyleOptions: Array<{ id: PanelStyle; label: string }> = [
  { id: 'glass-flow', label: '流光玻璃' },
  { id: 'borderless', label: '无边框' },
  { id: 'chamfered-instrument', label: '立体边框' },
]

const colorModeOptions: Array<{ id: ColorMode; label: string }> = [
  { id: 'solid', label: '纯色' },
  { id: 'gradient', label: '渐变色' },
]

const chartTypeOptions: Array<{ id: ChartDisplayType; label: string }> = [
  { id: 'line', label: '折线图' },
  { id: 'bar', label: '柱状图' },
]

const configurableChartModules = moduleCatalog.filter((module) => module.chart)

const slotItems = computed(() => selectedSlotModules.value)

function moduleDisplayType(module: ModuleCatalogItem): ModuleDisplayType {
  return tableModuleIds.has(module.id) ? 'table' : 'chart'
}

function moduleTypeLabel(module: ModuleCatalogItem) {
  return moduleDisplayType(module) === 'table' ? '表格' : '图形'
}

function moduleById(moduleId: string | null) {
  return [...availableModules.value, ...selectedModules.value].find(
    (module) => module.id === moduleId,
  )
}

function themeLabel(theme: Theme) {
  const aliases: Partial<Record<ThemeId, string>> = {
    'deep-sea-instrument': '蓝黑',
    'light-medical': '浅蓝',
    'ink-blue-medical': '蓝绿',
    'midnight-violet': '蓝紫',
    'black-gold-blue': '黑金',
  }
  return aliases[theme.id] ?? theme.name.replace(/^\d+\s*/, '')
}

function publishConfig() {
  savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function showLayoutWarning(message = '每一行只允许存在一个【表格】类型组件') {
  layoutWarning.value = message
  if (warningTimer) window.clearTimeout(warningTimer)
  warningTimer = window.setTimeout(() => {
    layoutWarning.value = ''
  }, 2600)
}

function addModule(module: ModuleCatalogItem) {
  const placed = store.addModuleToLayout(module.id)
  if (!placed) {
    showLayoutWarning(
      moduleDisplayType(module) === 'table'
        ? '每一行只允许存在一个【表格】类型组件'
        : '当前布局没有可用区域',
    )
  }
}

function handleAvailableDragStart(moduleId: string) {
  draggedModuleId.value = moduleId
  draggedSlotIndex.value = null
}

function handleSlotDragStart(index: number, module: ModuleCatalogItem | null) {
  if (!module) return
  draggedSlotIndex.value = index
  draggedModuleId.value = module.id
}

function handleSlotDrop(index: number) {
  let placed = true
  if (draggedModuleId.value) {
    if (draggedSlotIndex.value !== null) {
      placed = store.moveSelectedModule(draggedSlotIndex.value, index)
    } else {
      placed = store.placeModuleInSlot(draggedModuleId.value, index)
    }
  }

  if (!placed) {
    const draggedModule = moduleById(draggedModuleId.value)
    showLayoutWarning(
      draggedModule && moduleDisplayType(draggedModule) !== 'table'
        ? '当前布局没有可用区域'
        : '每一行只允许存在一个【表格】类型组件',
    )
  }

  clearDragState()
}

function clearDragState() {
  draggedModuleId.value = null
  draggedSlotIndex.value = null
  dragOverSlot.value = null
  isComponentPoolActive.value = false
}

function handleComponentPoolDrop() {
  if (draggedSlotIndex.value !== null) {
    store.removeModuleFromLayout(draggedSlotIndex.value)
  }
  clearDragState()
}

onMounted(() => {
  if (typeof ResizeObserver === 'undefined') return
  previewObserver = new ResizeObserver(measurePreview)
  if (previewRef.value) {
    previewObserver.observe(previewRef.value)
    measurePreview()
  }
})

onBeforeUnmount(() => {
  previewObserver?.disconnect()
})
</script>

<template>
  <main class="screen-frame config-workbench">
    <section class="config-shell panel">
      <div class="config-shell-header">
        <div class="config-shell-title">
          <ChevronDown class="h-4 w-4" aria-hidden="true" />
          <span>配置信息</span>
        </div>
        <div class="config-rule-toast" :class="{ visible: layoutWarning }" role="status">
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <span>{{ layoutWarning || '每一行只允许存在一个【表格】类型组件' }}</span>
        </div>
        <div class="config-shell-actions">
          <span class="config-save-state">{{ savedAt ? `已发布 ${savedAt}` : '自动保存' }}</span>
          <button class="app-button" type="button" @click="store.clearSelectedModules()">
            <X class="h-4 w-4" />
            清空布局
          </button>
          <button class="app-button" type="button" @click="store.resetConfig()">
            <RotateCcw class="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div class="config-workbench-grid">
        <section class="config-column config-column-components" aria-label="可选业务组件">
          <h2>可选业务组件</h2>
          <div
            class="config-column-box component-picker"
            :class="{ 'is-drop-target': isComponentPoolActive }"
            @dragenter.prevent="isComponentPoolActive = draggedSlotIndex !== null"
            @dragover.prevent="isComponentPoolActive = draggedSlotIndex !== null"
            @drop.prevent="handleComponentPoolDrop"
          >
            <button
              v-for="module in availableModules"
              :key="module.id"
              class="business-component-card"
              :class="`is-${moduleDisplayType(module)}`"
              type="button"
              draggable="true"
              :data-testid="`available-${module.id}`"
              @click="addModule(module)"
              @dragstart="handleAvailableDragStart(module.id)"
              @dragend="clearDragState"
            >
              <span class="component-type-badge">{{ moduleTypeLabel(module) }}</span>
              <span class="component-card-title">{{ module.title }}</span>
            </button>
            <div v-if="availableModules.length === 0" class="component-empty-state">
              所有组件已放入布局
            </div>
          </div>
        </section>

        <section class="config-column config-column-layout" aria-label="大屏布局">
          <h2>大屏布局</h2>
          <div
            class="layout-slot-board"
            :class="{ 'layout-slot-board-2x3': config.layout === '2x3' }"
          >
            <button
              v-for="(module, index) in slotItems"
              :key="index"
              class="layout-slot"
              :class="[
                module ? `is-${moduleDisplayType(module)}` : 'is-empty',
                { 'is-drag-over': dragOverSlot === index },
              ]"
              type="button"
              :draggable="Boolean(module)"
              :data-testid="`layout-slot-${index}`"
              @click="module ? store.removeModuleFromLayout(index) : undefined"
              @dragstart="handleSlotDragStart(index, module)"
              @dragenter.prevent="dragOverSlot = index"
              @dragover.prevent
              @drop.prevent="handleSlotDrop(index)"
              @dragend="clearDragState"
            >
              <span v-if="module" class="layout-slot-title">{{ module.title }}</span>
              <span v-else class="layout-slot-empty">将业务组件拖动至此处</span>
            </button>
          </div>
          <button class="config-publish-button" type="button" @click="publishConfig">
            <Save class="h-4 w-4" />
            保存并发布
          </button>
        </section>

        <section class="config-column config-column-properties" aria-label="大屏属性">
          <h2>大屏属性</h2>
          <div class="config-column-box property-panel">
            <fieldset class="property-group">
              <legend>布局设置</legend>
              <label class="property-radio">
                <input
                  type="radio"
                  name="layout"
                  value="2x3"
                  :checked="config.layout === '2x3'"
                  @change="store.setLayout('2x3' as LayoutType)"
                />
                <span>2行3列</span>
              </label>
              <label class="property-radio">
                <input
                  type="radio"
                  name="layout"
                  value="3x3"
                  :checked="config.layout === '3x3'"
                  @change="store.setLayout('3x3' as LayoutType)"
                />
                <span>3行3列</span>
              </label>
            </fieldset>

            <fieldset class="property-group">
              <legend>背景主题设置</legend>
              <label
                v-for="theme in themes"
                :key="theme.id"
                class="property-radio theme-radio"
                :class="{ active: theme.id === config.themeId }"
              >
                <input
                  type="radio"
                  name="theme"
                  :value="theme.id"
                  :checked="theme.id === config.themeId"
                  @change="store.setTheme(theme.id as ThemeId)"
                />
                <span>{{ themeLabel(theme) }}</span>
                <Check v-if="theme.id === config.themeId" class="h-3.5 w-3.5" aria-hidden="true" />
              </label>
            </fieldset>

            <fieldset class="property-group">
              <legend>卡片样式设置</legend>
              <label
                v-for="style in panelStyleOptions"
                :key="style.id"
                class="property-radio panel-style-radio"
                :class="{ active: style.id === config.panelStyle }"
              >
                <input
                  :data-testid="`panel-style-${style.id}`"
                  type="radio"
                  name="panel-style"
                  :value="style.id"
                  :checked="style.id === config.panelStyle"
                  @change="store.setPanelStyle(style.id)"
                />
                <span>{{ style.label }}</span>
                <Check
                  v-if="style.id === config.panelStyle"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </label>
            </fieldset>

            <fieldset class="property-group chart-type-group">
              <legend>统计图表设置</legend>
              <div
                v-for="module in configurableChartModules"
                :key="module.id"
                class="chart-type-row"
              >
                <span class="chart-type-title">{{ module.title }}</span>
                <div class="chart-type-options">
                  <label
                    v-for="option in chartTypeOptions"
                    :key="option.id"
                    class="property-radio chart-type-radio"
                    :class="{ active: config.chartTypes[module.id] === option.id }"
                  >
                    <input
                      :data-testid="`chart-type-${module.id}-${option.id}`"
                      type="radio"
                      :name="`chart-type-${module.id}`"
                      :value="option.id"
                      :checked="config.chartTypes[module.id] === option.id"
                      @change="store.setModuleChartType(module.id, option.id)"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>
            </fieldset>

            <fieldset class="property-group">
              <legend>环图配色</legend>
              <label
                v-for="mode in colorModeOptions"
                :key="`ring-${mode.id}`"
                class="property-radio color-mode-radio"
                :class="{ active: mode.id === config.ringColorMode }"
              >
                <input
                  :data-testid="`ring-color-mode-${mode.id}`"
                  type="radio"
                  name="ring-color-mode"
                  :value="mode.id"
                  :checked="mode.id === config.ringColorMode"
                  @change="store.setRingColorMode(mode.id)"
                />
                <span>{{ mode.label }}</span>
                <Check
                  v-if="mode.id === config.ringColorMode"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </label>
            </fieldset>

            <fieldset class="property-group">
              <legend>进度条配色</legend>
              <label
                v-for="mode in colorModeOptions"
                :key="`bar-${mode.id}`"
                class="property-radio color-mode-radio"
                :class="{ active: mode.id === config.barColorMode }"
              >
                <input
                  :data-testid="`bar-color-mode-${mode.id}`"
                  type="radio"
                  name="bar-color-mode"
                  :value="mode.id"
                  :checked="mode.id === config.barColorMode"
                  @change="store.setBarColorMode(mode.id)"
                />
                <span>{{ mode.label }}</span>
                <Check
                  v-if="mode.id === config.barColorMode"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </label>
            </fieldset>
          </div>
        </section>
      </div>
    </section>

    <section class="config-preview-panel panel" aria-label="效果预览">
      <div class="config-preview-header">
        <h2>效果预览</h2>
        <span>{{ activeTheme.name }} · {{ config.layout }}</span>
      </div>
      <div ref="previewRef" class="config-live-preview">
        <div
          class="config-live-scaler"
          :style="{ transform: `translate(-50%, -50%) scale(${previewScale})` }"
        >
          <BigScreen />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.config-workbench {
  display: block;
  width: min(100vw, 106rem);
  height: auto;
  min-height: 100vh;
  padding: 1rem;
  overflow: visible;
}
.config-workbench::before {
  display: none;
}
.config-shell,
.config-preview-panel {
  overflow: hidden;
  border-color: color-mix(in srgb, var(--glass-edge) 64%, transparent);
  border-radius: 0.5rem;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--glass-highlight) 10%, transparent),
      transparent
    ),
    color-mix(in srgb, var(--surface) 82%, var(--bg) 18%);
  box-shadow: var(--panel-shadow);
}
.config-shell {
  position: relative;
  min-height: 43rem;
}
.config-shell-header,
.config-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.25rem;
  border-bottom: 0.0625rem solid color-mix(in srgb, #ffffff 14%, transparent);
  padding: 0 1.55rem;
}
.config-rule-toast {
  position: absolute;
  left: 50%;
  top: 0.95rem;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.35rem;
  border: 0.0625rem solid color-mix(in srgb, var(--warn) 42%, transparent);
  border-radius: 0.25rem;
  background: color-mix(in srgb, var(--warn) 14%, var(--surface-strong) 86%);
  color: color-mix(in srgb, var(--warn) 88%, var(--text) 12%);
  padding: 0 1.05rem;
  font-size: calc(0.82rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -0.35rem);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.config-rule-toast.visible {
  opacity: 1;
  transform: translate(-50%, 0);
}
.config-shell-title,
.config-shell-actions,
.config-preview-header {
  color: color-mix(in srgb, var(--text) 84%, #d7dbe0 16%);
}
.config-shell-title {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  font-size: calc(1rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
}
.config-shell-actions {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.config-save-state {
  color: color-mix(in srgb, var(--muted) 78%, #d7dbe0 22%);
  font-size: calc(0.75rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
}
.config-workbench-grid {
  display: grid;
  grid-template-columns: minmax(18rem, 22rem) minmax(34rem, 1fr) minmax(18rem, 22rem);
  gap: 1.35rem;
  align-items: start;
  padding: 2.35rem 1.65rem 1.65rem;
}
.config-column {
  min-width: 0;
}
.config-column h2,
.config-preview-header h2 {
  margin: 0;
  color: color-mix(in srgb, var(--text) 82%, #ffffff 18%);
  font-size: calc(1rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
  line-height: 1;
  text-align: center;
}
.config-column h2 {
  min-height: 2.75rem;
}
.config-column-box,
.layout-slot-board {
  border: 0.0625rem solid color-mix(in srgb, var(--border-strong) 64%, transparent);
  background: color-mix(in srgb, var(--surface-muted) 82%, transparent);
}
.component-picker {
  display: grid;
  align-content: start;
  gap: 0.5rem;
  min-height: 34.75rem;
  max-height: 34.75rem;
  overflow: auto;
  padding: 0.75rem;
}
.component-picker.is-drop-target {
  border-color: color-mix(in srgb, var(--accent-2) 86%, transparent);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 14%, transparent), transparent 52%),
    color-mix(in srgb, var(--surface-muted) 88%, transparent);
  box-shadow: inset 0 0 1.2rem color-mix(in srgb, var(--accent) 18%, transparent);
}
.business-component-card {
  display: grid;
  grid-template-columns: 3.35rem minmax(0, 1fr);
  gap: 0.75rem;
  align-items: center;
  min-height: 3.05rem;
  border: 0.0625rem solid color-mix(in srgb, var(--accent) 42%, var(--border) 58%);
  border-radius: 0.25rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent) 30%, var(--surface-strong) 70%),
    color-mix(in srgb, var(--accent) 18%, var(--surface-strong) 82%)
  );
  color: var(--text);
  padding: 0 0.75rem;
  text-align: left;
  cursor: grab;
  transition:
    transform 140ms ease,
    border-color 140ms ease,
    box-shadow 140ms ease;
}
.business-component-card:hover,
.business-component-card:focus-visible {
  border-color: color-mix(in srgb, var(--accent-2) 72%, var(--border) 28%);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent) 40%, var(--surface-strong) 60%),
    color-mix(in srgb, var(--accent) 26%, var(--surface-strong) 74%)
  );
  box-shadow: 0 0 0 0.125rem color-mix(in srgb, var(--accent) 58%, transparent);
  transform: translateY(-0.0625rem);
  outline: none;
}
.business-component-card:active {
  cursor: grabbing;
}
.component-type-badge {
  display: inline-grid;
  min-height: 1.45rem;
  place-items: center;
  border-radius: 0.25rem;
  background: color-mix(in srgb, #081018 78%, transparent);
  font-size: calc(0.75rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
}
.business-component-card.is-table .component-type-badge {
  border: 0.0625rem solid color-mix(in srgb, #8ef66d 58%, transparent);
  color: #84e56d;
}
.business-component-card.is-chart .component-type-badge {
  border: 0.0625rem solid color-mix(in srgb, #54b7ff 62%, transparent);
  color: #54b7ff;
}
.component-card-title {
  min-width: 0;
  overflow: hidden;
  font-size: calc(0.86rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.component-empty-state {
  display: grid;
  min-height: 8rem;
  place-items: center;
  color: color-mix(in srgb, var(--muted) 78%, #ffffff 22%);
  font-size: calc(0.82rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
}
.layout-slot-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(6.2rem, 1fr));
  gap: 0.7rem;
  min-height: 34.75rem;
  padding: 0.75rem;
}
.layout-slot-board-2x3 {
  grid-template-rows: repeat(2, minmax(8rem, 1fr));
  min-height: 24.5rem;
}
.layout-slot {
  display: grid;
  place-items: center;
  min-width: 0;
  min-height: 0;
  border: 0.0625rem dashed color-mix(in srgb, #ffffff 62%, transparent);
  border-radius: 0.25rem;
  color: #f4fbff;
  padding: 0.75rem;
  text-align: center;
  transition:
    border-color 140ms ease,
    filter 140ms ease,
    transform 140ms ease;
}
.layout-slot.is-chart {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-3) 22%, #429bf0), #429bf0);
}
.layout-slot.is-table {
  background: linear-gradient(180deg, color-mix(in srgb, var(--good) 24%, #61c635), #61c635);
}
.layout-slot.is-empty {
  background: transparent;
  color: color-mix(in srgb, #ffffff 42%, transparent);
}
.layout-slot:hover,
.layout-slot:focus-visible,
.layout-slot.is-drag-over {
  border-color: #ffffff;
  filter: brightness(1.07);
  outline: none;
  transform: translateY(-0.0625rem);
}
.layout-slot-title {
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: calc(0.95rem * var(--dashboard-font-scale, 1.45));
  font-weight: 900;
  line-height: 1.25;
}
.layout-slot-empty {
  color: color-mix(in srgb, #ffffff 48%, transparent);
  font-size: calc(0.78rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
}
.config-publish-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 2.6rem;
  margin: 1.45rem auto 0;
  border: 0.0625rem solid color-mix(in srgb, #7fc6ff 86%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in srgb, #0e2439 86%, transparent);
  color: #45aafc;
  padding: 0 1.1rem;
  font-size: calc(0.9rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
}
.config-column-layout {
  display: grid;
}
.property-panel {
  min-height: 34.75rem;
  max-height: 34.75rem;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  padding: 1rem;
}
.property-panel::-webkit-scrollbar {
  display: none; /* Chrome / Safari / Edge */
}
.property-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.25rem;
  min-width: 0;
  border: 0;
  margin: 0;
  padding: 0 0 1.5rem;
}
.property-group + .property-group {
  margin-top: 0.3rem;
}
.property-group legend {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  box-sizing: border-box;
  width: 100%;
  margin: 0 0 1.05rem;
  border-bottom: 0.0625rem solid color-mix(in srgb, var(--accent) 30%, var(--border) 70%);
  border-radius: 0.25rem 0.25rem 0 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--accent) 14%, var(--surface-strong) 86%),
    transparent 82%
  );
  color: color-mix(in srgb, var(--text) 84%, var(--accent-2) 16%);
  padding: 0.55rem 0.7rem;
  font-size: calc(0.8rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
  letter-spacing: 0.03em;
}
.property-group legend::before {
  content: '';
  flex: 0 0 0.2rem;
  width: 0.2rem;
  height: 1rem;
  border-radius: 62.4375rem;
  background: linear-gradient(180deg, var(--accent-2), var(--accent));
  box-shadow: 0 0 0.65rem color-mix(in srgb, var(--accent) 52%, transparent);
}
.property-radio {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: color-mix(in srgb, var(--text) 74%, #ffffff 26%);
  font-size: calc(0.82rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
  cursor: pointer;
}
.property-radio input {
  width: 0.95rem;
  height: 0.95rem;
  margin: 0;
  accent-color: #3fa0f4;
}
.property-radio:has(input:checked),
.property-radio.active {
  color: #45aafc;
}
.theme-radio {
  min-width: 4.4rem;
}
.panel-style-radio {
  min-width: 6.6rem;
}
.color-mode-radio {
  min-width: 5.2rem;
}
.chart-type-group {
  display: grid;
  gap: 0.75rem;
}
.chart-type-row {
  display: grid;
  grid-template-columns: minmax(5.25rem, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
}
.chart-type-title {
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--text) 78%, #ffffff 22%);
  font-size: calc(0.8rem * var(--dashboard-font-scale, 1.45));
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.chart-type-options {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
.chart-type-radio {
  gap: 0.35rem;
  white-space: nowrap;
}
.config-preview-panel {
  margin-top: 0.85rem;
}
.config-preview-header h2 {
  text-align: left;
}
.config-preview-header span {
  color: color-mix(in srgb, var(--muted) 80%, #ffffff 20%);
  font-size: calc(0.76rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
}
.config-live-preview {
  position: relative;
  overflow: hidden;
  margin: 1.35rem;
  aspect-ratio: 16 / 9;
  border: 0.0625rem solid color-mix(in srgb, var(--border) 58%, transparent);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 16%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--bg-soft) 46%, transparent), var(--bg));
}
.config-live-scaler {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1920px;
  height: 1080px;
  transform-origin: center center;
  will-change: transform;
}
@media (max-width: 73.75rem) {
  .config-workbench {
    width: 100%;
    padding: 0.75rem;
  }
  .config-workbench-grid {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
  .component-picker,
  .property-panel,
  .layout-slot-board {
    min-height: auto;
    max-height: none;
  }
  .layout-slot-board,
  .layout-slot-board-2x3 {
    grid-template-rows: none;
    grid-auto-rows: minmax(5.5rem, auto);
  }
  .config-live-preview {
    aspect-ratio: auto;
    min-height: 22rem;
  }
}
</style>

<!-- 引用祖先壳 .config-mode + 穿透进 BigScreen 预览,必须全局(scoped 会给祖先/子元素也加 data-v 而失配) -->
<style>
.dashboard-shell.config-mode .config-live-preview .screen-frame {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  padding: 0.6rem 0.65rem 0.45rem;
}
.dashboard-shell.config-mode .config-live-preview .screen-frame::before {
  display: block;
}
.dashboard-shell.config-mode .config-live-preview .screen-grid {
  height: auto;
}
</style>
