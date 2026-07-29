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

/* 深色主题复用同一套机械结构，由主题色校正保持框体与语义色一致。 */
:global(.dashboard-shell[data-theme-id='deep-sea-instrument'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-deep-sea-instrument.png');
}

:global(.dashboard-shell[data-theme-id='ink-blue-medical'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-ink-blue-medical.png');
  filter: hue-rotate(-42deg) saturate(1.08) brightness(0.96);
}

:global(.dashboard-shell[data-theme-id='midnight-violet'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-midnight-violet.png');
}

:global(.dashboard-shell[data-theme-id='black-gold-blue'] .mechanical-frame--panel) {
  border-image-source: url('../../assets/mechanical-frames/panel-black-gold-blue.png');
  filter: sepia(0.86) saturate(2.8) hue-rotate(350deg) brightness(1.02);
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
  opacity: 0.82;
}

/* 浅色主题使用高明度冰蓝材质，避免任何暗色框观感。 */
:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame
) {
  display: block;
  background: transparent;
  filter: none;
}

:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame--panel
) {
  border: 0.9375rem solid transparent;
  border-image-source: url('../../assets/mechanical-frames/panel-light-medical-v4.png');
  border-image-slice: 15;
  border-image-width: 0.9375rem;
  border-image-outset: 0;
  border-image-repeat: stretch;
  border-radius: 0.75rem;
  opacity: 0.92;
  filter: none;
}

:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame--compact
) {
  inset: 0;
  border: 0.0625rem solid;
  border-image: none;
  border-color:
    rgba(250, 253, 255, 0.98)
    color-mix(in srgb, var(--status-tone, var(--accent)) 24%, #9ed8f8)
    color-mix(in srgb, var(--status-tone, var(--accent)) 32%, #5aaee7)
    rgba(190, 225, 247, 0.96);
  border-radius: 0.5rem;
  opacity: 1;
  box-shadow: none;
}
</style>
