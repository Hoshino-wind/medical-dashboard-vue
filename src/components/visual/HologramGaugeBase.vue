<script setup lang="ts">
const uid = `hgb-${Math.random().toString(36).slice(2, 8)}`
</script>

<template>
  <div class="hologram-gauge-base" aria-hidden="true">
    <svg class="hologram-gauge-base-svg" viewBox="0 0 220 76" focusable="false">
      <defs>
        <!-- 底部投影光晕 -->
        <radialGradient :id="`${uid}-glow`" cx="50%" cy="54%" r="60%">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0.24" />
          <stop offset="0.5" stop-color="var(--instrument-base-rim)" stop-opacity="0.1" />
          <stop offset="1" stop-color="var(--instrument-base-rim)" stop-opacity="0" />
        </radialGradient>
        <!-- 中心强光 -->
        <radialGradient :id="`${uid}-center`" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="var(--gauge-tone-bright)" stop-opacity="0.95" />
          <stop offset="0.34" stop-color="var(--gauge-tone-soft)" stop-opacity="0.5" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0" />
        </radialGradient>
        <!-- 侧壁厚度：上亮下暗营造立体 -->
        <linearGradient :id="`${uid}-wall`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--gauge-tone-soft)" stop-opacity="0.44" />
          <stop offset="0.52" stop-color="var(--instrument-base)" stop-opacity="0.2" />
          <stop offset="1" stop-color="var(--bg-soft)" stop-opacity="0.34" />
        </linearGradient>
        <!-- 台面 -->
        <linearGradient :id="`${uid}-deck`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.22" />
          <stop offset="0.6" stop-color="var(--instrument-base)" stop-opacity="0.12" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0.18" />
        </linearGradient>
        <!-- 背侧亮环 -->
        <linearGradient :id="`${uid}-rim`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.14" />
          <stop offset="0.5" stop-color="var(--gauge-tone)" stop-opacity="0.62" />
          <stop offset="1" stop-color="var(--instrument-base-rim)" stop-opacity="0.14" />
        </linearGradient>
        <!-- 左侧不规则强光 -->
        <linearGradient :id="`${uid}-left`" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stop-color="var(--gauge-tone-bright)" stop-opacity="0.82" />
          <stop offset="0.42" stop-color="var(--gauge-tone-soft)" stop-opacity="0.5" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0" />
        </linearGradient>
        <filter :id="`${uid}-blur`" x="-40%" y="-70%" width="180%" height="240%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <filter :id="`${uid}-soft`" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="4.4" />
        </filter>
      </defs>

      <!-- 底部投影光晕 -->
      <ellipse
        class="gauge-base-glow"
        cx="110"
        cy="48"
        rx="118"
        ry="24"
        :fill="`url(#${uid}-glow)`"
        :filter="`url(#${uid}-soft)`"
      />

      <!-- 外层全息轨道 -->
      <ellipse class="gauge-base-orbit" cx="110" cy="38" rx="116" ry="27" />
      <ellipse class="gauge-base-orbit gauge-base-orbit--inner" cx="110" cy="34" rx="104" ry="22" />

      <!-- 前沿厚度：立体侧壁 -->
      <path
        class="gauge-base-wall"
        d="M6 30 C40 50 180 50 214 30 L208 38 C176 55 44 55 12 38 Z"
        :fill="`url(#${uid}-wall)`"
      />

      <!-- 台面 -->
      <ellipse class="gauge-base-deck" cx="110" cy="30" rx="104" ry="15" :fill="`url(#${uid}-deck)`" />
      <ellipse class="gauge-base-deck gauge-base-deck--top" cx="110" cy="27" rx="72" ry="10" />

      <!-- 背侧亮环 -->
      <path class="gauge-base-rim" d="M8 30 C44 12 176 12 212 30" :stroke="`url(#${uid}-rim)`" />

      <!-- 台面同心环 -->
      <ellipse class="gauge-base-ring" cx="110" cy="30" rx="78" ry="11" />
      <ellipse class="gauge-base-ring gauge-base-ring--inner" cx="110" cy="31" rx="52" ry="7" />

      <!-- 分段高光：模拟断续全息轨道 -->
      <g class="gauge-base-segments" :filter="`url(#${uid}-blur)`">
        <path d="M40 26 C70 15 118 13 150 14" />
        <path class="gauge-base-segments--dim" d="M165 15 C190 18 208 24 214 31" />
      </g>

      <!-- 左侧不规则强光 -->
      <path
        class="gauge-base-lglow"
        d="M10 30 C20 18 58 12 96 14 C72 20 44 27 28 37 C20 42 12 40 8 34 C6 31 7 30 10 30 Z"
        :fill="`url(#${uid}-left)`"
        :filter="`url(#${uid}-blur)`"
      />

      <!-- 前沿亮边 -->
      <path
        class="gauge-base-front"
        d="M14 32 C48 48 172 48 206 32"
        :filter="`url(#${uid}-blur)`"
      />

      <!-- 环绕扫描高光 -->
      <ellipse class="gauge-base-scan" cx="110" cy="30" rx="106" ry="15.5" stroke-dasharray="60 377" />

      <!-- 中心竖向投影核心 -->
      <path class="gauge-base-core" d="M110 14 L110 46" />

      <!-- 中心强光 -->
      <ellipse
        class="gauge-base-spark"
        cx="110"
        cy="31"
        rx="36"
        ry="5.5"
        :fill="`url(#${uid}-center)`"
        :filter="`url(#${uid}-blur)`"
      />
      <circle class="gauge-base-dot" cx="110" cy="31" r="2.6" />
    </svg>
  </div>
