<script setup lang="ts">
import { Activity, ClipboardList, MonitorCog, ShieldCheck, Wrench } from 'lucide-vue-next'
import MetricRing from '../shared/MetricRing.vue'
import CountUp from '../shared/CountUp.vue'
import type { OverviewData } from '@/types/dashboard'
import { pxToRem } from '@/utils/rem'

defineProps<{
  data: OverviewData
}>()

const overviewRingSize = pxToRem(176)
</script>

<template>
  <div class="overview-layout">
    <div class="overview-ring">
      <MetricRing
        class="overview-feature-ring"
        :value="data.availability"
        label="设备可用率"
        :count="data.available"
        :size="overviewRingSize"
        tone="var(--data-ring)"
        inside-label="设备可用率"
        :show-footer="false"
        large
      />
    </div>
    <div class="overview-metrics">
      <div class="overview-stat overview-stat--total with-icon">
        <MonitorCog class="overview-stat-icon text-[color:var(--data-pie-primary)]" />
        <div>
          <div class="kpi-label">设备总数</div>
          <div class="overview-value text-[color:var(--data-pie-primary)]">
            <CountUp :value="data.total" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat overview-stat--available with-icon">
        <ShieldCheck class="overview-stat-icon text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">可用设备</div>
          <div class="overview-value text-[color:var(--good)]">
            <CountUp :value="data.available" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat overview-stat--repair with-icon is-alert is-danger">
        <Wrench class="overview-stat-icon text-[color:var(--danger)]" />
        <div>
          <div class="kpi-label">维修中</div>
          <div class="overview-value text-[color:var(--danger)]">
            <CountUp :value="data.repairing" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat overview-stat--maintenance with-icon is-alert is-warn">
        <ClipboardList class="overview-stat-icon text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">待保养</div>
          <div class="overview-value text-[color:var(--warn)]">
            <CountUp :value="data.maintenanceDue" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat overview-stat--inspection with-icon">
        <Activity class="overview-stat-icon text-[color:var(--data-inspection-line)]" />
        <div>
          <div class="kpi-label">待巡检</div>
          <div class="overview-value text-[color:var(--data-inspection-line)]">
            <CountUp :value="data.inspectionDue" /><span>台</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
