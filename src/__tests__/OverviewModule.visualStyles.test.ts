import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const source = readFileSync(join(testDir, '..', 'components/modules/OverviewModule.vue'), 'utf8')

describe('OverviewModule visual hierarchy', () => {
  it('keeps metric numbers in their status color and only mutes the unit', () => {
    expect(source.match(/class="overview-unit"/g)).toHaveLength(5)
    expect(source).not.toContain('.overview-value span {')

    const unitBlock = source.match(/\.overview-unit\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    expect(unitBlock).toContain('color: var(--muted)')
  })

  it('uses visible theme-driven glass fills and status tones for all five cards', () => {
    const cardBlock = source.match(/\.overview-stat\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(cardBlock).toContain('var(--surface-strong) 52%')
    expect(cardBlock).toContain('var(--surface-muted) 30%')
    expect(cardBlock).toContain('var(--status-tone, var(--chart-primary)) 14%')
    expect(cardBlock).toContain('var(--status-tone, var(--chart-primary)) 72%')

    expect(source).toContain('--status-tone: var(--data-pie-primary)')
    expect(source).toContain('--status-tone: var(--good)')
    expect(source).toContain('--status-tone: var(--danger)')
    expect(source).toContain('--status-tone: var(--warn)')
    expect(source).toContain('--status-tone: var(--data-inspection-line)')
  })
})
