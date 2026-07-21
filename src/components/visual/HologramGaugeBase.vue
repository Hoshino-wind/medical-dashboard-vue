<script setup lang="ts">
import { computed } from 'vue'
import HologramGaugeBaseDefs from './HologramGaugeBaseDefs.vue'

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
      <HologramGaugeBaseDefs :uid="uid" />

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
          <circle class="gauge-base-deck" cx="0" cy="0" r="104" :fill="`url(#${uid}-deck)`" />
          <g class="gauge-base-rotor gauge-base-rotor--bottom">
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
          <circle class="gauge-base-deck" cx="0" cy="0" r="86" :fill="`url(#${uid}-deck)`" />
          <circle class="gauge-base-rim" cx="0" cy="0" r="82" :stroke="`url(#${uid}-rim)`" />
          <g class="gauge-base-rotor gauge-base-rotor--middle">
            <circle
              class="gauge-base-rotor-rail"
              cx="0"
              cy="0"
              r="73"
              pathLength="100"
              stroke-dasharray="5 3 1 4"
            />
            <path class="gauge-base-rotor-spokes" d="M-65 0 H65 M-32 -56 L32 56 M32 -56 L-32 56" />
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
          <g class="gauge-base-rotor gauge-base-rotor--top">
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

<style scoped src="./HologramGaugeBase.css"></style>
