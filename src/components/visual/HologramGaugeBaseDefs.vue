<script setup lang="ts">
defineProps<{ uid: string }>()
</script>

<template>
  <defs>
    <!-- 基座与台面材质：金属外壳保持体积，只让发射窗和能量通道染上 tone -->
    <radialGradient :id="`${uid}-glow`" cx="50%" cy="54%" r="60%">
      <stop offset="0" stop-color="var(--gauge-base-tone)" stop-opacity="0.34" />
      <stop offset="0.46" stop-color="var(--instrument-base-rim)" stop-opacity="0.13" />
      <stop offset="1" stop-color="var(--instrument-base-rim)" stop-opacity="0" />
    </radialGradient>
    <!-- 中心强光 -->
    <radialGradient :id="`${uid}-center`" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.95" />
      <stop offset="0.34" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.5" />
      <stop offset="1" stop-color="var(--gauge-base-tone)" stop-opacity="0" />
    </radialGradient>
    <!-- 侧壁厚度：上亮下暗营造立体 -->
    <linearGradient :id="`${uid}-wall`" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.62" />
      <stop offset="0.18" stop-color="var(--gauge-base-tone)" stop-opacity="0.34" />
      <stop offset="0.5" stop-color="var(--instrument-base)" stop-opacity="0.78" />
      <stop offset="1" stop-color="var(--holo-shell-dark, #020711)" stop-opacity="0.94" />
    </linearGradient>
    <!-- 台面 -->
    <linearGradient :id="`${uid}-deck`" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.5" />
      <stop offset="0.26" stop-color="var(--instrument-base)" stop-opacity="0.68" />
      <stop offset="0.7" stop-color="var(--holo-deck-dark, #061221)" stop-opacity="0.86" />
      <stop offset="1" stop-color="var(--gauge-base-tone)" stop-opacity="0.34" />
    </linearGradient>
    <!-- 顶层独立高亮，中心能量向外扩散并在边沿收亮 -->
    <radialGradient :id="`${uid}-top-deck`" cx="50%" cy="45%" r="62%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="0.14" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.82" />
      <stop offset="0.42" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.46" />
      <stop offset="0.76" stop-color="var(--instrument-base)" stop-opacity="0.5" />
      <stop offset="0.94" stop-color="var(--gauge-base-tone)" stop-opacity="0.62" />
      <stop offset="1" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.9" />
    </radialGradient>
    <radialGradient :id="`${uid}-aperture`" cx="50%" cy="42%" r="64%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.98" />
      <stop offset="0.18" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.92" />
      <stop offset="0.48" stop-color="var(--gauge-base-tone)" stop-opacity="0.48" />
      <stop offset="0.78" stop-color="var(--holo-aperture-dark, #030b16)" stop-opacity="0.9" />
      <stop offset="1" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.76" />
    </radialGradient>
    <linearGradient :id="`${uid}-status`" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="var(--gauge-base-tone)" stop-opacity="0" />
      <stop offset="0.28" stop-color="var(--gauge-base-tone)" stop-opacity="0.72" />
      <stop offset="0.5" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.96" />
      <stop offset="0.72" stop-color="var(--gauge-base-tone)" stop-opacity="0.72" />
      <stop offset="1" stop-color="var(--gauge-base-tone)" stop-opacity="0" />
    </linearGradient>
    <!-- 背侧亮环 -->
    <linearGradient :id="`${uid}-rim`" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.14" />
      <stop offset="0.5" stop-color="var(--gauge-base-tone)" stop-opacity="0.62" />
      <stop offset="1" stop-color="var(--instrument-base-rim)" stop-opacity="0.14" />
    </linearGradient>
    <!-- 左侧不规则强光 -->
    <linearGradient :id="`${uid}-left`" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.82" />
      <stop offset="0.42" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.5" />
      <stop offset="1" stop-color="var(--gauge-base-tone)" stop-opacity="0" />
    </linearGradient>
    <linearGradient :id="`${uid}-beam`" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--gauge-base-tone)" stop-opacity="0.06" />
      <stop offset="0.38" stop-color="var(--gauge-base-tone)" stop-opacity="0.18" />
      <stop offset="0.7" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.52" />
      <stop offset="1" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.94" />
    </linearGradient>
    <linearGradient :id="`${uid}-beam-core`" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--gauge-base-tone)" stop-opacity="0.04" />
      <stop offset="0.5" stop-color="var(--gauge-base-tone-soft)" stop-opacity="0.2" />
      <stop offset="0.8" stop-color="var(--gauge-base-tone-bright)" stop-opacity="0.68" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.96" />
    </linearGradient>
    <filter :id="`${uid}-blur`" x="-40%" y="-70%" width="180%" height="240%">
      <feGaussianBlur stdDeviation="1.3" />
    </filter>
    <filter :id="`${uid}-beam-blur`" x="-55%" y="-35%" width="210%" height="180%">
      <feGaussianBlur stdDeviation="2.8" />
    </filter>
    <filter :id="`${uid}-soft`" x="-60%" y="-120%" width="220%" height="340%">
      <feGaussianBlur stdDeviation="4.4" />
    </filter>
  </defs>
</template>
