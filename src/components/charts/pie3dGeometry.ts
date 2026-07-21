import type { Theme } from '@/types/theme'
import type { Pie3DSegment } from '@/utils/pie3dSegments'

export const TAU = Math.PI * 2
export const BASE_START_ANGLE = -Math.PI / 2
export const VIEWBOX_WIDTH = 240
export const VIEWBOX_HEIGHT = 188
export const CENTER_X = 120
export const CENTER_Y = 61
const OUTER_RX = 78
const OUTER_RY = 34
const INNER_RX = 41
const INNER_RY = 16.5
export const DEPTH_STEP = 3.5
const ARC_POINT_DENSITY = 112

interface EllipsePoint {
  x: number
  y: number
}

export interface RenderedSegment extends Pie3DSegment {
  index: number
  startAngle: number
  endAngle: number
  path: string
  topColor: string
  depthColor: string
  strokeColor: string
  labelX: number
  labelY: number
}

export interface WallSegment {
  key: string
  path: string
  fill: string
  stroke: string
  opacity: number
}

export interface DepthLayer {
  key: string
  offset: number
  opacity: number
}

function colorMix(color: string, colorPercent: number, mixColor: string): string {
  return `color-mix(in srgb, ${color} ${colorPercent}%, ${mixColor})`
}

function pointOnTiltedEllipse(angle: number, rx: number, ry: number, yOffset = 0): EllipsePoint {
  const sin = Math.sin(angle)
  const frontRatio = (sin + 1) / 2
  const xPerspective = 0.86 + frontRatio * 0.3
  const yPerspective = 0.68 + frontRatio * 0.3

  return {
    x: CENTER_X + Math.cos(angle) * rx * xPerspective,
    y: CENTER_Y + sin * ry * yPerspective + yOffset,
  }
}

function formatPoint(point: EllipsePoint): string {
  return `${point.x.toFixed(3)} ${point.y.toFixed(3)}`
}

function sampledArcPoints(start: number, end: number, rx: number, ry: number): EllipsePoint[] {
  const arc = Math.max(0.001, end - start)
  const steps = Math.max(8, Math.ceil((arc / TAU) * ARC_POINT_DENSITY))

  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = start + (arc * index) / steps
    return pointOnTiltedEllipse(angle, rx, ry)
  })
}

function closedTiltedEllipsePath(rx: number, ry: number, yOffset: number): string {
  const points = Array.from({ length: ARC_POINT_DENSITY }, (_, index) =>
    pointOnTiltedEllipse((TAU * index) / ARC_POINT_DENSITY, rx, ry, yOffset),
  )
  return [
    `M ${formatPoint(points[0])}`,
    ...points.slice(1).map((point) => `L ${formatPoint(point)}`),
    'Z',
  ].join(' ')
}

function sideWallPath(start: number, end: number, depth: number): string {
  const topPoints = sampledArcPoints(start, end, OUTER_RX, OUTER_RY)
  const bottomPoints = topPoints.map((point) => ({ x: point.x, y: point.y + depth })).reverse()

  return [
    `M ${formatPoint(topPoints[0])}`,
    ...topPoints.slice(1).map((point) => `L ${formatPoint(point)}`),
    ...bottomPoints.map((point) => `L ${formatPoint(point)}`),
    'Z',
  ].join(' ')
}

function annularSectorPath(start: number, end: number): string {
  const outerPoints = sampledArcPoints(start, end, OUTER_RX, OUTER_RY)
  const innerPoints = sampledArcPoints(start, end, INNER_RX, INNER_RY).reverse()

  return [
    `M ${formatPoint(outerPoints[0])}`,
    ...outerPoints.slice(1).map((point) => `L ${formatPoint(point)}`),
    ...innerPoints.map((point) => `L ${formatPoint(point)}`),
    'Z',
  ].join(' ')
}

export function buildRenderedSegments(
  segments: Pie3DSegment[],
  startAngle: number,
  theme: Theme | undefined,
): RenderedSegment[] {
  const isLight = theme?.mode === 'light'
  const gap = segments.length > 1 ? 0.012 : 0

  return segments.map((segment, index) => {
    const startRaw = startAngle + segment.startRatio * TAU
    const endRaw = startAngle + segment.endRatio * TAU
    const arc = Math.max(0, endRaw - startRaw)
    const segmentGap = Math.min(gap, Math.max(0, arc * 0.16))
    const start = startRaw + segmentGap
    const end = Math.max(start + 0.001, endRaw - segmentGap)
    const label = pointOnTiltedEllipse(
      (start + end) / 2,
      (OUTER_RX + INNER_RX) / 2,
      (OUTER_RY + INNER_RY) / 2,
    )

    return {
      ...segment,
      index,
      startAngle: start,
      endAngle: end,
      path: annularSectorPath(start, end),
      topColor: segment.color,
      depthColor: colorMix(segment.color, isLight ? 72 : 68, isLight ? '#c3dbe1' : '#020814'),
      strokeColor: colorMix(
        segment.color,
        isLight ? 70 : 72,
        theme?.variables['--instrument-rim'] ?? '#d7fbff',
      ),
      labelX: label.x,
      labelY: label.y,
    }
  })
}

export function buildDepthLayers(count: number, isLight: boolean): DepthLayer[] {
  return Array.from({ length: count }, (_, index) => {
    const layer = count - index
    return {
      key: `depth-${layer}`,
      offset: layer * DEPTH_STEP,
      opacity: (isLight ? 0.1 : 0.12) + (index / Math.max(1, count - 1)) * (isLight ? 0.18 : 0.22),
    }
  })
}

export function buildFrontWalls(
  segments: RenderedSegment[],
  totalDepth: number,
  isLight: boolean,
): WallSegment[] {
  return segments.flatMap((segment) => {
    const start = Math.max(segment.startAngle, 0)
    const end = Math.min(segment.endAngle, Math.PI)
    if (end - start <= 0.01) return []

    return [
      {
        key: `front-wall-${segment.index}`,
        path: sideWallPath(start, end, totalDepth),
        fill: colorMix(segment.topColor, isLight ? 72 : 78, isLight ? '#b9d6df' : '#020814'),
        stroke: segment.strokeColor,
        opacity: isLight ? 0.76 : 0.94,
      },
    ]
  })
}

export function buildBottomRimPath(totalDepth: number): string {
  const points = sampledArcPoints(0, Math.PI, OUTER_RX, OUTER_RY).map((point) => ({
    x: point.x,
    y: point.y + totalDepth,
  }))

  return [
    `M ${formatPoint(points[0])}`,
    ...points.slice(1).map((point) => `L ${formatPoint(point)}`),
  ].join(' ')
}

export function buildCenterCapPath(): string {
  return closedTiltedEllipsePath(INNER_RX - 3, INNER_RY - 1.5, 0.8)
}

export function buildInnerRimPath(): string {
  return closedTiltedEllipsePath(INNER_RX, INNER_RY, 0)
}
