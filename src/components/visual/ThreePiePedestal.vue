<script setup lang="ts">
import * as THREE from 'three'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: string
    accent?: string
    intensity?: number
  }>(),
  {
    color: 'var(--accent)',
    accent: 'var(--accent-2)',
    intensity: 1,
  },
)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let rootGroup: THREE.Group | null = null
let observer: ResizeObserver | null = null

function cssColorToThree(value: string, fallback = '#00a8ff'): THREE.Color {
  if (!host.value) return new THREE.Color(fallback)
  const probe = document.createElement('span')
  probe.style.color = value
  host.value.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return new THREE.Color(resolved || fallback)
}

function disposeScene() {
  scene?.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose?.()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose())
    } else {
      material?.dispose?.()
    }
  })
}

function makeMaterial(color: THREE.Color, opacity: number, depthWrite = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.intensity)),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite,
  })
}

function makeGlowTexture(color: THREE.Color): THREE.CanvasTexture {
  const size = 256
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = size
  glowCanvas.height = size
  const ctx = glowCanvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(glowCanvas)
  const rgb = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, rgb.replace('rgb', 'rgba').replace(')', ',0.68)'))
  gradient.addColorStop(0.2, rgb.replace('rgb', 'rgba').replace(')', ',0.52)'))
  gradient.addColorStop(0.58, rgb.replace('rgb', 'rgba').replace(')', ',0.18)'))
  gradient.addColorStop(1, rgb.replace('rgb', 'rgba').replace(')', ',0)'))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(glowCanvas)
  texture.needsUpdate = true
  return texture
}

function makeGlow(color: THREE.Color, xScale: number, yScale: number, opacity: number, y = -0.2): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: makeGlowTexture(color),
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.intensity)),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(xScale, yScale, 1)
  sprite.position.set(0, y, -0.05)
  return sprite
}

function makeEllipseRing(rx: number, ry: number, width: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const shape = new THREE.Shape()
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(0, 0, Math.max(0.01, rx - width), Math.max(0.01, ry - width * 0.42), 0, Math.PI * 2, true, 0)
  shape.holes.push(hole)
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 96), makeMaterial(color, opacity))
  mesh.position.z = 0.03
  return mesh
}

function makeFrontLip(rx: number, ry: number, y: number, color: THREE.Color, opacity: number, z: number): THREE.Mesh {
  const lipDepth = Math.max(0.018, ry * 0.12)
  const shape = new THREE.Shape()
  shape.moveTo(-rx * 0.92, y - ry * 0.34)
  shape.bezierCurveTo(-rx * 0.62, y - ry * 0.84, rx * 0.62, y - ry * 0.84, rx * 0.92, y - ry * 0.34)
  shape.lineTo(rx * 0.82, y - ry * 0.34 - lipDepth)
  shape.bezierCurveTo(rx * 0.54, y - ry * 0.7 - lipDepth, -rx * 0.54, y - ry * 0.7 - lipDepth, -rx * 0.82, y - ry * 0.34 - lipDepth)
  shape.closePath()
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 72), makeMaterial(color, opacity))
  mesh.position.z = z
  return mesh
}

function makeEllipseDisc(rx: number, ry: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const shape = new THREE.Shape()
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0)
  return new THREE.Mesh(new THREE.ShapeGeometry(shape, 128), makeMaterial(color, opacity))
}

function makeShape(points: (number | 'c')[], color: THREE.Color, opacity: number): THREE.Mesh {
  const shape = new THREE.Shape()
  let i = 0
  shape.moveTo(points[i] as number, points[i + 1] as number)
  i += 2
  while (i < points.length) {
    if (points[i] === 'c') {
      shape.bezierCurveTo(
        points[i + 1] as number,
        points[i + 2] as number,
        points[i + 3] as number,
        points[i + 4] as number,
        points[i + 5] as number,
        points[i + 6] as number,
      )
      i += 7
    } else {
      shape.lineTo(points[i] as number, points[i + 1] as number)
      i += 2
    }
  }
  shape.closePath()
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 64), makeMaterial(color, opacity))
  mesh.position.z = 0.01
  return mesh
}

interface StepTierOptions {
  rx: number
  ry: number
  y: number
  depth: number
  color: THREE.Color
  rim: THREE.Color
  topOpacity: number
  wallOpacity: number
  rimOpacity: number
  z: number
}

