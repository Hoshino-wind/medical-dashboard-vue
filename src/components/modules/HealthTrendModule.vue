<script setup>
import { AlertTriangle, BadgeCheck, HeartPulse, ShieldCheck, Wrench } from "lucide-vue-next";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="grid h-full grid-cols-[1fr_190px_1fr] gap-4">
    <div class="grid content-center gap-3">
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
    <div class="hologram-base">
      <div class="hologram-content">
        <ShieldCheck class="mx-auto h-16 w-16 text-[color:var(--accent)] drop-shadow-[0_0_18px_var(--accent)]" />
        <HeartPulse class="mx-auto -mt-10 h-8 w-8 text-[color:var(--accent-2)]" />
        <div class="mt-8 text-xs font-bold text-[color:var(--muted)]">健康评分</div>
        <div class="text-3xl font-black text-[color:var(--accent-2)]">{{ data.score }}</div>
      </div>
    </div>
    <div class="grid content-center gap-3">
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
