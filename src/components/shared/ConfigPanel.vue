<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  RotateCcw,
  Save,
  SlidersHorizontal,
  SwatchBook,
} from 'lucide-vue-next'
import { moduleCatalog } from '@/data/modules'
import { themes } from '@/data/themes'
import { useDashboardStore } from '@/stores/dashboard'
import type { FieldConfig } from '@/types/config'
import type { ThemeId } from '@/types/theme'

const store = useDashboardStore()
const { config, orderedModules, activeTheme } = storeToRefs(store)

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const savedAt = ref('')
const selectedModuleId = ref(moduleCatalog[0]?.id ?? '')

const orderedIds = computed(() => orderedModules.value.map((item) => item.id))
const selectedModule = computed(
  () =>
    orderedModules.value.find((item) => item.id === selectedModuleId.value) ??
    orderedModules.value[0],
)
const selectedSettings = computed(() =>
  selectedModule.value ? config.value.moduleSettings[selectedModule.value.id] : undefined,
)

function selectModule(id: string) {
  selectedModuleId.value = id
}

function onDragStart(index: number) {
  draggingIndex.value = index
}

function onDragEnter(index: number) {
  dragOverIndex.value = index
}

function onDrop(index: number) {
  if (draggingIndex.value === null) return
  if (draggingIndex.value === index) {
    draggingIndex.value = null
    dragOverIndex.value = null
    return
  }
  store.moveModule(draggingIndex.value, index)
  draggingIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggingIndex.value = null
  dragOverIndex.value = null
}

/**
 * "保存发布":配置在每次变更时已由 store 自动写入 localStorage,
 * 此处仅给出可视的发布确认反馈(时间戳)。
 */
function publishConfig() {
  savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

function moveUp(index: number) {
  if (index <= 0) return
  store.moveModule(index, index - 1)
}

function moveDown(index: number) {
  if (index >= orderedModules.value.length - 1) return
  store.moveModule(index, index + 1)
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement).value
}

function updateField(field: FieldConfig, event: Event) {
  if (!selectedModule.value) return
  store.updateFieldLabel(selectedModule.value.id, field.key, inputValue(event))
}

