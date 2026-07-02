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
      v-for="item in items"
      :key="item.name"
      :value="item.value"
      :label="item.name"
      :count="item.count"
      size="88px"
    />
  </div>
</template>
