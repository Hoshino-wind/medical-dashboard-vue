<script setup lang="ts">
import { Activity, ClipboardList, MonitorCog, ShieldCheck, Wrench } from 'lucide-vue-next'
import MetricRing from '../MetricRing.vue'
import CountUp from '../CountUp.vue'
import type { OverviewData } from '@/types/dashboard'

defineProps<{
  data: OverviewData
}>()
</script>

<template>
  <div class="overview-layout">
    <div class="overview-ring">
      <MetricRing
        class="overview-feature-ring"
        :value="data.availability"
        label="设备可用率"
        :count="data.available"
        size="154px"
        inside-label="设备可用率"
        :show-footer="false"
        large
      />
    </div>
    <div class="overview-metrics">
      <div class="overview-stat with-icon">
        <MonitorCog class="overview-stat-icon text-[color:var(--accent)]" />
        <div>
          <div class="kpi-label">设备总数</div>
          <div class="overview-value text-[color:var(--accent)]">
            <CountUp :value="data.total" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat with-icon">
        <ShieldCheck class="overview-stat-icon text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">可用设备</div>
          <div class="overview-value text-[color:var(--good)]">
            <CountUp :value="data.available" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat with-icon">
        <Wrench class="overview-stat-icon text-[color:var(--danger)]" />
        <div>
          <div class="kpi-label">维修中</div>
          <div class="overview-value text-[color:var(--danger)]">
            <CountUp :value="data.repairing" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat with-icon">
        <ClipboardList class="overview-stat-icon text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">待保养</div>
          <div class="overview-value text-[color:var(--warn)]">
            <CountUp :value="data.maintenanceDue" /><span>台</span>
          </div>
        </div>
      </div>
      <div class="overview-stat with-icon span-2">
        <Activity class="overview-stat-icon text-[color:var(--accent-2)]" />
        <div>
          <div class="kpi-label">待巡检</div>
          <div class="overview-value text-[color:var(--accent-2)]">
            <CountUp :value="data.inspectionDue" /><span>台</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
