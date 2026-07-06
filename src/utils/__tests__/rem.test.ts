import { describe, expect, it } from 'vitest'
import { pxToRem, rem } from '../rem'

describe('rem utilities', () => {
  it('converts px values to rem strings with a 1rem base', () => {
    expect(pxToRem(16)).toBe('1rem')
    expect(pxToRem(8)).toBe('0.5rem')
    expect(pxToRem(118)).toBe('7.375rem')
  })

  it('keeps zero unitless and supports aliases', () => {
    expect(pxToRem(0)).toBe('0')
    expect(rem(32)).toBe('2rem')
  })

  it('handles invalid input defensively', () => {
    expect(pxToRem(Number.NaN)).toBe('0rem')
    expect(pxToRem(16, 0)).toBe('0rem')
  })
})
