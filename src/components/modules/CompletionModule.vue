<script setup lang="ts">
import { Bell, CalendarCheck, CheckCircle2, UserRound } from 'lucide-vue-next'
import CountUp from '../shared/CountUp.vue'
import type { InspectionOrders } from '@/types/dashboard'

defineProps<{
  data: InspectionOrders
}>()
</script>

<template>
  <div class="inspection-hub">
    <div class="hub-side">
      <div class="kpi-card hub-card">
        <UserRound class="h-5 w-5 text-[color:var(--accent)]" />
        <div>
          <div class="kpi-label">巡检工单总数</div>
          <div class="hub-number"><CountUp :value="data.total" /><span>单</span></div>
        </div>
      </div>
      <div class="kpi-card hub-card">
        <CheckCircle2 class="h-5 w-5 text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">已完成</div>
          <div class="hub-number"><CountUp :value="data.finished" /><span>单</span></div>
        </div>
      </div>
    </div>

    <div class="completion-orb">
      <span class="holo-ring holo-ring-wide" aria-hidden="true"></span>
      <span class="holo-ring holo-ring-core" aria-hidden="true"></span>
      <div class="completion-content">
        <div class="completion-label">本月巡检完成率</div>
        <div class="completion-value"><CountUp :value="data.rate" :decimals="1" />%</div>
      </div>
    </div>

    <div class="hub-side">
      <div class="kpi-card hub-card">
        <CalendarCheck class="h-5 w-5 text-[color:var(--accent-3)]" />
        <div>
          <div class="kpi-label">待巡检</div>
          <div class="hub-number"><CountUp :value="data.waiting" /><span>单</span></div>
        </div>
      </div>
      <div class="kpi-card hub-card">
        <Bell class="h-5 w-5 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">逾期未检</div>
          <div class="hub-number"><CountUp :value="data.overdue" /><span>单</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
