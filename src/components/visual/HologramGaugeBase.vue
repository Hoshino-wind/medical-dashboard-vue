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
    '--holo-speed-middle': `${Number((speed * 0.86).toFixed(2))}s`,
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
    <span class="hologram-gauge-volume" aria-hidden="true"></span>
    <svg class="hologram-gauge-base-svg" viewBox="0 0 220 76" focusable="false">
      <defs>
        <!-- 基座与台面材质：金属外壳保持体积，只让发射窗和能量通道染上 tone -->
        <radialGradient :id="`${uid}-glow`" cx="50%" cy="54%" r="60%">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0.34" />
          <stop offset="0.46" stop-color="var(--instrument-base-rim)" stop-opacity="0.13" />
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
          <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.62" />
          <stop offset="0.18" stop-color="var(--gauge-tone)" stop-opacity="0.34" />
          <stop offset="0.5" stop-color="var(--instrument-base)" stop-opacity="0.78" />
          <stop offset="1" stop-color="var(--holo-shell-dark, #020711)" stop-opacity="0.94" />
        </linearGradient>
        <!-- 台面 -->
        <linearGradient :id="`${uid}-deck`" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="var(--instrument-base-rim)" stop-opacity="0.5" />
          <stop offset="0.26" stop-color="var(--instrument-base)" stop-opacity="0.68" />
          <stop offset="0.7" stop-color="var(--holo-deck-dark, #061221)" stop-opacity="0.86" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0.34" />
        </linearGradient>
        <!-- 顶层独立高亮，中心能量向外扩散并在边沿收亮 -->
        <radialGradient :id="`${uid}-top-deck`" cx="50%" cy="45%" r="62%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="0.14" stop-color="var(--gauge-tone-bright)" stop-opacity="0.82" />
          <stop offset="0.42" stop-color="var(--gauge-tone-soft)" stop-opacity="0.46" />
          <stop offset="0.76" stop-color="var(--instrument-base)" stop-opacity="0.5" />
          <stop offset="0.94" stop-color="var(--gauge-tone)" stop-opacity="0.62" />
          <stop offset="1" stop-color="var(--gauge-tone-bright)" stop-opacity="0.9" />
        </radialGradient>
        <radialGradient :id="`${uid}-aperture`" cx="50%" cy="42%" r="64%">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.98" />
          <stop offset="0.18" stop-color="var(--gauge-tone-bright)" stop-opacity="0.92" />
          <stop offset="0.48" stop-color="var(--gauge-tone)" stop-opacity="0.48" />
          <stop offset="0.78" stop-color="var(--holo-aperture-dark, #030b16)" stop-opacity="0.9" />
          <stop offset="1" stop-color="var(--gauge-tone-soft)" stop-opacity="0.76" />
        </radialGradient>
        <linearGradient :id="`${uid}-status`" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0" />
          <stop offset="0.28" stop-color="var(--gauge-tone)" stop-opacity="0.72" />
          <stop offset="0.5" stop-color="var(--gauge-tone-bright)" stop-opacity="0.96" />
          <stop offset="0.72" stop-color="var(--gauge-tone)" stop-opacity="0.72" />
          <stop offset="1" stop-color="var(--gauge-tone)" stop-opacity="0" />
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
        <linearGradient :id="`${uid}-beam`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0.06" />
          <stop offset="0.38" stop-color="var(--gauge-tone)" stop-opacity="0.18" />
          <stop offset="0.7" stop-color="var(--gauge-tone-soft)" stop-opacity="0.52" />
          <stop offset="1" stop-color="var(--gauge-tone-bright)" stop-opacity="0.94" />
        </linearGradient>
        <linearGradient :id="`${uid}-beam-core`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--gauge-tone)" stop-opacity="0.04" />
          <stop offset="0.5" stop-color="var(--gauge-tone-soft)" stop-opacity="0.2" />
          <stop offset="0.8" stop-color="var(--gauge-tone-bright)" stop-opacity="0.68" />
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

      <!--
        从发射窗上升的三层体积光：倒梯形(上宽下窄)、宽发射角。
        底边为平口发射窗(非尖点)，向上张开约 140~150°，外层最宽、亮芯最窄。
      -->
      <g class="gauge-base-projector">
        <path
          class="gauge-base-beam gauge-base-beam--outer"
          d="M96 29 L-40 -21 L260 -21 L124 29 Z"
          :fill="`url(#${uid}-beam)`"
          :filter="`url(#${uid}-soft)`"
        />
        <path
          class="gauge-base-beam gauge-base-beam--inner"
          d="M102 29 L18 -21 L202 -21 L118 29 Z"
          :fill="`url(#${uid}-beam)`"
          :filter="`url(#${uid}-beam-blur)`"
        />
        <path
          class="gauge-base-beam gauge-base-beam--core"
          d="M106 29 L64 -21 L156 -21 L114 29 Z"
          :fill="`url(#${uid}-beam-core)`"
          :filter="`url(#${uid}-blur)`"
        />
      </g>

      <ellipse
        class="gauge-base-ground-shadow"
        cx="110"
        cy="58"
        rx="104"
        ry="13"
        fill="var(--holo-shadow, #01040a)"
      />

      <!--
        三层低矮椭圆台阶：侧壁是静止外壳，台面是独立旋转体。
        旋转体先按正圆运动，再由外层 scale 压成透视椭圆，避免整只椭圆在屏幕平面内翻转。
      -->
      <g class="gauge-base-tier gauge-base-tier--bottom">
        <path
          class="gauge-base-wall"
          d="M6 42 C40 59 180 59 214 42 L208 50 C176 65 44 65 12 50 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <g class="gauge-base-rotor-plane" transform="translate(110 42) scale(1 0.1442)">
          <g class="gauge-base-rotor gauge-base-rotor--bottom">
            <circle class="gauge-base-deck" cx="0" cy="0" r="104" :fill="`url(#${uid}-deck)`" />
            <circle
              class="gauge-base-rotor-rail gauge-base-rotor-rail--outer"
              cx="0"
              cy="0"
              r="98"
              pathLength="100"
              stroke-dasharray="7 4 1 5"
            />
            <path
              class="gauge-base-rotor-spokes"
              d="M-84 0 H84 M0 -84 V84 M-59 -59 L59 59 M59 -59 L-59 59"
            />
            <g class="gauge-base-rotor-nodes">
              <circle cx="76" cy="0" r="2.8" />
              <circle cx="-76" cy="0" r="2.8" />
              <circle cx="0" cy="76" r="2.8" />
              <circle cx="0" cy="-76" r="2.8" />
            </g>
          </g>
        </g>
        <path class="gauge-base-front" d="M14 45 C48 59 172 59 206 45" />
        <path class="gauge-base-strut" d="M24 47 L41 42 L48 48 L34 54 Z" />
        <path class="gauge-base-strut" d="M196 47 L179 42 L172 48 L186 54 Z" />
      </g>

      <g class="gauge-base-tier gauge-base-tier--middle">
        <path
          class="gauge-base-wall"
          d="M24 36 C54 49 166 49 196 36 L191 43 C161 54 59 54 29 43 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <g class="gauge-base-rotor-plane" transform="translate(110 36) scale(1 0.1395)">
          <g class="gauge-base-rotor gauge-base-rotor--middle">
            <circle class="gauge-base-deck" cx="0" cy="0" r="86" :fill="`url(#${uid}-deck)`" />
            <circle class="gauge-base-rim" cx="0" cy="0" r="82" :stroke="`url(#${uid}-rim)`" />
            <circle
              class="gauge-base-rotor-rail"
              cx="0"
              cy="0"
              r="73"
              pathLength="100"
              stroke-dasharray="5 3 1 4"
            />
            <path
              class="gauge-base-rotor-spokes"
              d="M-65 0 H65 M-32 -56 L32 56 M32 -56 L-32 56"
            />
            <g class="gauge-base-rotor-nodes">
              <circle cx="54" cy="0" r="2.5" />
              <circle cx="-27" cy="47" r="2.5" />
              <circle cx="-27" cy="-47" r="2.5" />
            </g>
          </g>
        </g>
      </g>

      <g class="gauge-base-tier gauge-base-tier--top">
        <path
          class="gauge-base-wall"
          d="M44 29 C66 39 154 39 176 29 L172 36 C149 44 71 44 48 36 Z"
          :fill="`url(#${uid}-wall)`"
        />
        <g class="gauge-base-rotor-plane" transform="translate(110 29) scale(1 0.1364)">
          <g class="gauge-base-rotor gauge-base-rotor--top">
            <circle
              class="gauge-base-deck gauge-base-deck--top"
              cx="0"
              cy="0"
              r="66"
              :fill="`url(#${uid}-top-deck)`"
            />
            <circle
              class="gauge-base-aperture"
              cx="0"
              cy="0"
              r="43"
              :fill="`url(#${uid}-aperture)`"
            />
            <circle
              class="gauge-base-aperture-ring"
              cx="0"
              cy="0"
              r="37"
              pathLength="100"
              stroke-dasharray="8 3 2 4"
            />
            <path class="gauge-base-rotor-spokes" d="M-34 0 H34 M0 -34 V34" />
            <g class="gauge-base-rotor-nodes gauge-base-rotor-nodes--top">
              <circle cx="27" cy="0" r="2.2" />
              <circle cx="-27" cy="0" r="2.2" />
              <circle cx="0" cy="27" r="2.2" />
              <circle cx="0" cy="-27" r="2.2" />
            </g>
          </g>
        </g>
      </g>

      <!-- 背侧亮环 -->
      <path class="gauge-base-rim" d="M8 42 C44 19 176 19 212 42" :stroke="`url(#${uid}-rim)`" />

      <!-- 前置状态窗和紧固点，让底座更像可维护的真实设备 -->
      <path
        class="gauge-base-status-window"
        d="M82 51 C92 53 128 53 138 51 L132 55 C122 57 98 57 88 55 Z"
        :fill="`url(#${uid}-status)`"
      />
      <circle class="gauge-base-fastener" cx="35" cy="50" r="1.35" />
      <circle class="gauge-base-fastener" cx="185" cy="50" r="1.35" />

      <!-- 左侧不规则强光 -->
      <path
        class="gauge-base-lglow"
        d="M10 42 C20 29 58 21 96 23 C72 28 44 36 28 47 C20 52 12 50 8 45 C6 43 7 42 10 42 Z"
        :fill="`url(#${uid}-left)`"
        :filter="`url(#${uid}-blur)`"
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
  isolation: isolate;
  pointer-events: none;
}

