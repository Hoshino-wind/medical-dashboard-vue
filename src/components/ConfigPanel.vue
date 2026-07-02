<script setup>
import { computed, ref } from "vue";
import { GripVertical, LayoutGrid, RotateCcw, Save, SwatchBook } from "lucide-vue-next";
import { moduleCatalog, themes } from "../data/dashboard";

const props = defineProps({
  config: {
    type: Object,
    required: true,
  },
  modules: {
    type: Array,
    required: true,
  },
  activeTheme: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["set-theme", "set-layout", "move-module", "reset"]);
const draggingIndex = ref(null);
const savedAt = ref("");

const orderedIds = computed(() => props.modules.map((item) => item.id));

function onDragStart(index) {
  draggingIndex.value = index;
}

function onDrop(index) {
  if (draggingIndex.value === null || draggingIndex.value === index) return;
  emit("move-module", draggingIndex.value, index);
  draggingIndex.value = null;
}

function saveConfig() {
  savedAt.value = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}
</script>

<template>
  <main class="screen-frame">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black">大屏配置</h1>
        <div class="mt-1 text-sm text-[color:var(--muted)]">主题、布局、模块顺序</div>
      </div>
      <div class="flex gap-2">
        <button class="app-button" @click="emit('reset')">
          <RotateCcw class="h-4 w-4" />
          重置
        </button>
        <button class="app-button active" @click="saveConfig">
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
            @click="emit('set-theme', theme.id)"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <div class="text-base font-black">{{ theme.name }}</div>
                <div class="mt-1 text-xs text-[color:var(--muted)]">{{ theme.description }}</div>
              </div>
              <div class="flex gap-1">
                <span v-for="color in theme.preview" :key="color" class="h-8 w-8 rounded-full border border-white/20" :style="{ background: color }"></span>
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
            <button class="app-button" :class="{ active: config.layout === '2x3' }" @click="emit('set-layout', '2x3')">
              <LayoutGrid class="h-4 w-4" />
              2行3列
            </button>
            <button class="app-button" :class="{ active: config.layout === '3x3' }" @click="emit('set-layout', '3x3')">
              <LayoutGrid class="h-4 w-4" />
              3行3列
            </button>
          </div>
          <div class="grid gap-2">
            <div
              v-for="(item, index) in modules"
              :key="item.id"
              class="drag-row"
              draggable="true"
              @dragstart="onDragStart(index)"
              @dragover.prevent
              @drop="onDrop(index)"
            >
              <GripVertical class="h-4 w-4 text-[color:var(--muted)]" />
              <span class="panel-number">{{ item.number }}</span>
              <div class="min-w-0">
                <div class="truncate text-sm font-black">{{ item.title }}</div>
                <div class="mt-1 text-[11px] text-[color:var(--muted)]">{{ item.kind }}</div>
              </div>
              <div class="text-right text-xs text-[color:var(--muted)]">位置 {{ index + 1 }}</div>
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
              <div class="text-xs text-[color:var(--good)]">{{ savedAt ? `已保存 ${savedAt}` : "未发布" }}</div>
            </div>
            <div class="grid gap-2" :class="config.layout === '3x3' ? 'grid-cols-3' : 'grid-cols-3'">
              <div
                v-for="(id, index) in orderedIds.slice(0, config.layout === '2x3' ? 6 : 9)"
                :key="id"
                class="grid aspect-[1.55] place-items-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] text-center text-[11px] font-black"
              >
                {{ moduleCatalog.find((item) => item.id === id)?.number }}
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <div class="text-sm font-black">保存JSON</div>
            <pre class="mt-3 max-h-[260px] overflow-auto rounded-xl bg-black/20 p-3 text-[11px] leading-5 text-[color:var(--muted)]">{{ JSON.stringify({
              themeId: config.themeId,
              layout: config.layout,
              moduleOrder: orderedIds,
            }, null, 2) }}</pre>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>
