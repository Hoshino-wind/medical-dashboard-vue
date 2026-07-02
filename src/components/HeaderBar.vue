<script setup>
import hospitalBadge from "../assets/hospital-badge.png";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <header class="dashboard-header mb-[18px] grid grid-cols-[330px_1fr_330px] items-center gap-3">
    <div class="brand-chip">
      <div class="brand-lockup" aria-label="Sunnicare 上云赋">
        <span class="brand-main">Sunnicare</span>
        <span class="brand-cn">上云赋</span>
      </div>
      <div class="brand-clock">
        <div>{{ data.updatedAt }}</div>
        <div>星期三</div>
      </div>
    </div>

    <div class="title-frame">
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
