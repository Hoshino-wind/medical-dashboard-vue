import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('holographic instrument visual system', () => {
  it('defines theme-derived instrument roles and preserves looping motion by default', () => {
    const tokens = read('styles/tokens.css')
    const motion = read('styles/motion.css')
    const main = read('main.ts')
    const loopingConsumers = `${read('styles/panel.css')}\n${read('styles/header.css')}`

    expect(tokens).toContain('--instrument-structure: var(--chart-primary)')
    expect(tokens).toContain('--instrument-core: var(--instrument-rim)')
    expect(tokens).toContain('--instrument-reflection: var(--chart-tertiary)')
    expect(tokens).toContain('--motion-loop-panel: 10.8s')
    expect(tokens).toContain('--motion-loop-instrument: 7.2s')
    expect(tokens).toContain('--motion-loop-spine: 12.8s')
    expect(motion).toContain('@keyframes instrument-energy-pulse')
    expect(motion).toContain('@keyframes instrument-background-scan')
    expect(loopingConsumers).toContain('infinite')
    expect(motion).toContain('@media (prefers-reduced-motion: reduce)')
    expect(main).toContain("import './styles/motion.css'")
  })

  it('uses a central energy spine and positional panel levels without changing equal columns', () => {
    const layout = read('styles/layout.css')
    const panel = read('styles/panel.css')

    expect(layout).toContain('.screen-energy-spine')
    expect(layout).toContain('animation: instrument-background-scan')
    expect(layout).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(panel).toContain('.screen-grid > .panel:nth-child(3n + 2)')
    expect(panel).toContain('--panel-edge-weight: 100%')
    expect(panel).toContain('--panel-edge-weight: 84%')
    expect(panel).toContain('--panel-edge-weight: 72%')
    expect(panel).toContain('var(--motion-phase)')
  })

  it('uses shared loop timing and combined phases for gauge scan timing', () => {
    const gaugeBase = read('components/visual/HologramGaugeBase.vue')

    expect(gaugeBase).toContain('var(--motion-loop-instrument)')
    expect(gaugeBase).toContain('var(--motion-local-phase, 0s)')
    expect(gaugeBase).toContain(
      'animation-delay: calc(var(--motion-phase, 0s) + var(--motion-local-phase, 0s));',
    )
  })

  it('keeps gauge energy visible while limiting reduced motion to animation', () => {
    const rings = read('styles/rings.css')

    expect(rings).toContain('.hologram-gauge.is-idle .hologram-gauge-ring')
    expect(rings).toContain(
      'animation: instrument-energy-pulse var(--motion-loop-instrument) ease-in-out infinite;',
    )
    expect(rings).toContain(
      'animation-delay: calc(var(--motion-phase, 0s) + var(--motion-local-phase, 0s) - 0.9s);',
    )
    expect(rings).toContain('font-family: var(--instrument-font-data)')
    expect(rings).toContain('font-variant-numeric: tabular-nums')
    expect(rings).toContain('@media (prefers-reduced-motion: reduce)')
    expect(rings).toContain('.hologram-gauge-ring::before {\n    animation: none;\n  }')
  })

  it('adds a low-cost diagnostic pie pedestal orbit with shared loop timing', () => {
    const pedestal = read('components/visual/ThreePiePedestal.vue')

    expect(pedestal).toContain('pedestal-orbit-overlay')
    expect(pedestal).toContain('var(--motion-loop-instrument)')
  })
})
