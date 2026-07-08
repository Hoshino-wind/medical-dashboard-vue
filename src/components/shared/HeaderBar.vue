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
          <stop class="header-stop-primary is-transparent" offset="0" stop-color="var(--chart-primary)" />
          <stop class="header-stop-primary" offset="0.18" stop-color="var(--chart-primary)" />
          <stop class="header-stop-secondary" offset="0.5" stop-color="var(--accent-2)" />
          <stop class="header-stop-tertiary" offset="0.68" stop-color="var(--chart-secondary)" />
          <stop class="header-stop-primary" offset="0.82" stop-color="var(--chart-primary)" />
          <stop class="header-stop-primary is-transparent" offset="1" stop-color="var(--chart-primary)" />
        </linearGradient>
        <!-- 流光亮芯渐变:中央纯白高亮 -->
        <linearGradient id="headerFlowGradient" x1="0" x2="1" y1="0" y2="0">
          <stop class="header-stop-primary is-transparent" offset="0" stop-color="var(--chart-primary)" />
          <stop class="header-stop-primary is-soft" offset="0.3" stop-color="var(--chart-primary)" />
          <stop class="header-flow-core" offset="0.5" stop-color="#ffffff" />
          <stop class="header-stop-secondary is-strong" offset="0.64" stop-color="var(--accent-2)" />
          <stop class="header-stop-primary is-soft" offset="0.76" stop-color="var(--chart-primary)" />
          <stop class="header-stop-primary is-transparent" offset="1" stop-color="var(--chart-primary)" />
        </linearGradient>
        <!-- 流光辉光底层渐变 -->
        <linearGradient id="headerFlowGlowGradient" x1="0" x2="1" y1="0" y2="0">
          <stop class="header-stop-primary is-transparent" offset="0" stop-color="var(--chart-primary)" />
          <stop class="header-stop-secondary" offset="0.5" stop-color="var(--accent-2)" />
          <stop class="header-stop-primary is-transparent" offset="1" stop-color="var(--chart-primary)" />
        </linearGradient>
        <filter id="headerPathGlow" x="-18%" y="-120%" width="136%" height="340%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.6" flood-color="var(--chart-primary)" flood-opacity="0.72" />
          <feDropShadow dx="0" dy="0" stdDeviation="5.5" flood-color="var(--accent-2)" flood-opacity="0.32" />
        </filter>
        <!-- 流光亮芯发光:轻模糊叠加 -->
        <filter id="headerFlowGlow" x="-40%" y="-300%" width="180%" height="700%">
          <feGaussianBlur stdDeviation="1.3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <!-- 流光辉光底层:大模糊散射 -->
        <filter id="headerFlowSoftGlow" x="-80%" y="-600%" width="260%" height="1300%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <!-- 标题区填充六边形(贴合 title-frame) -->
      <path class="header-title-fill" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />

      <!-- 静态装饰线:按用户标注的红线路径绘制,左右先走上沿再折入标题 -->
      <g class="header-static-lines" filter="url(#headerPathGlow)">
        <path class="header-line is-main" d="M6 8 H160 L178 30 H404 L432 46 H482" />
        <path class="header-line is-main" d="M918 42 H930 L958 30 H1168 L1188 12 H1394" />
        <path class="header-line is-step" d="M306 50 H390 L418 62 H470" />
        <path class="header-line is-step" d="M1030 50 H1168" />
        <!-- 标题外/内六边形 -->
        <path class="header-line is-title" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />
        <path class="header-line is-inner" d="M516 24 H884 L896 42 L884 60 H516 L504 42 Z" />

        <!-- 左刻度(间隙带内,关于 x=700 镜像) -->
        <g class="header-ticks is-left">
          <path d="M360 20 L356 30" />
          <path d="M368 20 L364 30" />
          <path d="M376 20 L372 30" />
          <path d="M384 20 L380 30" />
          <path d="M392 20 L388 30" />
        </g>
        <g class="header-ticks is-right">
          <path d="M1040 20 L1044 30" />
          <path d="M1032 20 L1036 30" />
          <path d="M1024 20 L1028 30" />
          <path d="M1016 20 L1020 30" />
          <path d="M1008 20 L1012 30" />
        </g>
        <!-- 间隙底部点缀 -->
        <g class="header-micro-lines">
          <path d="M356 68 H402" />
          <path d="M1044 68 H998" />
        </g>
      </g>

      <!-- 流光:辉光底层 + 亮芯双层 -->
      <g class="header-flow-group">
        <path class="header-flow-glow is-left" d="M6 8 H160 L178 30 H404 L432 46 H482" />
        <path class="header-flow-glow is-right" d="M918 42 H930 L958 30 H1168 L1188 12 H1394" />
        <path class="header-flow-glow is-title" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />
        <path class="header-flow is-left" d="M6 8 H160 L178 30 H404 L432 46 H482" />
        <path class="header-flow is-right" d="M918 42 H930 L958 30 H1168 L1188 12 H1394" />
        <path class="header-flow is-title" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />
      </g>

      <ellipse class="header-core-glow" cx="700" cy="72" rx="134" ry="5" />
    </svg>

    <div class="brand-chip">
      <div class="brand-lockup" aria-label="Sunnicare 上云赋">
        <span class="brand-main">Sunnicare</span>
        <span class="brand-cn">上云赋</span>
      </div>
      <div class="brand-clock">
        <div>{{ data.updatedAt }}　星期三</div>
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
