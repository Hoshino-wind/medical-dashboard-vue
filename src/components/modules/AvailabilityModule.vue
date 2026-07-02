<script setup>
import MetricRing from "../MetricRing.vue";

defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div class="grid h-full grid-cols-3 items-center gap-2">
    <MetricRing
      v-for="(item, index) in items"
      :key="item.name"
      :value="item.value"
      :label="item.name"
      :count="item.count"
      :tone="['var(--accent)', 'var(--accent-2)', 'var(--accent-3)'][index % 3]"
      size="88px"
    />
  </div>
</template>