.hologram-gauge-volume {
  position: absolute;
  top: -72%;
  left: 50%;
  z-index: 0;
  display: block;
  width: 68%;
  height: 116%;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--gauge-tone) 7%, transparent),
    color-mix(in srgb, var(--gauge-tone) 18%, transparent) 44%,
    color-mix(in srgb, var(--gauge-tone-soft) 48%, transparent) 76%,
    color-mix(in srgb, var(--gauge-tone-bright) 78%, transparent)
  );
  clip-path: polygon(2% 0, 98% 0, 57% 100%, 43% 100%);
  filter: blur(5px);
  mix-blend-mode: screen;
  opacity: 0.42;
  transform: translateX(-50%);
  transform-origin: 50% 100%;
  animation: gauge-base-volume-pulse 3.2s ease-in-out infinite;
}

.hologram-gauge-volume::after {
  content: '';
  position: absolute;
  inset: 8% 34% 0;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--gauge-tone-bright) 4%, transparent),
    color-mix(in srgb, var(--gauge-tone-bright) 54%, transparent) 74%,
    color-mix(in srgb, #ffffff 82%, transparent)
  );
  clip-path: polygon(0 0, 100% 0, 64% 100%, 36% 100%);
  filter: blur(2px);
  opacity: 0.7;
}

