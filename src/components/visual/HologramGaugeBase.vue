<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: string
    speed?: number
    direction?: 'clockwise' | 'counter-clockwise'
    intensity?: number
  }>(),
  {
    speed: 6.4,
    direction: 'clockwise',
    intensity: 1,
  },
)

const uid = `hgb-${Math.random().toString(36).slice(2, 8)}`

const baseStyle = computed(() => {
  const speed = Math.max(1.6, props.speed)
  const toneStyle = props.tone
    ? {
        '--gauge-tone': props.tone,
        '--gauge-tone-soft': `color-mix(in srgb, ${props.tone} 58%, #ffffff 42%)`,
        '--gauge-tone-bright': `color-mix(in srgb, ${props.tone} 18%, #ffffff 82%)`,
      }
    : {}

  return {
    ...toneStyle,
    '--holo-speed': `${speed}s`,
    '--holo-speed-fast': `${Number((speed * 0.72).toFixed(2))}s`,
    '--holo-intensity': Math.min(1.35, Math.max(0.2, props.intensity)),
  }
})
</script>

<template>
  <div
    class="hologram-gauge-base"
    :class="{ 'is-counter-clockwise': direction === 'counter-clockwise' }"
    :style="baseStyle"
    aria-hidden="true"
  >
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
        <!-- 顶层独立高亮，中心能量向外扩散并在边沿收亮 -->
        <radialGradient :id="`${uid}-top-deck`" cx="50%" cy="45%" r="62%">
          <stop offset="0" stop-color="var(--gauge-tone-bright)" stop-opacity="0.56" />
          <stop offset="0.22" stop-color="var(--gauge-tone-soft)" stop-opacity="0.34" />
          <stop offset="0.7" stop-color="var(--instrument-base)" stop-opacity="0.16" />
          <stop offset="0.92" stop-color="var(--gauge-tone)" stop-opacity="0.3" />
          <stop offset="1" stop-color="var(--gauge-tone-bright)" stop-opacity="0.64" />
        </radialGradient>
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
        <linearGradient :id="`${uid}-beam`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0" />
          <stop offset="0.46" stop-color="var(--gauge-tone)" stop-opacity="0.14" />
          <stop offset="0.72" stop-color="var(--gauge-tone-soft)" stop-opacity="0.42" />
          <stop offset="1" stop-color="var(--gauge-tone-bright)" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient :id="`${uid}-beam-core`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0" />
          <stop offset="0.52" stop-color="var(--gauge-tone-soft)" stop-opacity="0.12" />
          <stop offset="0.82" stop-color="var(--gauge-tone-bright)" stop-opacity="0.58" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.96" />
        </linearGradient>
        <!-- 小孔成像顶部投射光斑渐变 -->
        <radialGradient :id="`${uid}-spot`" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.92" />
          <stop offset="0.3" stop-color="var(--gauge-tone-bright)" stop-opacity="0.6" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0" />
        </radialGradient>
        <!-- 小孔成像扇形发光锥：以针孔为圆心的径向渐变 -->
        <radialGradient :id="`${uid}-cone`" cx="110" cy="29" r="120" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.96" />
          <stop offset="0.12" stop-color="var(--gauge-tone-bright)" stop-opacity="0.82" />
          <stop offset="0.38" stop-color="var(--gauge-tone-soft)" stop-opacity="0.44" />
          <stop offset="0.72" stop-color="var(--gauge-tone)" stop-opacity="0.16" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0" />
        </radialGradient>
        <filter :id="`${uid}-blur`" x="-40%" y="-70%" width="180%" height="240%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>
        <filter :id="`${uid}-beam-blur`" x="-50%" y="-30%" width="200%" height="170%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter :id="`${uid}-soft`" x="-60%" y="-120%" width="220%" height="340%">
          <feGaussianBlur stdDeviation="4.4" />
        </filter>
        <!-- 裁剪发光锥：底座范围内，留出拱顶弧线高度 -->
        <clipPath :id="`${uid}-cone-clip`">
          <rect x="0" y="-14" width="220" height="44" />
        </clipPath>
      </defs>

      <!-- 底部投影光晕 -->
      <ellipse
        class="gauge-base-glow"
        cx="110"
        cy="54"
        rx="118"
        ry="20"
        :fill="`url(#${uid}-glow)`"
        :filter="`url(#${uid}-soft)`"
      />

      <!-- 小孔成像：针孔向上扩散的单层扇形发光锥（裁剪在底座范围内） -->
      <g class="gauge-base-projector" :clip-path="`url(#${uid}-cone-clip)`">
        <path
          class="gauge-base-cone"
          d="M110 29 L42 2 Q110 -14 178 2 L110 29 Z"
          :fill="`url(#${uid}-cone)`"
          :filter="`url(#${uid}-soft)`"
        />
      </g>

      <!-- 三层低矮椭圆台阶，几何保持静止 -->
      <g class="gauge-base-tier gauge-base-tier--bottom">
        <path
          class="gauge-base-wall"
          d="M6 42 C40 59 180 59 214 42 L208 50 C176 65 44 65 12 50 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <ellipse class="gauge-base-deck" cx="110" cy="42" rx="104" ry="15" :fill="`url(#${uid}-deck)`" />
        <path class="gauge-base-front" d="M14 45 C48 59 172 59 206 45" />
      </g>

      <g class="gauge-base-tier gauge-base-tier--middle">
        <path
          class="gauge-base-wall"
          d="M24 36 C54 49 166 49 196 36 L191 43 C161 54 59 54 29 43 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <ellipse class="gauge-base-deck" cx="110" cy="36" rx="86" ry="12" :fill="`url(#${uid}-deck)`" />
        <path class="gauge-base-rim" d="M27 36 C55 24 165 24 193 36" :stroke="`url(#${uid}-rim)`" />
      </g>

      <g class="gauge-base-tier gauge-base-tier--top">
        <path
          class="gauge-base-wall"
          d="M44 29 C66 39 154 39 176 29 L172 36 C149 44 71 44 48 36 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <ellipse
          class="gauge-base-deck gauge-base-deck--top"
          cx="110"
          cy="29"
          rx="66"
          ry="9"
          :fill="`url(#${uid}-top-deck)`"
        />
      </g>

      <!-- 椭圆不旋转，仅让虚线沿路径流动，保持正确透视 -->
      <ellipse
        class="gauge-base-orbit gauge-base-orbit--rotating gauge-base-orbit--outer"
        cx="110"
        cy="42"
        rx="112"
        ry="20"
        pathLength="100"
        stroke-dasharray="7 4 1 5"
      />
      <ellipse
        class="gauge-base-orbit gauge-base-orbit--rotating gauge-base-orbit--inner"
        cx="110"
        cy="29"
        rx="70"
        ry="10"
        pathLength="100"
        stroke-dasharray="2 3"
      />

      <!-- 背侧亮环 -->
      <path class="gauge-base-rim" d="M8 42 C44 19 176 19 212 42" :stroke="`url(#${uid}-rim)`" />

      <!-- 台面同心环 -->
      <ellipse class="gauge-base-ring" cx="110" cy="36" rx="82" ry="11.5" />
      <ellipse class="gauge-base-ring gauge-base-ring--inner" cx="110" cy="29" rx="48" ry="6.5" />

      <!-- 分段高光：模拟断续全息轨道 -->
      <g class="gauge-base-segments" :filter="`url(#${uid}-blur)`">
        <path d="M37 35 C67 22 119 20 154 22" />
        <path class="gauge-base-segments--dim" d="M162 24 C188 26 207 34 214 42" />
      </g>

      <!-- 左侧不规则强光 -->
      <path
        class="gauge-base-lglow"
        d="M10 42 C20 29 58 21 96 23 C72 28 44 36 28 47 C20 52 12 50 8 45 C6 43 7 42 10 42 Z"
        :fill="`url(#${uid}-left)`"
        :filter="`url(#${uid}-blur)`"
      />

      <!-- 环绕扫描高光 -->
      <ellipse
        class="gauge-base-scan"
        cx="110"
        cy="42"
        rx="106"
        ry="18"
        pathLength="100"
        stroke-dasharray="16 84"
      />

      <!-- 中心强光 -->
      <ellipse
        class="gauge-base-spark"
        cx="110"
        cy="29"
        rx="20"
        ry="4"
        :fill="`url(#${uid}-center)`"
        :filter="`url(#${uid}-blur)`"
      />
      <circle class="gauge-base-dot" cx="110" cy="29" r="1.8" />
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
  opacity: var(--holo-intensity, 1);
}

