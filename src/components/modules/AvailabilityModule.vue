<script setup>
import { computed } from "vue";
import MetricRing from "../MetricRing.vue";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  variant: {
    type: String,
    default: "life",
  },
});

const ringTones = computed(() => {
  if (props.variant === "ultrasound") {
    return ["var(--accent)", "var(--accent-3)", "var(--accent-2)"];
  }
  return ["var(--accent)", "var(--accent-2)", "var(--accent)"];
});
</script>

<template>
  <div class="availability-grid grid h-full grid-cols-3 items-center gap-2" :class="`availability-${variant}`">
    <MetricRing
      v-for="(item, index) in items"
      :key="item.name"
      :value="item.value"
      :label="item.name"
      :count="item.count"
      :tone="ringTones[index % ringTones.length]"
      size="92px"
    />
  </div>
</template>
