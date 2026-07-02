<script setup>
import { dashboardData } from "../data/dashboard";
import PanelShell from "./PanelShell.vue";
import WorkOrderTable from "./WorkOrderTable.vue";
import OverviewModule from "./modules/OverviewModule.vue";
import AvailabilityModule from "./modules/AvailabilityModule.vue";
import ChartModule from "./modules/ChartModule.vue";
import CompletionModule from "./modules/CompletionModule.vue";
import HealthTrendModule from "./modules/HealthTrendModule.vue";

defineProps({
  module: {
    type: Object,
    required: true,
  },
  theme: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <PanelShell :number="module.number" :title="module.title" :class="{ 'module-wide': module.size === 'wide' }">
    <OverviewModule v-if="module.id === 'overview'" :data="dashboardData.overview" />

    <WorkOrderTable
      v-else-if="module.id === 'repairOrders'"
      :headers="['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态']"
      :rows="dashboardData.repairOrders"
    />

    <ChartModule
      v-else-if="module.id === 'repairStats'"
      type="bar"
      :theme="theme"
      :data="dashboardData.repairStats"
    />

    <AvailabilityModule
      v-else-if="module.id === 'lifeSupport'"
      :items="dashboardData.lifeSupport"
      variant="life"
    />

    <CompletionModule
      v-else-if="module.id === 'inspectionOrders'"
      :data="dashboardData.inspectionOrders"
    />

    <ChartModule
      v-else-if="module.id === 'maintenanceStats'"
      type="maintenance"
      :theme="theme"
      :data="dashboardData.maintenanceStats"
    />

    <AvailabilityModule
      v-else-if="module.id === 'ultrasound'"
      :items="dashboardData.ultrasound"
      variant="ultrasound"
    />

    <HealthTrendModule
      v-else-if="module.id === 'healthTrend'"
      :data="dashboardData.healthTrend"
    />

    <ChartModule
      v-else-if="module.id === 'inspectionStats'"
      type="inspection"
      :theme="theme"
      :data="dashboardData.inspectionStats"
    />
  </PanelShell>
</template>
