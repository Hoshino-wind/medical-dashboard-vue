import { describe, expect, it } from 'vitest'
import { buildPie3DSegments } from '../pie3dSegments'

describe('buildPie3DSegments', () => {
  it('normalizes positive values into contiguous pie segments', () => {
    const segments = buildPie3DSegments([
      { name: '维保预警', value: 68, color: '#ffc857' },
      { name: '维修中', value: 44, color: '#ff5e78' },
      { name: '即将保养', value: 102, color: '#8b6dff' },
    ])

    expect(segments).toHaveLength(3)
    expect(segments[0]).toMatchObject({
      name: '维保预警',
      value: 68,
      color: '#ffc857',
      startRatio: 0,
    })
    expect(segments[0].endRatio).toBeCloseTo(68 / 214)
    expect(segments[1].startRatio).toBeCloseTo(68 / 214)
    expect(segments[1].endRatio).toBeCloseTo(112 / 214)
    expect(segments[2].startRatio).toBeCloseTo(112 / 214)
    expect(segments[2].endRatio).toBeCloseTo(1)
  })

  it('drops non-positive values and returns no segments for an empty total', () => {
    expect(
      buildPie3DSegments([
        { name: '空值', value: 0, color: '#fff' },
        { name: '异常值', value: -1, color: '#000' },
      ]),
    ).toEqual([])
  })
})
