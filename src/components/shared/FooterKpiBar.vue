<script setup lang="ts">
import { Briefcase, Clock3, Landmark, Settings, Timer, Wrench } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { FooterMetric } from '@/types/dashboard'

defineProps<{
  items: FooterMetric[]
}>()

const iconMap: Record<string, Component> = {
  bag: Briefcase,
  wrench: Wrench,
  clock: Clock3,
  tool: Settings,
  timer: Timer,
  bank: Landmark,
}
</script>

<template>
  <footer class="footer-kpi-bar">
    <div v-for="item in items" :key="item.label" class="footer-kpi-item">
      <span class="footer-kpi-icon">
        <component :is="iconMap[item.icon] || Settings" />
      </span>
      <span class="footer-kpi-copy">
        <span class="footer-kpi-label">{{ item.label }}</span>
        <span class="footer-kpi-value">{{ item.value }}<small>{{ item.unit }}</small></span>
      </span>
    </div>
  </footer>
</template>
