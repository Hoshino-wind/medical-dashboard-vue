<script setup lang="ts">
import * as THREE from 'three'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { buildPie3DSegments, type Pie3DInputItem, type Pie3DSegment } from '@/utils/pie3dSegments'
import { pxToRem } from '@/utils/rem'

const TAU = Math.PI * 2
const START_ANGLE = -Math.PI / 2
const OUTER_RADIUS = 1
const INNER_RADIUS = 0.42
const CAMERA_BASE_SIZE = 1.05
const MAX_PIXEL_RATIO = 1.6

const props = withDefaults(
  defineProps<{
    items: Pie3DInputItem[]
    height?: string
    thickness?: number
  }>(),
  {
    height: pxToRem(150),
    thickness: 8,
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

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let rootGroup: THREE.Group | null = null
let observer: ResizeObserver | null = null
let hoveredGroup: THREE.Group | null = null
let segmentMeshes: SegmentMesh[] = []

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function pieDepth(): number {
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

function resolveColor(value: string, fallback = '#20f1d4'): THREE.Color {
  try {
    return new THREE.Color(value)
  } catch {
    return new THREE.Color(fallback)
  }
}

function makeAnnularSectorGeometry(start: number, end: number, depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(Math.cos(start) * OUTER_RADIUS, Math.sin(start) * OUTER_RADIUS)
  shape.absarc(0, 0, OUTER_RADIUS, start, end, false)
  shape.lineTo(Math.cos(end) * INNER_RADIUS, Math.sin(end) * INNER_RADIUS)
  shape.absarc(0, 0, INNER_RADIUS, end, start, true)
  shape.closePath()

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

function makeSegmentGroup(segment: Pie3DSegment, depth: number, gap: number): THREE.Group {
  const start = START_ANGLE + segment.startRatio * TAU + gap
  const end = START_ANGLE + segment.endRatio * TAU - gap
  const midAngle = (start + end) / 2
  const color = resolveColor(segment.color)
  const sideColor = color.clone().multiplyScalar(0.55)
  const rimColor = color.clone().offsetHSL(0, 0.04, 0.18)
  const geometry = makeAnnularSectorGeometry(start, Math.max(start + 0.01, end), depth)

  const mesh = new THREE.Mesh(geometry, [
    new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.16),
      metalness: 0.22,
      roughness: 0.34,
      transparent: true,
      opacity: 0.98,
    }),
    new THREE.MeshStandardMaterial({
      color: sideColor,
      emissive: color.clone().multiplyScalar(0.06),
      metalness: 0.12,
      roughness: 0.44,
      transparent: true,
      opacity: 0.96,
    }),
  ]) as unknown as SegmentMesh

  const group = new THREE.Group()
  mesh.userData = { group, midAngle, segment }
  segmentMeshes.push(mesh)

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 24)
  const edges = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.18,
    }),
  )

  const innerGlowGeometry = new THREE.RingGeometry(INNER_RADIUS * 0.94, INNER_RADIUS * 1.02, 96, 1, start, end - start)
  const innerGlow = new THREE.Mesh(
    innerGlowGeometry,
    new THREE.MeshBasicMaterial({
      color: rimColor,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  )
  innerGlow.position.z = depth / 2 + 0.012

  group.userData = { midAngle }
  group.add(mesh, edges, innerGlow)
  return group
}

function makeCenterCap(depth: number): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(INNER_RADIUS * 0.82, INNER_RADIUS * 0.9, depth * 0.92, 96)
  geometry.rotateX(Math.PI / 2)
  const material = new THREE.MeshStandardMaterial({
    color: '#123e63',
    emissive: '#0a8fb7',
    emissiveIntensity: 0.28,
    metalness: 0.34,
    roughness: 0.28,
    transparent: true,
    opacity: 0.74,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.z = 0.018
  return mesh
}

function makeFloorShadow(depth: number): THREE.Mesh {
  const geometry = new THREE.CircleGeometry(1.18, 128)
  const material = new THREE.MeshBasicMaterial({
    color: '#20f1d4',
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
  })
  const shadow = new THREE.Mesh(geometry, material)
  shadow.position.z = -depth / 2 - 0.055
  shadow.scale.set(1.24, 0.62, 1)
  return shadow
}

function buildScene() {
  disposeScene()

  const depth = pieDepth()
  const segments = buildPie3DSegments(props.items)
  const gap = segments.length > 1 ? 0.014 : 0

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.05, -1.05, 0.1, 20)
  camera.position.set(0, -2.65, 2.05)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.AmbientLight('#ffffff', 1.25))

  const keyLight = new THREE.DirectionalLight('#ffffff', 2.4)
  keyLight.position.set(-1.5, -2.6, 3.2)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight('#53fff0', 1.75)
  rimLight.position.set(2.4, 1.8, 2.4)
  scene.add(rimLight)

  const frontLight = new THREE.PointLight('#4defff', 1.25, 6)
  frontLight.position.set(0, -1.5, 1.2)
  scene.add(frontLight)

  rootGroup = new THREE.Group()
  rootGroup.rotation.z = -0.12
  rootGroup.scale.set(1.04, 1.04, 1)
  rootGroup.add(makeFloorShadow(depth))

  if (segments.length === 0) {
    rootGroup.add(
      makeSegmentGroup(
        { name: '暂无数据', value: 1, color: '#265d85', startRatio: 0, endRatio: 1 },
        depth,
        0,
      ),
    )
  } else {
    segments.forEach((segment) => rootGroup?.add(makeSegmentGroup(segment, depth, gap)))
  }

  rootGroup.add(makeCenterCap(depth))
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

function mountScene() {
  ensureRenderer()
  if (!renderer) return
  tooltip.visible = false
  buildScene()
  resize()
  renderScene()
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
    mountScene()
    observer = new ResizeObserver(resize)
    if (host.value) observer.observe(host.value)
  })
})

watch(
  () => [props.items, props.thickness],
  () => nextTick(mountScene),
  { deep: true },
)

onUnmounted(() => {
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
    :style="{ height }"
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
  border: 0.0625rem solid rgba(32, 241, 212, 0.58);
  border-radius: 0.5rem;
  background: rgba(6, 20, 48, 0.92);
  box-shadow: 0 0.375rem 1.25rem rgba(0, 120, 220, 0.35);
  color: #eaf6ff;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1.45;
  pointer-events: none;
  white-space: nowrap;
}
</style>
