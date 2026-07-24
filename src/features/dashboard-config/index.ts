export {
  catalogModuleIds,
  findAvailableSlot,
  getLayoutCapacity,
  hasRowTableConflict,
  normalizeSlotIds,
} from './model/layoutRules'
export {
  DASHBOARD_CONFIG_STORAGE_KEY,
  loadDashboardConfig,
  saveDashboardConfig,
} from './model/configPersistence'
export {
  dashboardColorToHsva,
  dashboardHsvaToColor,
  isDashboardCustomColor,
  normalizeDashboardCustomColor,
} from './model/customColor'
export type { DashboardHsvaColor } from './model/customColor'
