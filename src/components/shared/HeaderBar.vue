<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import sunnicareLogo from '../../assets/sunnicare-logo.png'
import hospitalLogo from '../../assets/jiangmen-central-hospital-logo.png'
import type { HeaderData } from '@/types/dashboard'

defineProps<{
  data: HeaderData
}>()

const beijingClock = defineBeijingClock()

function defineBeijingClock() {
  const text = ref('')
  let timer: ReturnType<typeof setInterval> | null = null

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  })

  const pad = (value: string): string => (value.length < 2 ? `0${value}` : value)

  const tick = (): void => {
    const map: Record<string, string> = {}
    for (const part of formatter.formatToParts(new Date())) {
      map[part.type] = part.value
    }
    let hour = pad(map.hour ?? '0')
    if (hour === '24') hour = '00'
    text.value = `${map.year}-${pad(map.month)}-${pad(map.day)} ${hour}:${pad(map.minute)} ${map.weekday}`
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  })

  return { text }
}
</script>

<template>
  <header class="dashboard-header">
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
        <path
          class="header-line is-main"
          data-header-connector="left"
          d="M6 8 H160 L178 30 H404 L432 42 H482"
        />
        <path
          class="header-line is-main"
          data-header-connector="right"
          d="M6 8 H160 L178 30 H404 L432 42 H482"
          transform="translate(1400 0) scale(-1 1)"
        />
        <path
          class="header-line is-step"
          data-header-step="left"
          d="M306 50 H390 L418 62 H470"
        />
        <path
          class="header-line is-step"
          data-header-step="right"
          d="M306 50 H390 L418 62 H470"
          transform="translate(1400 0) scale(-1 1)"
        />
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
        <path class="header-flow-glow is-left" d="M6 8 H160 L178 30 H404 L432 42 H482" />
        <path
          class="header-flow-glow is-right"
          d="M6 8 H160 L178 30 H404 L432 42 H482"
          transform="translate(1400 0) scale(-1 1)"
        />
        <path class="header-flow-glow is-title" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />
        <path class="header-flow is-left" d="M6 8 H160 L178 30 H404 L432 42 H482" />
        <path
          class="header-flow is-right"
          d="M6 8 H160 L178 30 H404 L432 42 H482"
          transform="translate(1400 0) scale(-1 1)"
        />
        <path class="header-flow is-title" d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z" />
      </g>

      <ellipse class="header-core-glow" cx="700" cy="72" rx="134" ry="5" />
    </svg>

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

