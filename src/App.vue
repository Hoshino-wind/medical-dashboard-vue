<script setup>
import { computed, ref } from "vue";
import { Monitor, Settings } from "lucide-vue-next";
import BigScreen from "./components/BigScreen.vue";
import ConfigPanel from "./components/ConfigPanel.vue";
import { useDashboardConfig } from "./composables/useDashboardConfig";

const view = ref("screen");
const {
  state,
  activeTheme,
  orderedModules,
  setTheme,
  setLayout,
  moveModule,
  resetConfig,
} = useDashboardConfig();

const themeStyle = computed(() => activeTheme.value.variables);
</script>

<template>
  <div class="dashboard-shell" :class="{ 'config-mode': view === 'config' }" :style="themeStyle">
    <div class="fixed bottom-4 right-4 z-20 flex gap-2">
      <button class="app-button" :class="{ active: view === 'screen' }" @click="view = 'screen'">
        <Monitor class="h-4 w-4" />
        大屏
      </button>
      <button class="app-button" :class="{ active: view === 'config' }" @click="view = 'config'">
        <Settings class="h-4 w-4" />
        配置
      </button>
    </div>

    <BigScreen
      v-if="view === 'screen'"
      :modules="orderedModules"
      :theme="activeTheme"
      :layout="state.layout"
    />

    <ConfigPanel
      v-else
      :config="state"
      :modules="orderedModules"
      :active-theme="activeTheme"
      @set-theme="setTheme"
      @set-layout="setLayout"
      @move-module="moveModule"
      @reset="resetConfig"
    />
  </div>
</template>
