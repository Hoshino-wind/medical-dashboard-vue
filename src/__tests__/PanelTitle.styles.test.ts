import { existsSync, readFileSync } from 'node:fs'
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
    expect(titleBlock).toContain('font-family: var(--font-dashboard-rounded-heavy)')
    expect(titleBlock).toContain('font-weight: 700')
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

  it('uses the medical pulse ornament with a flat border-masking title background', () => {
    const panelShell = readFileSync(join(testDir, '../components/shared/PanelShell.vue'), 'utf8')
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const ornamentPath = join(
      testDir,
      '../assets/panel-titles/medical-pulse-title-left-v3.png',
    )
    const rightOrnamentPath = join(
      testDir,
      '../assets/panel-titles/medical-pulse-title-right-v6.png',
    )
    const chamferedFrameBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-title-frame\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedOrnamentBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-title-ornament\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedMaskBlock =
      panelStyles.match(
        /\.panel-title-frame::before\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedHeaderBlock =
      panelStyles.match(
        /\.panel-header--main\s*\{\n  z-index: 5;[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedTitleBlock =
      panelStyles.match(
        /\.panel-title-text\s*\{\n  z-index: 2;[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(existsSync(ornamentPath)).toBe(true)
    expect(existsSync(rightOrnamentPath)).toBe(true)
    expect(panelShell).toContain('medical-pulse-title-left-v3.png')
    expect(panelShell).toContain('medical-pulse-title-right-v6.png')
    expect(panelShell).toContain('panel-title-ornament--left')
    expect(panelShell).toContain('panel-title-ornament--right')
    expect(panelShell).toContain('aria-hidden="true"')
    expect(chamferedFrameBlock).toContain('background: transparent')
    expect(chamferedFrameBlock).toContain('overflow: visible')
    expect(chamferedFrameBlock).toContain('padding: 0.25rem 0')
    expect(chamferedMaskBlock).toContain("content: ''")
    expect(chamferedHeaderBlock).toContain('transform: translateY(-0.1875rem)')
    expect(chamferedTitleBlock).toContain('transform: translateY(-0.1875rem)')
    expect(chamferedMaskBlock).toContain('inset: -0.125rem -8rem -0.125rem -2.25rem')
    expect(chamferedMaskBlock).toContain('var(--bg) 76%')
    expect(chamferedMaskBlock).toContain('var(--bg-soft) 24%')
    expect(chamferedMaskBlock).not.toContain('border:')
    expect(chamferedMaskBlock).not.toContain('box-shadow:')
    expect(chamferedOrnamentBlock).toContain('display: block')
    expect(chamferedOrnamentBlock).toContain('z-index: 1')
    expect(chamferedOrnamentBlock).toContain('drop-shadow(')
    expect(panelStyles).toContain('.panel-title-ornament--left')
    expect(panelStyles).toContain('.panel-title-ornament--right')
  })
})
