import { describe, expect, it } from 'vitest'
import { themes } from '@/data/themes'

describe('glass-flow panel theme colors', () => {
  it('keeps every dark theme flow palette visually distinct', () => {
    const darkThemePalettes = themes
      .filter((theme) => theme.id !== 'light-medical')
      .map((theme) =>
        [
          theme.variables['--accent'],
          theme.variables['--accent-2'],
          theme.variables['--accent-3'],
        ].join('|'),
      )

    expect(new Set(darkThemePalettes).size).toBe(darkThemePalettes.length)
  })
})
