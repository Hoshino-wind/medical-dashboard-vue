import { describe, expect, it } from 'vitest'
import { moduleCatalog } from '@/data/modules'
import { themes } from '@/data/themes'
import { THEME_IDS, type ThemeVariables } from '@/types/theme'

const selectableThemeIds = [
  'light-medical',
  'deep-sea-instrument',
  'ink-blue-medical',
  'midnight-violet',
  'black-gold-blue',
]

const requiredVariableKeys: Array<keyof ThemeVariables> = [
  '--bg-top',
  '--bg-bottom',
  '--backdrop',
  '--bg',
  '--bg-soft',
  '--surface',
  '--surface-strong',
  '--surface-muted',
  '--glass',
  '--glass-strong',
  '--glass-edge',
  '--glass-highlight',
  '--border',
  '--border-strong',
  '--text',
  '--muted',
  '--accent',
  '--accent-2',
  '--accent-3',
  '--chart-primary',
  '--chart-secondary',
  '--chart-tertiary',
  '--data-bar',
  '--data-bar-secondary',
  '--data-bar-2',
  '--data-bar-3',
  '--data-maintenance-line',
  '--data-inspection-line',
  '--data-ring',
  '--data-ring-secondary',
  '--data-pie-primary',
  '--data-pie-pending',
  '--data-health-pie-good',
  '--data-health-pie-warning',
  '--data-health-pie-repairing',
  '--data-health-pie-pending',
  '--data-inspection-pie-finished',
  '--data-inspection-pie-waiting',
  '--data-inspection-pie-overdue',
  '--instrument-base',
  '--instrument-base-rim',
  '--instrument-rim',
  '--good',
  '--warn',
  '--danger',
  '--chart-grid',
  '--star-white',
  '--star-accent',
  '--star-opacity',
  '--grid-opacity',
  '--grid-blend-mode',
  '--panel-shadow',
]

function hexLuminance(hex: string): number {
  const match = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!match) return 0

  const [r, g, b] = match.slice(1).map((value) => {
    const channel = Number.parseInt(value, 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('dashboard themes', () => {
  it('keeps the default module titles aligned with the layout reference', () => {
    expect(moduleCatalog.map((item) => item.title)).toEqual([
      '设备总览',
      '维修工单',
      '保修统计',
      '生命支持设备可用率',
      '巡检工单',
      '保养统计',
      '超声设备可用率',
      '保养工单',
      '巡检统计',
      '设备分布台数占比',
    ])
  })

  it('exposes exactly five selectable big-screen themes', () => {
    const themeIds = themes.map((theme) => theme.id)

    expect(themeIds).toEqual(selectableThemeIds)
    expect(THEME_IDS).toEqual(selectableThemeIds)
    expect(new Set(themeIds)).toHaveProperty('size', 5)
  })

  it('defines complete runtime CSS variables for each selectable theme', () => {
    for (const themeId of selectableThemeIds) {
      const theme = themes.find((item) => item.id === themeId)

      expect(theme, themeId).toBeTruthy()
      expect(theme!.preview, themeId).toHaveLength(3)

      for (const key of requiredVariableKeys) {
        expect(theme!.variables[key], `${themeId} ${key}`).toBeTruthy()
      }
    }
  })

  it('declares exactly the required variable keys with no stray or misspelled tokens', () => {
    const required = [...requiredVariableKeys].sort()

    for (const theme of themes) {
      const actual = Object.keys(theme.variables).sort()
      // 索引签名允许任意 --xxx 通过类型检查,故用集合相等在测试层拦截拼写错误/遗漏
      expect(actual, theme.id).toEqual(required)
    }
  })

  it('places one light theme before four dark big-screen themes', () => {
    const [first, ...darkThemes] = themes

    expect(first.id).toBe('light-medical')
    expect(hexLuminance(first.variables['--bg'])).toBeGreaterThan(0.82)

    for (const theme of darkThemes) {
      expect(hexLuminance(theme.variables['--bg']), theme.id).toBeLessThan(0.04)
    }
  })

  it('keeps the light medical theme led by clinical blue with semantic state accents', () => {
    const theme = themes.find((item) => item.id === 'light-medical')!

    expect(theme.description).toBe('冷白天空蓝·白底运维')
    expect(theme.preview).toEqual(['#f7fbff', '#1677ff', '#2fbf8f'])
    expect(theme.variables['--accent']).toBe('#1677ff')
    expect(theme.variables['--accent-2']).toBe('#69b1ff')
    expect(theme.variables['--accent-3']).toBe('#9ccaff')
    expect(theme.variables['--chart-primary']).toBe('#1677ff')
    expect(theme.variables['--chart-secondary']).toBe('#69b1ff')
    expect(theme.variables['--chart-tertiary']).toBe('#9ccaff')
    expect(theme.variables['--data-ring']).toBe('#1677ff')
    expect(theme.variables['--data-pie-primary']).toBe('#237804')
    expect(theme.variables['--data-health-pie-good']).toBe('#237804')
    expect(theme.variables['--data-inspection-pie-finished']).toBe('#1677ff')
    expect(theme.variables['--data-inspection-line']).toBe('#20b486')
    expect(theme.variables['--data-health-pie-pending']).toBe('#7c3aed')
    expect(theme.variables['--good']).toBe('#2fbf8f')
    expect(theme.variables['--warn']).toBe('#d97706')
    expect(theme.variables['--danger']).toBe('#e11d48')
  })
})
