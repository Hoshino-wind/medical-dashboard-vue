<script setup>
defineProps({
  value: {
    type: Number,
    required: true,
  },
  label: String,
  count: [String, Number],
  size: {
    type: String,
    default: "94px",
  },
  tone: {
    type: String,
    default: "",
  },
  insideLabel: {
    type: String,
    default: "",
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2">
    <div class="metric-ring" :style="{ '--value': value, '--ring-size': size, '--ring-accent': tone || undefined }">
      <div class="metric-inner">
        <div v-if="insideLabel" class="metric-inside-label">{{ insideLabel }}</div>
        <div class="metric-value">{{ value }}%</div>
      </div>
    </div>
    <div v-if="showFooter" class="text-center">
      <div class="text-[13px] font-extrabold">{{ label }}</div>
      <div class="mt-1 text-[13px] font-black text-[color:var(--text)]">{{ count }}<span class="ml-1 text-[11px] text-[color:var(--muted)]">台</span></div>
    </div>
  </div>
</template>
