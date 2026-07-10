<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { AlertCircle, Check, ChevronDown, LayoutGrid, RotateCcw, Save, X } from 'lucide-vue-next'
import { themes } from '@/data/themes'
import { useDashboardStore } from '@/stores/dashboard'
import BigScreen from './BigScreen.vue'
import type { LayoutType } from '@/types/config'
import type { ModuleCatalogItem } from '@/types/module'
import type { Theme, ThemeId } from '@/types/theme'

type ModuleDisplayType = 'table' | 'chart'
type ConfirmAction = 'clear' | 'reset' | null

const store = useDashboardStore()
const { config, availableModules, selectedModules, selectedSlotModules, activeTheme, slotCount } =
  storeToRefs(store)

// 效果预览等比缩小：基于 1920 基准宽度计算 scale
const PREVIEW_BASE_WIDTH = 1920
const PREVIEW_BASE_HEIGHT = 1080
const previewRef = ref<HTMLElement | null>(null)
const layoutSlotBoardRef = ref<HTMLElement | null>(null)
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
const confirmAction = ref<ConfirmAction>(null)
const confirmDialogRef = ref<HTMLDivElement | null>(null)
const placedSlotIndex = ref<number | null>(null)
let confirmTrigger: HTMLElement | null = null
let warningTimer: number | undefined
let placedTimer: number | undefined

const tableModuleIds = new Set(['repairOrders', 'inspectionOrders', 'healthTrend'])

const slotItems = computed(() => selectedSlotModules.value)

const configuredCount = computed(() => selectedModules.value.length)

function moduleDisplayType(module: ModuleCatalogItem): ModuleDisplayType {
  return tableModuleIds.has(module.id) ? 'table' : 'chart'
}

