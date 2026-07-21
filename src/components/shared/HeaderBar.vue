<script setup lang="ts">
import sunnicareLogo from '../../assets/sunnicare-logo.png'
import hospitalLogo from '../../assets/jiangmen-central-hospital-logo.png'
import HeaderTechFrame from './HeaderTechFrame.vue'
import { useBeijingClock } from '@/composables/useBeijingClock'
import type { HeaderData } from '@/types/dashboard'

defineProps<{
  data: HeaderData
}>()

const beijingClock = useBeijingClock()
</script>

<template>
  <header class="dashboard-header">
    <HeaderTechFrame />

    <div class="brand-chip">
      <div class="brand-lockup">
        <img class="brand-logo" :src="sunnicareLogo" alt="Sunnicare 上云赋" />
      </div>
      <div class="brand-clock">
        <div>{{ beijingClock.text.value }}</div>
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
      <img class="hospital-badge" :src="hospitalLogo" :alt="`${data.hospital}院徽`" />
    </div>
  </header>
</template>

<style scoped src="./HeaderBar.css"></style>

<!-- 浅色主题覆盖:引用祖先 .dashboard-shell,必须全局 -->
<style src="./HeaderBar.global.css"></style>