.gauge-base-wall,
.gauge-base-deck,
.gauge-base-rim,
.gauge-base-ring,
.gauge-base-orbit,
.gauge-base-scan,
.gauge-base-front,
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
  opacity: 0.44;
}

.gauge-base-orbit--rotating {
  stroke-width: 1.05;
  animation: gauge-base-orbit-spin var(--holo-speed, 6.4s) linear infinite;
}

.gauge-base-orbit--inner {
  animation-duration: var(--holo-speed-fast, 4.6s);
  animation-direction: reverse;
}

.hologram-gauge-base.is-counter-clockwise .gauge-base-orbit--outer {
  animation-direction: reverse;
}

.hologram-gauge-base.is-counter-clockwise .gauge-base-orbit--inner {
  animation-direction: normal;
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
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 68%, var(--instrument-base-rim));
  stroke-width: 1.1;
  opacity: 0.96;
  filter: drop-shadow(0 0 2px color-mix(in srgb, var(--gauge-tone) 72%, transparent));
}

.gauge-base-tier--bottom {
  opacity: 0.72;
}

.gauge-base-tier--middle {
  opacity: 0.84;
}

.gauge-base-tier--top {
  opacity: 0.96;
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
  animation: gauge-base-scan-sweep var(--holo-speed-fast, 4.6s) linear infinite;
}

.gauge-base-projector {
  transform-origin: 110px 29px;
  transform-box: view-box;
  animation: gauge-base-beam-pulse 3.2s ease-in-out infinite;
}

.gauge-base-cone {
  opacity: 0.88;
}

.gauge-base-spark {
  opacity: 0.96;
}

.gauge-base-dot {
  fill: #fff;
  opacity: 1;
  filter:
    drop-shadow(0 0 2px #fff)
    drop-shadow(0 0 5px var(--gauge-tone-bright))
    drop-shadow(0 0 11px var(--gauge-tone));
}

@keyframes gauge-base-scan-sweep {
  from {
    stroke-dashoffset: 0;
  }

  to {
    stroke-dashoffset: -100;
  }
}

@keyframes gauge-base-orbit-spin {
  to {
    stroke-dashoffset: -100;
  }
}

@keyframes gauge-base-beam-pulse {
  0%,
  100% {
    opacity: 0.78;
    transform: scaleX(0.94);
  }

  50% {
    opacity: 1;
    transform: scaleX(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gauge-base-scan,
  .gauge-base-orbit--rotating,
  .gauge-base-projector {
    animation: none;
  }
}

/*
 * 浅色主题下 .gauge-base-* 的覆盖统一放在全局 styles/rings.css。
 * 不能写在这里的 scoped <style> 中：Vue 会把 `:global(A) .b` 编译成只剩 `A`，
 * 后代选择器被丢弃，导致 opacity 直接落到 .dashboard-shell 本身（整壳半透明发白）。
 */
</style>
