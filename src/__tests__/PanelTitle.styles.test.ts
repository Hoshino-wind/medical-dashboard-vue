import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))

describe('panel title styles', () => {
  it('keeps the original title color and adds only a short glow line', () => {
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const headingBlock = panelStyles.match(/\.panel-header h2\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const titleBlock = panelStyles.match(/\.panel-title-text\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const glowLineBlock = panelStyles.match(/\.panel-title-text::after\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(headingBlock).toContain('font-size: 1.25rem')
    expect(titleBlock).toContain('color: inherit')
    expect(titleBlock).toContain("font-family: 'STHeiti'")
    expect(titleBlock).toContain('font-weight: 900')
    expect(titleBlock).toContain('letter-spacing: 0.06em')
    expect(titleBlock).not.toContain('background-clip: text')
    expect(titleBlock).not.toContain('color: transparent')
    expect(titleBlock).not.toContain('text-shadow:')
    expect(titleBlock).not.toContain('-webkit-text-stroke:')
    expect(glowLineBlock).toContain("content: ''")
    expect(glowLineBlock).toContain('width: min(96%, 8.5rem)')
    expect(glowLineBlock).toContain('height: 0.22rem')
    expect(glowLineBlock).toContain('clip-path: ellipse(50% 50% at 50% 50%)')
    expect(glowLineBlock).not.toContain('clip-path: polygon(')
    expect(glowLineBlock).toContain('linear-gradient')
    expect(glowLineBlock).toContain('filter:')
    expect(glowLineBlock).toContain('drop-shadow(')
    expect(glowLineBlock).not.toContain('box-shadow:')
  })
})
