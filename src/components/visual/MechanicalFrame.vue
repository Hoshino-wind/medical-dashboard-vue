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

/* 浅色主题使用连续的玻璃立体框，不复用暗色 PNG，也不做切角。 */
:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame
) {
  display: block;
  border: 0;
  border-image: none;
  filter: none;
}

:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame--panel
) {
  padding: 0.09375rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent) 72%, #ffffff) 0%,
    color-mix(in srgb, var(--instrument-rim) 58%, #ffffff) 28%,
    color-mix(in srgb, var(--instrument-rim) 48%, #ffffff) 72%,
    color-mix(in srgb, var(--accent-2) 72%, #ffffff) 100%
  );
  border-radius: 0.625rem;
  opacity: 0.82;
  filter: drop-shadow(0 0.0625rem 0 rgba(255, 255, 255, 0.92))
    drop-shadow(0 0.125rem 0.125rem rgba(66, 100, 137, 0.14));
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}

:global(
  .dashboard-shell[data-theme-id='light-medical'][data-panel-style='chamfered-instrument']
    .mechanical-frame--compact
) {
  inset: -0.0625rem;
  padding: 0.0625rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--status-tone, var(--panel-title-primary)) 68%, #ffffff),
    color-mix(in srgb, var(--instrument-rim) 42%, #ffffff),
    color-mix(in srgb, var(--status-tone, var(--panel-title-primary)) 52%, #ffffff)
  );
  border-radius: 0.375rem;
  opacity: 0.72;
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
}
</style>
