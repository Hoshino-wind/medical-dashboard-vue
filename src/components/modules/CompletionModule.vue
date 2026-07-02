<script setup>
import { Bell, CalendarCheck, CheckCircle2, UserRound } from "lucide-vue-next";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="inspection-hub">
    <div class="hub-side">
      <div class="kpi-card hub-card">
        <UserRound class="h-5 w-5 text-[color:var(--accent)]" />
        <div>
          <div class="kpi-label">巡检工单总数</div>
          <div class="hub-number">{{ data.total.toLocaleString() }}<span>单</span></div>
        </div>
      </div>
      <div class="kpi-card hub-card">
        <CheckCircle2 class="h-5 w-5 text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">已完成</div>
          <div class="hub-number">{{ data.finished.toLocaleString() }}<span>单</span></div>
        </div>
      </div>
    </div>

    <div class="completion-orb">
      <div class="completion-content">
        <div class="completion-label">本月巡检完成率</div>
        <div class="completion-value">{{ data.rate }}%</div>
      </div>
    </div>

    <div class="hub-side">
      <div class="kpi-card hub-card">
        <CalendarCheck class="h-5 w-5 text-[color:var(--accent-3)]" />
        <div>
          <div class="kpi-label">待巡检</div>
          <div class="hub-number">{{ data.waiting }}<span>单</span></div>
        </div>
      </div>
      <div class="kpi-card hub-card">
        <Bell class="h-5 w-5 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">逾期未检</div>
          <div class="hub-number">{{ data.overdue }}<span>单</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
