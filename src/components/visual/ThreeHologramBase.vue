<script setup lang="ts">
/**
 * 【已知优化项 / Three.js 多实例】
 * 当前每个 ThreeHologramBase 实例都创建独立的 WebGLRenderer + 独立的
 * requestAnimationFrame 渲染循环。大屏上同时存在多个实例(可用率环
 * MetricRing→HologramGauge、健康饼图底座),会占用多份 WebGL 上下文
 * 与多路 rAF,存在显存与 CPU 开销。
 *
 * 理想方案是“单 renderer 多视口”：由一个全局 WebGLRenderer 统一管理,
 * 每个实例只维护自己的 scene/camera,在统一 rAF 里按 viewport 依次 render。
 * 但该重构需重写本组件的创建/销毁/resize 生命周期，回归风险高。
 * 按“功能零回归”原则与重构计划 Task 8 的授权，暂保留现状，以此注释标注为已知优化项。
 */
import * as THREE from 'three'
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: string
    density?: number
  }>(),
  {
    tone: 'var(--data-ring)',
    density: 1,
  },
)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let baseGroup: THREE.Group | null = null
let ringLayers: THREE.Group[] = []
let frame = 0
let observer: ResizeObserver | null = null

function cssColorToThree(value: string): THREE.Color {
  if (!host.value) return new THREE.Color('#00a8ff')
  const probe = document.createElement('span')
  probe.style.color = value
  host.value.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return new THREE.Color(resolved || '#00a8ff')
}

interface LayerOptions {
  radius: number
  width: number
  color: THREE.Color
  opacity: number
  segmentCount: number
  particleCount?: number
  speed: number
  phase?: number
}

interface StageTierOptions {
  topCluster?: boolean
}

function rgba(color: THREE.Color, alpha: number): string {
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${alpha})`
}

function makeMaterial(color: THREE.Color, opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.density)),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

function makeGradientTexture(
  inner: THREE.Color,
  outer: THREE.Color,
  rim: THREE.Color,
  centerAlpha = 0.58,
): THREE.CanvasTexture {
  const size = 256
  const gradientCanvas = document.createElement('canvas')
  gradientCanvas.width = size
  gradientCanvas.height = size
  const ctx = gradientCanvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(gradientCanvas)

  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.08, size / 2, size / 2, size * 0.5)
  gradient.addColorStop(0, rgba(inner.clone().offsetHSL(0, 0, 0.22), centerAlpha))
  gradient.addColorStop(0.28, rgba(inner, 0.5))
  gradient.addColorStop(0.58, rgba(outer, 0.3))
  gradient.addColorStop(0.82, rgba(rim, 0.44))
  gradient.addColorStop(1, rgba(rim.clone().offsetHSL(0, 0, -0.16), 0.78))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const gloss = ctx.createLinearGradient(0, 0, 0, size)
  gloss.addColorStop(0, rgba(inner, 0.18))
  gloss.addColorStop(0.22, rgba(inner, 0.06))
  gloss.addColorStop(0.56, rgba(inner, 0))
  gloss.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = gloss
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(gradientCanvas)
  texture.needsUpdate = true
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeGradientMaterial(
  inner: THREE.Color,
  outer: THREE.Color,
  rim: THREE.Color,
  opacity: number,
  centerAlpha?: number,
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    map: makeGradientTexture(inner, outer, rim, centerAlpha),
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.density)),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

function makeVertexGradientMaterial(opacity: number): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.density)),
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

function makeGradientShape(
  shape: THREE.Shape,
  top: THREE.Color,
  middle: THREE.Color,
  bottom: THREE.Color,
  opacity: number,
  z: number,
): THREE.Mesh {
  const geometry = new THREE.ShapeGeometry(shape, 96)
  const position = geometry.getAttribute('position')
  let minY = Infinity
  let maxY = -Infinity

  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

  const colors: number[] = []
  const range = Math.max(0.001, maxY - minY)

  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i)
    const t = (y - minY) / range
    const color =
      t < 0.52
        ? bottom.clone().lerp(middle, t / 0.52)
        : middle.clone().lerp(top, (t - 0.52) / 0.48)
    colors.push(color.r, color.g, color.b)
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const mesh = new THREE.Mesh(geometry, makeVertexGradientMaterial(opacity))
  mesh.position.z = z
  return mesh
}

function makeRing(radius: number, width: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - width, radius, 160)
  return new THREE.Mesh(geometry, makeMaterial(color, opacity))
}

function makeGradientRing(
  radius: number,
  width: number,
  inner: THREE.Color,
  outer: THREE.Color,
  rim: THREE.Color,
  opacity: number,
): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - width, radius, 192)
  return new THREE.Mesh(geometry, makeGradientMaterial(inner, outer, rim, opacity, 0.76))
}

function makeDisc(radius: number, color: THREE.Color, opacity: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, 160), makeMaterial(color, opacity))
}

function makeGradientDisc(
  radius: number,
  inner: THREE.Color,
  outer: THREE.Color,
  rim: THREE.Color,
  opacity: number,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, 192), makeGradientMaterial(inner, outer, rim, opacity))
}

function makeGlowTexture(color: THREE.Color): THREE.CanvasTexture {
  const size = 256
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = size
  glowCanvas.height = size
  const ctx = glowCanvas.getContext('2d')
  if (!ctx) return new THREE.CanvasTexture(glowCanvas)

  const rgb = `${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}`
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, `rgba(${rgb},0.74)`)
  gradient.addColorStop(0.18, `rgba(${rgb},0.54)`)
  gradient.addColorStop(0.54, `rgba(${rgb},0.2)`)
  gradient.addColorStop(1, `rgba(${rgb},0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(glowCanvas)
  texture.needsUpdate = true
  return texture
}

