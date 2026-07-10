<script setup lang="ts">
import { Activity, ClipboardList, MonitorCog, ShieldCheck, Wrench } from 'lucide-vue-next'
import MetricRing from '../shared/MetricRing.vue'
import CountUp from '../shared/CountUp.vue'
import type { OverviewData } from '@/types/dashboard'
import { pxToRem } from '@/utils/rem'

defineProps<{
  data: OverviewData
}>()

// 环形等比缩小：原先 176px → 145px，底座/字体随之按 --gauge-size 等比缩放
const overviewRingSize = pxToRem(145)
</script>

<template>
  <div class="overview-layout">
    <!-- 环形居中 -->
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

    <!-- 5 个指标环绕分布：左上 / 右上 / 左下 / 右下 / 正下 -->
    <div class="overview-stat overview-stat--total with-icon pos-tl">
      <MonitorCog class="overview-stat-icon text-[color:var(--data-pie-primary)]" />
      <div>
        <div class="kpi-label">设备总数</div>
        <div class="overview-value text-[color:var(--data-pie-primary)]">
          <CountUp :value="data.total" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--available with-icon pos-tr">
      <ShieldCheck class="overview-stat-icon text-[color:var(--good)]" />
      <div>
        <div class="kpi-label">可用设备</div>
        <div class="overview-value text-[color:var(--good)]">
          <CountUp :value="data.available" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--repair with-icon is-alert is-danger pos-bl">
      <Wrench class="overview-stat-icon text-[color:var(--danger)]" />
      <div>
        <div class="kpi-label">维修中</div>
        <div class="overview-value text-[color:var(--danger)]">
          <CountUp :value="data.repairing" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--maintenance with-icon is-alert is-warn pos-br">
      <ClipboardList class="overview-stat-icon text-[color:var(--warn)]" />
      <div>
        <div class="kpi-label">待保养</div>
        <div class="overview-value text-[color:var(--warn)]">
          <CountUp :value="data.maintenanceDue" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--inspection with-icon pos-bc">
      <Activity class="overview-stat-icon text-[color:var(--data-inspection-line)]" />
      <div>
        <div class="kpi-label">待巡检</div>
        <div class="overview-value text-[color:var(--data-inspection-line)]">
          <CountUp :value="data.inspectionDue" /><span>台</span>
        </div>
      </div>
    </div>
  </div>
</template>
