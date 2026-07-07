import { describe, expect, it } from 'vitest'
import { themes } from '@/data/themes'
import { THEME_IDS, type ThemeVariables } from '@/types/theme'

const selectableThemeIds = [
  'light-medical',
  'deep-sea-instrument',
  'ink-blue-medical',
  'midnight-violet',
  'black-gold-blue',
  'light-blue',
]

const requiredVariableKeys: Array<keyof ThemeVariables> = [
  '--bg',
  '--bg-soft',
  '--surface',
  '--surface-strong',
  '--surface-muted',
  '--border',
  '--border-strong',
  '--text',
  '--muted',
  '--accent',
  '--accent-2',
  '--accent-3',
  '--good',
  '--warn',
  '--danger',
  '--chart-grid',
  '--panel-shadow',
]

describe('dashboard themes', () => {
  it('exposes exactly six selectable themes including light palettes', () => {
    const themeIds = themes.map((theme) => theme.id)

    expect(themeIds).toEqual(selectableThemeIds)
    expect(THEME_IDS).toEqual(selectableThemeIds)
    expect(themeIds.filter((themeId) => themeId === 'light-medical')).toHaveLength(1)
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
})