function makeGlow(color: THREE.Color, scaleX: number, scaleY: number, opacity: number, y = -0.28): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: makeGlowTexture(color),
      transparent: true,
      opacity: Math.min(1, Math.max(0, opacity * props.density)),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  sprite.scale.set(scaleX, scaleY, 1)
  sprite.position.set(0, y, -0.04)
  return sprite
}

function makeFrontLip(radius: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const shape = new THREE.Shape()
  const topY = -radius * 0.18
  const bottomY = -radius * 0.31
  shape.moveTo(-radius * 0.94, topY)
  shape.bezierCurveTo(-radius * 0.64, -radius * 0.62, radius * 0.64, -radius * 0.62, radius * 0.94, topY)
  shape.lineTo(radius * 0.84, bottomY)
  shape.bezierCurveTo(radius * 0.54, -radius * 0.46, -radius * 0.54, -radius * 0.46, -radius * 0.84, bottomY)
  shape.closePath()
  return makeGradientShape(
    shape,
    color.clone().offsetHSL(0, 0.05, 0.2),
    color,
    color.clone().offsetHSL(0.02, -0.08, -0.32),
    opacity,
    0.035,
  )
}

function makeFrontLipShade(radius: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const shape = new THREE.Shape()
  const topY = -radius * 0.21
  const bottomY = -radius * 0.34
  shape.moveTo(-radius * 0.88, topY)
  shape.bezierCurveTo(-radius * 0.55, -radius * 0.52, radius * 0.55, -radius * 0.52, radius * 0.88, topY)
  shape.lineTo(radius * 0.74, bottomY)
  shape.bezierCurveTo(radius * 0.46, -radius * 0.42, -radius * 0.46, -radius * 0.42, -radius * 0.74, bottomY)
  shape.closePath()
  return makeGradientShape(
    shape,
    color.clone().offsetHSL(0, 0.02, 0.04),
    color.clone().offsetHSL(0, -0.02, -0.12),
    color.clone().offsetHSL(0.02, -0.08, -0.36),
    opacity,
    0.045,
  )
}

function makeSegment(
  radius: number,
  angle: number,
  color: THREE.Color,
  opacity: number,
  length = 0.11,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(length, 0.014)
  const segment = new THREE.Mesh(geometry, makeMaterial(color, opacity))
  segment.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.012)
  segment.rotation.z = angle + Math.PI / 2
  return segment
}

function makeParticle(radius: number, angle: number, color: THREE.Color, opacity: number, size: number): THREE.Mesh {
  const particle = new THREE.Mesh(new THREE.CircleGeometry(size, 18), makeMaterial(color, opacity))
  particle.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.11)
  return particle
}

