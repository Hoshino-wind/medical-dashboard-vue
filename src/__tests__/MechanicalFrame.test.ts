import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MechanicalFrame from '@/components/visual/MechanicalFrame.vue'
import PanelShell from '@/components/shared/PanelShell.vue'

const testDir = dirname(fileURLToPath(import.meta.url))
const frameAssetDir = join(testDir, '../assets/mechanical-frames')

const panelAssets = [
  'panel-deep-sea-instrument.png',
  'panel-ink-blue-medical.png',
  'panel-midnight-violet.png',
  'panel-black-gold-blue.png',
]

const compactAssets = [
  'compact-primary.png',
  'compact-success.png',
  'compact-danger.png',
  'compact-warning.png',
  'compact-inspection.png',
  'compact-purple.png',
]

describe('MechanicalFrame', () => {
  it('switches among independent dark-theme PNGs without runtime tinting', () => {
    const wrapper = mount(MechanicalFrame, { props: { variant: 'panel' } })

    expect(wrapper.classes()).toContain('mechanical-frame--panel')
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)

    const frameSource = readFileSync(
      join(testDir, '../components/visual/MechanicalFrame.vue'),
      'utf8',
    )

    panelAssets.forEach((asset) => {
      expect(frameSource).toContain(asset)
      expect(existsSync(join(frameAssetDir, asset))).toBe(true)
      expect(readFileSync(join(frameAssetDir, asset)).subarray(1, 4).toString()).toBe('PNG')
    })

    expect(frameSource).not.toContain('currentColor')
    expect(frameSource).not.toContain('color-mix')
    expect(frameSource).not.toContain('filter:')
    expect(frameSource).toContain("data-theme-id='light-medical'")
    expect(frameSource).toContain('浅色主题走独立玻璃体系')
    expect(frameSource).not.toContain('panel-light-medical')
  })

  it('uses separate raster assets for compact-card status colors', () => {
    const wrapper = mount(MechanicalFrame, { props: { variant: 'compact' } })
    const frameSource = readFileSync(
      join(testDir, '../components/visual/MechanicalFrame.vue'),
      'utf8',
    )

    expect(wrapper.classes()).toContain('mechanical-frame--compact')
    expect(wrapper.find('svg').exists()).toBe(false)

    compactAssets.forEach((asset) => {
      expect(frameSource).toContain(asset)
      expect(existsSync(join(frameAssetDir, asset))).toBe(true)
    })

    expect(frameSource).not.toContain('compact-light-')
  })

  it('mounts independent image frames for the panel and its title', () => {
    const wrapper = mount(PanelShell, {
      props: { title: '保修统计', subtitle: '近7天', variant: 'line' },
      slots: { default: '<div>内容</div>' },
    })

    expect(wrapper.findAllComponents(MechanicalFrame)).toHaveLength(2)
    expect(wrapper.findAll('.mechanical-frame--panel')).toHaveLength(1)
    expect(wrapper.findAll('.mechanical-frame--compact')).toHaveLength(1)
  })

  it('uses a standalone single-layer glass system for the light theme', () => {
    const frameSource = readFileSync(
      join(testDir, '../components/visual/MechanicalFrame.vue'),
      'utf8',
    )
    const layoutStyles = readFileSync(join(testDir, '../styles/layout.css'), 'utf8')
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const moduleStyles = readFileSync(join(testDir, '../styles/modules.css'), 'utf8')
    const tableStyles = readFileSync(join(testDir, '../styles/tables.css'), 'utf8')

    expect(frameSource).toContain("data-theme-id='light-medical'] .mechanical-frame")
    expect(frameSource).toContain('display: none')
    expect(layoutStyles).toContain(".dashboard-shell[data-theme-id='light-medical']")
    expect(layoutStyles).toContain('rgba(52, 211, 187, 0.22)')
    expect(panelStyles).toContain('backdrop-filter: blur(1.125rem) saturate(1.28)')
    expect(panelStyles).toContain('border-radius: 0.875rem')
    expect(moduleStyles).toContain('--glass-stat-tint')
    expect(moduleStyles).toContain('.module-status-summary')
    expect(moduleStyles).toContain('.pie-summary-panel')
    expect(moduleStyles).toContain('rgba(255, 255, 255, 0.035)')
    expect(tableStyles).toContain('维修、巡检、保养工单共享透明表格材质')
    expect(tableStyles).toContain('rgba(255, 255, 255, 0.07)')
  })
})
