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

  it('uses active theme variables for document-level background chrome', () => {
    const app = readSource('App.vue')
    const baseStyles = readSource('styles/base.css')
    const bodyBlock = baseStyles.match(/body\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(app).toContain('document.documentElement')
    expect(app).toContain('setProperty(key, value)')
    expect(bodyBlock).toContain('var(--bg-top)')
    expect(bodyBlock).toContain('var(--bg)')
    expect(bodyBlock).toContain('var(--bg-bottom)')
    expect(bodyBlock).not.toContain('#041022')
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

  it('auto-rotates 3D pie charts with a reduced-motion guard', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).toContain('requestAnimationFrame(tickRotation)')
    expect(pie3d).toContain('prefers-reduced-motion: reduce')
    expect(pie3d).toContain('autoRotate')
  })

  it('removes the lower glow from 3D pie charts', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')
    const moduleStyles = readSource('styles/modules.css')
    const inspectionPieShell =
      moduleStyles.match(/\.inspection-pie-shell\s+\.pie3d-three-shell\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(pie3d).not.toContain('makeFloorShadow')
    expect(pie3d).not.toContain('rootGroup.add(makeFloorShadow')
    expect(inspectionPieShell).not.toContain('drop-shadow')
  })

  it('renders panel flowing borders with reduced-motion fallback', () => {
    const panelShell = readSource('components/shared/PanelShell.vue')
    const panelStyles = readSource('styles/panel.css')
    const panelBeforeBlock = panelStyles.match(/\.panel::before\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(panelShell).toContain('panel-border-flow')
    expect(panelShell).not.toContain('panel-scan')
    expect(panelStyles).toContain('@keyframes panel-card-enter')
    expect(panelStyles).toContain('@keyframes panel-border-breathe')
    expect(panelStyles).toContain('@keyframes panel-border-flow-spin')
    expect(panelStyles).toContain('panel-card-enter 520ms ease-out both')
    expect(panelStyles).toContain('panel-border-breathe')
    expect(panelStyles).toContain('.screen-grid > .panel:nth-child(2)')
    expect(panelStyles).toContain('prefers-reduced-motion: reduce')
    expect(panelStyles).toContain('-webkit-mask-composite: xor')
    expect(panelStyles).not.toMatch(/\.panel::after\s*\{/)
    expect(panelStyles).not.toMatch(/\.panel-header::after\s*\{/)
    expect(panelBeforeBlock).not.toContain('inset 0 0.0625rem 0')
  })

  it('renders configurable main panel title layouts without per-card color overrides', () => {
    const bigScreen = readSource('components/shared/BigScreen.vue')
    const panelShell = readSource('components/shared/PanelShell.vue')
    const moduleRenderer = readSource('components/shared/ModuleRenderer.vue')
    const panelStyles = readSource('styles/panel.css')
    const panelHeaderBlock = panelStyles.match(/\.panel-header\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const panelTitleFrameBlock =
      panelStyles.match(/\.panel-title-frame\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(panelShell).not.toContain('number?:')
    expect(panelShell).not.toContain('panel-number')
    expect(panelShell).not.toContain('PanelTitleSignal')
    expect(moduleRenderer).not.toContain(':number=')
    expect(moduleRenderer).toContain(':variant="module.kind"')
    expect(bigScreen).toContain('type TitleStyle')
    expect(bigScreen).toContain('titleStyle')
    expect(bigScreen).toContain('data-title-style')
    expect(panelShell).toContain(':class="panelVariantClass"')
    expect(panelShell).toContain('panel-header--main')
    expect(panelShell).toContain('panel-title-frame')
    expect(panelShell).toContain('panel-title-text')
    expect(panelShell).toContain('panel-title-mini-bars')
    expect(panelShell).toContain('panel-title-mini-bars--left')
    expect(panelShell).toContain('panel-title-mini-bars--right')
    expect(panelShell).not.toContain('panel-title-chip')
    expect(existsSync(sourcePath('components/shared/PanelTitleSignal.vue'))).toBe(false)
    expect(panelStyles).toContain('.title-style-center')
    expect(panelStyles).toContain('.title-style-left')
    expect(panelStyles).toContain('.title-style-strip')
    expect(panelStyles).toContain('.panel-title-mini-bars')
    expect(panelStyles).toContain('.panel-title-mini-bars--left')
    expect(panelStyles).toContain('@keyframes panel-title-mini-bar')
    expect(panelStyles).not.toContain('.panel-title-chip')
    expect(panelStyles).not.toContain('panel-title-pulse')
    expect(panelStyles).not.toContain('panel-title-art')
    expect(panelStyles).not.toContain('@keyframes panel-title-signal')
    expect(panelStyles).not.toContain('.panel-title-frame::before')
    expect(panelStyles).not.toContain('.panel-title-frame::after')
    expect(panelHeaderBlock).not.toContain('background:')
    expect(panelTitleFrameBlock).not.toContain('background:')
    expect(panelTitleFrameBlock).not.toContain('border:')
    expect(panelTitleFrameBlock).not.toContain('box-shadow:')
    expect(panelStyles.indexOf('@media (prefers-reduced-motion: reduce)')).toBeGreaterThan(
      panelStyles.indexOf('@keyframes panel-border-flow-spin'),
    )
  })

  it('adds subtle alert flicker without adding scanline effects', () => {
    const moduleStyles = readSource('styles/modules.css')
    const tableStyles = readSource('styles/tables.css')

    expect(`${moduleStyles}\n${tableStyles}`).toContain('@keyframes status-alert-flicker')
    expect(moduleStyles).toContain('.module-status-summary .is-warn')
    expect(moduleStyles).toContain('.module-status-summary .is-danger')
    expect(tableStyles).toContain('.work-order-summary .is-danger')
    expect(tableStyles).toContain('.work-order-summary .is-warn')
    expect(`${moduleStyles}\n${tableStyles}`).not.toMatch(/scan-?line|panel-scan/i)
  })

  it('renders a chart loading layer until ECharts finishes its first frame', () => {
    const echart = readSource('components/charts/EChart.vue')
    const chartStyles = readSource('styles/charts.css')

    expect(echart).toContain('isChartReady')
    expect(echart).toContain('chart-loading-layer')
    expect(echart).toContain('chart-loading-pulse')
    expect(echart).toContain('chart-loading-bars')
    expect(echart).toContain('requestAnimationFrame(() => {')
    expect(chartStyles).toContain('@keyframes chart-loading-pulse')
    expect(chartStyles).toContain('@keyframes chart-loading-bar')
    expect(chartStyles).toContain('.chart-shell.is-ready .chart-loading-layer')
  })

  it('uses a plain circular progress ring with the hologram base preserved', () => {
    const gauge = readSource('components/visual/HologramGauge.vue')
    const base = existsSync(sourcePath('components/visual/HologramGaugeBase.vue'))
      ? readSource('components/visual/HologramGaugeBase.vue')
      : ''
    const ringStyles = readSource('styles/rings.css')
    const source = `${gauge}\n${base}\n${ringStyles}`

    expect(source).toContain('hologram-gauge-base')
    expect(base).toContain('hologram-gauge-base-svg')
    expect(base).toContain('viewBox="0 0 220 76"')
    expect(base).toContain('gauge-base-wall')
    expect(base).toContain('gauge-base-deck')
    expect(base).not.toContain('ThreePiePedestal')
    expect(base).not.toContain('WebGLRenderer')
    expect(source).not.toContain('gauge-base-tier')
    expect(source).not.toContain('gauge-base-beam')
    expect(gauge).toContain('gauge-ring-track')
    expect(gauge).toContain('gauge-ring-progress')
    expect(source).not.toMatch(/gauge-(?:tube|water|glass)|pipe-|tube-|water-pipe/i)
    expect(source).not.toMatch(/hologram-gauge-(?:beam|gloss)/)
  })

  it('uses value-banded gauge colors instead of theme-adaptive ring colors', () => {
    const availabilityModule = readSource('components/modules/AvailabilityModule.vue')
    const gauge = readSource('components/visual/HologramGauge.vue')
    const base = readSource('components/visual/HologramGaugeBase.vue')
    const ringStyles = readSource('styles/rings.css')
    const progressStyles =
      ringStyles.match(/\.gauge-grad-a\s*\{[\s\S]*?\.gauge-grad-d\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(gauge).toContain('GAUGE_PALETTES')
    expect(gauge).toContain('max: 30')
    expect(gauge).toContain('max: 60')
    expect(gauge).toContain('max: 80')
    expect(gauge).toContain('max: 95')
    expect(gauge).toContain('#e65b73')
    expect(gauge).toContain('#f2b84b')
    expect(gauge).toContain('#e6b94a')
    expect(gauge).toContain('#24c78e')
    expect(gauge).toContain('#ddf5f8')
    expect(base).toContain('stop-color="var(--gauge-tone)"')
    expect(base).toContain('gauge-base-deck--top')
    expect(availabilityModule).not.toContain('ringTones')
    expect(availabilityModule).not.toContain('toneFor')
    expect(progressStyles).toContain('var(--gauge-tone-soft)')
    expect(progressStyles).toContain('var(--gauge-tone-bright)')
    expect(progressStyles).not.toMatch(/var\(--data-ring|var\(--data-pie-primary/)
  })

  it('uses instrument-style pedestal geometry for 3D pie bases', () => {
    const completionModule = readSource('components/modules/CompletionModule.vue')
    const pedestal = readSource('components/visual/ThreePiePedestal.vue')
    const moduleStyles = readSource('styles/modules.css')
    const healthBaseBlock =
      moduleStyles.match(/\.health-pie-panel\s+\.health-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(completionModule).toContain(
      "import ThreePiePedestal from '../visual/ThreePiePedestal.vue'",
    )
    expect(completionModule).toContain('class="inspection-pie-base"')
    expect(pedestal).toContain('makeStepTier')
    expect(pedestal).toContain('makeTickBand')
    expect(pedestal).toContain('makeInstrumentMarker')
    expect(pedestal).toContain('supportsWebGL')
    expect(pedestal).toContain('WebGLRenderingContext')
    expect(pedestal).toContain("variant?: 'webgl' | 'compact'")
    expect(pedestal).toContain('three-pie-pedestal--compact')
    expect(pedestal).toContain("cssColorToThree('var(--instrument-base-rim)'")
    expect(healthBaseBlock).toContain('display: block')
    expect(healthBaseBlock).not.toContain('display: none')
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
    expect(base).toContain('hologram-gauge-base-svg')
    expect(base).not.toContain('ThreePiePedestal')
    expect(base).not.toContain('requestAnimationFrame')
    expect(ringStyles).toMatch(/top:\s*calc\(var\(--gauge-size,\s*7\.375rem\)\s*\*\s*0\.78\)/)
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
