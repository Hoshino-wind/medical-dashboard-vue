<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ChevronDown, ChevronUp, GripVertical, LayoutGrid, RotateCcw, Save, SwatchBook } from 'lucide-vue-next'
import { moduleCatalog } from '@/data/modules'
import { themes } from '@/data/themes'
import { useDashboardStore } from '@/stores/dashboard'
import type { LayoutType } from '@/types/config'
import type { ThemeId } from '@/types/theme'

const store = useDashboardStore()
const { config, orderedModules, activeTheme } = storeToRefs(store)

const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
const savedAt = ref('')

const orderedIds = computed(() => orderedModules.value.map((item) => item.id))

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
</script>

<template>
  <main class="screen-frame">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black">大屏配置</h1>
        <div class="mt-1 text-sm text-[color:var(--muted)]">主题、布局、模块顺序(自动持久化)</div>
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

    <div class="grid grid-cols-[360px_1fr_360px] gap-4 max-[1180px]:grid-cols-1">
      <section class="panel">
        <div class="panel-header">
          <span class="panel-number"><SwatchBook class="h-4 w-4" /></span>
          <h2 class="text-[15px]">主题样式</h2>
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
          <h2 class="text-[15px]">模块顺序</h2>
        </div>
        <div class="panel-body">
          <div class="mb-3 grid grid-cols-2 gap-2">
            <button
              class="app-button"
              :class="{ active: config.layout === '2x3' }"
              @click="store.setLayout('2x3' as LayoutType)"
            >
              <LayoutGrid class="h-4 w-4" />
              2行3列
            </button>
            <button
              class="app-button"
              :class="{ active: config.layout === '3x3' }"
              @click="store.setLayout('3x3' as LayoutType)"
            >
              <LayoutGrid class="h-4 w-4" />
              3行3列
            </button>
          </div>
          <div class="grid gap-2">
            <div
              v-for="(item, index) in orderedModules"
              :key="item.id"
              class="drag-row"
              :class="{
                dragging: draggingIndex === index,
                'drag-over': dragOverIndex === index && draggingIndex !== index,
              }"
              draggable="true"
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
                <div class="mt-1 text-[11px] text-[color:var(--muted)]">{{ item.kind }}</div>
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
          <span class="panel-number">预</span>
          <h2 class="text-[15px]">配置预览</h2>
        </div>
        <div class="panel-body">
          <div class="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
            <div class="mb-3 flex items-center justify-between">
              <div>
                <div class="text-sm font-black">{{ activeTheme.name }}</div>
                <div class="text-xs text-[color:var(--muted)]">{{ config.layout }}</div>
              </div>
              <div class="text-xs text-[color:var(--good)]">
                {{ savedAt ? `已发布 ${savedAt}` : '未发布' }}
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="id in orderedIds.slice(0, config.layout === '2x3' ? 6 : 9)"
                :key="id"
                class="config-preview-tile grid aspect-[1.55] place-items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-center text-[11px] font-black"
              >
                <div>
                  <div class="text-sm text-[color:var(--accent-2)]">
                    {{ moduleCatalog.find((item) => item.id === id)?.number }}
                  </div>
                  <div class="mt-1 max-w-[80px] truncate text-[10px] text-[color:var(--muted)]">
                    {{ moduleCatalog.find((item) => item.id === id)?.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <div class="text-sm font-black">配置 JSON</div>
            <pre class="mt-3 max-h-[260px] overflow-auto rounded-xl bg-black/20 p-3 text-[11px] leading-5 text-[color:var(--muted)]">{{ JSON.stringify(
              {
                themeId: config.themeId,
                layout: config.layout,
                moduleOrder: orderedIds,
              },
              null,
              2,
            ) }}</pre>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
