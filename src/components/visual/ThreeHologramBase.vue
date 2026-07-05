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
    tone: 'var(--accent)',
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
  speed: number
  phase?: number
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

function makeRing(radius: number, width: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - width, radius, 160)
  return new THREE.Mesh(geometry, makeMaterial(color, opacity))
}

function makeDisc(radius: number, color: THREE.Color, opacity: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.CircleGeometry(radius, 160), makeMaterial(color, opacity))
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
  gradient.addColorStop(0, 'rgba(255,255,255,0.86)')
  gradient.addColorStop(0.18, `rgba(${rgb},0.72)`)
  gradient.addColorStop(0.54, `rgba(${rgb},0.24)`)
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
  const lip = new THREE.Mesh(new THREE.ShapeGeometry(shape, 96), makeMaterial(color, opacity))
  lip.position.z = 0.035
  return lip
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

function makeStageTier(radius: number, color: THREE.Color, secondary: THREE.Color, opacity: number): THREE.Group {
  const tier = new THREE.Group()

  // 一层基座由半透明盘面、外圈亮边、前沿厚度组成；多层叠加后接近参考图的玻璃台阶。
  tier.add(makeDisc(radius, color, opacity * 0.22))
  tier.add(makeRing(radius, radius * 0.028, secondary, opacity * 0.92))
  tier.add(makeRing(radius * 0.78, radius * 0.018, color, opacity * 0.46))
  tier.add(makeRing(radius * 0.55, radius * 0.012, secondary, opacity * 0.28))
  tier.add(makeFrontLip(radius, secondary, opacity * 0.72))

  return tier
}

function makeLayer(opts: LayerOptions): THREE.Group {
  const { radius, width, color, opacity, segmentCount, speed, phase = 0 } = opts
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
  baseGroup.scale.set(1.24, 0.42, 1)

  const bottomTier = makeStageTier(1.26, deep, color, 0.5)
  bottomTier.position.y = -0.18
  baseGroup.add(bottomTier)

  const middleTier = makeStageTier(1.04, color, secondary, 0.72)
  middleTier.position.y = -0.04
  baseGroup.add(middleTier)

  const topTier = makeStageTier(0.78, secondary, secondary, 0.92)
  topTier.position.y = 0.09
  baseGroup.add(topTier)

  ringLayers = [
    makeLayer({ radius: 1.23, width: 0.014, color, opacity: 0.48, segmentCount: 32, speed: -0.0024 }),
    makeLayer({
      radius: 0.96,
      width: 0.012,
      color: secondary,
      opacity: 0.44,
      segmentCount: 24,
      speed: -0.0018,
      phase: 0.18,
    }),
    makeLayer({ radius: 0.68, width: 0.01, color, opacity: 0.32, segmentCount: 18, speed: -0.002, phase: 0.32 }),
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