function toggleField(field: FieldConfig, event: Event) {
  if (!selectedModule.value) return
  store.toggleField(selectedModule.value.id, field.key, (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <main class="screen-frame">
    <div class="config-topbar">
      <div>
        <h1 class="text-2xl font-black">大屏配置</h1>
        <div class="mt-1 text-sm text-[color:var(--muted)]">
          固定九模块，支持主题、顺序、标题与字段配置
        </div>
      </div>
      <div class="flex gap-2">
        <button class="app-button" @click="store.resetConfig()">
          <RotateCcw class="h-4 w-4" />
          重置
        </button>
        <button class="app-button active" @click="publishConfig">
          <Save class="h-4 w-4" />
          保存发布
        </button>
      </div>
    </div>

    <div class="config-workspace">
      <section class="panel">
        <div class="panel-header">
          <span class="panel-number"><SwatchBook class="h-4 w-4" /></span>
          <h2 class="text-[0.9375rem]">主题样式</h2>
        </div>
        <div class="panel-body grid gap-3">
          <button
            v-for="theme in themes"
            :key="theme.id"
            class="theme-card text-left"
            :class="{ active: theme.id === config.themeId }"
            @click="store.setTheme(theme.id as ThemeId)"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-base font-black">{{ theme.name }}</div>
                <div class="mt-1 text-xs text-[color:var(--muted)]">{{ theme.description }}</div>
              </div>
              <div class="flex gap-1">
                <span
                  v-for="color in theme.preview"
                  :key="color"
                  class="h-8 w-8 rounded-full border border-white/20"
                  :style="{ background: color }"
                ></span>
              </div>
            </div>
          </button>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-number"><GripVertical class="h-4 w-4" /></span>
          <h2 class="text-[0.9375rem]">九模块顺序</h2>
        </div>
        <div class="panel-body">
          <div class="config-note">
            当前大屏固定显示 9 个模块。拖拽或点击箭头调整位置，点击模块可编辑字段。
          </div>
          <div class="grid gap-2">
            <div
              v-for="(item, index) in orderedModules"
              :key="item.id"
              class="drag-row"
              :class="{
                active: selectedModule?.id === item.id,
                dragging: draggingIndex === index,
                'drag-over': dragOverIndex === index && draggingIndex !== index,
              }"
              draggable="true"
              @click="selectModule(item.id)"
              @dragstart="onDragStart(index)"
              @dragenter="onDragEnter(index)"
              @dragover.prevent
              @drop="onDrop(index)"
              @dragend="onDragEnd"
            >
              <GripVertical class="h-4 w-4 text-[color:var(--muted)]" />
              <span class="panel-number">{{ item.number }}</span>
              <div class="min-w-0">
                <div class="truncate text-sm font-black">{{ item.title }}</div>
                <div class="mt-1 text-[0.6875rem] text-[color:var(--muted)]">
                  {{ item.kind }} · {{ item.size }}
                </div>
              </div>
              <div class="text-right text-xs text-[color:var(--muted)]">位置 {{ index + 1 }}</div>
              <div class="order-actions">
                <button
                  class="icon-button"
                  :data-testid="`move-up-${item.id}`"
                  :disabled="index === 0"
                  title="上移"
                  @click.stop="moveUp(index)"
                >
                  <ChevronUp class="h-3.5 w-3.5" />
                </button>
                <button
                  class="icon-button"
                  :data-testid="`move-down-${item.id}`"
                  :disabled="index === orderedModules.length - 1"
                  title="下移"
                  @click.stop="moveDown(index)"
                >
                  <ChevronDown class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <span class="panel-number"><SlidersHorizontal class="h-4 w-4" /></span>
          <h2 class="text-[0.9375rem]">字段配置</h2>
        </div>
        <div v-if="selectedModule && selectedSettings" class="panel-body">
          <div class="field-editor-head">
            <span class="panel-number">{{ selectedModule.number }}</span>
            <div class="min-w-0">
              <div class="truncate text-sm font-black">{{ selectedModule.title }}</div>
              <div class="mt-1 text-xs text-[color:var(--muted)]">{{ selectedModule.id }}</div>
            </div>
          </div>

          <label class="config-label" :for="`${selectedModule.id}-title`">模块标题</label>
          <input
            :id="`${selectedModule.id}-title`"
            class="config-input"
            :value="selectedSettings.title"
            @input="store.updateModuleTitle(selectedModule.id, inputValue($event))"
          />

          <label class="config-label" :for="`${selectedModule.id}-subtitle`">副标题</label>
          <input
            :id="`${selectedModule.id}-subtitle`"
            class="config-input"
            :value="selectedSettings.subtitle ?? ''"
            placeholder="可留空"
            @input="store.updateModuleSubtitle(selectedModule.id, inputValue($event))"
          />

          <div class="field-list">
            <label v-for="field in selectedSettings.fields" :key="field.key" class="field-row">
              <input
                class="field-toggle"
                type="checkbox"
                :checked="field.visible"
                @change="toggleField(field, $event)"
              />
              <div class="min-w-0">
                <div class="field-key">{{ field.key }}</div>
                <input
                  class="config-input compact"
                  :value="field.label"
                  @input="updateField(field, $event)"
                />
              </div>
              <span class="field-unit">{{ field.unit }}</span>
            </label>
          </div>

          <div class="config-preview-card">
            <div class="mb-3 flex items-center justify-between">
              <div>
                <div class="text-sm font-black">{{ activeTheme.name }}</div>
                <div class="text-xs text-[color:var(--muted)]">九模块 · {{ config.layout }}</div>
              </div>
              <div class="text-xs text-[color:var(--good)]">
                {{ savedAt ? `已发布 ${savedAt}` : '自动保存中' }}
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="id in orderedIds"
                :key="id"
                class="config-preview-tile grid aspect-[1.55] place-items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-center text-[0.6875rem] font-black"
              >
                <div>
                  <div class="text-sm text-[color:var(--accent-2)]">
                    {{ moduleCatalog.find((item) => item.id === id)?.number }}
                  </div>
                  <div class="mt-1 max-w-[5rem] truncate text-[0.625rem] text-[color:var(--muted)]">
                    {{ config.moduleSettings[id]?.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
