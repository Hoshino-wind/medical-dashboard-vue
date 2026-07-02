<script setup>
import { MonitorCog } from "lucide-vue-next";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <header class="dashboard-header mb-3 grid grid-cols-[260px_1fr_260px] items-center gap-3">
    <div class="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
      <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--accent)] to-[color:var(--accent-3)] text-sm font-black text-white shadow-glow">
        S
      </div>
      <div>
        <div class="text-lg font-black leading-none">{{ data.brand }}</div>
        <div class="mt-1 text-xs text-[color:var(--muted)]">{{ data.updatedAt }}</div>
      </div>
    </div>

    <div class="relative flex h-16 items-center justify-center overflow-hidden rounded-[22px] border border-[color:var(--border-strong)] bg-[color:var(--surface)] shadow-glow">
      <div class="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--accent-2)] to-transparent"></div>
      <MonitorCog class="mr-3 h-7 w-7 text-[color:var(--accent-2)]" />
      <h1 class="text-center text-[28px] font-black leading-none tracking-0">{{ data.title }}</h1>
      <div class="absolute bottom-1 h-px w-64 bg-gradient-to-r from-transparent via-[color:var(--accent)] to-transparent"></div>
    </div>

    <div class="flex items-center justify-end gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
      <div class="text-right">
        <div class="text-base font-black">{{ data.hospital }}</div>
        <div class="mt-1 text-[10px] text-[color:var(--muted)]">{{ data.subtitle }}</div>
      </div>
      <div class="grid h-12 w-12 place-items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-strong)] text-xs font-black text-[color:var(--accent)]">
        医
      </div>
    </div>
  </header>
</template>
