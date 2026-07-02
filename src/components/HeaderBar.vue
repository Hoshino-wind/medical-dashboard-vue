<script setup>
import headerTitle from "../assets/header-title-ref.png";
import hospitalHeader from "../assets/hospital-header-ref.png";
import sunnicareBrand from "../assets/sunnicare-brand-ref.png";

defineProps({
  data: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <header class="dashboard-header mb-[18px] grid grid-cols-[350px_1fr_350px] items-center gap-3">
    <div class="brand-chip">
      <div class="brand-lockup" aria-label="Sunnicare 上云赋">
        <img class="brand-image" :src="sunnicareBrand" alt="Sunnicare 上云赋" />
      </div>
      <div class="brand-clock">
        <div>{{ data.updatedAt }}</div>
        <div>星期三</div>
      </div>
    </div>

    <div class="title-frame">
      <img class="title-image" :src="headerTitle" :alt="data.title" />
    </div>

    <div class="hospital-chip">
      <img class="hospital-header-image" :src="hospitalHeader" :alt="`${data.hospital} ${data.subtitle}`" />
    </div>
  </header>
</template>
