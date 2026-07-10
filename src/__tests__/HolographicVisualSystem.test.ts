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
})
