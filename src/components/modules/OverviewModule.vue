<script setup lang="ts">
import { Activity, ClipboardList, MonitorCog, ShieldCheck, Wrench } from 'lucide-vue-next'
import MetricRing from '../shared/MetricRing.vue'
import CountUp from '../shared/CountUp.vue'
import MechanicalFrame from '../visual/MechanicalFrame.vue'
import type { OverviewData } from '@/types/dashboard'
import { pxToRem } from '@/utils/rem'

defineProps<{
  data: OverviewData
}>()

// 环形等比缩小：原先 176px → 132px，底座/字体随之按 --gauge-size 等比缩放
const overviewRingSize = pxToRem(132)
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
    <div class="overview-stat overview-stat--total with-icon pos-tl mechanical-frame-host">
      <MechanicalFrame variant="compact" />
      <MonitorCog class="overview-stat-icon text-[color:var(--data-pie-primary)]" />
      <div>
        <div class="kpi-label">设备总数</div>
        <div class="overview-value text-[color:var(--data-pie-primary)]">
          <CountUp :value="data.total" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--available with-icon pos-tr mechanical-frame-host">
      <MechanicalFrame variant="compact" />
      <ShieldCheck class="overview-stat-icon text-[color:var(--good)]" />
      <div>
        <div class="kpi-label">可用设备</div>
        <div class="overview-value text-[color:var(--good)]">
          <CountUp :value="data.available" /><span>台</span>
        </div>
      </div>
    </div>
    <div
      class="overview-stat overview-stat--repair with-icon is-alert is-danger pos-bl mechanical-frame-host"
    >
      <MechanicalFrame variant="compact" />
      <Wrench class="overview-stat-icon text-[color:var(--danger)]" />
      <div>
        <div class="kpi-label">维修中</div>
        <div class="overview-value text-[color:var(--danger)]">
          <CountUp :value="data.repairing" /><span>台</span>
        </div>
      </div>
    </div>
    <div
      class="overview-stat overview-stat--maintenance with-icon is-alert is-warn pos-br mechanical-frame-host"
    >
      <MechanicalFrame variant="compact" />
      <ClipboardList class="overview-stat-icon text-[color:var(--warn)]" />
      <div>
        <div class="kpi-label">待巡检</div>
        <div class="overview-value text-[color:var(--warn)]">
          <CountUp :value="data.maintenanceDue" /><span>台</span>
        </div>
      </div>
    </div>
    <div class="overview-stat overview-stat--inspection with-icon pos-bc mechanical-frame-host">
      <MechanicalFrame variant="compact" />
      <Activity class="overview-stat-icon text-[color:var(--data-inspection-line)]" />
      <div>
        <div class="kpi-label">待保养</div>
        <div class="overview-value text-[color:var(--data-inspection-line)]">
          <CountUp :value="data.inspectionDue" /><span>台</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 设备总览：环形缩小居中，5 个指标卡环绕分布（grid 区域布局，天然防重叠） */
.overview-layout {
  display: grid;
  height: 100%;
  min-height: 0;
  /* 内边距让环绕指标卡不贴面板边缘 */
  padding: 0.35rem 0.6rem;
  /* 左列 | 环形 | 右列，环形跨上下两行 */
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  grid-template-rows: 1fr 1fr auto;
  grid-template-areas:
    'tl   ring tr'
    'bl   ring br'
    'bc   bc   bc';
  align-items: center;
  justify-items: center;
  gap: 0.35rem 0.5rem;
  box-sizing: border-box;
}
.overview-ring {
  grid-area: ring;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* —— grid-area 分配 —— */
.overview-stat.pos-tl {
  grid-area: tl;
  justify-self: start;
}
.overview-stat.pos-tr {
  grid-area: tr;
  justify-self: end;
}
.overview-stat.pos-bl {
  grid-area: bl;
  justify-self: start;
}
.overview-stat.pos-br {
  grid-area: br;
  justify-self: end;
}
.overview-stat.pos-bc {
  grid-area: bc;
  justify-self: center;
  width: min(100%, 11rem);
}
/* 指标卡基础样式（紧凑版，适配环绕布局） */
.overview-stat {
  min-width: 0;
  width: 100%;
  max-width: 9rem;
  border: 0.0625rem solid color-mix(in srgb, var(--glass-edge) 48%, transparent);
  border-radius: 0.375rem;
  background:
    linear-gradient(90deg, color-mix(in srgb, currentColor 12%, transparent), transparent 68%),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--surface-strong) 22%, transparent),
      color-mix(in srgb, var(--surface) 12%, transparent)
    );
  padding: 0.3rem 0.5rem;
  box-shadow:
    inset 0.1875rem 0 0 color-mix(in srgb, currentColor 58%, transparent),
    inset 0 0.0625rem 0 color-mix(in srgb, var(--instrument-rim) 18%, transparent);
}
.overview-stat.with-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.overview-stat.with-icon > div {
  min-width: 0;
  flex: 1;
}
.overview-stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex: none;
  padding: 0.3rem;
  border: 0.0625rem solid color-mix(in srgb, currentColor 48%, transparent);
  border-radius: 0.1875rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, currentColor 24%, transparent),
    color-mix(in srgb, var(--surface-strong) 48%, transparent)
  );
}
.overview-value {
  margin-top: 0.12rem;
  overflow: hidden;
  font-size: calc(0.98rem * var(--dashboard-font-scale, 1.45));
  font-weight: 950;
  line-height: 1.05;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.overview-value span {
  margin-left: 0.125rem;
  color: var(--muted);
  font-size: calc(0.69rem * var(--dashboard-font-scale, 1.45));
  font-weight: 800;
}
/* kpi-label 也同步缩小一点，和紧凑卡更协调 */
.overview-stat .kpi-label {
  font-size: calc(0.69rem * var(--dashboard-font-scale, 1.45));
  line-height: 1.1;
}
.kpi-label {
  color: var(--muted);
  font-size: calc(0.875rem * var(--dashboard-font-scale, 1.45));
  line-height: 1;
  white-space: nowrap;
}
.overview-stat.is-warn {
  --status-tone: var(--warn);
}
.overview-stat.is-danger {
  --status-tone: var(--danger);
}
</style>
