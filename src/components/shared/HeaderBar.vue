<script setup lang="ts">
import hospitalBadge from '../../assets/hospital-badge.png'
import type { HeaderData } from '@/types/dashboard'

defineProps<{
  data: HeaderData
}>()
</script>

<template>
  <header class="dashboard-header grid grid-cols-[32.5rem_1fr_32.5rem] items-center gap-3">
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
      <h1>{{ data.title }}</h1>
    </div>

    <div class="hospital-chip">
      <div class="hospital-copy">
        <div class="hospital-name">{{ data.hospital }}</div>
        <div class="hospital-subtitle">{{ data.subtitle }}</div>
      </div>
      <img class="hospital-badge" :src="hospitalBadge" :alt="data.hospital" />
    </div>
  </header>
</template>
