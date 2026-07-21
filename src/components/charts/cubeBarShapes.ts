import echarts from '@/utils/echarts'

export const CUBE_HALF = 7
export const CUBE_DEPTH = 3
export const AXIS_DEPTH = 20
export const AXIS_HEIGHT = 30
export const AXIS_SLANT = 15

// 玻璃柱体由左右面、顶面与内部高光叠加；cubeHalf 随类目带宽自适应。
const GlassColumnLeft = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0], cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const point = shape.xAxisPoint
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x - half, shape.y - CUBE_DEPTH)
    ctx.lineTo(point[0] - half, point[1] - CUBE_DEPTH)
    ctx.lineTo(point[0], point[1])
    ctx.closePath()
  },
})

const GlassColumnRight = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, xAxisPoint: [0, 0], cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const point = shape.xAxisPoint
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(point[0], point[1])
    ctx.lineTo(point[0] + half, point[1] - CUBE_DEPTH)
    ctx.lineTo(shape.x + half, shape.y - CUBE_DEPTH)
    ctx.closePath()
  },
})

const GlassColumnTop = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, cubeHalf: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: any) {
    const half = shape.cubeHalf || CUBE_HALF
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + half, shape.y - CUBE_DEPTH)
    ctx.lineTo(shape.x, shape.y - CUBE_DEPTH * 2)
    ctx.lineTo(shape.x - half, shape.y - CUBE_DEPTH)
    ctx.closePath()
  },
})

const CuboidAxisTop = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y)
    ctx.lineTo(shape.x + shape.width + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.lineTo(shape.x + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.closePath()
  },
})

const CuboidAxisFront = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    ctx.moveTo(shape.x, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y)
    ctx.lineTo(shape.x + shape.width, shape.y + AXIS_HEIGHT)
    ctx.lineTo(shape.x, shape.y + AXIS_HEIGHT)
    ctx.closePath()
  },
})

const CuboidAxisRight = echarts.graphic.extendShape({
  shape: { x: 0, y: 0, width: 0 },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildPath(ctx: any, shape: { x: number; y: number; width: number }) {
    const right = shape.x + shape.width
    ctx.moveTo(right, shape.y)
    ctx.lineTo(right + AXIS_SLANT, shape.y - AXIS_DEPTH)
    ctx.lineTo(right + AXIS_SLANT, shape.y - AXIS_DEPTH + AXIS_HEIGHT)
    ctx.lineTo(right, shape.y + AXIS_HEIGHT)
    ctx.closePath()
  },
})

/** HMR 会重新执行模块；使用全局标记避免重复注册同名图形。 */
export function registerCubeBarShapes(): void {
  const registry = globalThis as Record<string, unknown>
  if (registry.__CUBE_SHAPES_REGISTERED__) return

  echarts.graphic.registerShape('GlassColumnLeft', GlassColumnLeft)
  echarts.graphic.registerShape('GlassColumnRight', GlassColumnRight)
  echarts.graphic.registerShape('GlassColumnTop', GlassColumnTop)
  echarts.graphic.registerShape('CuboidAxisTop', CuboidAxisTop)
  echarts.graphic.registerShape('CuboidAxisFront', CuboidAxisFront)
  echarts.graphic.registerShape('CuboidAxisRight', CuboidAxisRight)
  registry.__CUBE_SHAPES_REGISTERED__ = true
}
