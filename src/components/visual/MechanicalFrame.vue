<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'panel' | 'compact'
  }>(),
  {
    variant: 'panel',
  },
)
</script>

<template>
  <span class="mechanical-frame" :class="`mechanical-frame--${variant}`" aria-hidden="true" />
</template>

<style scoped>
.mechanical-frame {
  position: absolute;
  inset: 0;
  z-index: 4;
  display: none;
  box-sizing: border-box;
  pointer-events: none;
}

:global(.mechanical-frame-host) {
  position: relative;
}

:global(.dashboard-shell[data-panel-style='chamfered-instrument'] .mechanical-frame) {
  display: block;
}

.mechanical-frame--panel {
  border: 0.9375rem solid transparent;
  border-image-slice: 15;
  border-image-width: 0.9375rem;
  border-image-outset: 0;
  border-image-repeat: stretch;
}

/* 每个主题使用独立 PNG；不使用运行时染色或滤镜。 */
:global(.dashboard-shell[data-theme-id='deep-sea-instrument'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-deep-sea-instrument.png');
}

:global(.dashboard-shell[data-theme-id='ink-blue-medical'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-ink-blue-medical.png');
}

:global(.dashboard-shell[data-theme-id='midnight-violet'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-midnight-violet.png');
}

:global(.dashboard-shell[data-theme-id='black-gold-blue'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-black-gold-blue.png');
}

.mechanical-frame--compact {
  z-index: 2;
  border: 0.4375rem solid transparent;
  border-image-source: url('../../assets/mechanical-frames/compact-primary.png');
  border-image-slice: 7;
  border-image-width: 0.4375rem;
  border-image-outset: 0;
  border-image-repeat: stretch;
}

:global(.overview-stat--available > .mechanical-frame--compact),
:global(.is-good > .mechanical-frame--compact) {
  border-image-source: url('../../assets/mechanical-frames/compact-success.png');
}

:global(.overview-stat--repair > .mechanical-frame--compact),
:global(.is-danger > .mechanical-frame--compact) {
  border-image-source: url('../../assets/mechanical-frames/compact-danger.png');
}

:global(.overview-stat--maintenance > .mechanical-frame--compact),
:global(.is-warn > .mechanical-frame--compact) {
  border-image-source: url('../../assets/mechanical-frames/compact-warning.png');
}

:global(.overview-stat--inspection > .mechanical-frame--compact) {
  border-image-source: url('../../assets/mechanical-frames/compact-inspection.png');
}

:global(.is-purple > .mechanical-frame--compact) {
  border-image-source: url('../../assets/mechanical-frames/compact-purple.png');
}

/* 浅色主题走独立玻璃体系，不加载任何机械边框图片。 */
:global(.dashboard-shell[data-theme-id='light-medical'] .mechanical-frame) {
  display: none;
}
</style>
