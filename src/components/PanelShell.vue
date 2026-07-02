<script setup>
defineProps({
  number: String,
  title: String,
});
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <span class="panel-number">{{ number }}</span>
      <h2 class="truncate text-[16px]">{{ title }}</h2>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </section>
</template>
