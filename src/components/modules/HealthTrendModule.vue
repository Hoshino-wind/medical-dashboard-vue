<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, BadgeCheck, Wrench } from 'lucide-vue-next'
import CountUp from '../shared/CountUp.vue'
import HealthPieChart from '../charts/HealthPieChart.vue'
import type { HealthTrendData } from '@/types/dashboard'
import type { FieldConfig } from '@/types/config'
import type { Theme } from '@/types/theme'

const props = defineProps<{
  data: HealthTrendData
  theme: Theme
  fields?: FieldConfig[]
}>()

const fieldMap = computed(() => new Map((props.fields ?? []).map((field) => [field.key, field])))

function field(key: string, fallback: string): FieldConfig {
  return fieldMap.value.get(key) ?? { key, label: fallback, visible: true }
}

const cards = computed(() =>
  [
    {
      key: 'online',
      fallback: '运行正常',
      value: props.data.online,
      unit: '台',
      icon: BadgeCheck,
      tone: 'var(--good)',
      color: props.theme.variables['--good'],
    },
    {
      key: 'warning',
      fallback: '维保预警',
      value: props.data.warning,
      unit: '台',
      icon: AlertTriangle,
      tone: 'var(--warn)',
      color: props.theme.variables['--warn'],
    },
    {
      key: 'repairing',
      fallback: '维修中',
      value: props.data.repairing,
      unit: '台',
      icon: Wrench,
      tone: 'var(--danger)',
      color: props.theme.variables['--danger'],
    },
    {
      key: 'pending',
      fallback: '即将保养',
      value: props.data.pending,
      unit: '台',
      icon: AlertTriangle,
      tone: 'var(--accent-3)',
      color: props.theme.variables['--accent-3'],
    },
  ].flatMap((card) => {
    const config = field(card.key, card.fallback)
    if (!config.visible) return []
    return [{ ...card, label: config.label, unit: config.unit ?? card.unit }]
  }),
)

const scoreField = computed(() => field('score', '健康评分'))

const pieItems = computed(() =>
  cards.value.map((card) => ({ name: card.label, value: card.value, color: card.color })),
)

const pieTotal = computed(() => pieItems.value.reduce((sum, item) => sum + item.value, 0))
</script>

<template>
  <div class="health-layout">
    <div class="health-side">
      <div
        v-for="card in cards.slice(0, 2)"
        :key="card.key"
        class="kpi-card flex items-center gap-3"
      >
        <component :is="card.icon" class="h-5 w-5" :style="{ color: card.tone }" />
        <div>
          <div class="kpi-label">{{ card.label }}</div>
          <div class="text-xl font-black" :style="{ color: card.tone }">
            <CountUp :value="card.value" /><span class="ml-1 text-xs">{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="health-stage">
      <HealthPieChart :items="pieItems" :total="pieTotal" :tone="theme.variables['--accent']" />
      <div v-if="scoreField.visible" class="health-score-pill">
        <span>{{ scoreField.label }}</span>
        <b><CountUp :value="data.score" :decimals="1" /></b>
      </div>
    </div>

    <div class="health-side">
      <div v-for="card in cards.slice(2)" :key="card.key" class="kpi-card flex items-center gap-3">
        <component :is="card.icon" class="h-5 w-5" :style="{ color: card.tone }" />
        <div>
          <div class="kpi-label">{{ card.label }}</div>
          <div class="text-xl font-black" :style="{ color: card.tone }">
            <CountUp :value="card.value" /><span class="ml-1 text-xs">{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
