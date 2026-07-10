<script setup lang="ts">
defineProps<{
  variant: 'cylinder' | 'fan'
}>()
</script>

<template>
  <span
    class="hologram-light-curtain"
    :class="`hologram-light-curtain--${variant}`"
    aria-hidden="true"
  ></span>
</template>

<style scoped>
.hologram-light-curtain {
  position: absolute;
  z-index: 0;
  left: 50%;
  bottom: 42%;
  pointer-events: none;
  transform: translateX(-50%);
  transform-origin: 50% 100%;
  background:
    linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--hologram-curtain-tone) 22%, transparent) 20%,
      color-mix(in srgb, var(--hologram-curtain-highlight) 34%, transparent) 49%,
      color-mix(in srgb, var(--hologram-curtain-tone) 22%, transparent) 80%,
      transparent
    ),
    repeating-linear-gradient(
      90deg,
      transparent 0 10%,
      color-mix(in srgb, var(--hologram-curtain-highlight) 9%, transparent) 10.5% 11%,
      transparent 11.5% 20%
    );
  box-shadow: 0 -0.75rem 1.8rem color-mix(in srgb, var(--hologram-curtain-tone) 16%, transparent);
  mix-blend-mode: var(--hologram-curtain-blend, screen);
  opacity: var(--hologram-curtain-opacity, 0.72);
  animation: hologram-curtain-breathe var(--motion-loop-instrument) ease-in-out infinite;
  animation-delay: calc(var(--motion-phase, 0s) + var(--motion-local-phase, 0s) - 2.2s);
}

.hologram-light-curtain::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0 16%,
    color-mix(in srgb, var(--hologram-curtain-highlight) 24%, transparent) 46%,
    transparent 52% 100%
  );
  opacity: 0.55;
  transform: translateY(30%);
  animation: hologram-curtain-scan var(--motion-loop-panel) linear infinite;
  animation-delay: calc(var(--motion-phase, 0s) - 1.4s);
}

.hologram-light-curtain--cylinder {
  width: 58%;
  height: 248%;
  border-right: 0.0625rem solid color-mix(in srgb, var(--hologram-curtain-highlight) 24%, transparent);
  border-left: 0.0625rem solid color-mix(in srgb, var(--hologram-curtain-highlight) 24%, transparent);
  border-radius: 48% 48% 14% 14% / 12% 12% 5% 5%;
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 22% 92%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 22% 92%, transparent);
}

.hologram-light-curtain--fan {
  width: 118%;
  height: 190%;
  clip-path: polygon(4% 0, 96% 0, 64% 100%, 36% 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent, #000 24% 92%, transparent);
  mask-image: linear-gradient(180deg, transparent, #000 24% 92%, transparent);
}

@keyframes hologram-curtain-breathe {
  0%,
  100% {
    opacity: calc(var(--hologram-curtain-opacity, 0.72) * 0.64);
  }

  50% {
    opacity: var(--hologram-curtain-opacity, 0.72);
  }
}

@keyframes hologram-curtain-scan {
  from {
    transform: translateY(42%);
  }

  to {
    transform: translateY(-48%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hologram-light-curtain,
  .hologram-light-curtain::after {
    animation: none;
  }

  .hologram-light-curtain::after {
    opacity: 0.2;
    transform: translateY(0);
  }
}
</style>
