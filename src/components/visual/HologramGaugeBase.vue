<script setup lang="ts">
import ThreePiePedestal from './ThreePiePedestal.vue'
</script>

<template>
  <ThreePiePedestal
    class="hologram-gauge-base"
    variant="compact"
    color="var(--instrument-base)"
    accent="var(--gauge-tone)"
    :intensity="0.72"
  />
</template>
