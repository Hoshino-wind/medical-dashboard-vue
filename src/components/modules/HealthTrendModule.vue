<script setup>
import { AlertTriangle, BadgeCheck, Heart, ShieldCheck, Wrench } from "lucide-vue-next";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="health-layout">
    <div class="health-side">
      <div class="kpi-card flex items-center gap-3">
        <BadgeCheck class="h-5 w-5 text-[color:var(--good)]" />
        <div>
          <div class="kpi-label">运行正常</div>
          <div class="text-xl font-black text-[color:var(--good)]">{{ data.online.toLocaleString() }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 text-[color:var(--warn)]" />
        <div>
          <div class="kpi-label">维保预警</div>
          <div class="text-xl font-black text-[color:var(--warn)]">{{ data.warning }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
    </div>

    <div class="health-stage">
      <div class="health-emblem">
        <ShieldCheck class="health-shield" />
        <Heart class="health-heart" />
      </div>
    </div>

    <div class="health-side">
      <div class="kpi-card flex items-center gap-3">
        <Wrench class="h-5 w-5 text-[color:var(--danger)]" />
        <div>
          <div class="kpi-label">维修中</div>
          <div class="text-xl font-black text-[color:var(--danger)]">{{ data.repairing }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
      <div class="kpi-card flex items-center gap-3">
        <AlertTriangle class="h-5 w-5 text-[color:var(--accent-3)]" />
        <div>
          <div class="kpi-label">即将保养</div>
          <div class="text-xl font-black text-[color:var(--accent-3)]">{{ data.pending }}<span class="ml-1 text-xs">台</span></div>
        </div>
      </div>
    </div>
  </div>
</template>
