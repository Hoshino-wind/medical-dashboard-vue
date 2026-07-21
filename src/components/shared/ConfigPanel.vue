<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertCircle, ChevronDown, RotateCcw, Save, X } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useScaledPreview } from '@/composables/useScaledPreview'
import BigScreen from './BigScreen.vue'
import ConfigPropertyPanel from './ConfigPropertyPanel.vue'
import type { ModuleCatalogItem, ModuleId } from '@/types/module'

const store = useDashboardStore()
const { config, availableModules, selectedModules, selectedSlotModules, activeTheme } =
  storeToRefs(store)

const { previewRef, previewScale } = useScaledPreview(1920, 1080)

const draggedModuleId = ref<ModuleId | null>(null)
const draggedSlotIndex = ref<number | null>(null)
const dragOverSlot = ref<number | null>(null)
const isComponentPoolActive = ref(false)
const savedAt = ref('')
const layoutWarning = ref('')
let warningTimer: number | undefined

const slotItems = computed(() => selectedSlotModules.value)

function moduleDisplayType(module: ModuleCatalogItem) {
  return module.displayType
}

function moduleTypeLabel(module: ModuleCatalogItem) {
  return moduleDisplayType(module) === 'table' ? '表格' : '图形'
}

function moduleById(moduleId: ModuleId | null) {
  return [...availableModules.value, ...selectedModules.value].find(
    (module) => module.id === moduleId,
  )
}

function saveConfig() {
  if (store.persistConfig()) {
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  } else {
    showLayoutWarning('浏览器存储不可用，配置未保存')
  }
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

function handleAvailableDragStart(moduleId: ModuleId) {
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
          <span class="config-save-state">{{ savedAt ? `已保存 ${savedAt}` : '自动保存' }}</span>
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
              :aria-label="
                module ? `移除布局位置 ${index + 1} 的${module.title}` : `空布局位置 ${index + 1}`
              "
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
          <button class="config-publish-button" type="button" @click="saveConfig">
            <Save class="h-4 w-4" />
            保存本地配置
          </button>
        </section>

        <section class="config-column config-column-properties" aria-label="大屏属性">
          <h2>大屏属性</h2>
          <ConfigPropertyPanel />
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

<style scoped src="./ConfigPanel.css"></style>

<!-- 引用祖先壳 .config-mode + 穿透进 BigScreen 预览,必须全局(scoped 会给祖先/子元素也加 data-v 而失配) -->
<style src="./ConfigPanel.global.css"></style>