function makeParticleLayer(
  radius: number,
  count: number,
  color: THREE.Color,
  secondary: THREE.Color,
  opacity: number,
  phase: number,
): THREE.Group {
  const particles = new THREE.Group()

  for (let i = 0; i < count; i += 1) {
    const angle = phase + (Math.PI * 2 * i) / count
    const jitter = Math.sin(i * 12.9898) * radius * 0.018
    const size = radius * (i % 5 === 0 ? 0.015 : 0.01)
    const particle = makeParticle(
      radius + jitter,
      angle,
      i % 3 === 0 ? secondary : color,
      opacity * (i % 4 === 0 ? 0.82 : 0.48),
      size,
    )
    particles.add(particle)
  }

  return particles
}

function makeTopRingCluster(radius: number, color: THREE.Color, secondary: THREE.Color, deep: THREE.Color): THREE.Group {
  const cluster = new THREE.Group()
  const topDeck = makeGradientDisc(radius * 0.72, secondary, color, deep, 0.24)
  topDeck.position.z = 0.048
  cluster.add(topDeck)

  const rings = [
    { radius: radius * 0.98, width: radius * 0.026, opacity: 0.92 },
    { radius: radius * 0.82, width: radius * 0.021, opacity: 0.68 },
    { radius: radius * 0.66, width: radius * 0.017, opacity: 0.56 },
    { radius: radius * 0.5, width: radius * 0.014, opacity: 0.44 },
    { radius: radius * 0.34, width: radius * 0.011, opacity: 0.34 },
  ]

  rings.forEach((ring, index) => {
    const mesh = makeGradientRing(ring.radius, ring.width, secondary, color, deep, ring.opacity)
    mesh.position.z = 0.062 + index * 0.006
    cluster.add(mesh)
  })

  for (let i = 0; i < 36; i += 1) {
    const angle = (Math.PI * 2 * i) / 36
    const radiusOffset = i % 2 === 0 ? radius * 0.88 : radius * 0.58
    const segment = makeSegment(radiusOffset, angle, i % 3 === 0 ? secondary : color, 0.34, i % 4 === 0 ? 0.12 : 0.07)
    segment.position.z = 0.098
    cluster.add(segment)
  }

  const center = makeGradientDisc(radius * 0.22, color.clone().offsetHSL(0, 0.08, 0.2), secondary, deep, 0.38)
  center.position.z = 0.108
  cluster.add(center)

  return cluster
}

function makeStageTier(
  radius: number,
  color: THREE.Color,
  secondary: THREE.Color,
  opacity: number,
  options: StageTierOptions = {},
): THREE.Group {
  const tier = new THREE.Group()
  const deep = color.clone().offsetHSL(0.02, -0.08, -0.28)

  // 一层基座由半透明盘面、外圈亮边、前沿厚度组成；多层叠加后接近参考图的玻璃台阶。
  const deck = makeGradientDisc(radius, color, secondary, deep, opacity * 0.56)
  deck.position.z = 0.006
  tier.add(deck)

  const outerRim = makeGradientRing(radius, radius * 0.04, secondary, color, deep, opacity * 1.1)
  outerRim.position.z = 0.032
  tier.add(outerRim)

  const upperStep = makeGradientRing(radius * 0.86, radius * 0.026, color, secondary, deep, opacity * 0.72)
  upperStep.position.z = 0.044
  tier.add(upperStep)

  const middleStep = makeGradientRing(radius * 0.66, radius * 0.019, secondary, color, deep, opacity * 0.5)
  middleStep.position.z = 0.056
  tier.add(middleStep)

  const innerStep = makeGradientRing(radius * 0.46, radius * 0.014, color, secondary, deep, opacity * 0.34)
  innerStep.position.z = 0.068
  tier.add(innerStep)

  tier.add(makeFrontLip(radius, secondary, opacity * 0.82))
  tier.add(makeFrontLipShade(radius, deep, opacity * 0.36))

  if (options.topCluster) {
    tier.add(makeTopRingCluster(radius, color, secondary, deep))
  }

  return tier
}

