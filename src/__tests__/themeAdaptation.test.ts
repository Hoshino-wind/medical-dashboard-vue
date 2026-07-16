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
  it('scales dashboard text through shared multipliers while keeping chart and percentage values readable', () => {
    const tokenStyles = readSource('styles/tokens.css')
    const cssWithTextSizes = [
      'styles/layout.css',
      'styles/header.css',
      'styles/panel.css',
      'styles/rings.css',
      'styles/modules.css',
      'styles/tables.css',
      'styles/charts.css',
      'styles/config.css',
      'components/charts/Pie3D.vue',
      'components/visual/AvailabilityMetricRing.vue',
    ]
    const fontSizeDeclarations = cssWithTextSizes.flatMap((path) =>
      Array.from(readSource(path).matchAll(/font-size:\s*([^;]+);/g), (match) => ({
        path,
        value: match[1],
      })),
    )
    const ringStyles = readSource('styles/rings.css')
    // 头部文字样式已随 HeaderBar 组件化搬入其 <style scoped>
    const headerStyles = readSource('components/shared/HeaderBar.vue')
    const moduleStyles = readSource('styles/modules.css')
    const panelStyles = readSource('styles/panel.css')
    const tableStyles = readSource('styles/tables.css')
    const cubeBar = readSource('components/charts/CubeBarChart.vue')
    const lineArea = readSource('components/charts/LineAreaChart.vue')
    const restoredHeaderTextBlocks = [
      '.brand-main',
      '.brand-cn',
      '.brand-clock',
      '.hospital-name',
      '.hospital-subtitle',
      '.title-frame h1',
    ].map((selector) => headerStyles.match(new RegExp(`${selector.replace('.', '\\.')}\\s*\\{[\\s\\S]*?\\n\\}`))?.[0] ?? '')
    const restoredPanelTitleBlocks = [
      panelStyles.match(/\.panel-header h2\s*\{[\s\S]*?\n\}/)?.[0] ?? '',
      panelStyles.match(/\.panel-title-suffix\s*\{[\s\S]*?\n\}/)?.[0] ?? '',
    ]
    const gaugeValueBlock =
      ringStyles.match(/\.hologram-gauge-value\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const largeGaugeValueBlock =
      ringStyles.match(/\.hologram-gauge\.is-large \.hologram-gauge-value\s*\{[\s\S]*?\n\}/)?.[0] ??
      ''
    const overviewValueBlock =
      moduleStyles.match(/\.overview-feature-ring \.hologram-gauge-value\s*\{[\s\S]*?\n\}/)?.[0] ??
      ''
    const pieCenterValueBlock =
      moduleStyles.match(/\.pie-center-value\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const pieSummaryTitleBlock =
      moduleStyles.match(/\.pie-summary-title\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const compactTableBlock =
      moduleStyles.match(/\.compact-order-table\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const dataTableBlock = tableStyles.match(/\.data-table\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(tokenStyles).toContain('--dashboard-font-scale: 1.45')
    expect(tokenStyles).toContain('--dashboard-list-font-scale: 1.18')
    expect(fontSizeDeclarations.length).toBeGreaterThan(20)
    expect(
      fontSizeDeclarations.filter((declaration) =>
        declaration.value.includes('var(--dashboard-font-scale'),
      ).length,
    ).toBeGreaterThan(20)
    expect(dataTableBlock).toContain('var(--dashboard-list-font-scale')
    expect(dataTableBlock).not.toContain('var(--dashboard-font-scale')
    expect(compactTableBlock).toContain('var(--dashboard-list-font-scale')
    expect(compactTableBlock).not.toContain('var(--dashboard-font-scale')
    expect(restoredHeaderTextBlocks.every(Boolean)).toBe(true)
    expect(restoredPanelTitleBlocks.every(Boolean)).toBe(true)
    expect(restoredHeaderTextBlocks.join('\n')).not.toContain('var(--dashboard-font-scale')
    expect(restoredPanelTitleBlocks.join('\n')).not.toContain('var(--dashboard-font-scale')
    expect(pieSummaryTitleBlock).not.toContain('var(--dashboard-font-scale')
    expect(pieCenterValueBlock).toContain('font-size: 0.92rem')
    expect(gaugeValueBlock).not.toContain('var(--dashboard-font-scale')
    expect(largeGaugeValueBlock).not.toContain('var(--dashboard-font-scale')
    expect(overviewValueBlock).not.toContain('var(--dashboard-font-scale')
    expect(pieCenterValueBlock).not.toContain('var(--dashboard-font-scale')
    expect(cubeBar).not.toContain('chartFontSize(')
    expect(cubeBar).toContain('fontSize: 10')
    expect(cubeBar).toContain('fontSize: 11')
    expect(cubeBar).toContain('fontSize: 12')
    expect(cubeBar).toContain('fontSize: 8')
    expect(lineArea).toContain('chartFontSize(')
  })

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

  it('keeps the overview gauge label and value as a compact centered stack', () => {
    const ringStyles = readSource('styles/rings.css')
    const moduleStyles = readSource('styles/modules.css')
    const contentBlock =
      ringStyles.match(
        /\.hologram-gauge\.has-inside-label \.hologram-gauge-content\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const labelBlock =
      ringStyles.match(
        /\.hologram-gauge\.has-inside-label \.hologram-gauge-label\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const valueBlock =
      ringStyles.match(
        /\.hologram-gauge\.has-inside-label \.hologram-gauge-value\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const largeInsideValueBlock =
      ringStyles.match(
        /\.hologram-gauge\.is-large\.has-inside-label \.hologram-gauge-value\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const overviewValueBlock =
      moduleStyles.match(/\.overview-feature-ring \.hologram-gauge-value\s*\{[\s\S]*?\n\}/)?.[0] ??
      ''
    const overviewLabelBlock =
      moduleStyles.match(/\.overview-feature-ring \.hologram-gauge-label\s*\{[\s\S]*?\n\}/)?.[0] ??
      ''

    expect(contentBlock).toContain('display: grid')
    expect(contentBlock).toContain('align-content: center')
    expect(contentBlock).not.toContain('display: block')
    expect(labelBlock).toContain('position: static')
    expect(labelBlock).toContain('0.625rem')
    expect(labelBlock).not.toContain('bottom: calc')
    expect(valueBlock).toContain('position: static')
    expect(valueBlock).toContain('transform: none')
    expect(valueBlock).toContain('0.17')
    expect(largeInsideValueBlock).toContain('0.18')
    expect(overviewValueBlock).toContain('font-size: 1.7rem')
    expect(overviewLabelBlock).toContain('font-size: 0.56rem')
  })

  it('uses theme tokens for the cube bar base instead of fixed blue and violet fills', () => {
    const cubeBar = readSource('components/charts/CubeBarChart.vue')

    expect(cubeBar).not.toContain('baseBlue')
    expect(cubeBar).not.toContain('baseViolet')
    expect(cubeBar).not.toContain('baseNavy')
  })

  it('uses theme tokens for the 2.5D pie colors and tooltip instead of fixed cyan lighting', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).not.toMatch(/#(?:20f1d4|123e63|0a8fb7|2f8dff|45d8ff|53fff0|4defff|265d85)/i)
    expect(pie3d).not.toMatch(/rgba\(32,\s*241,\s*212/)
  })

  it('keeps 2.5D pie tooltip compact and inside the chart bounds', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')
    const tooltipBlock = pie3d.match(/\.pie3d-three-tooltip\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(pie3d).toContain('const TOOLTIP_WIDTH = 92')
    expect(pie3d).toContain('const TOOLTIP_MARGIN = 6')
    expect(pie3d).toContain('function clampTooltipPosition')
    expect(pie3d).toContain('Math.min(Math.max')
    expect(pie3d).toContain('rect.width - TOOLTIP_WIDTH - TOOLTIP_MARGIN')
    expect(tooltipBlock).toContain('font-size: 0.68rem')
    expect(tooltipBlock).not.toContain('--dashboard-font-scale')
    expect(tooltipBlock).toContain('min-width: 5.25rem')
  })

  it('keeps light-theme 2.5D pie fills slightly translucent', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).toContain('const lightDepthOpacityBase = isLightTheme() ? 0.1 : 0.12')
    expect(pie3d).toContain('const lightDepthOpacityRange = isLightTheme() ? 0.18 : 0.22')
    expect(pie3d).toContain('opacity: isLightTheme() ? 0.76 : 0.94')
    expect(pie3d).toContain('opacity: isLightTheme() ? 0.76 : 1')
  })

  it('renders 2.5D pie top faces as flat fills instead of gradients', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).toContain(':fill="segment.topColor"')
    expect(pie3d).not.toContain('<linearGradient')
    expect(pie3d).not.toContain('gradientId')
    expect(pie3d).not.toContain(':fill="`url(#${segment.')
  })

  it('renders pie charts as layered SVG 2.5D without WebGL materials', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')

    expect(pie3d).toContain('<svg')
    expect(pie3d).toContain('pie3d-depth-layer')
    expect(pie3d).toContain('pie3d-top-segment')
    expect(pie3d).toContain('data-segment-name')
    expect(pie3d).toContain('tooltip.visible')
    expect(pie3d).not.toContain('WebGLRenderer')
    expect(pie3d).not.toContain('MeshStandardMaterial')
    expect(pie3d).not.toContain('Raycaster')
    expect(pie3d).not.toContain('requestAnimationFrame(tickRotation)')
  })

  it('keeps lower glow out of 2.5D pie charts', () => {
    const pie3d = readSource('components/charts/Pie3D.vue')
    const moduleStyles = readSource('styles/modules.css')
    const inspectionPieShell =
      moduleStyles.match(/\.inspection-pie-shell\s+\.pie3d-three-shell\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(pie3d).not.toContain('makeFloorShadow')
    expect(pie3d).not.toContain('rootGroup.add(makeFloorShadow')
    expect(inspectionPieShell).not.toContain('drop-shadow')
  })

  it('keeps each 3x3 dashboard row split into three equal-width cards', () => {
    const layoutStyles = readSource('styles/layout.css')
    const screenGridBlock = layoutStyles.match(/\.screen-grid\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const compactGridBlock =
      layoutStyles.match(/\.screen-grid\.layout-2x3\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(screenGridBlock).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
    expect(screenGridBlock).not.toContain('0.98fr 1.43fr 1.04fr')
    expect(compactGridBlock).toContain('grid-template-columns: repeat(3, minmax(0, 1fr));')
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

  it('adapts repair work order summary colors to each status tone', () => {
    const tableStyles = readSource('styles/tables.css')
    const summaryBlock = tableStyles.match(/\.work-order-summary\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const itemBlock = tableStyles.match(/\.work-order-summary > div\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const labelBlock = tableStyles.match(/\.work-order-summary span\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const valueBlock = tableStyles.match(/\.work-order-summary b\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const unitBlock = tableStyles.match(/\.work-order-summary em\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const lightItemBlock =
      tableStyles.match(
        /\.dashboard-shell\[data-theme-mode='light'\] \.work-order-summary > div\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(summaryBlock).toContain('var(--surface-strong)')
    expect(summaryBlock).not.toContain('var(--chart-primary) 9%')
    expect(itemBlock).toContain('var(--status-tone')
    expect(labelBlock).toContain('var(--status-tone')
    expect(valueBlock).toContain('var(--status-tone')
    expect(unitBlock).toContain('var(--status-tone')
    expect(tableStyles).toContain('.work-order-summary .is-danger {\n  --status-tone: var(--danger);')
    expect(tableStyles).toContain('.work-order-summary .is-purple {\n  --status-tone: var(--accent-3);')
    expect(tableStyles).toContain('.work-order-summary .is-warn {\n  --status-tone: var(--warn);')
    expect(tableStyles).toContain('.work-order-summary .is-good {\n  --status-tone: var(--good);')
    expect(lightItemBlock).toContain('var(--status-tone')
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
    expect(source).toContain('gauge-base-tier')
    expect(source).toContain('gauge-base-beam')
    expect(source).toContain('gauge-base-orbit--rotating')
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

  it('reuses the overview hologram base for both work-order pie charts', () => {
    const completionModule = readSource('components/modules/CompletionModule.vue')
    const healthPie = readSource('components/charts/HealthPieChart.vue')
    const legacyPedestalPath = sourcePath('components/visual/ThreePiePedestal.vue')
    const moduleStyles = readSource('styles/modules.css')
    const healthBaseBlock =
      moduleStyles.match(/\.health-pie-panel\s+\.health-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''

    expect(completionModule).toContain(
      "import HologramGaugeBase from '../visual/HologramGaugeBase.vue'",
    )
    expect(healthPie).toContain(
      "import HologramGaugeBase from '../visual/HologramGaugeBase.vue'",
    )
    expect(completionModule).not.toContain('ThreePiePedestal')
    expect(healthPie).not.toContain('ThreePiePedestal')
    expect(existsSync(legacyPedestalPath)).toBe(false)
    expect(completionModule).toContain('<HologramGaugeBase')
    expect(healthPie).toContain('<HologramGaugeBase')
    expect(completionModule).toContain('class="inspection-pie-base"')
    expect(completionModule).toContain(':speed="7.2"')
    expect(completionModule).toContain('direction="clockwise"')
    expect(healthPie).toContain(':speed="8.4"')
    expect(healthPie).toContain('direction="counter-clockwise"')
    expect(healthBaseBlock).toContain('display: block')
    expect(healthBaseBlock).not.toContain('display: none')
  })

  it('removes the unused Three.js hologram base and dependencies', () => {
    const packageJson = JSON.parse(readSource('../package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const ringStyles = readSource('styles/rings.css')

    expect(existsSync(sourcePath('components/visual/ThreeHologramBase.vue'))).toBe(false)
    expect(packageJson.dependencies).not.toHaveProperty('three')
    expect(packageJson.devDependencies).not.toHaveProperty('@types/three')
    expect(ringStyles).not.toContain('.three-hologram-base')
  })

  it('uses the same 2.5D pie geometry with simplified pedestals', () => {
    const healthPie = readSource('components/charts/HealthPieChart.vue')
    const completionModule = readSource('components/modules/CompletionModule.vue')
    const moduleStyles = readSource('styles/modules.css')
    const healthCoreBlock =
      moduleStyles.match(/\.health-pie-panel\s+\.health-pie-core\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const healthBaseBlock =
      moduleStyles.match(/\.health-pie-panel\s+\.health-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const inspectionPieBlock =
      moduleStyles.match(/\.inspection-pie-shell\s+\.pie3d-three-shell\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const inspectionBaseBlock =
      moduleStyles.match(/\.inspection-pie-base\s*\{[\s\S]*?\}/)?.[0] ?? ''
    const healthBaseTag = healthPie.match(/<HologramGaugeBase[\s\S]*?\/>/)?.[0] ?? ''
    const inspectionBaseTag =
      completionModule.match(/<HologramGaugeBase[\s\S]*?\/>/)?.[0] ?? ''

    expect(healthPie).toContain('const chartHeight = pxToRem(136)')
    expect(healthPie).toContain(':thickness="7"')
    expect(healthPie).toContain('auto-rotate')
    expect(healthBaseTag).not.toContain('variant="compact"')
    expect(healthPie).toContain(':speed="8.4"')
    expect(healthPie).toContain('direction="counter-clockwise"')
    expect(healthPie).not.toContain('label-deck')
    expect(completionModule).toContain('const chartHeight = pxToRem(136)')
    expect(completionModule).toContain(':thickness="7"')
    expect(completionModule).toContain('auto-rotate')
    expect(inspectionBaseTag).not.toContain('variant="compact"')
    expect(completionModule).not.toContain('label-deck')
    expect(healthCoreBlock).toContain('width: 12.85rem')
    expect(healthCoreBlock).toContain('height: 8.5rem')
    expect(healthCoreBlock).toContain('transform: translateY(-0.25rem)')
    expect(inspectionPieBlock).toContain('width: 12.85rem')
    expect(inspectionPieBlock).toContain('height: 8.5rem')
    expect(inspectionPieBlock).toContain('transform: translateY(-0.25rem)')
    expect(healthBaseBlock).toContain('width: min(16.25rem, 124%)')
    expect(healthBaseBlock).toContain('height: 6.25rem')
    expect(healthBaseBlock).toContain('top: 4.75rem')
    expect(healthBaseBlock).toContain('bottom: auto')
    expect(healthBaseBlock).not.toContain('bottom: -0.2rem')
    expect(inspectionBaseBlock).toContain('width: min(16.25rem, 124%)')
    expect(inspectionBaseBlock).toContain('height: 6.25rem')
    expect(inspectionBaseBlock).toContain('top: 4.75rem')
    expect(inspectionBaseBlock).toContain('bottom: auto')
    expect(inspectionBaseBlock).not.toContain('bottom: -0.2rem')
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
