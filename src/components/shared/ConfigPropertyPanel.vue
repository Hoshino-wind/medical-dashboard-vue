<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { themes } from '@/data/themes'
import { moduleCatalog } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'
import type { ChartDisplayType, ColorMode, LayoutType, PanelStyle } from '@/types/config'
import type { Theme, ThemeId } from '@/types/theme'

const store = useDashboardStore()
const { config } = storeToRefs(store)

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
</script>

<template>
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
        <Check v-if="style.id === config.panelStyle" class="h-3.5 w-3.5" aria-hidden="true" />
      </label>
    </fieldset>

    <fieldset class="property-group chart-type-group">
      <legend>统计图表设置</legend>
      <div v-for="module in configurableChartModules" :key="module.id" class="chart-type-row">
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
        <Check v-if="mode.id === config.ringColorMode" class="h-3.5 w-3.5" aria-hidden="true" />
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
        <Check v-if="mode.id === config.barColorMode" class="h-3.5 w-3.5" aria-hidden="true" />
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
/* 属性面板盒外框(原与另两列共用 .config-column-box 基线,拆出后自包含一份) */
.config-column-box {
  border: 0.0625rem solid color-mix(in srgb, var(--border-strong) 64%, transparent);
  background: color-mix(in srgb, var(--surface-muted) 82%, transparent);
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
@media (max-width: 73.75rem) {
  .property-panel {
    min-height: auto;
    max-height: none;
  }
}
</style>
