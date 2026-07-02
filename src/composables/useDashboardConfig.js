import { computed, reactive, watch } from "vue";
import { defaultConfig, moduleCatalog, themes } from "../data/dashboard";

const storageKey = "medical-dashboard-config";

function readStoredConfig() {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function useDashboardConfig() {
  const saved = readStoredConfig();
  const state = reactive({
    themeId: saved.themeId || defaultConfig.themeId,
    layout: saved.layout || defaultConfig.layout,
    moduleOrder: Array.isArray(saved.moduleOrder) && saved.moduleOrder.length
      ? saved.moduleOrder
      : [...defaultConfig.moduleOrder],
  });

  const activeTheme = computed(() => themes.find((theme) => theme.id === state.themeId) || themes[0]);
  const orderedModules = computed(() => {
    const ids = new Set(state.moduleOrder);
    const configured = state.moduleOrder
      .map((id) => moduleCatalog.find((item) => item.id === id))
      .filter(Boolean);
    const missing = moduleCatalog.filter((item) => !ids.has(item.id));
    return [...configured, ...missing];
  });

  function setTheme(themeId) {
    state.themeId = themeId;
  }

  function setLayout(layout) {
    state.layout = layout;
  }

  function moveModule(fromIndex, toIndex) {
    const next = [...state.moduleOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    state.moduleOrder = next;
  }

  function resetConfig() {
    state.themeId = defaultConfig.themeId;
    state.layout = defaultConfig.layout;
    state.moduleOrder = [...defaultConfig.moduleOrder];
  }

  watch(
    state,
    () => {
      window.localStorage.setItem(storageKey, JSON.stringify({
        themeId: state.themeId,
        layout: state.layout,
        moduleOrder: state.moduleOrder,
      }));
    },
    { deep: true },
  );

  return {
    state,
    activeTheme,
    orderedModules,
    setTheme,
    setLayout,
    moveModule,
    resetConfig,
  };
}