<style scoped>
.dashboard-header {
  position: relative;
  display: grid;
  grid-template-columns: minmax(28rem, 0.9fr) minmax(42rem, 1.4fr) minmax(28rem, 0.9fr);
  align-items: center;
  gap: 0.75rem;
  isolation: isolate;
}
.dashboard-header::before {
  content: "";
  position: absolute;
  display: none;
  left: 10rem;
  right: 10rem;
  top: 50%;
  height: 0.0625rem;
  background: linear-gradient(90deg, transparent, var(--accent), var(--accent-2), var(--accent), transparent);
  opacity: 0.74;
  transform: translateY(-50%);
}
.header-tech-frame {
  position: absolute;
  inset: -0.42rem 1.05rem auto;
  z-index: 0;
  width: calc(100% - 2.1rem);
  height: 4.95rem;
  pointer-events: none;
  overflow: visible;
  opacity: 0.9;
  animation: header-frame-breathe 5.2s ease-in-out infinite;
}
.header-stop-primary {
  stop-color: var(--chart-primary);
  stop-opacity: 0.82;
}
.header-stop-secondary {
  stop-color: var(--accent-2);
  stop-opacity: 0.96;
}
.header-stop-tertiary {
  stop-color: var(--chart-secondary);
  stop-opacity: 0.9;
}
.header-stop-primary.is-soft,
.header-stop-secondary.is-soft,
.header-stop-tertiary.is-soft {
  stop-opacity: 0.28;
}
.header-stop-secondary.is-strong,
.header-stop-tertiary.is-strong {
  stop-opacity: 0.78;
}
.header-stop-primary.is-transparent {
  stop-opacity: 0;
}
.dashboard-header > .brand-chip,
.dashboard-header > .title-frame,
.dashboard-header > .hospital-chip {
  z-index: 1;
}
.header-title-fill {
  fill: color-mix(in srgb, var(--chart-primary) 4%, transparent);
  stroke: color-mix(in srgb, var(--chart-primary) 42%, transparent);
}
.header-line,
.header-ticks path,
.header-micro-lines path {
  fill: none;
  stroke: url(#headerLineGradient);
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.header-line.is-main {
  stroke-width: 1.15;
  opacity: 0.82;
}
.header-line.is-title {
  stroke-width: 1.65;
  opacity: 1;
}
.header-line.is-inner {
  stroke-width: 0.75;
  opacity: 0.42;
}
.header-line.is-step {
  stroke-width: 1.05;
  opacity: 0.76;
}
.header-line.is-widget {
  stroke-width: 1;
  opacity: 0.68;
}
.header-ticks path {
  stroke-width: 1.65;
  opacity: 0.88;
}
.header-micro-lines path {
  stroke-width: 1.1;
  stroke-dasharray: 1 4;
  opacity: 0.72;
}
.header-flow-core {
  stop-color: #ffffff;
  stop-opacity: 0.72;
}
.header-flow-group {
  pointer-events: none;
}
/* 流光辉光底层:宽柔散射,营造光晕溢出 */
.header-flow-glow {
  fill: none;
  stroke: url(#headerFlowGlowGradient);
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 42 190;
  vector-effect: non-scaling-stroke;
  opacity: 0.28;
  filter: url(#headerFlowSoftGlow);
  animation: header-flow-sweep-short 6.8s linear infinite;
}
.header-flow-glow.is-right {
  animation-delay: -1.8s;
}
.header-flow-glow.is-title {
  stroke-width: 3.6;
  stroke-dasharray: 72 868;
  opacity: 0.34;
  animation: header-flow-sweep 9.4s linear infinite;
  animation-delay: -1.1s;
}
/* 流光亮芯:细亮线 + 轻发光,中央纯白 */
.header-flow {
  fill: none;
  stroke: url(#headerFlowGradient);
  stroke-width: 1.35;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 24 208;
  vector-effect: non-scaling-stroke;
  opacity: 0.58;
  filter: url(#headerFlowGlow);
  animation: header-flow-sweep-short 6.2s linear infinite;
}
.header-flow.is-right {
  animation-delay: -1.6s;
}
.header-flow.is-title {
  stroke-width: 1.45;
  stroke-dasharray: 46 898;
  opacity: 0.62;
  animation: header-flow-sweep 9.4s linear infinite;
  animation-delay: -1.1s;
}
.header-core-glow {
  display: block;
  fill: color-mix(in srgb, var(--accent-2) 92%, transparent);
  opacity: 0.94;
  transform-origin: 50% 50%;
  animation: header-core-breathe 2.8s ease-in-out infinite;
}
.brand-chip,
.hospital-chip {
  position: relative;
  display: flex;
  min-width: 0;
  height: 3.625rem;
  align-items: center;
  gap: 1.55rem;
  overflow: hidden;
  border-top: 0.0625rem solid transparent;
  border-bottom: 0.0625rem solid transparent;
  background: transparent;
  box-shadow: none;
}
.brand-chip {
  justify-content: flex-start;
  padding: 0;
  clip-path: polygon(0 0, 92% 0, 100% 50%, 92% 100%, 0 100%);
  transform: translate(-0.125rem, -0.0625rem);
}
.hospital-chip {
  justify-content: flex-end;
  height: 4.125rem;
  gap: 0.9rem;
  overflow: visible;
  padding: 0;
  clip-path: none;
  transform: translate(0.125rem, -0.0625rem);
}
.brand-chip::after,
.hospital-chip::after {
  content: "";
  position: absolute;
  display: none;
  bottom: 0.375rem;
  height: 0.125rem;
  width: 58%;
  background: linear-gradient(90deg, transparent, var(--accent-2), transparent);
  opacity: 0.78;
}
.brand-chip::after {
  right: 0.5rem;
}
.hospital-chip::after {
  left: 0.5rem;
}
.brand-lockup {
  position: relative;
  display: inline-flex;
  width: 15.25rem;
  height: 3.1875rem;
  flex: none;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  padding: 0 2.25rem 0 1.1rem;
  border: 0.0625rem solid color-mix(in srgb, var(--glass-edge) 92%, transparent);
  border-radius: 0;
  clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%);
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--chart-primary) 16%, transparent), transparent 30% 72%, color-mix(in srgb, var(--chart-secondary) 10%, transparent)),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-strong) 20%, transparent), color-mix(in srgb, var(--surface) 10%, transparent));
  box-shadow:
    inset 0 0.0625rem 0 color-mix(in srgb, var(--instrument-rim) 34%, transparent),
    0 0 1.1rem color-mix(in srgb, var(--chart-primary) 22%, transparent);
}
.brand-lockup::before {
  content: "";
  position: absolute;
  inset: 0.0625rem;
  clip-path: inherit;
  border: 0.0625rem solid color-mix(in srgb, var(--chart-primary) 74%, transparent);
  pointer-events: none;
}
.brand-lockup::after {
  content: "";
  position: absolute;
  inset: auto 2.3rem 0.4rem 0.9rem;
  height: 0.125rem;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--chart-primary) 88%, transparent), transparent);
  opacity: 0.8;
  animation: header-chip-breathe 3.6s ease-in-out infinite;
}
.brand-logo {
  position: relative;
  z-index: 1;
  display: block;
  width: auto;
  max-width: 100%;
  height: 3.25rem;
  flex: none;
  object-fit: contain;
}
.brand-clock {
  position: relative;
  flex: none;
  min-width: 13.9rem;
  padding-left: 1.1rem;
  color: var(--text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  transform: translate(-0.75rem, 1.06rem);
}
.brand-clock div {
  overflow: hidden;
  white-space: nowrap;
}
.brand-clock::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.1rem;
  bottom: 0.1rem;
  width: 0.0625rem;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--chart-primary) 82%, transparent), transparent);
}
.hospital-name {
  position: relative;
  z-index: 1;
  overflow: visible;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 950;
  line-height: 1.25;
  white-space: nowrap;
}
.hospital-subtitle {
  position: relative;
  z-index: 1;
  margin-top: 0.3125rem;
  overflow: visible;
  color: var(--muted);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}
