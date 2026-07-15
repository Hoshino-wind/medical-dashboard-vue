import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))

describe('view switch styles', () => {
  it('reveals the controls only from the bottom-right interaction area', () => {
    const configStyles = readFileSync(join(testDir, '../styles/config.css'), 'utf8')
    const switchBlock = configStyles.match(/\.view-switch\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const hiddenButtonBlock =
      configStyles.match(/\.view-switch \.app-button\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const revealBlock =
      configStyles.match(
        /\.view-switch:hover \.app-button,[\s\S]*?\.view-switch:focus-within \.app-button\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(switchBlock).toContain('right: 0')
    expect(switchBlock).toContain('bottom: 0')
    expect(switchBlock).toContain('padding: 1rem')
    expect(hiddenButtonBlock).toContain('opacity: 0')
    expect(hiddenButtonBlock).toContain('pointer-events: none')
    expect(revealBlock).toContain('opacity: 1')
    expect(revealBlock).toContain('pointer-events: auto')
    expect(configStyles).toContain('@media (hover: none)')
  })
})