.hologram-gauge-base-svg {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  opacity: var(--holo-intensity, 1);
}

.gauge-base-wall,
.gauge-base-deck,
.gauge-base-aperture,
.gauge-base-aperture-ring,
.gauge-base-rim,
.gauge-base-rotor-rail,
.gauge-base-rotor-spokes,
.gauge-base-front,
.gauge-base-fastener,
.gauge-base-rotor-nodes circle {
  vector-effect: non-scaling-stroke;
}

.gauge-base-ground-shadow {
  opacity: 0.86;
  filter: blur(2.2px);
}

.gauge-base-projector {
  transform-origin: 110px 29px;
  transform-box: view-box;
  mix-blend-mode: screen;
  animation: gauge-base-beam-pulse 3.2s ease-in-out infinite;
}

.gauge-base-beam {
  transform-origin: 110px 29px;
  transform-box: view-box;
}

.gauge-base-beam--outer {
  stroke: color-mix(in srgb, var(--gauge-tone-soft) 34%, transparent);
  stroke-width: 0.5;
  opacity: 0.46;
}

.gauge-base-beam--inner {
  opacity: 0.68;
}

.gauge-base-beam--core {
  opacity: 0.9;
}

.gauge-base-rotor-plane {
  pointer-events: none;
}

.gauge-base-rotor {
  transform-box: fill-box;
  transform-origin: center;
  animation: gauge-base-layer-rotate var(--holo-speed, 6.4s) linear infinite;
}

.gauge-base-rotor--middle {
  animation-duration: var(--holo-speed-middle, 5.5s);
  animation-direction: reverse;
  animation-delay: -1.35s;
}

.gauge-base-rotor--top {
  animation-duration: var(--holo-speed-fast, 4.6s);
  animation-delay: -0.8s;
}

.hologram-gauge-base.is-counter-clockwise .gauge-base-rotor--bottom,
.hologram-gauge-base.is-counter-clockwise .gauge-base-rotor--top {
  animation-direction: reverse;
}