.hospital-copy {
  position: relative;
  min-width: 0;
  flex: 1 1 0;
  padding: 0.35rem 1.1rem 0.35rem 1.75rem;
  clip-path: polygon(10% 0, 100% 0, 92% 100%, 0 100%);
  background:
    linear-gradient(90deg, transparent, color-mix(in srgb, var(--chart-primary) 16%, transparent) 22%, color-mix(in srgb, var(--surface-strong) 18%, transparent) 100%),
    linear-gradient(180deg, color-mix(in srgb, var(--glass-edge) 12%, transparent), color-mix(in srgb, var(--surface) 8%, transparent));
  text-align: right;
  box-shadow:
    inset 0 -0.0625rem 0 color-mix(in srgb, var(--chart-primary) 62%, transparent),
    0 0 1rem color-mix(in srgb, var(--chart-primary) 22%, transparent);
  transform: none;
}
.hospital-copy::before {
  content: "";
  position: absolute;
  inset: 0.0625rem;
  clip-path: inherit;
  border: 0.0625rem solid color-mix(in srgb, var(--chart-primary) 74%, transparent);
  pointer-events: none;
}
.hospital-copy::after {
  content: "";
  position: absolute;
  right: 3.75rem;
  bottom: 0.4375rem;
  width: 52%;
  height: 0.125rem;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--chart-primary) 86%, transparent), transparent);
  opacity: 0.78;
  animation: header-chip-breathe 3.9s ease-in-out infinite;
}
.title-frame {
  position: relative;
  display: flex;
  width: min(100%, 47.5rem);
  min-width: 0;
  height: 4.12rem;
  align-items: center;
  justify-content: center;
  justify-self: center;
  overflow: visible;
  border: 0;
  background: transparent;
  clip-path: none;
  box-shadow: none;
  isolation: isolate;
  transform: translateY(-0.0625rem);
}
.title-frame h1 {
  position: relative;
  z-index: 2;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--text) 96%, var(--accent-2) 4%) 0%,
    var(--accent-2) 22%,
    color-mix(in srgb, var(--chart-secondary) 76%, var(--text) 24%) 48%,
    color-mix(in srgb, var(--data-inspection-line) 78%, var(--text) 22%) 74%,
    color-mix(in srgb, var(--text) 96%, var(--accent-2) 4%) 100%
  );
  background-size: 260% 100%;
  background-clip: text;
  color: transparent;
  font-family: var(--font-dashboard-rounded-heavy);
  font-size: 2.55rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0;
  -webkit-background-clip: text;
  -webkit-text-stroke: 0.018rem color-mix(in srgb, var(--chart-primary) 34%, transparent);
  animation: header-title-flow 4.8s ease-in-out infinite;
}
.title-frame::before {
  content: "";
  position: absolute;
  pointer-events: none;
}
.title-frame::before {
  inset: 0;
  z-index: 1;
  clip-path: polygon(6% 0, 94% 0, 100% 50%, 94% 100%, 6% 100%, 0 50%);
  background:
    radial-gradient(ellipse at center, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 64%),
    linear-gradient(90deg, transparent, color-mix(in srgb, var(--chart-primary) 18%, transparent) 18%, color-mix(in srgb, var(--surface-strong) 12%, transparent) 50%, color-mix(in srgb, var(--chart-secondary) 14%, transparent) 82%, transparent),
    linear-gradient(180deg, color-mix(in srgb, var(--chart-primary) 5%, transparent), transparent 58%, color-mix(in srgb, var(--chart-secondary) 5%, transparent));
  box-shadow:
    inset 0 0.0625rem 0 color-mix(in srgb, var(--instrument-rim) 38%, transparent),
    inset 0 -0.0625rem 0 color-mix(in srgb, var(--chart-primary) 68%, transparent),
    0 0 1.65rem color-mix(in srgb, var(--chart-primary) 30%, transparent);
  opacity: 1;
}
@media (prefers-reduced-motion: reduce) {
  .header-tech-frame,
  .header-flow,
  .header-flow-glow,
  .header-core-glow,
  .title-frame h1,
  .brand-lockup::after,
  .hospital-copy::after {
    animation: none;
  }
}
.hospital-badge {
  width: 4.75rem;
  height: 3.5rem;
  flex: none;
  object-fit: contain;
  filter: saturate(1.08) contrast(1.04) drop-shadow(0 0 0.5rem color-mix(in srgb, var(--chart-primary) 30%, transparent));
}
</style>

