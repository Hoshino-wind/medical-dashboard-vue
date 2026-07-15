import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))

describe('WorkOrderTable layout', () => {
  it('does not reserve an empty summary row below the repair list', () => {
    const source = readFileSync(
      join(testDir, '../components/shared/WorkOrderTable.vue'),
      'utf8',
    )
    const moduleStyle = source.match(/\.work-order-module\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(moduleStyle).toContain('grid-template-rows: minmax(0, 1fr)')
    expect(moduleStyle).toContain('gap: 0')
    expect(moduleStyle).not.toContain('2.65rem')
  })
})
