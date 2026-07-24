<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { themes } from '@/data/themes'
import { configurableChartModules } from '@/data/modules'
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
  { id: 'custom', label: '自定义' },
]

const chartTypeOptions: Array<{ id: ChartDisplayType; label: string }> = [
  { id: 'line', label: '折线图' },
  { id: 'bar', label: '柱状图' },
]

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

function setRingCustomColor(event: Event) {
  store.setRingCustomColor((event.target as HTMLInputElement).value)
}

function setBarCustomColor(event: Event) {
  store.setBarCustomColor((event.target as HTMLInputElement).value)
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
      <label v-if="config.ringColorMode === 'custom'" class="custom-color-field">
        <span>自定义颜色</span>
        <input
          data-testid="ring-custom-color"
          type="color"
          :value="config.ringCustomColor"
          @input="setRingCustomColor"
        />
        <output>{{ config.ringCustomColor.toUpperCase() }}</output>
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
      <label v-if="config.barColorMode === 'custom'" class="custom-color-field">
        <span>自定义颜色</span>
        <input
          data-testid="bar-custom-color"
          type="color"
          :value="config.barCustomColor"
          @input="setBarCustomColor"
        />
        <output>{{ config.barCustomColor.toUpperCase() }}</output>
      </label>
    </fieldset>
  </div>
</template>

<style scoped src="./ConfigPropertyPanel.css"></style>
