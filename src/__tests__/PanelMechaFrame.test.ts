import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelShell from '@/components/shared/PanelShell.vue'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

function cssBlock(source: string, marker: string) {
  const markerIndex = source.indexOf(`${marker} {`)
  if (markerIndex < 0) throw new Error(`Missing CSS marker: ${marker}`)

  const blockStart = source.indexOf('{', markerIndex)
  if (blockStart < 0) throw new Error(`Missing CSS block for: ${marker}`)

  let depth = 0
  for (let index = blockStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] !== '}') continue

    depth -= 1
    if (depth === 0) return source.slice(blockStart + 1, index)
  }

  throw new Error(`Unclosed CSS block for: ${marker}`)
}

describe('mecha panel frame', () => {
  it('renders a decorative four-rail and four-corner chassis for the shared main panel', () => {
    const wrapper = mount(PanelShell, { props: { title: '设备总览' } })
    expect(wrapper.find('.panel-mecha-frame').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.panel-mecha-rail')).toHaveLength(4)
    expect(wrapper.findAll('.panel-mecha-corner')).toHaveLength(4)
  })

  it('keeps the existing modes and turns stereoscopic into a looping mecha frame', () => {
    const panel = read('styles/panel.css')
    const configPanel = read('components/shared/ConfigPanel.vue')

    expect(panel).toContain("[data-panel-border='borderless']")
    expect(panel).toContain("[data-panel-border='standard']")
    expect(panel).toContain("[data-panel-border='stereoscopic'] .panel-mecha-frame")
    expect(panel).toContain('@keyframes panel-mecha-trace-sweep')
    expect(panel).toContain('panel-mecha-trace-sweep var(--motion-loop-panel) linear infinite')
    expect(panel).toMatch(
      /prefers-reduced-motion:[\s\S]*?\.panel-mecha-rail::after[\s\S]*?animation: none/,
    )
    expect(configPanel).toContain('机甲立体框')
  })

  it('keeps the dark mecha highlight weights stable while hovering', () => {
    const panel = read('styles/panel.css')
    const base = cssBlock(panel, ".screen-frame[data-panel-border='stereoscopic'] .panel")
    const hover = cssBlock(
      panel,
      ".screen-frame[data-panel-border='stereoscopic'] .screen-grid > .panel:hover",
    )

    expect(base).toContain('var(--panel-frame-highlight) 92%')
    expect(base).toContain('var(--panel-frame-highlight) 42%')
    expect(hover).toContain('var(--panel-frame-highlight) 92%')
    expect(hover).toContain('var(--panel-frame-highlight) 42%')
  })

  it('breathes mecha corners with opacity only', () => {
    const panel = read('styles/panel.css')
    const cornerBreathe = cssBlock(panel, '@keyframes panel-mecha-corner-breathe')

    expect(cornerBreathe).toContain('opacity: var(--panel-mecha-corner-opacity-low)')
    expect(cornerBreathe).toContain('opacity: var(--panel-mecha-corner-opacity-high)')
    expect(cornerBreathe).not.toMatch(/\bfilter\s*:/)
  })
})