function makeStepTier(opts: StepTierOptions): THREE.Group {
  const { rx, ry, y, depth, color, rim, topOpacity, wallOpacity, rimOpacity, z } = opts
  const group = new THREE.Group()

  // 每层台阶由“顶面 + 前沿厚度 + 外沿亮边”构成，避免再出现独立扫线。
  const wall = makeShape(
    [-rx, y, 'c', -rx * 0.72, y - ry * 0.92, rx * 0.72, y - ry * 0.92, rx, y, rx, y - depth, 'c', rx * 0.7, y - depth - ry * 0.74, -rx * 0.7, y - depth - ry * 0.74, -rx, y - depth],
    color,
    wallOpacity,
  )
  wall.position.z = z
  group.add(wall)

  const top = makeEllipseDisc(rx, ry, color, topOpacity)
  top.position.set(0, y, z + 0.02)
  group.add(top)

  const rimMesh = makeEllipseRing(rx, ry, Math.max(0.018, ry * 0.16), rim, rimOpacity)
  rimMesh.position.set(0, y, z + 0.04)
  group.add(rimMesh)

  const lip = makeFrontLip(rx, ry, y, rim, rimOpacity * 0.72, z + 0.07)
  group.add(lip)

  return group
}

function buildScene() {
  const baseColor = cssColorToThree(props.color)
  const accentColor = cssColorToThree(props.accent, '#54e8ff')
  const bottomColor = baseColor.clone().offsetHSL(0.02, -0.04, -0.1)
  const middleColor = baseColor.clone().offsetHSL(0.04, 0.02, 0.02)
  const topColor = accentColor.clone().offsetHSL(0.02, 0.08, 0.14)

  disposeScene()
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-2.35, 2.35, 1.12, -1.12, 0.1, 10)
  camera.position.set(0, 0, 5)

  rootGroup = new THREE.Group()
  rootGroup.position.set(0, -0.06, 0)

  rootGroup.add(makeGlow(accentColor, 3.35, 0.64, 0.18, -0.53))
  rootGroup.add(makeGlow(baseColor, 4.25, 0.8, 0.08, -0.56))

  rootGroup.add(
    makeStepTier({
      rx: 2.16,
      ry: 0.46,
      y: -0.56,
      depth: 0.2,
      color: bottomColor,
      rim: baseColor,
      topOpacity: 0.04,
      wallOpacity: 0.08,
      rimOpacity: 0.11,
      z: 0,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.8,
      ry: 0.38,
      y: -0.41,
      depth: 0.18,
      color: baseColor,
      rim: baseColor,
      topOpacity: 0.08,
      wallOpacity: 0.13,
      rimOpacity: 0.22,
      z: 0.05,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.44,
      ry: 0.31,
      y: -0.27,
      depth: 0.15,
      color: middleColor,
      rim: accentColor,
      topOpacity: 0.19,
      wallOpacity: 0.22,
      rimOpacity: 0.48,
      z: 0.1,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.16,
      ry: 0.25,
      y: -0.15,
      depth: 0.12,
      color: topColor,
      rim: accentColor,
      topOpacity: 0.48,
      wallOpacity: 0.42,
      rimOpacity: 1,
      z: 0.15,
    }),
  )

  const outerSweep = makeEllipseRing(2.12, 0.45, 0.028, accentColor, 0.44)
  outerSweep.position.set(0, -0.53, 0.24)
  rootGroup.add(outerSweep)

  const middleSweep = makeEllipseRing(1.58, 0.34, 0.022, baseColor, 0.38)
  middleSweep.position.set(0, -0.36, 0.26)
  rootGroup.add(middleSweep)

  const topSweep = makeEllipseRing(1.04, 0.22, 0.018, accentColor, 0.66)
  topSweep.position.set(0, -0.16, 0.28)
  rootGroup.add(topSweep)

  const topGlow = makeGlow(accentColor, 1.48, 0.27, 1, -0.17)
  topGlow.position.z = 0.22
  rootGroup.add(topGlow)

  scene.add(rootGroup)
}

function resize() {
  if (!host.value || !renderer) return
  const rect = host.value.getBoundingClientRect()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
  renderer.setSize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)), false)
  renderScene()
}

function renderScene() {
  if (!renderer || !scene || !camera) return
  renderer.render(scene, camera)
}

function mountScene() {
  if (!canvas.value) return
  renderer?.dispose()
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  })
  renderer.setClearAlpha(0)
  buildScene()
  resize()
  renderScene()
}

onMounted(() => {
  mountScene()
  observer = new ResizeObserver(resize)
  if (host.value) observer.observe(host.value)
})

watch(
  () => [props.color, props.accent, props.intensity],
  () => mountScene(),
)

onUnmounted(() => {
  observer?.disconnect()
  disposeScene()
  renderer?.dispose()
})
</script>

<template>
  <div ref="host" class="three-pie-pedestal" aria-hidden="true">
    <canvas ref="canvas" />
  </div>
</template>

<style scoped>
.three-pie-pedestal {
  overflow: visible;
  pointer-events: none;
}

.three-pie-pedestal canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