function moduleTypeLabel(module: ModuleCatalogItem) {
  return moduleDisplayType(module) === 'table' ? '表格' : '图形'
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

function slotDropState(index: number): 'allowed' | 'blocked' | null {
  if (!draggedModuleId.value) return null
  const allowed =
    draggedSlotIndex.value !== null
      ? store.canMoveSelectedModule(draggedSlotIndex.value, index)
      : store.canPlaceModuleInSlot(draggedModuleId.value, index)
  return allowed ? 'allowed' : 'blocked'
}

function slotAriaLabel(module: ModuleCatalogItem | null, index: number) {
  const baseLabel = module ? `布局位置 ${index + 1}：${module.title}` : `空布局位置 ${index + 1}`
  const dropState = slotDropState(index)
  if (dropState === 'allowed') return `${baseLabel}，可以放置`
  if (dropState === 'blocked') return `${baseLabel}，不可放置`
  return baseLabel
}

const dragPlacementAnnouncement = computed(() => {
  if (!draggedModuleId.value) return ''

  const allowed: number[] = []
  const blocked: number[] = []
  slotItems.value.forEach((_, index) => {
    if (slotDropState(index) === 'allowed') allowed.push(index + 1)
    else blocked.push(index + 1)
  })

  const allowedLabel = allowed.length > 0 ? allowed.join('、') : '无'
  const blockedLabel = blocked.length > 0 ? blocked.join('、') : '无'
  return `拖拽预检：可以放置到位置 ${allowedLabel}；不可放置到位置 ${blockedLabel}`
})

function markSlotPlaced(index: number) {
  placedSlotIndex.value = index
  if (placedTimer) window.clearTimeout(placedTimer)
  placedTimer = window.setTimeout(() => {
    placedSlotIndex.value = null
  }, 520)
}

function handleSlotDrop(index: number) {
  if (!draggedModuleId.value) {
    clearDragState()
    return
  }

  const dropState = slotDropState(index)
  const placed =
    dropState === 'allowed' && draggedSlotIndex.value !== null
      ? store.moveSelectedModule(draggedSlotIndex.value, index)
      : dropState === 'allowed'
        ? store.placeModuleInSlot(draggedModuleId.value, index)
        : false

  if (!placed) {
    showLayoutWarning()
  } else {
    markSlotPlaced(index)
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

async function removeModuleFromSlot(index: number) {
  store.removeModuleFromLayout(index)
  await nextTick()
  layoutSlotBoardRef.value
    ?.querySelector<HTMLElement>(`[data-testid="layout-slot-${index}"]`)
    ?.focus()
}

async function openConfirmation(action: Exclude<ConfirmAction, null>, event: MouseEvent) {
  confirmTrigger = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  confirmAction.value = action
  await nextTick()
  confirmDialogRef.value?.querySelector<HTMLButtonElement>('button')?.focus()
}

async function closeConfirmation() {
  confirmAction.value = null
  await nextTick()
  confirmTrigger?.focus()
  confirmTrigger = null
}

function trapConfirmationFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') return
  const buttons = Array.from(
    confirmDialogRef.value?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
  )
  if (buttons.length === 0) return
  const first = buttons[0]
  const last = buttons[buttons.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

async function confirmDestructiveAction() {
  const action = confirmAction.value
  if (action === 'clear') store.clearSelectedModules()
  if (action === 'reset') store.resetConfig()
  await closeConfirmation()
}

async function requestPreviewFullscreen() {
  const preview = previewRef.value
  if (!preview?.requestFullscreen) {
    showLayoutWarning('当前浏览器不支持全屏预览')
    return
  }
  try {
    await preview.requestFullscreen()
  } catch {
    showLayoutWarning('浏览器未能进入全屏预览')
  }
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
  if (warningTimer) window.clearTimeout(warningTimer)
  if (placedTimer) window.clearTimeout(placedTimer)
})
</script>

<template>
  <main class="screen-frame config-workbench">
    <section class="config-shell panel">
      <div class="config-shell-header" :inert="confirmAction ? true : undefined">
        <div class="config-shell-title">
          <ChevronDown class="h-4 w-4" aria-hidden="true" />
          <span>配置信息</span>
        </div>
        <div class="config-rule-toast" :class="{ visible: layoutWarning }" role="status">
          <AlertCircle class="h-4 w-4" aria-hidden="true" />
          <span>{{ layoutWarning || '每一行只允许存在一个【表格】类型组件' }}</span>
        </div>
        <div class="config-shell-actions">
          <span class="config-save-state">修改自动保存到本机</span>
          <span v-if="savedAt" class="config-published-state" aria-live="polite">
            已发布 {{ savedAt }}
          </span>
          <button class="app-button is-clear" type="button" @click="openConfirmation('clear', $event)">
            <X class="h-4 w-4" />
            清空布局
          </button>
          <button class="app-button is-reset" type="button" @click="openConfirmation('reset', $event)">
            <RotateCcw class="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div
        v-if="confirmAction"
        ref="confirmDialogRef"
        class="config-confirm-layer"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="config-confirm-title"
        @mousedown.self.prevent
        @keydown.esc.prevent="closeConfirmation"
        @keydown.tab="trapConfirmationFocus"
      >
        <div class="config-confirm-card">
          <strong id="config-confirm-title">
            {{ confirmAction === 'clear' ? '确认清空当前布局？' : '确认恢复默认配置？' }}
          </strong>
          <div class="config-confirm-actions">
            <button type="button" @click="closeConfirmation">取消</button>
            <button type="button" class="is-danger" @click="confirmDestructiveAction">确认</button>
          </div>
        </div>
      </div>

      <div class="config-workbench-grid" :inert="confirmAction ? true : undefined">
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
            ref="layoutSlotBoardRef"
            class="layout-slot-board"
            :class="{ 'layout-slot-board-2x3': config.layout === '2x3' }"
          >
            <p
              data-testid="drag-placement-status"
              class="config-drag-status"
              role="status"
              aria-live="polite"
            >
              {{ dragPlacementAnnouncement }}
            </p>
            <div
              v-for="(module, index) in slotItems"
              :key="index"
              class="layout-slot"
              :class="[
                module ? `is-${moduleDisplayType(module)}` : 'is-empty',
                slotDropState(index) === 'allowed' && 'is-drop-allowed',
                slotDropState(index) === 'blocked' && 'is-drop-blocked',
                placedSlotIndex === index && 'is-placed',
                dragOverSlot === index && 'is-drag-over',
              ]"
              role="group"
              :aria-label="slotAriaLabel(module, index)"
              tabindex="-1"
              :draggable="Boolean(module)"
              :data-testid="`layout-slot-${index}`"
              @dragstart="handleSlotDragStart(index, module)"
              @dragenter.prevent="dragOverSlot = index"
              @dragover.prevent
              @drop.prevent="handleSlotDrop(index)"
              @dragend="clearDragState"
            >
              <span v-if="module" class="layout-slot-title">{{ module.title }}</span>
              <span v-else class="layout-slot-empty">将业务组件拖动至此处</span>
              <button
                v-if="module"
                class="layout-slot-remove"
                type="button"
                :data-testid="`remove-layout-slot-${index}`"
                :aria-label="`移除${module.title}`"
                @click.stop="removeModuleFromSlot(index)"
              >
                <X class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <button class="config-publish-button" type="button" @click="publishConfig">
            <Save class="h-4 w-4" />
            发布演示
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
                <span class="layout-choice-preview is-2x3" aria-hidden="true">
                  <i v-for="cell in 6" :key="cell"></i>
                </span>
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
                <span class="layout-choice-preview is-3x3" aria-hidden="true">
                  <i v-for="cell in 9" :key="cell"></i>
                </span>
                <span>3行3列</span>
              </label>
            </fieldset>

            <fieldset class="property-group panel-border-group">
              <legend>边框样式</legend>
              <label class="property-radio panel-border-radio">
                <input
                  type="radio"
                  name="panel-border"
                  value="borderless"
                  :checked="config.panelBorderMode === 'borderless'"
                  @change="store.setPanelBorderMode('borderless')"
                />
                <span
                  class="panel-border-preview panel-border-preview--borderless"
                  aria-hidden="true"
                ></span>
                <span>无边框流光</span>
              </label>
              <label class="property-radio panel-border-radio">
                <input
                  type="radio"
                  name="panel-border"
                  value="standard"
                  :checked="config.panelBorderMode === 'standard'"
                  @change="store.setPanelBorderMode('standard')"
                />
                <span
                  class="panel-border-preview panel-border-preview--standard"
                  aria-hidden="true"
                ></span>
                <span>标准边框</span>
              </label>
              <label class="property-radio panel-border-radio">
                <input
                  type="radio"
                  name="panel-border"
                  value="stereoscopic"
                  :checked="config.panelBorderMode === 'stereoscopic'"
                  @change="store.setPanelBorderMode('stereoscopic')"
                />
                <span
                  class="panel-border-preview panel-border-preview--stereoscopic"
                  aria-hidden="true"
                ></span>
                <span>立体框架</span>
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
                <span class="theme-swatch" aria-hidden="true">
                  <i
                    v-for="color in theme.preview"
                    :key="color"
                    class="theme-swatch-dot"
                    :style="{ '--swatch-color': color }"
                  ></i>
                </span>
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

    <section
      class="config-preview-panel panel"
      aria-label="效果预览"
      :inert="confirmAction ? true : undefined"
    >
      <div class="config-preview-header">
        <h2>效果预览</h2>
        <div class="config-preview-actions">
          <span>{{ activeTheme.name }} · {{ config.layout }}</span>
          <button
            data-testid="preview-fullscreen"
            class="app-button"
            type="button"
            @click="requestPreviewFullscreen"
          >
            全屏预览
          </button>
        </div>
      </div>
      <div ref="previewRef" class="config-live-preview">
        <div class="config-live-scaler" :style="{ transform: `translate(-50%, -50%) scale(${previewScale})` }">
          <BigScreen />
        </div>
      </div>
    </section>
  </main>
</template>
