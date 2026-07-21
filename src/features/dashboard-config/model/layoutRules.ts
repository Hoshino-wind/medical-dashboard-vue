import { findModuleById, isModuleId, moduleCatalog } from '@/data/modules'
import type { LayoutType } from '@/types/config'
import type { ModuleId } from '@/types/module'

const LAYOUT_COLUMNS = 3

export function getLayoutCapacity(layout: LayoutType): number {
  return layout === '2x3' ? 6 : 9
}

export function normalizeSlotIds(
  selectedIds: readonly (string | null)[] | undefined,
  layout: LayoutType,
): Array<ModuleId | null> {
  const seen = new Set<ModuleId>()
  return Array.from({ length: getLayoutCapacity(layout) }, (_, index) => {
    const id = selectedIds?.[index]
    if (!isModuleId(id) || seen.has(id)) return null
    seen.add(id)
    return id
  })
}

export function hasRowTableConflict(selectedIds: readonly (ModuleId | null)[]): boolean {
  for (let rowIndex = 0; rowIndex < selectedIds.length; rowIndex += LAYOUT_COLUMNS) {
    const tableCount = selectedIds
      .slice(rowIndex, rowIndex + LAYOUT_COLUMNS)
      .filter((moduleId) => moduleId && findModuleById(moduleId).displayType === 'table').length
    if (tableCount > 1) return true
  }
  return false
}

export function findAvailableSlot(
  selectedIds: readonly (ModuleId | null)[],
  moduleId: ModuleId,
): number {
  return selectedIds.findIndex((slotId, index) => {
    if (slotId) return false
    const next = [...selectedIds]
    next[index] = moduleId
    return !hasRowTableConflict(next)
  })
}

export function catalogModuleIds(): ModuleId[] {
  return moduleCatalog.map((module) => module.id)
}
