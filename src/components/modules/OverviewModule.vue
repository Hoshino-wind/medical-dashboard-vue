<script setup lang="ts">
import { computed } from 'vue'
import { Activity, ClipboardList, MonitorCog, ShieldCheck, Wrench } from 'lucide-vue-next'
import MetricRing from '../shared/MetricRing.vue'
import CountUp from '../shared/CountUp.vue'
import type { OverviewData } from '@/types/dashboard'
import type { FieldConfig } from '@/types/config'
import { pxToRem } from '@/utils/rem'

const props = defineProps<{
  data: OverviewData
  fields?: FieldConfig[]
}>()

const overviewRingSize = pxToRem(150)

const fieldMap = computed(() => new Map((props.fields ?? []).map((field) => [field.key, field])))

function field(key: string, fallback: string): FieldConfig {
  return fieldMap.value.get(key) ?? { key, label: fallback, visible: true }
}

const availabilityField = computed(() => field('availability', '设备可用率'))

const metricCards = computed(() =>
  [
    {
      key: 'total',
      fallback: '设备总数',
      value: props.data.total,
      unit: '台',
      icon: MonitorCog,
      tone: 'var(--accent)',
      span: false,
    },
    {
      key: 'available',
      fallback: '可用设备',
      value: props.data.available,
      unit: '台',
      icon: ShieldCheck,
      tone: 'var(--good)',
      span: false,
    },
    {
      key: 'repairing',
      fallback: '维修中',
      value: props.data.repairing,
      unit: '台',
      icon: Wrench,
      tone: 'var(--danger)',
      span: false,
    },
    {
      key: 'maintenanceDue',
      fallback: '待保养',
      value: props.data.maintenanceDue,
      unit: '台',
      icon: ClipboardList,
      tone: 'var(--warn)',
      span: false,
    },
    {
      key: 'inspectionDue',
      fallback: '待巡检',
      value: props.data.inspectionDue,
      unit: '台',
      icon: Activity,
      tone: 'var(--accent-2)',
      span: true,
    },
  ].flatMap((card) => {
    const config = field(card.key, card.fallback)
    if (!config.visible) return []
    return [{ ...card, label: config.label, unit: config.unit ?? card.unit }]
  }),
)
</script>

<template>
  <div class="overview-layout">
    <div v-if="availabilityField.visible" class="overview-ring">
      <MetricRing
        class="overview-feature-ring"
        :value="data.availability"
        :label="availabilityField.label"
        :count="data.available"
        :size="overviewRingSize"
        :inside-label="availabilityField.label"
        :show-footer="false"
        large
      />
    </div>
    <div class="overview-metrics">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="overview-stat with-icon"
        :class="{ 'span-2': card.span }"
      >
        <component :is="card.icon" class="overview-stat-icon" :style="{ color: card.tone }" />
        <div>
          <div class="kpi-label">{{ card.label }}</div>
          <div class="overview-value" :style="{ color: card.tone }">
            <CountUp :value="card.value" /><span>{{ card.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
