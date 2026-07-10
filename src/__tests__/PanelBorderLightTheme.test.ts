import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const panelStyles = readFileSync(join(sourceRoot, 'styles/panel.css'), 'utf8')
const normalizedPanelStyles = panelStyles.replace(/\s+/g, ' ')

function ruleIndex(selector: string) {
  const token = `${selector} {`
  let selectorIndex = normalizedPanelStyles.indexOf(token)

  while (selectorIndex >= 0) {
    const precedingCharacter = normalizedPanelStyles.slice(0, selectorIndex).trimEnd().at(-1)
    if (selectorIndex === 0 || precedingCharacter === '}') return selectorIndex
    selectorIndex = normalizedPanelStyles.indexOf(token, selectorIndex + token.length)
  }

  return -1
}

function ruleBlock(selector: string) {
  const selectorIndex = ruleIndex(selector)
  if (selectorIndex < 0) return ''
  const blockStart = normalizedPanelStyles.indexOf('{', selectorIndex)
  const blockEnd = normalizedPanelStyles.indexOf('}', blockStart)
  return normalizedPanelStyles.slice(blockStart + 1, blockEnd)
}

function numericCustomProperty(block: string, property: string) {
  const value = block.match(new RegExp(`${property}: ([0-9.]+)`))?.[1]
  return value ? Number(value) : Number.NaN
}

describe('light theme panel border modes', () => {
  const lightPanelSelector = ".dashboard-shell[data-theme-mode='light'] .panel"

  it('keeps borderless panels transparent and free of the generic light frame', () => {
    const selector =
      ".dashboard-shell[data-theme-mode='light'] .screen-frame[data-panel-border='borderless'] .panel"
    const beforeSelector = `${selector}::before`
    const block = ruleBlock(selector)
    const beforeBlock = ruleBlock(beforeSelector)

    expect(ruleIndex(selector)).toBeGreaterThan(ruleIndex(lightPanelSelector))
    expect(block).toContain('border-color: transparent')
    expect(block).not.toContain('var(--panel-shadow)')
    expect(beforeBlock).toContain('var(--panel-title-primary)')
    expect(beforeBlock).not.toContain('rgba(255, 255, 255, 0.88)')
  })

  it('keeps stereoscopic panels on a dedicated light-theme depth stack', () => {
    const selector =
      ".dashboard-shell[data-theme-mode='light'] .screen-frame[data-panel-border='stereoscopic'] .panel"
    const block = ruleBlock(selector)

    expect(ruleIndex(selector)).toBeGreaterThan(ruleIndex(lightPanelSelector))
    expect(block).toContain('var(--panel-frame-highlight)')
    expect(block).toContain('var(--panel-frame-depth)')
    expect(block).toContain('var(--panel-glow-weight)')
    expect(block).not.toContain('box-shadow: var(--panel-shadow)')
  })

  it('keeps all three light-theme modes explicit without stopping border flow', () => {
    expect(normalizedPanelStyles).toContain(
      ".dashboard-shell[data-theme-mode='light'] .screen-frame[data-panel-border='standard'] .panel",
    )
    expect(ruleBlock(".dashboard-shell[data-theme-mode='light'] .panel-border-flow")).toContain(
      'display: block',
    )
    expect(normalizedPanelStyles).toContain(
      'panel-border-flow-spin var(--motion-loop-panel) linear infinite',
    )
  })

  it('keeps borderless hover transparent after the generic hover rule', () => {
    const genericHoverSelector = '.screen-grid > .panel:hover'
    const selector = ".screen-frame[data-panel-border='borderless'] .screen-grid > .panel:hover"
    const block = ruleBlock(selector)

    expect(ruleIndex(selector)).toBeGreaterThan(ruleIndex(genericHoverSelector))
    expect(block).toContain('border-color: transparent')
    expect(block).not.toContain('var(--panel-shadow)')
  })

  it('keeps stereoscopic hover on the six-layer depth roles after generic hover', () => {
    const genericHoverSelector = '.screen-grid > .panel:hover'
    const selector = ".screen-frame[data-panel-border='stereoscopic'] .screen-grid > .panel:hover"
    const block = ruleBlock(selector)

    expect(ruleIndex(selector)).toBeGreaterThan(ruleIndex(genericHoverSelector))
    expect(block).toContain('var(--panel-frame-highlight)')
    expect(block).toContain('var(--panel-frame-depth)')
    expect(block).toContain('var(--panel-glow-weight)')
  })

  it('uses lower themeable light flow endpoints while preserving both infinite loops', () => {
    const basePanelBlock = ruleBlock('.panel')
    const lightPanelBlock = ruleBlock(lightPanelSelector)
    const lightFlowBlock = ruleBlock(".dashboard-shell[data-theme-mode='light'] .panel-border-flow")

    expect(numericCustomProperty(lightPanelBlock, '--panel-flow-opacity-low')).toBeLessThan(
      numericCustomProperty(basePanelBlock, '--panel-flow-opacity-low'),
    )
    expect(numericCustomProperty(lightPanelBlock, '--panel-flow-opacity-high')).toBeLessThan(
      numericCustomProperty(basePanelBlock, '--panel-flow-opacity-high'),
    )
    expect(normalizedPanelStyles).toContain('0%, 100% { opacity: var(--panel-flow-opacity-low);')
    expect(normalizedPanelStyles).toContain('50% { opacity: var(--panel-flow-opacity-high);')
    expect(lightFlowBlock).toContain('opacity: var(--panel-flow-opacity-low)')
    expect(normalizedPanelStyles).toContain(
      'panel-border-flow-spin var(--motion-loop-panel) linear infinite',
    )
    expect(normalizedPanelStyles).toContain(
      'panel-border-breathe var(--motion-loop-status) ease-in-out infinite',
    )
  })
})
