<script setup>
import { computed } from "vue";

const props = defineProps({
  number: String,
  title: String,
});

const titleParts = computed(() => {
  const match = props.title?.match(/^(.*?)(（.*）)$/);
  if (!match) return { main: props.title, suffix: "" };
  return { main: match[1], suffix: match[2] };
});
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <span class="panel-number">{{ number }}</span>
      <h2 class="truncate text-[17px]">
        {{ titleParts.main }}
        <span v-if="titleParts.suffix" class="panel-title-suffix">{{ titleParts.suffix }}</span>
      </h2>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>
