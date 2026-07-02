<script setup>
import { computed } from "vue";
import { dashboardData } from "../data/dashboard";
import HeaderBar from "./HeaderBar.vue";
import ModuleRenderer from "./ModuleRenderer.vue";

const props = defineProps({
  modules: {
    type: Array,
    required: true,
  },
  theme: {
    type: Object,
    required: true,
  },
  layout: {
    type: String,
    required: true,
  },
});

const visibleModules = computed(() => (props.layout === "2x3" ? props.modules.slice(0, 6) : props.modules));
</script>

<template>
  <main class="screen-frame">
    <HeaderBar :data="dashboardData.header" />
    <section class="screen-grid" :class="{ 'layout-2x3': layout === '2x3' }">
      <ModuleRenderer
        v-for="item in visibleModules"
        :key="item.id"
        :module="item"
        :theme="theme"
      />
    </section>
  </main>
</template>
