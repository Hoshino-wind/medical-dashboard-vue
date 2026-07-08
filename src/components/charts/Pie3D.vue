<script setup lang="ts">
import * as THREE from 'three'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { buildPie3DSegments, type Pie3DInputItem, type Pie3DSegment } from '@/utils/pie3dSegments'
import { pxToRem } from '@/utils/rem'
import type { Theme } from '@/types/theme'

const TAU = Math.PI * 2
const START_ANGLE = -Math.PI / 2
const OUTER_RADIUS = 1
const INNER_RADIUS = 0.56
const CAMERA_BASE_SIZE = 1.05
const MAX_PIXEL_RATIO = 1.6
const LIGHT_PIE_SIDE = new THREE.Color('#d8f1f4')
const LIGHT_PIE_EDGE = new THREE.Color('#bfe8f0')

const props = withDefaults(
  defineProps<{
    items: Pie3DInputItem[]
    height?: string
    thickness?: number
    theme?: Theme
    tone?: string
    accent?: string
    surface?: string
    text?: string
    autoRotate?: boolean
  }>(),
  {
    height: pxToRem(150),
    thickness: 8,
    autoRotate: true,
  },
)

type SegmentMesh = THREE.Mesh & {
  userData: {
    group: THREE.Group
    midAngle: number
    segment: Pie3DSegment
  }
}

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const total = computed(() =>
  props.items.reduce((sum, item) => (Number.isFinite(item.value) && item.value > 0 ? sum + item.value : sum), 0),
)

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  name: '',
  value: 0,
  percent: '0.0',
})

const tooltipStyle = computed(() => ({
  transform: `translate(${pxToRem(tooltip.x)}, ${pxToRem(tooltip.y)})`,
}))

const shellStyle = computed(() => ({
  height: props.height,
  '--pie-tone': props.tone ?? props.theme?.variables['--data-pie-primary'] ?? 'var(--data-pie-primary)',
  '--pie-accent': props.accent ?? props.theme?.variables['--data-pie-pending'] ?? 'var(--data-pie-pending)',
  '--pie-surface':
    props.surface ?? props.theme?.variables['--instrument-base'] ?? 'var(--instrument-base)',
  '--pie-edge': props.theme?.variables['--glass-edge'] ?? 'var(--glass-edge)',
  '--pie-text': props.text ?? props.theme?.variables['--text'] ?? 'var(--text)',
}))

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let rootGroup: THREE.Group | null = null
let observer: ResizeObserver | null = null
let hoveredGroup: THREE.Group | null = null
let segmentMeshes: SegmentMesh[] = []
let animationFrame = 0
let lastFrameTime = 0
let motionQuery: MediaQueryList | null = null

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function isLightTheme(): boolean {
  return props.theme?.id.startsWith('light-') ?? false
}

function pieDepth(): number {
  if (isLightTheme()) return Math.max(0.14, Math.min(0.24, props.thickness * 0.026))
  return Math.max(0.24, Math.min(0.42, props.thickness * 0.04))
}

function disposeMaterial(material: THREE.Material | THREE.Material[] | undefined) {
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose())
    return
  }
  material?.dispose()
}

function disposeScene() {
  scene?.traverse((object) => {
    const disposable = object as THREE.Object3D & {
      geometry?: THREE.BufferGeometry
      material?: THREE.Material | THREE.Material[]
    }
    disposable.geometry?.dispose()
    disposeMaterial(disposable.material)
  })
  scene = null
  camera = null
  rootGroup = null
  hoveredGroup = null
  segmentMeshes = []
}

function resolveColor(value: string, fallback = '#000000'): THREE.Color {
  const rgb = value
    .trim()
    .match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i)
  if (rgb) {
    return new THREE.Color(Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255)
  }

  try {
    return new THREE.Color(value)
  } catch {
    return new THREE.Color(fallback)
  }
}

function cssVariableName(value: string): string | null {
  return value.match(/^var\((--[\w-]+)/)?.[1] ?? null
}

function runtimeColor(value: string | undefined, token: keyof Theme['variables'], fallback: string): string {
  if (value && !cssVariableName(value)) return value
  if (props.theme?.variables[token]) return props.theme.variables[token]
  const variableName = value ? cssVariableName(value) : token
  if (!variableName || !host.value) return fallback
  return getComputedStyle(host.value).getPropertyValue(variableName).trim() || fallback
}

// 浅色主题:保留扇区色相,压低饱和、提高明度,得到适配白底玻璃的顶面亮基色
function lightPieBright(base: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 0.8), Math.min(0.82, hsl.l + 0.22))
}

