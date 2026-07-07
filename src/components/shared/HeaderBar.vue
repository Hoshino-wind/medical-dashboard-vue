<script setup lang="ts">
import hospitalBadge from '../../assets/hospital-badge.png'
import type { HeaderData } from '@/types/dashboard'

defineProps<{
  data: HeaderData
}>()
</script>

<template>
  <header class="dashboard-header grid grid-cols-[32.5rem_1fr_32.5rem] items-center gap-3">
    <svg
      class="header-tech-frame"
      viewBox="0 0 1400 84"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="headerLineGradient" x1="0" x2="1" y1="0" y2="0">
          <stop class="header-stop-primary is-transparent" offset="0" />
          <stop class="header-stop-primary" offset="0.18" />
          <stop class="header-stop-secondary" offset="0.5" />
          <stop class="header-stop-primary" offset="0.82" />
          <stop class="header-stop-primary is-transparent" offset="1" />
        </linearGradient>
        <linearGradient id="headerFlowGradient" x1="0" x2="1" y1="0" y2="0">
          <stop class="header-stop-primary is-transparent" offset="0" />
          <stop class="header-stop-primary is-soft" offset="0.42" />
          <stop class="header-stop-secondary is-strong" offset="0.55" />
          <stop class="header-stop-secondary is-soft" offset="0.68" />
          <stop class="header-stop-primary is-transparent" offset="1" />
        </linearGradient>
        <filter id="headerPathGlow" x="-10%" y="-80%" width="120%" height="260%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path class="header-title-fill" d="M512 12 L888 12 L912 42 L888 72 L512 72 L488 42 Z" />
      <path class="header-line is-main" d="M20 32 H452 L468 48 H492" />
      <path class="header-line is-main" d="M1380 32 H948 L932 48 H908" />
      <path class="header-line is-title" d="M512 12 L888 12 L912 42 L888 72 L512 72 L488 42 Z" />
      <path class="header-line is-inner" d="M524 24 H876 L890 42 L876 60 H524 L510 42 Z" />
      <path class="header-line is-step" d="M306 40 H392 L404 52 H486" />
      <path class="header-line is-step" d="M1094 40 H1008 L996 52 H914" />

      <g class="header-ticks is-left">
        <path d="M430 23 L424 35" />
        <path d="M438 23 L432 35" />
        <path d="M446 23 L440 35" />
        <path d="M454 23 L448 35" />
        <path d="M462 23 L456 35" />
      </g>
      <g class="header-ticks is-right">
        <path d="M970 23 L976 35" />
        <path d="M962 23 L968 35" />
        <path d="M954 23 L960 35" />
        <path d="M946 23 L952 35" />
        <path d="M938 23 L944 35" />
      </g>
      <g class="header-micro-lines">
        <path d="M370 62 H452" />
        <path d="M948 62 H1030" />
      </g>

      <path class="header-flow is-left" d="M20 32 H452 L468 48 H492" />
      <path class="header-flow is-right" d="M1380 32 H948 L932 48 H908" />
      <path class="header-flow is-title" d="M512 12 L888 12 L912 42 L888 72 L512 72 L488 42 Z" />
      <ellipse class="header-core-glow" cx="700" cy="72" rx="112" ry="5" />
    </svg>

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
