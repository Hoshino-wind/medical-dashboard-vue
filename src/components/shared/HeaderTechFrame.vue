<template>
  <svg
    class="header-tech-frame"
    viewBox="0 0 1400 84"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="headerLineGradient" x1="0" x2="1" y1="0" y2="0">
        <stop
          class="header-stop-primary is-transparent"
          offset="0"
          stop-color="var(--chart-primary)"
        />
        <stop class="header-stop-primary" offset="0.18" stop-color="var(--chart-primary)" />
        <stop class="header-stop-secondary" offset="0.5" stop-color="var(--accent-2)" />
        <stop class="header-stop-tertiary" offset="0.68" stop-color="var(--chart-secondary)" />
        <stop class="header-stop-primary" offset="0.82" stop-color="var(--chart-primary)" />
        <stop
          class="header-stop-primary is-transparent"
          offset="1"
          stop-color="var(--chart-primary)"
        />
      </linearGradient>
      <!-- 流光亮芯渐变:中央纯白高亮 -->
      <linearGradient id="headerFlowGradient" x1="0" x2="1" y1="0" y2="0">
        <stop
          class="header-stop-primary is-transparent"
          offset="0"
          stop-color="var(--chart-primary)"
        />
        <stop class="header-stop-primary is-soft" offset="0.3" stop-color="var(--chart-primary)" />
        <stop class="header-flow-core" offset="0.5" stop-color="#ffffff" />
        <stop class="header-stop-secondary is-strong" offset="0.64" stop-color="var(--accent-2)" />
        <stop class="header-stop-primary is-soft" offset="0.76" stop-color="var(--chart-primary)" />
        <stop
          class="header-stop-primary is-transparent"
          offset="1"
          stop-color="var(--chart-primary)"
        />
      </linearGradient>
      <!-- 流光辉光底层渐变 -->
      <linearGradient id="headerFlowGlowGradient" x1="0" x2="1" y1="0" y2="0">
        <stop
          class="header-stop-primary is-transparent"
          offset="0"
          stop-color="var(--chart-primary)"
        />
        <stop class="header-stop-secondary" offset="0.5" stop-color="var(--accent-2)" />
        <stop
          class="header-stop-primary is-transparent"
          offset="1"
          stop-color="var(--chart-primary)"
        />
      </linearGradient>
      <filter id="headerPathGlow" x="-18%" y="-120%" width="136%" height="340%">
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="2.6"
          flood-color="var(--chart-primary)"
          flood-opacity="0.72"
        />
        <feDropShadow
          dx="0"
          dy="0"
          stdDeviation="5.5"
          flood-color="var(--accent-2)"
          flood-opacity="0.32"
        />
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
      <path class="header-line is-step" data-header-step="left" d="M306 50 H390 L418 62 H470" />
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
      <path
        class="header-flow-glow is-title"
        d="M502 12 L898 12 L918 42 L898 72 L502 72 L482 42 Z"
      />
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
</template>

<style scoped>
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
@media (prefers-reduced-motion: reduce) {
  .header-tech-frame,
  .header-flow,
  .header-flow-glow,
  .header-core-glow {
    animation: none;
  }
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
</style>
