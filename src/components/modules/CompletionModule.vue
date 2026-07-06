<script setup lang="ts">
import { computed } from 'vue'
import { Bell, CalendarCheck, CheckCircle2, UserRound } from 'lucide-vue-next'
import CountUp from '../shared/CountUp.vue'
import type { InspectionOrders } from '@/types/dashboard'
import type { FieldConfig } from '@/types/config'

const props = defineProps<{
  data: InspectionOrders
  fields?: FieldConfig[]
}>()

const fieldMap = computed(() => new Map((props.fields ?? []).map((field) => [field.key, field])))

function field(key: string, fallback: string): FieldConfig {
  return fieldMap.value.get(key) ?? { key, label: fallback, visible: true }
}

const rateField = computed(() => field('rate', '本月巡检完成率'))

const cards = computed(() =>
  [
    {
      key: 'total',
      fallback: '巡检工单总数',
      value: props.data.total,
      unit: '单',
      icon: UserRound,
      tone: 'var(--accent)',
    },
    {
      key: 'finished',
      fallback: '已完成',
      value: props.data.finished,
      unit: '单',
      icon: CheckCircle2,
      tone: 'var(--good)',
    },
    {
      key: 'waiting',
      fallback: '待巡检',
      value: props.data.waiting,
      unit: '单',
      icon: CalendarCheck,
      tone: 'var(--accent-3)',
    },
    {
      key: 'overdue',
      fallback: '逾期未检',
      value: props.data.overdue,
      unit: '单',
      icon: Bell,
      tone: 'var(--warn)',
    },
  ].flatMap((card) => {
    const config = field(card.key, card.fallback)
    if (!config.visible) return []
    return [{ ...card, label: config.label, unit: config.unit ?? card.unit }]
  }),
)
</script>

<template>
  <div class="inspection-hub">
    <div class="hub-side">
      <div v-for="card in cards.slice(0, 2)" :key="card.key" class="kpi-card hub-card">
        <component :is="card.icon" class="h-5 w-5" :style="{ color: card.tone }" />
        <div>
          <div class="kpi-label">{{ card.label }}</div>
          <div class="hub-number">
            <CountUp :value="card.value" /><span>{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="rateField.visible" class="completion-orb">
      <span class="holo-ring holo-ring-wide" aria-hidden="true"></span>
      <span class="holo-ring holo-ring-core" aria-hidden="true"></span>
      <div class="completion-content">
        <div class="completion-label">{{ rateField.label }}</div>
        <div class="completion-value"><CountUp :value="data.rate" :decimals="1" />%</div>
      </div>
    </div>

    <div class="hub-side">
      <div v-for="card in cards.slice(2)" :key="card.key" class="kpi-card hub-card">
        <component :is="card.icon" class="h-5 w-5" :style="{ color: card.tone }" />
        <div>
          <div class="kpi-label">{{ card.label }}</div>
          <div class="hub-number">
            <CountUp :value="card.value" /><span>{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