</template>

<style scoped>
.hologram-gauge-base {
  overflow: visible;
  color: var(--gauge-tone);
  pointer-events: none;
}

.hologram-gauge-base-svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.gauge-base-wall,
.gauge-base-deck,
.gauge-base-rim,
.gauge-base-ring,
.gauge-base-orbit,
.gauge-base-scan,
.gauge-base-front,
.gauge-base-core,
.gauge-base-segments path {
  vector-effect: non-scaling-stroke;
}

.gauge-base-orbit {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone) 60%, var(--instrument-base-rim));
  stroke-width: 0.8;
  opacity: 0.16;
}

.gauge-base-orbit--inner {
  opacity: 0.24;
}

.gauge-base-wall {
  stroke: color-mix(in srgb, var(--instrument-base-rim) 32%, transparent);
  stroke-width: 0.85;
}

.gauge-base-deck {
  stroke: color-mix(in srgb, var(--instrument-base-rim) 40%, transparent);
  stroke-width: 0.9;
}

.gauge-base-deck--top {
  fill: color-mix(in srgb, var(--gauge-tone) 8%, transparent);
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 40%, var(--instrument-base-rim));
  stroke-width: 0.8;
  opacity: 0.72;
}

.gauge-base-rim {
  fill: none;
  stroke-width: 1.4;
  opacity: 0.82;
}

.gauge-base-ring {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone-soft) 60%, transparent);
  stroke-width: 0.8;
  opacity: 0.42;
}

.gauge-base-ring--inner {
  stroke: color-mix(in srgb, var(--gauge-tone) 50%, transparent);
  opacity: 0.24;
}

.gauge-base-segments path {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 70%, var(--gauge-tone));
  stroke-width: 1.4;
  stroke-linecap: round;
  opacity: 0.62;
}

.gauge-base-segments .gauge-base-segments--dim {
  stroke: color-mix(in srgb, var(--gauge-tone) 78%, var(--gauge-tone-soft));
  opacity: 0.5;
}

.gauge-base-lglow {
  opacity: 0.68;
}

.gauge-base-front {
  fill: none;
  stroke: var(--gauge-tone-bright);
  stroke-width: 1.7;
  stroke-linecap: round;
  opacity: 0.82;
}

.gauge-base-scan {
  fill: none;
  stroke: var(--gauge-tone-bright);
  stroke-width: 1.6;
  stroke-linecap: round;
  opacity: 0.8;
  animation: gauge-base-scan-sweep 5.5s linear infinite;
}

.gauge-base-core {
  fill: none;
  stroke: var(--gauge-tone-soft);
  stroke-width: 1;
  stroke-linecap: round;
  opacity: 0.32;
}

.gauge-base-spark {
  opacity: 0.9;
}

.gauge-base-dot {
  fill: var(--gauge-tone-bright);
  opacity: 0.95;
}

@keyframes gauge-base-scan-sweep {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -437;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gauge-base-scan {
    animation: none;
    opacity: 0.5;
  }
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-glow {
  opacity: 0.5;
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-orbit {
  opacity: 0.12;
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-wall {
  stroke: color-mix(in srgb, var(--instrument-base-rim) 46%, transparent);
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-rim {
  opacity: 0.7;
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-front {
  opacity: 0.68;
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-scan {
  opacity: 0.58;
}

:global(.dashboard-shell[data-theme-mode='light']) .gauge-base-lglow {
  opacity: 0.5;
}
</style>
