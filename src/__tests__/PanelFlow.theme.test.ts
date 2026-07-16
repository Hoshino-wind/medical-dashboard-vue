import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { themes } from '@/data/themes'

const testDir = import.meta.dirname

describe('glass-flow panel theme colors', () => {
  it('drives the flowing border from the active theme accent palette', () => {
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const flowBlock = panelStyles.match(/\.panel-border-flow\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(flowBlock).toContain('--panel-flow-primary: var(--accent)')
    expect(flowBlock).toContain('--panel-flow-secondary: var(--accent-2)')
    expect(flowBlock).toContain('--panel-flow-accent: var(--accent-3)')
    expect(flowBlock).toContain('var(--panel-flow-primary)')
    expect(flowBlock).toContain('var(--panel-flow-secondary)')
    expect(flowBlock).toContain('var(--panel-flow-accent)')
    expect(flowBlock).not.toContain('var(--panel-title-primary)')
    expect(flowBlock).not.toContain('var(--panel-title-secondary)')
    expect(flowBlock).not.toContain('var(--panel-title-accent)')
  })

  it('keeps every dark theme flow palette visually distinct', () => {
    const darkThemePalettes = themes
      .filter((theme) => theme.id !== 'light-medical')
      .map((theme) =>
        [
          theme.variables['--accent'],
          theme.variables['--accent-2'],
          theme.variables['--accent-3'],
        ].join('|'),
      )

    expect(new Set(darkThemePalettes).size).toBe(darkThemePalettes.length)
  })
})