function makeLayer(opts: LayerOptions): THREE.Group {
  const { radius, width, color, opacity, segmentCount, particleCount = 0, speed, phase = 0 } = opts
  const secondary = color.clone().offsetHSL(0.05, 0.06, 0.1)
  const layer = new THREE.Group()
  layer.userData.speed = speed
  layer.add(makeRing(radius, width, color, opacity))
  layer.add(makeRing(radius - width * 3.2, width * 0.5, color, opacity * 0.48))

  // 短弧段让"环自身顺时针旋转"可见,避免整组扫线式旋转。
  for (let i = 0; i < segmentCount; i += 1) {
    const angle = phase + (Math.PI * 2 * i) / segmentCount
    const strong = i % 4 === 0
    layer.add(
      makeSegment(
        radius - width * 0.8,
        angle,
        color,
        strong ? opacity : opacity * 0.48,
        strong ? 0.14 : 0.08,
      ),
    )
  }

  if (particleCount > 0) {
    layer.add(makeParticleLayer(radius - width * 1.4, particleCount, color, secondary, opacity, phase + 0.11))
  }

  return layer
}

function buildScene() {
  const color = cssColorToThree(props.tone)
  const secondary = color.clone().offsetHSL(0.08, 0.1, 0.12)
  const deep = color.clone().offsetHSL(0.02, -0.04, -0.16)

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.2, -1.2, 0.1, 10)
  camera.position.set(0, 0, 4)

  baseGroup = new THREE.Group()
  baseGroup.position.set(0, -0.08, 0)
  baseGroup.scale.set(1.24, 0.46, 1)

  const bottomTier = makeStageTier(1.34, deep, color, 0.42)
  bottomTier.position.y = -0.25
  baseGroup.add(bottomTier)

  const lowerTier = makeStageTier(1.16, deep.clone().lerp(color, 0.58), color, 0.58)
  lowerTier.position.y = -0.12
  baseGroup.add(lowerTier)

  const middleTier = makeStageTier(0.98, color, secondary, 0.76)
  middleTier.position.y = 0.02
  baseGroup.add(middleTier)

  const topTier = makeStageTier(0.76, secondary, secondary.clone().offsetHSL(0.03, 0.06, 0.08), 0.96, { topCluster: true })
  topTier.position.y = 0.15
  baseGroup.add(topTier)

  ringLayers = [
    makeLayer({
      radius: 1.3,
      width: 0.014,
      color,
      opacity: 0.42,
      segmentCount: 36,
      particleCount: 28,
      speed: -0.0024,
    }),
    makeLayer({
      radius: 1.04,
      width: 0.012,
      color: secondary,
      opacity: 0.44,
      segmentCount: 24,
      particleCount: 22,
      speed: 0.002,
      phase: 0.18,
    }),
    makeLayer({
      radius: 0.72,
      width: 0.01,
      color,
      opacity: 0.3,
      segmentCount: 18,
      particleCount: 16,
      speed: -0.0017,
      phase: 0.32,
    }),
  ]
  ringLayers.forEach((layer) => baseGroup!.add(layer))

  baseGroup.add(makeDisc(0.54, secondary, 0.2))
  scene.add(makeGlow(color, 2.9, 0.72, 0.38, -0.22))
  scene.add(makeGlow(secondary, 1.5, 0.34, 0.5, -0.02))
  scene.add(baseGroup)
}

function resize() {
  if (!host.value || !renderer) return
  const rect = host.value.getBoundingClientRect()
  const width = Math.max(1, Math.floor(rect.width))
  const height = Math.max(1, Math.floor(rect.height))
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
  renderer.setSize(width, height, false)
}

function animate() {
  if (!renderer || !scene || !camera || !baseGroup) return
  ringLayers.forEach((layer) => {
    layer.rotation.z += layer.userData.speed as number
  })
  renderer.render(scene, camera)
  frame = requestAnimationFrame(animate)
}

function mountScene() {
  if (!canvas.value) return
  renderer?.dispose()
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true,
  })
  renderer.setClearAlpha(0)
  buildScene()
  resize()
  animate()
}

onMounted(() => {
  mountScene()
  observer = new ResizeObserver(resize)
  if (host.value) observer.observe(host.value)
})

watch(
  () => [props.tone, props.density],
  () => {
    cancelAnimationFrame(frame)
    mountScene()
  },
)

onUnmounted(() => {
  cancelAnimationFrame(frame)
  observer?.disconnect()
  renderer?.dispose()
})
</script>

<template>
  <div ref="host" class="three-hologram-base" aria-hidden="true">
    <canvas ref="canvas" />
  </div>
</template>
