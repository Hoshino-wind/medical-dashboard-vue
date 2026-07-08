<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertCircle, Check, ChevronDown, LayoutGrid, RotateCcw, Save, X } from 'lucide-vue-next'
import { themes } from '@/data/themes'
import { useDashboardStore } from '@/stores/dashboard'
import BigScreen from './BigScreen.vue'
import type { LayoutType } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

type ModuleDisplayType = 'table' | 'chart'

const store = useDashboardStore()
const { config, availableModules, selectedModules, selectedSlotModules, activeTheme, slotCount } =
  storeToRefs(store)

const draggedModuleId = ref<string | null>(null)
const draggedSlotIndex = ref<number | null>(null)
const dragOverSlot = ref<number | null>(null)
const isComponentPoolActive = ref(false)
const savedAt = ref('')
const layoutWarning = ref('')
let warningTimer: number | undefined

const tableModuleIds = new Set(['repairOrders', 'inspectionOrders', 'healthTrend'])

const slotItems = computed(() => selectedSlotModules.value)

const configuredCount = computed(() => selectedModules.value.length)

function moduleDisplayType(module: ModuleCatalogItem): ModuleDisplayType {
  return tableModuleIds.has(module.id) ? 'table' : 'chart'
}

function moduleTypeLabel(module: ModuleCatalogItem) {
  return moduleDisplayType(module) === 'table' ? '表格' : '图形'
}

function moduleById(moduleId: string | null) {
  return [...availableModules.value, ...selectedModules.value].find((module) => module.id === moduleId)
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
      placed = store.moveSelectedModule(
        draggedSlotIndex.value,
        index,
      )
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

            <div class="property-summary">
              <LayoutGrid class="h-4 w-4" aria-hidden="true" />
              <span>{{ configuredCount }}/{{ slotCount }} 已配置</span>
            </div>
          </div>
        </section>
      </div>
    </section>

    <section class="config-preview-panel panel" aria-label="效果预览">
      <div class="config-preview-header">
        <h2>效果预览</h2>
        <span>{{ activeTheme.name }} · {{ config.layout }}</span>
      </div>
      <div class="config-live-preview">
        <BigScreen />
      </div>
    </section>
  </main>
</template>
