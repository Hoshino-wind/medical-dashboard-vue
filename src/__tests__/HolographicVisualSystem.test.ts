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

  it('keeps the orbit footprint fixed while a clipped inner trace loops', () => {
    const pedestal = read('components/visual/ThreePiePedestal.vue')
    const orbit = pedestal.match(/\.pedestal-orbit-overlay\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const trace = pedestal.match(/\.pedestal-orbit-overlay::after\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(orbit).not.toContain('instrument-orbit-sweep')
    expect(orbit).not.toContain('animation:')
    expect(orbit).toContain(
      'transform: translateX(-50%) perspective(14rem) rotateX(66deg);',
    )
    expect(orbit).toContain('overflow: hidden')
    expect(orbit).toContain('border-radius: 50%')
    expect(trace).toContain("content: ''")
    expect(trace).toContain('background: linear-gradient')
    expect(trace).toContain('transform: translate3d')
    expect(trace).toContain(
      'animation: pedestal-orbit-trace-sweep var(--motion-loop-instrument) linear infinite;',
    )
    expect(pedestal).toContain('@keyframes pedestal-orbit-trace-sweep')
    expect(pedestal).toContain(
      '.pedestal-orbit-overlay::after {\n    animation: none;\n    opacity: 0;\n  }',
    )
    expect(pedestal).toContain('.pedestal-orbit-overlay {\n    opacity: 0.28;\n  }')
  })

  it('leaves diagnostic pedestal positioning to its absolute-positioned consumers', () => {
    const pedestal = read('components/visual/ThreePiePedestal.vue')
    const completion = read('components/modules/CompletionModule.vue')
    const healthPie = read('components/charts/HealthPieChart.vue')
    const modules = read('styles/modules.css')
    const pedestalRoot = pedestal.match(/\.three-pie-pedestal\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const inspectionBase = modules.match(/(?:^|\n)\.inspection-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const healthBase = modules.match(/(?:^|\n)\.health-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(completion).toContain('class="inspection-pie-base"')
    expect(healthPie).toContain('class="health-pie-base"')
    expect(inspectionBase).toContain('position: absolute')
    expect(healthBase).toContain('position: absolute')
    expect(pedestalRoot).not.toContain('position:')
  })

  it('styles the configuration page as a loop-enabled holographic editor', () => {
    const config = read('styles/config.css')

    expect(config).toContain('.is-drop-allowed')
    expect(config).toContain('.is-drop-blocked')
    expect(config).toContain('.is-placed')
    expect(config).toContain('.theme-swatch-dot')
    expect(config).toContain('.config-live-preview:fullscreen')
    expect(config).toContain('var(--motion-loop-background)')
    expect(config).toContain('@media (prefers-reduced-motion: reduce)')
  })
})
