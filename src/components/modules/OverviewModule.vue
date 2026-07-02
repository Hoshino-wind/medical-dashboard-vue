<script setup>
import MetricRing from "../MetricRing.vue";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="overview-layout">
    <div class="overview-ring">
      <MetricRing
        class="overview-feature-ring"
        :value="data.availability"
        label="设备可用率"
        :count="data.available"
        size="124px"
        inside-label="设备可用率"
        :show-footer="false"
      />
    </div>
    <div class="overview-metrics">
      <div class="overview-stat">
        <div class="kpi-label">设备总数</div>
        <div class="overview-value text-[color:var(--accent)]">{{ data.total.toLocaleString() }}<span>台</span></div>
      </div>
      <div class="overview-stat">
        <div class="kpi-label">可用设备</div>
        <div class="overview-value text-[color:var(--good)]">{{ data.available.toLocaleString() }}<span>台</span></div>
      </div>
      <div class="overview-stat">
        <div class="kpi-label">维修中</div>
        <div class="overview-value text-[color:var(--danger)]">{{ data.repairing }}<span>台</span></div>
      </div>
      <div class="overview-stat">
        <div class="kpi-label">待保养</div>
        <div class="overview-value text-[color:var(--warn)]">{{ data.maintenanceDue }}<span>台</span></div>
      </div>
      <div class="overview-stat span-2">
        <div class="kpi-label">待巡检</div>
        <div class="overview-value text-[color:var(--accent-2)]">{{ data.inspectionDue.toLocaleString() }}<span>台</span></div>
      </div>
    </div>
  </div>
</template>
