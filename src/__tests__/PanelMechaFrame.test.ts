import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelShell from '@/components/shared/PanelShell.vue'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

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
})