// 顶面由内到外的深基色:比亮基色略深、略饱和,拉出层次但仍属白底玻璃
function lightPieDeep(base: THREE.Color): THREE.Color {
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 0.9), Math.min(0.64, hsl.l + 0.06))
}

function makeAnnularSectorShape(start: number, end: number): THREE.Shape {
  const shape = new THREE.Shape()
  shape.moveTo(Math.cos(start) * OUTER_RADIUS, Math.sin(start) * OUTER_RADIUS)
  shape.absarc(0, 0, OUTER_RADIUS, start, end, false)
  shape.lineTo(Math.cos(end) * INNER_RADIUS, Math.sin(end) * INNER_RADIUS)
  shape.absarc(0, 0, INNER_RADIUS, end, start, true)
  shape.closePath()
  return shape
}

function makeAnnularSectorGeometry(start: number, end: number, depth: number): THREE.ExtrudeGeometry {
  const shape = makeAnnularSectorShape(start, end)

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.024,
    bevelSegments: 3,
    curveSegments: 64,
    steps: 1,
  })

  geometry.translate(0, 0, -depth / 2)
  return geometry
}

function gradientColorAt(angle: number, radius: number, base: THREE.Color): THREE.Color {
  const y = Math.sin(angle) * radius
  const ratio = Math.max(0, Math.min(1, (y + OUTER_RADIUS) / (OUTER_RADIUS * 2)))
  return lightPieDeep(base).lerp(lightPieBright(base), ratio)
}

