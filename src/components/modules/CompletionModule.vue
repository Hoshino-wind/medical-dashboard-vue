<script setup>
import { Bell, CalendarCheck, CheckCircle2, UserRound } from "lucide-vue-next";
import WorkOrderTable from "../WorkOrderTable.vue";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="grid h-full grid-cols-[1fr_232px] gap-4">
    <div class="min-w-0">
      <WorkOrderTable
        :headers="['所属科室', '设备名称', '剩余时间', '负责人']"
        :rows="data.rows"
      />
    </div>
    <div class="grid grid-cols-2 content-between gap-3">
      <div class="completion-orb col-span-2">
        <div>
          <div class="completion-label">本月巡检完成率</div>
          <div class="completion-value">{{ data.rate }}%</div>
          <div class="relative z-[1] mt-1 text-[11px] font-bold text-[color:var(--muted)]">
            总数 {{ data.total.toLocaleString() }} 单 / 已完成 {{ data.finished.toLocaleString() }} 单
          </div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-2">
        <UserRound class="h-4 w-4 text-[color:var(--accent)]" />
        <div>
          <div class="kpi-label">待巡检</div>
          <div class="text-sm font-black">{{ data.waiting }}<span class="text-[10px] text-[color:var(--muted)]"> 单</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-2">
        <Bell class="h-4 w-4 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">逾期未检</div>
          <div class="text-sm font-black">{{ data.overdue }}<span class="text-[10px] text-[color:var(--muted)]"> 单</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-2">
        <CheckCircle2 class="h-4 w-4 text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">已完成</div>
          <div class="text-sm font-black">{{ data.finished.toLocaleString() }}<span class="text-[10px] text-[color:var(--muted)]"> 单</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-2">
        <CalendarCheck class="h-4 w-4 text-[color:var(--accent-3)]" />
        <div>
          <div class="kpi-label">总数量</div>
          <div class="text-sm font-black">{{ data.total.toLocaleString() }}<span class="text-[10px] text-[color:var(--muted)]"> 单</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