<!-- 浅色主题覆盖:引用祖先 .dashboard-shell,必须全局 -->
<style>
.dashboard-shell[data-theme-mode='light'] .header-tech-frame {
  opacity: 0.28;
  animation: none;
}
.dashboard-shell[data-theme-mode='light'] .header-stop-primary {
  stop-opacity: 0.24;
}
.dashboard-shell[data-theme-mode='light'] .header-stop-secondary,
.dashboard-shell[data-theme-mode='light'] .header-stop-tertiary {
  stop-opacity: 0.26;
}
.dashboard-shell[data-theme-mode='light'] .header-stop-primary.is-soft,
.dashboard-shell[data-theme-mode='light'] .header-stop-secondary.is-soft,
.dashboard-shell[data-theme-mode='light'] .header-stop-tertiary.is-soft {
  stop-opacity: 0.08;
}
.dashboard-shell[data-theme-mode='light'] .header-flow,
.dashboard-shell[data-theme-mode='light'] .header-flow-glow,
.dashboard-shell[data-theme-mode='light'] .header-core-glow {
  opacity: 0;
  animation: none;
}
.dashboard-shell[data-theme-mode='light'] .header-title-fill {
  fill: rgba(255, 255, 255, 0.9);
  stroke: color-mix(in srgb, var(--border) 82%, transparent);
}
.dashboard-shell[data-theme-mode='light'] .brand-lockup,
.dashboard-shell[data-theme-mode='light'] .hospital-copy {
  border-color: var(--lm-glass-border);
  background: var(--lm-glass-fill);
  -webkit-backdrop-filter: var(--lm-glass-blur);
  backdrop-filter: var(--lm-glass-blur);
  box-shadow: var(--lm-glass-shadow);
}
.dashboard-shell[data-theme-mode='light'] .brand-lockup::before,
.dashboard-shell[data-theme-mode='light'] .hospital-copy::before {
  border-color: color-mix(in srgb, var(--border-strong) 42%, transparent);
}
.dashboard-shell[data-theme-mode='light'] .brand-lockup::after,
.dashboard-shell[data-theme-mode='light'] .hospital-copy::after {
  opacity: 0.2;
  animation: none;
}
.dashboard-shell[data-theme-mode='light'] .title-frame h1 {
  background: none;
  color: color-mix(in srgb, var(--accent) 76%, var(--text) 24%);
  -webkit-text-stroke: 0;
  animation: none;
}
.dashboard-shell[data-theme-mode='light'] .title-frame::before {
  background: var(--lm-glass-fill);
  -webkit-backdrop-filter: var(--lm-glass-blur);
  backdrop-filter: var(--lm-glass-blur);
  box-shadow:
    inset 0 0.0625rem 0 rgba(255, 255, 255, 0.9),
    inset 0 -0.0625rem 0 color-mix(in srgb, var(--border) 72%, transparent),
    0 0.5rem 1.5rem rgba(41, 71, 115, 0.08);
}
.dashboard-shell[data-theme-mode='light'] .hospital-subtitle,
.dashboard-shell[data-theme-mode='light'] .brand-clock {
  color: color-mix(in srgb, var(--text) 72%, var(--muted) 28%);
}
.dashboard-shell[data-theme-mode='light'] .hospital-badge {
  filter: saturate(1) contrast(1.02) drop-shadow(0 0.25rem 0.5rem rgba(41, 71, 115, 0.12));
}
</style>
