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

function makeRing(radius: number, width: number, color: THREE.Color, opacity: number): THREE.Mesh {
  const geometry = new THREE.RingGeometry(radius - width, radius, 160)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  return new THREE.Mesh(geometry, material)
}

function makeSegment(
  radius: number,
  angle: number,
  color: THREE.Color,
  opacity: number,
  length = 0.11,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(length, 0.014)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const segment = new THREE.Mesh(geometry, material)
  segment.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.012)
  segment.rotation.z = angle + Math.PI / 2
  return segment
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

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.2, -1.2, 0.1, 10)
  camera.position.set(0, 0, 4)

  baseGroup = new THREE.Group()
  baseGroup.scale.set(1.22, 0.38, 1)
  ringLayers = [
    makeLayer({ radius: 1.18, width: 0.018, color, opacity: 0.78, segmentCount: 36, speed: -0.0042 }),
    makeLayer({
      radius: 0.9,
      width: 0.014,
      color: secondary,
      opacity: 0.56,
      segmentCount: 28,
      speed: -0.0028,
      phase: 0.18,
    }),
    makeLayer({ radius: 0.62, width: 0.011, color, opacity: 0.42, segmentCount: 20, speed: -0.0035, phase: 0.32 }),
  ]
  ringLayers.forEach((layer) => baseGroup!.add(layer))

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 96),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.13 * props.density,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  baseGroup.add(glow)
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
