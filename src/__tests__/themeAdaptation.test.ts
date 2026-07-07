import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))

function sourcePath(relativePath: string): string {
  return join(testDir, '..', relativePath)
}

function readSource(relativePath: string): string {
  return readFileSync(sourcePath(relativePath), 'utf8')
}

describe('global theme adaptation', () => {
  it('uses theme-driven SVG stops for the top header frame', () => {
    const header = readSource('components/shared/HeaderBar.vue')

    expect(header).not.toMatch(/stop-color="rgba\(/)
  })

  it('uses theme tokens for the cube bar base instead of fixed blue and violet fills', () => {
    const cubeBar = readSource('components/charts/CubeBarChart.vue')

    expect(cubeBar).not.toContain('baseBlue')
    expect(cubeBar).not.toContain('baseViolet')
    expect(cubeBar).not.toContain('baseNavy')
  })

  it('uses theme tokens for the 3D pie lighting and tooltip instead of fixed cyan lighting', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).not.toMatch(/#(?:20f1d4|123e63|0a8fb7|2f8dff|45d8ff|53fff0|4defff|265d85)/i)
    expect(pie3d).not.toMatch(/rgba\(32,\s*241,\s*212/)
  })

  it('removes the lower glow from 3D pie charts', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')
    const moduleStyles = readSource('styles/modules.css')
    const inspectionPieShell = moduleStyles.match(
      /\.inspection-pie-shell\s+\.pie3d-three-shell\s*\{[\s\S]*?\}/,
    )?.[0] ?? ''

    expect(pie3d).not.toContain('makeFloorShadow')
    expect(pie3d).not.toContain('rootGroup.add(makeFloorShadow')
    expect(inspectionPieShell).not.toContain('drop-shadow')
  })

  it('uses a plain circular progress ring with the hologram base preserved', () => {
    const gauge = readSource('components/visual/HologramGauge.vue')
    const base = existsSync(sourcePath('components/visual/HologramGaugeBase.vue'))
      ? readSource('components/visual/HologramGaugeBase.vue')
      : ''
    const ringStyles = readSource('styles/rings.css')
    const source = `${gauge}\n${base}\n${ringStyles}`

    expect(source).toContain('hologram-gauge-base')
    expect(gauge).toContain('gauge-ring-track')
    expect(gauge).toContain('gauge-ring-progress')
    expect(source).not.toMatch(/gauge-(?:tube|water|glass)|pipe-|tube-|water-pipe/i)
    expect(source).not.toMatch(/hologram-gauge-(?:beam|gloss)/)
  })

  it('extracts the hologram base component and positions it below the ring', () => {
    const basePath = sourcePath('components/visual/HologramGaugeBase.vue')
    const gauge = readSource('components/visual/HologramGauge.vue')
    const ringStyles = readSource('styles/rings.css')

    expect(existsSync(basePath)).toBe(true)

    const base = readFileSync(basePath, 'utf8')

    expect(gauge).toContain("import HologramGaugeBase from './HologramGaugeBase.vue'")
    expect(gauge).toContain('<HologramGaugeBase')
    expect(gauge).not.toContain('<div class="hologram-gauge-base"')
    expect(base).toContain('hologram-gauge-base')
    expect(base).toContain('gauge-base-ring')
    expect(ringStyles).toMatch(/top:\s*calc\(var\(--gauge-size,\s*7\.375rem\)\s*\*\s*0\.8\)/)
  })

  it('keeps global chrome free of text and card glow effects', () => {
    const globalChrome = [
      readSource('styles/panel.css'),
      readSource('styles/header.css'),
      readSource('styles/tables.css'),
      readSource('styles/charts.css'),
      readSource('styles/rings.css'),
    ].join('\n')

    expect(globalChrome).not.toMatch(/text-shadow\s*:/)
    expect(globalChrome).not.toMatch(/drop-shadow\(/)
    expect(globalChrome).not.toMatch(/0\s+0\s+[0-9.]+(?:rem|px)\s+color-mix\([^;]*var\(--accent/)
  })
})
