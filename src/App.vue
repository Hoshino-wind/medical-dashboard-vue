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

function switchView(nextView, event) {
  view.value = nextView;
  event?.currentTarget?.blur();
}
</script>

<template>
  <div class="dashboard-shell" :class="{ 'config-mode': view === 'config' }" :style="themeStyle">
    <div class="view-switch" :class="{ 'screen-mode': view === 'screen' }">
      <button class="app-button" :class="{ active: view === 'screen' }" @click="switchView('screen', $event)">
        <Monitor class="h-4 w-4" />
        大屏
      </button>
      <button class="app-button" :class="{ active: view === 'config' }" @click="switchView('config', $event)">
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
