<script setup>
import { Activity, CalendarCheck, Stethoscope, Wrench } from "lucide-vue-next";
import MetricRing from "../MetricRing.vue";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="grid h-full grid-cols-[116px_1fr] gap-4">
    <div class="flex items-center justify-center">
      <MetricRing :value="data.availability" label="设备可用率" :count="data.available" size="112px" />
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="kpi-card">
        <div class="kpi-label">设备总数</div>
        <div class="kpi-value text-[color:var(--accent)]">{{ data.total.toLocaleString() }}<span class="ml-1 text-xs">台</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">可用设备</div>
        <div class="kpi-value text-[color:var(--good)]">{{ data.available.toLocaleString() }}<span class="ml-1 text-xs">台</span></div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <Wrench class="h-5 w-5 text-[color:var(--danger)]" />
        <div>
          <div class="kpi-label">维修中</div>
          <div class="kpi-value text-[color:var(--danger)]">{{ data.repairing }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <CalendarCheck class="h-5 w-5 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">待保养</div>
          <div class="kpi-value text-[color:var(--warn)]">{{ data.maintenanceDue }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
      <div class="kpi-card col-span-2 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Activity class="h-5 w-5 text-[color:var(--accent-2)]" />
          <div>
            <div class="kpi-label">待巡检</div>
            <div class="kpi-value text-[color:var(--accent-2)]">{{ data.inspectionDue.toLocaleString() }}<span class="ml-1 text-xs">台</span></div>
          </div>
        </div>
        <Stethoscope class="h-10 w-10 opacity-30" />
      </div>
    </div>
  </div>
</template>