.hologram-gauge-base.is-counter-clockwise .gauge-base-rotor--middle {
  animation-direction: normal;
}

.gauge-base-wall {
  stroke: color-mix(in srgb, var(--instrument-base-rim) 48%, var(--gauge-tone) 18%);
  stroke-width: 0.95;
}

.gauge-base-deck {
  stroke: color-mix(in srgb, var(--instrument-base-rim) 58%, var(--gauge-tone) 18%);
  stroke-width: 1;
  filter: drop-shadow(0 1.5px 2px color-mix(in srgb, #000000 62%, transparent));
}

.gauge-base-deck--top {
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 68%, var(--instrument-base-rim));
  stroke-width: 1.1;
  opacity: 0.96;
  filter: drop-shadow(0 0 2px color-mix(in srgb, var(--gauge-tone) 72%, transparent));
}

.gauge-base-tier--bottom {
  opacity: 0.96;
}

.gauge-base-tier--middle {
  opacity: 0.94;
}

.gauge-base-tier--top {
  opacity: 0.96;
}

.gauge-base-rim {
  fill: none;
  stroke-width: 1.4;
  opacity: 0.82;
}

.gauge-base-strut {
  fill: color-mix(in srgb, var(--instrument-base) 82%, var(--holo-shell-dark, #020711) 18%);
  stroke: color-mix(in srgb, var(--instrument-base-rim) 44%, transparent);
  stroke-width: 0.75;
}

.gauge-base-rotor-rail {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone-soft) 64%, var(--instrument-base-rim));
  stroke-width: 0.9;
  opacity: 0.58;
}

.gauge-base-rotor-rail--outer {
  stroke-width: 1.05;
  opacity: 0.72;
}

.gauge-base-rotor-spokes {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone) 38%, var(--instrument-base-rim));
  stroke-width: 0.72;
  stroke-linecap: round;
  opacity: 0.3;
}

.gauge-base-rotor-nodes circle {
  fill: color-mix(in srgb, var(--gauge-tone-bright) 74%, #ffffff 26%);
  stroke: color-mix(in srgb, var(--gauge-tone) 72%, var(--instrument-base-rim));
  stroke-width: 0.72;
  opacity: 0.84;
}

.gauge-base-rotor-nodes--top circle {
  opacity: 0.96;
}

.gauge-base-aperture {
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 78%, #ffffff 22%);
  stroke-width: 1.15;
  opacity: 0.98;
  filter: drop-shadow(0 0 4px color-mix(in srgb, var(--gauge-tone) 88%, transparent));
}

.gauge-base-aperture-ring {
  fill: none;
  stroke: color-mix(in srgb, var(--gauge-tone-bright) 86%, #ffffff 14%);
  stroke-width: 0.8;
  opacity: 0.86;
}

.gauge-base-status-window {
  opacity: 0.84;
  filter: drop-shadow(0 0 3px color-mix(in srgb, var(--gauge-tone) 76%, transparent));
}

.gauge-base-fastener {
  fill: color-mix(in srgb, var(--instrument-base-rim) 72%, #ffffff 28%);
  stroke: color-mix(
    in srgb,
    var(--holo-shell-dark, #020711) 68%,
    var(--instrument-base-rim) 32%
  );
  stroke-width: 0.75;
  opacity: 0.72;
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

.gauge-base-spark {
  opacity: 0.96;
  animation: gauge-base-emitter-breathe 2.6s ease-in-out infinite;
}

.gauge-base-dot {
  fill: #fff;
  opacity: 1;
  filter:
    drop-shadow(0 0 2px #fff)
    drop-shadow(0 0 5px var(--gauge-tone-bright))
    drop-shadow(0 0 11px var(--gauge-tone));
}

@keyframes gauge-base-layer-rotate {
  to {
    transform: rotate(1turn);
  }
}

@keyframes gauge-base-beam-pulse {
  0%,
  100% {
    opacity: 0.76;
    transform: scaleX(0.96);
  }

  50% {
    opacity: 1;
    transform: scaleX(1.018);
  }
}

@keyframes gauge-base-emitter-breathe {
  0%,
  100% {
    opacity: var(--holo-emitter-min, 0.76);
    transform: scaleX(0.9);
  }

  50% {
    opacity: var(--holo-emitter-max, 1);
    transform: scaleX(1.06);
  }
}

@keyframes gauge-base-volume-pulse {
  0%,
  100% {
    opacity: var(--holo-volume-min, 0.32);
    transform: translateX(-50%) scaleX(0.94);
  }

  50% {
    opacity: var(--holo-volume-max, 0.46);
    transform: translateX(-50%) scaleX(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .gauge-base-rotor,
  .gauge-base-spark,
  .hologram-gauge-volume,
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
