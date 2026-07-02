<script setup>
import { MonitorCog } from "lucide-vue-next";
import hospitalBadge from "../assets/hospital-badge.png";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <header class="dashboard-header mb-2 grid grid-cols-[286px_1fr_286px] items-center gap-3">
    <div class="brand-chip">
      <div class="brand-mark">
        <span>Sun</span>
      </div>
      <div class="min-w-0">
        <div class="brand-name">{{ data.brand }}</div>
        <div class="brand-time">{{ data.updatedAt }}</div>
      </div>
    </div>

    <div class="title-frame">
      <MonitorCog class="mr-3 h-7 w-7 text-[color:var(--accent-2)]" />
      <h1 class="text-center text-[28px] font-black leading-none tracking-0">{{ data.title }}</h1>
    </div>

    <div class="hospital-chip">
      <div class="text-right">
        <div class="hospital-name">{{ data.hospital }}</div>
        <div class="hospital-subtitle">{{ data.subtitle }}</div>
      </div>
      <div class="screen-toggle" aria-hidden="true">
        <span></span>
        <span></span>
      </div>
      <img class="hospital-badge" :src="hospitalBadge" alt="医院院徽" />
    </div>
  </header>
</template>
