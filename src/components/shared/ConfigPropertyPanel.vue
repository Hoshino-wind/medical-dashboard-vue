<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { themes } from '@/data/themes'
import { configurableChartModules } from '@/data/modules'
import { useDashboardStore } from '@/stores/dashboard'
import type { ChartColorKind, ChartDisplayType, LayoutType, PanelStyle } from '@/types/config'
import type { Theme, ThemeId } from '@/types/theme'
import DashboardColorPicker from './DashboardColorPicker.vue'

const store = useDashboardStore()
const { activeTheme, config } = storeToRefs(store)

const panelStyleOptions: Array<{ id: PanelStyle; label: string }> = [
  { id: 'glass-flow', label: '流光玻璃' },
  { id: 'borderless', label: '无边框' },
  { id: 'chamfered-instrument', label: '立体边框' },
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

const chartColorControls = computed<
  Array<{
    id: ChartColorKind
    label: string
    description: string
    value: string
    overridden: boolean
  }>
>(() => [
  {
    id: 'ring',
    label: '环图颜色',
    description: '设备可用率环图',
    value: config.value.chartColors.ring ?? activeTheme.value.variables['--data-ring'],
    overridden: config.value.chartColors.ring !== null,
  },
  {
    id: 'pie',
    label: '饼图颜色',
    description: '完成率与健康状态主色',
    value: config.value.chartColors.pie ?? activeTheme.value.variables['--data-pie-primary'],
    overridden: config.value.chartColors.pie !== null,
  },
  {
    id: 'bar',
    label: '柱状图颜色',
    description: '保修、保养与巡检统计',
    value: config.value.chartColors.bar ?? activeTheme.value.variables['--data-bar'],
    overridden: config.value.chartColors.bar !== null,
  },
  {
    id: 'horizontalBar',
    label: '条形图颜色',
    description: '设备分布台数占比',
    value: config.value.chartColors.horizontalBar ?? activeTheme.value.variables['--data-bar'],
    overridden: config.value.chartColors.horizontalBar !== null,
  },
])
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

    <fieldset class="property-group chart-color-group">
      <legend>图表颜色设置</legend>
      <DashboardColorPicker
        v-for="item in chartColorControls"
        :key="item.id"
        :label="item.label"
        :description="item.description"
        :value="item.value"
        :overridden="item.overridden"
        :test-id="`${item.id}-color-picker`"
        :dark="activeTheme.mode === 'dark'"
        @change="store.setChartColor(item.id, $event)"
        @reset="store.resetChartColor(item.id)"
      />
    </fieldset>
  </div>
</template>

<style scoped src="./ConfigPropertyPanel.css"></style>