function makeTopGradientMesh(start: number, end: number, depth: number, base: THREE.Color): THREE.Mesh {
  const arc = Math.max(0.01, end - start)
  const steps = Math.max(18, Math.ceil((arc / TAU) * 128))
  const positions: number[] = []
  const colors: number[] = []
  const indices: number[] = []

  for (let index = 0; index <= steps; index += 1) {
    const ratio = index / steps
    const angle = start + arc * ratio
    const outerColor = gradientColorAt(angle, OUTER_RADIUS, base)
    const innerColor = gradientColorAt(angle, INNER_RADIUS, base).lerp(lightPieDeep(base), 0.1)

    positions.push(Math.cos(angle) * OUTER_RADIUS, Math.sin(angle) * OUTER_RADIUS, depth / 2 + 0.012)
    colors.push(outerColor.r, outerColor.g, outerColor.b)

    positions.push(Math.cos(angle) * INNER_RADIUS, Math.sin(angle) * INNER_RADIUS, depth / 2 + 0.012)
    colors.push(innerColor.r, innerColor.g, innerColor.b)
  }

  for (let index = 0; index < steps; index += 1) {
    const outerCurrent = index * 2
    const innerCurrent = outerCurrent + 1
    const outerNext = outerCurrent + 2
    const innerNext = outerCurrent + 3
    indices.push(outerCurrent, outerNext, innerNext, outerCurrent, innerNext, innerCurrent)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
}

function makeSegmentGroup(segment: Pie3DSegment, depth: number, gap: number): THREE.Group {
  const start = START_ANGLE + segment.startRatio * TAU + gap
  const end = START_ANGLE + segment.endRatio * TAU - gap
  const midAngle = (start + end) / 2
  const isLight = isLightTheme()
  const sourceColor = resolveColor(segment.color)
  const color = isLight ? lightPieDeep(sourceColor) : sourceColor
  const rimTheme = resolveColor(runtimeColor(undefined, '--instrument-rim', '#d7fbff'))
  const sideColor = isLight
    ? lightPieBright(sourceColor).lerp(LIGHT_PIE_SIDE, 0.55)
    : color.clone().offsetHSL(0, -0.03, -0.18).multiplyScalar(0.82)
  const rimColor = isLight
    ? lightPieBright(sourceColor).lerp(LIGHT_PIE_EDGE, 0.4)
    : color.clone().lerp(rimTheme, 0.08).offsetHSL(0, 0.03, 0.08)
  const geometry = makeAnnularSectorGeometry(start, Math.max(start + 0.01, end), depth)

  const mesh = new THREE.Mesh(geometry, [
    new THREE.MeshStandardMaterial({
      color: isLight
        ? lightPieBright(sourceColor)
        : color.clone().lerp(rimTheme, 0.02).offsetHSL(0, 0.1, 0.05),
      emissive: color.clone().multiplyScalar(isLight ? 0.006 : 0.11),
      metalness: isLight ? 0.08 : 0.16,
      roughness: isLight ? 0.6 : 0.36,
      transparent: true,
      opacity: isLight ? 0.32 : 0.96,
    }),
    new THREE.MeshStandardMaterial({
      color: sideColor,
      emissive: sideColor.clone().multiplyScalar(isLight ? 0.006 : 0.04),
      metalness: isLight ? 0.02 : 0.12,
      roughness: isLight ? 0.76 : 0.52,
      transparent: true,
      opacity: isLight ? 0.34 : 0.88,
    }),
  ]) as unknown as SegmentMesh

  const group = new THREE.Group()
  mesh.userData = { group, midAngle, segment }
  segmentMeshes.push(mesh)

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 24)
  const edges = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
      color: rimColor,
      transparent: true,
      opacity: isLight ? 0.05 : 0.17,
    }),
  )

  const innerGlowGeometry = new THREE.RingGeometry(INNER_RADIUS * 0.94, INNER_RADIUS * 1.02, 96, 1, start, end - start)
  const innerGlow = new THREE.Mesh(
    innerGlowGeometry,
    new THREE.MeshBasicMaterial({
      color: rimColor,
      transparent: true,
      opacity: isLight ? 0.025 : 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  innerGlow.position.z = depth / 2 + 0.012

  group.userData = { midAngle }
  const topGradient = isLight
    ? makeTopGradientMesh(start, Math.max(start + 0.01, end), depth, sourceColor)
    : null
  group.add(mesh, edges, innerGlow)
  if (topGradient) group.add(topGradient)
  return group
}

function makeCenterCap(depth: number, toneColor: THREE.Color, accentColor: THREE.Color, surfaceColor: THREE.Color): THREE.Mesh {
  const isLight = isLightTheme()
  const topRadius = INNER_RADIUS * (isLight ? 0.5 : 0.82)
  const bottomRadius = INNER_RADIUS * (isLight ? 0.58 : 0.9)
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, depth * 0.82, 96)
  geometry.rotateX(Math.PI / 2)
  const material = new THREE.MeshStandardMaterial({
    color: isLight ? new THREE.Color('#f4fbfc') : surfaceColor.clone().lerp(toneColor, 0.12),
    emissive: accentColor.clone().multiplyScalar(isLight ? 0.004 : 0.16),
    emissiveIntensity: isLight ? 0.004 : 0.1,
    metalness: isLight ? 0.04 : 0.2,
    roughness: isLight ? 0.82 : 0.46,
    transparent: true,
    opacity: isLight ? 0.16 : 0.56,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = 0.018
  return mesh
}

function buildScene() {
  disposeScene()

  const isLight = isLightTheme()
  const depth = pieDepth()
  const segments = buildPie3DSegments(props.items)
  const gap = segments.length > 1 ? 0.014 : 0
  const toneColor = resolveColor(runtimeColor(props.tone, '--data-pie-primary', '#20e8ff'))
  const accentColor = resolveColor(runtimeColor(props.accent, '--data-pie-pending', '#9df5ff'))
  const surfaceColor = resolveColor(runtimeColor(props.surface, '--instrument-base', '#33566c'))
  const mutedColor = resolveColor(runtimeColor(undefined, '--surface-muted', '#000000'))

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.05, -1.05, 0.1, 20)
  camera.position.set(0, -2.65, 2.05)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight(toneColor.clone().offsetHSL(0, -0.04, 0.08), isLight ? 0.48 : 0.88))

  const keyLight = new THREE.DirectionalLight(toneColor.clone().offsetHSL(0, -0.02, 0.12), isLight ? 0.62 : 1.28)
  keyLight.position.set(-1.5, -2.6, 3.2)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(accentColor.clone().offsetHSL(0, 0.04, 0.1), isLight ? 0.22 : 0.96)
  rimLight.position.set(2.4, 1.8, 2.4)
  scene.add(rimLight)

  const frontLight = new THREE.PointLight(accentColor, isLight ? 0.08 : 0.58, 6)
  frontLight.position.set(0, -1.5, 1.2)
  scene.add(frontLight)

  rootGroup = new THREE.Group()
  rootGroup.rotation.z = -0.12
  rootGroup.scale.set(1.04, 1.04, 1)

  if (segments.length === 0) {
    rootGroup.add(
      makeSegmentGroup(
        { name: '暂无数据', value: 1, color: mutedColor.getStyle(), startRatio: 0, endRatio: 1 },
        depth,
        0,
      ),
    )
  } else {
    segments.forEach((segment) => rootGroup?.add(makeSegmentGroup(segment, depth, gap)))
  }

  rootGroup.add(makeCenterCap(depth, toneColor, accentColor, surfaceColor))
  scene.add(rootGroup)
}

function ensureRenderer() {
  if (!canvas.value || renderer) return
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearAlpha(0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
}

function resize() {
  if (!host.value || !renderer || !camera) return
  const rect = host.value.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  const aspect = width / height

  camera.left = -CAMERA_BASE_SIZE * aspect
  camera.right = CAMERA_BASE_SIZE * aspect
  camera.top = CAMERA_BASE_SIZE
  camera.bottom = -CAMERA_BASE_SIZE
  camera.updateProjectionMatrix()

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO))
  renderer.setSize(width, height, false)
  renderScene()
}

