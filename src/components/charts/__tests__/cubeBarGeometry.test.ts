import { describe, expect, it } from 'vitest'
import {
  BASE_DROP,
  BASE_VERTICAL_OFFSET,
  BAR_ANIMATION_DURATION,
  createColumnBasePoint,
  createBaseCuboidGeometry,
  interpolateBarValue,
} from '../cubeBarGeometry'

describe('cube bar geometry', () => {
  it('moves the base down and keeps the date label centered on the front face', () => {
    const geometry = createBaseCuboidGeometry({
      axisX: 10,
      baseY: 100,
      width: 200,
      slant: 15,
      depth: 20,
      drop: BASE_DROP,
      offsetY: BASE_VERTICAL_OFFSET,
    })

    expect(geometry.axisY).toBe(108)
    expect(geometry.labelY).toBe(117)
    expect(geometry.faces.top[0]).toEqual(geometry.faces.front[0])
    expect(geometry.faces.top[1]).toEqual(geometry.faces.front[1])
    expect(geometry.faces.top[1]).toEqual(geometry.faces.right[0])
    expect(geometry.faces.top[2]).toEqual(geometry.faces.right[1])
  })

  it('interpolates bar values from zero to the target with clamped progress', () => {
    expect(interpolateBarValue(331, 0)).toBe(0)
    expect(interpolateBarValue(331, 0.5)).toBeCloseTo(165.5)
    expect(interpolateBarValue(331, 1)).toBe(331)
    expect(interpolateBarValue(331, 2)).toBe(331)
    expect(interpolateBarValue(331, -1)).toBe(0)
    expect(interpolateBarValue(0, 0.7)).toBe(0)
  })

  it('places columns lower and closer to the center of the base top face', () => {
    expect(createColumnBasePoint({ categoryX: 120, axisY: 108, slant: 15, depth: 20 })).toEqual([
      127.5,
      101.2,
    ])
  })

  it('uses a slower opening animation duration', () => {
    expect(BAR_ANIMATION_DURATION).toBeGreaterThanOrEqual(2400)
  })
})
