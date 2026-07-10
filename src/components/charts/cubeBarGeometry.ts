export const BASE_DROP = 18
export const BASE_VERTICAL_OFFSET = 8
export const BAR_ANIMATION_DURATION = 2600
export const COLUMN_BASE_X_RATIO = 0.5
export const COLUMN_BASE_Y_RATIO = 0.34

export interface BaseCuboidGeometryInput {
  axisX: number
  baseY: number
  width: number
  slant: number
  depth: number
  drop?: number
  offsetY?: number
}

export interface BaseCuboidGeometry {
  axisY: number
  labelY: number
  faces: {
    left: number[][]
    front: number[][]
    right: number[][]
    top: number[][]
  }
}

export interface ColumnBasePointInput {
  categoryX: number
  axisY: number
  slant: number
  depth: number
}

export function createBaseCuboidGeometry({
  axisX,
  baseY,
  width,
  slant,
  depth,
  drop = BASE_DROP,
  offsetY = BASE_VERTICAL_OFFSET,
}: BaseCuboidGeometryInput): BaseCuboidGeometry {
  const axisY = baseY + offsetY
  const frontLeft = [axisX, axisY]
  const frontRight = [axisX + width, axisY]
  const backRight = [axisX + width + slant, axisY - depth]
  const backLeft = [axisX + slant, axisY - depth]
  const frontLeftBottom = [axisX, axisY + drop]
  const frontRightBottom = [axisX + width, axisY + drop]
  const backRightBottom = [axisX + width + slant, axisY - depth + drop]
  const backLeftBottom = [axisX + slant, axisY - depth + drop]

  return {
    axisY,
    labelY: axisY + drop / 2,
    faces: {
      left: [backLeft, frontLeft, frontLeftBottom, backLeftBottom],
      front: [frontLeft, frontRight, frontRightBottom, frontLeftBottom],
      right: [frontRight, backRight, backRightBottom, frontRightBottom],
      top: [frontLeft, frontRight, backRight, backLeft],
    },
  }
}

export function createColumnBasePoint({
  categoryX,
  axisY,
  slant,
  depth,
}: ColumnBasePointInput): [number, number] {
  return [categoryX + slant * COLUMN_BASE_X_RATIO, axisY - depth * COLUMN_BASE_Y_RATIO]
}

export function findPeakSeriesIndex(values: number[]): number {
  if (values.length === 0) return -1
  return values.reduce((peak, value, index) => (value > values[peak] ? index : peak), 0)
}

function easeInOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))
  if (clamped < 0.5) return 4 * clamped * clamped * clamped
  return 1 - Math.pow(-2 * clamped + 2, 3) / 2
}

export function interpolateBarValue(target: number, progress: number): number {
  if (target <= 0) return 0
  return target * easeInOutCubic(progress)
}