function renderScene() {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

function prefersReducedMotion(): boolean {
  return motionQuery?.matches ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function shouldRotate(): boolean {
  return props.autoRotate && !prefersReducedMotion()
}

function stopRotation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }
  lastFrameTime = 0
}

function tickRotation(timestamp: number) {
  if (!rootGroup || !shouldRotate()) {
    animationFrame = 0
    lastFrameTime = 0
    return
  }

  if (!lastFrameTime) lastFrameTime = timestamp
  const delta = Math.min(48, timestamp - lastFrameTime)
  lastFrameTime = timestamp
  rootGroup.rotation.z += delta * 0.00016
  renderScene()
  animationFrame = requestAnimationFrame(tickRotation)
}

function startRotation() {
  stopRotation()
  if (!shouldRotate()) return
  animationFrame = requestAnimationFrame(tickRotation)
}

function onMotionPreferenceChange() {
  if (shouldRotate()) {
    startRotation()
    return
  }

  stopRotation()
  renderScene()
}

function mountScene() {
  ensureRenderer()
  if (!renderer) return
  tooltip.visible = false
  stopRotation()
  buildScene()
  resize()
  renderScene()
  startRotation()
}

function resetHover() {
  if (hoveredGroup) {
    hoveredGroup.position.set(0, 0, 0)
    hoveredGroup.scale.set(1, 1, 1)
    hoveredGroup = null
  }
  tooltip.visible = false
  renderScene()
}

function updateHover(mesh: SegmentMesh, event: PointerEvent) {
  const group = mesh.userData.group
  const midAngle = mesh.userData.midAngle

  if (hoveredGroup && hoveredGroup !== group) {
    hoveredGroup.position.set(0, 0, 0)
    hoveredGroup.scale.set(1, 1, 1)
  }

  hoveredGroup = group
  group.position.set(Math.cos(midAngle) * 0.045, Math.sin(midAngle) * 0.045, 0.035)
  group.scale.set(1.025, 1.025, 1.025)

  const rect = host.value?.getBoundingClientRect()
  const segment = mesh.userData.segment
  tooltip.visible = true
  tooltip.name = segment.name
  tooltip.value = segment.value
  tooltip.percent = total.value > 0 ? ((segment.value / total.value) * 100).toFixed(1) : '0.0'

  if (rect) {
    tooltip.x = event.clientX - rect.left + 10
    tooltip.y = event.clientY - rect.top - 10
  }

  renderScene()
}

function onPointerMove(event: PointerEvent) {
  if (!canvas.value || !camera || segmentMeshes.length === 0) return
  const rect = canvas.value.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(pointer, camera)
  const [hit] = raycaster.intersectObjects(segmentMeshes, false)

  if (!hit) {
    resetHover()
    return
  }

  updateHover(hit.object as SegmentMesh, event)
}

onMounted(() => {
  nextTick(() => {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionQuery.addEventListener('change', onMotionPreferenceChange)
    mountScene()
    observer = new ResizeObserver(resize)
    if (host.value) observer.observe(host.value)
  })
})

watch(
  () => [props.items, props.thickness, props.theme, props.tone, props.accent, props.surface, props.autoRotate],
  () => nextTick(mountScene),
  { deep: true },
)

onUnmounted(() => {
  stopRotation()
  motionQuery?.removeEventListener('change', onMotionPreferenceChange)
  motionQuery = null
  observer?.disconnect()
  disposeScene()
  renderer?.dispose()
  renderer = null
})
</script>

<template>
  <div
    ref="host"
    class="pie3d-three-shell"
    :style="shellStyle"
    @pointermove="onPointerMove"
    @pointerleave="resetHover"
  >
    <canvas ref="canvas" class="pie3d-three-canvas" />
    <div
      v-if="tooltip.visible"
      class="pie3d-three-tooltip"
      :style="tooltipStyle"
    >
      <div>{{ tooltip.name }}：{{ tooltip.value }} 台</div>
      <div>占比：{{ tooltip.percent }}%</div>
    </div>
  </div>
</template>

<style scoped>
.pie3d-three-shell {
  position: relative;
  width: 100%;
  overflow: visible;
}

.pie3d-three-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.pie3d-three-tooltip {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 4;
  min-width: 7.25rem;
  padding: 0.4375rem 0.625rem;
  border: 0.0625rem solid color-mix(in srgb, var(--pie-edge) 74%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--pie-surface) 72%, #020814);
  color: var(--pie-text);
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.45;
  pointer-events: none;
  white-space: nowrap;
}
</style>
