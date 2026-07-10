<script setup lang="ts">
import * as THREE from 'three'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import HologramLightCurtain from './HologramLightCurtain.vue'

const props = withDefaults(
  defineProps<{
    color?: string
    accent?: string
    intensity?: number
    variant?: 'webgl' | 'compact'
    labelDeck?: boolean
    curtainVariant?: 'cylinder' | 'fan'
  }>(),
  {
    color: 'var(--instrument-base)',
    accent: 'var(--data-pie-primary)',
    intensity: 1,
    variant: 'webgl',
    labelDeck: false,
    curtainVariant: 'fan',
  },
)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
let rootGroup: THREE.Group | null = null
let observer: ResizeObserver | null = null

const hostStyle = computed(() => ({
  '--pedestal-color': props.color,
  '--pedestal-accent': props.accent,
  '--pedestal-intensity': props.intensity,
  '--hologram-curtain-tone': props.accent,
  '--hologram-curtain-highlight': 'var(--instrument-rim)',
  '--hologram-curtain-opacity': 0.58 * props.intensity,
}))

function cssColorToThree(value: string, fallback = '#00a8ff'): THREE.Color {
  if (!host.value) return new THREE.Color(fallback)
  const probe = document.createElement('span')
  probe.style.color = value
  host.value.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  probe.remove()
  return new THREE.Color(resolved || fallback)
}

function usesLightSurface(): boolean {
  return host.value?.closest('[data-theme-mode="light"]') !== null
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

function makeMaterial(
  color: THREE.Color,
  opacity: number,
  depthWrite = false,
): THREE.MeshBasicMaterial {
  const lightSurface = usesLightSurface()
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.intensity)),
    side: THREE.DoubleSide,
    blending: lightSurface ? THREE.NormalBlending : THREE.AdditiveBlending,
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

function makeGlow(
  color: THREE.Color,
  xScale: number,
  yScale: number,
  opacity: number,
  y = -0.2,
): THREE.Sprite {
  const lightSurface = usesLightSurface()
  const material = new THREE.SpriteMaterial({
    map: makeGlowTexture(color),
    transparent: true,
    opacity: Math.min(1, Math.max(0, opacity * props.intensity)),
    blending: lightSurface ? THREE.NormalBlending : THREE.AdditiveBlending,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(xScale, yScale, 1)
  sprite.position.set(0, y, -0.05)
  return sprite
}

function makeEllipseRing(
  rx: number,
  ry: number,
  width: number,
  color: THREE.Color,
  opacity: number,
): THREE.Mesh {
  const shape = new THREE.Shape()
  shape.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(
    0,
    0,
    Math.max(0.01, rx - width),
    Math.max(0.01, ry - width * 0.42),
    0,
    Math.PI * 2,
    true,
    0,
  )
  shape.holes.push(hole)
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 96), makeMaterial(color, opacity))
  mesh.position.z = 0.03
  return mesh
}

function makeFrontLip(
  rx: number,
  ry: number,
  y: number,
  color: THREE.Color,
  opacity: number,
  z: number,
): THREE.Mesh {
  const lipDepth = Math.max(0.018, ry * 0.12)
  const shape = new THREE.Shape()
  shape.moveTo(-rx * 0.92, y - ry * 0.34)
  shape.bezierCurveTo(-rx * 0.62, y - ry * 0.84, rx * 0.62, y - ry * 0.84, rx * 0.92, y - ry * 0.34)
  shape.lineTo(rx * 0.82, y - ry * 0.34 - lipDepth)
  shape.bezierCurveTo(
    rx * 0.54,
    y - ry * 0.7 - lipDepth,
    -rx * 0.54,
    y - ry * 0.7 - lipDepth,
    -rx * 0.82,
    y - ry * 0.34 - lipDepth,
  )
  shape.closePath()
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 72), makeMaterial(color, opacity))
  mesh.position.z = z
  return mesh
}

function makeInstrumentMarker(
  x: number,
  y: number,
  width: number,
  height: number,
  color: THREE.Color,
  opacity: number,
  z: number,
): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    makeMaterial(color, opacity),
  )
  marker.position.set(x, y, z)
  return marker
}

function makePedestalTick(
  rx: number,
  ry: number,
  centerY: number,
  angle: number,
  color: THREE.Color,
  opacity: number,
  z: number,
): THREE.Mesh {
  const tick = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.016), makeMaterial(color, opacity))
  tick.position.set(Math.cos(angle) * rx, centerY + Math.sin(angle) * ry, z)
  tick.rotation.z = Math.atan2(ry * Math.cos(angle), -rx * Math.sin(angle))
  return tick
}

function makeTickBand(
  rx: number,
  ry: number,
  centerY: number,
  count: number,
  color: THREE.Color,
  accent: THREE.Color,
  opacity: number,
  z: number,
): THREE.Group {
  const group = new THREE.Group()

  for (let i = 0; i < count; i += 1) {
    if (i % 3 === 1) continue
    const angle = (Math.PI * 2 * i) / count
    const tick = makePedestalTick(rx, ry, centerY, angle, i % 5 === 0 ? accent : color, opacity, z)
    tick.scale.x = i % 5 === 0 ? 1.28 : 0.78
    group.add(tick)
  }

  return group
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
    [
      -rx,
      y,
      'c',
      -rx * 0.72,
      y - ry * 0.92,
      rx * 0.72,
      y - ry * 0.92,
      rx,
      y,
      rx,
      y - depth,
      'c',
      rx * 0.7,
      y - depth - ry * 0.74,
      -rx * 0.7,
      y - depth - ry * 0.74,
      -rx,
      y - depth,
    ],
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
  const rimColor = cssColorToThree('var(--instrument-base-rim)', '#d7fbff')
  const bottomColor = baseColor.clone().offsetHSL(0.02, -0.05, -0.14)
  const middleColor = baseColor.clone().lerp(rimColor, 0.22)
  const topColor = accentColor.clone().offsetHSL(0.02, 0.08, 0.16)
  const tier = props.labelDeck
    ? {
        bottomY: -0.62,
        middleY: -0.47,
        upperY: -0.38,
        topY: 0.12,
        upperSweepY: -0.39,
        topSweepY: 0.08,
        centerDeckY: 0.08,
        topGlowY: 0.06,
      }
    : {
        bottomY: -0.58,
        middleY: -0.42,
        upperY: -0.27,
        topY: -0.14,
        upperSweepY: -0.34,
        topSweepY: -0.15,
        centerDeckY: -0.14,
        topGlowY: -0.16,
      }

  disposeScene()
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(-2.35, 2.35, 1.12, -1.12, 0.1, 10)
  camera.position.set(0, 0, 5)

  rootGroup = new THREE.Group()
  rootGroup.position.set(0, -0.02, 0)

  rootGroup.add(makeGlow(accentColor, 3.85, 0.72, 0.18, -0.54))
  rootGroup.add(makeGlow(baseColor, 4.7, 0.92, 0.1, -0.58))
  rootGroup.add(makeInstrumentMarker(0, -0.16, 0.035, 0.78, accentColor, 0.18, 0.01))

  rootGroup.add(
    makeStepTier({
      rx: 2.26,
      ry: 0.48,
      y: tier.bottomY,
      depth: 0.24,
      color: bottomColor,
      rim: rimColor,
      topOpacity: 0.08,
      wallOpacity: 0.16,
      rimOpacity: 0.24,
      z: 0,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.9,
      ry: 0.4,
      y: tier.middleY,
      depth: 0.21,
      color: baseColor,
      rim: rimColor,
      topOpacity: 0.14,
      wallOpacity: 0.22,
      rimOpacity: 0.38,
      z: 0.05,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.5,
      ry: 0.32,
      y: tier.upperY,
      depth: 0.17,
      color: middleColor,
      rim: accentColor,
      topOpacity: 0.28,
      wallOpacity: 0.34,
      rimOpacity: 0.68,
      z: 0.1,
    }),
  )
  rootGroup.add(
    makeStepTier({
      rx: 1.13,
      ry: 0.24,
      y: tier.topY,
      depth: 0.13,
      color: topColor,
      rim: accentColor,
      topOpacity: 0.62,
      wallOpacity: 0.5,
      rimOpacity: 1,
      z: 0.15,
    }),
  )

  rootGroup.add(makeTickBand(2.06, 0.42, tier.bottomY + 0.04, 42, rimColor, accentColor, 0.32, 0.28))
  rootGroup.add(makeTickBand(1.5, 0.31, tier.upperY, 30, baseColor, accentColor, 0.34, 0.3))
  rootGroup.add(makeInstrumentMarker(-2.1, -0.49, 0.26, 0.035, accentColor, 0.48, 0.34))
  rootGroup.add(makeInstrumentMarker(2.1, -0.49, 0.26, 0.035, accentColor, 0.48, 0.34))
  rootGroup.add(makeInstrumentMarker(-1.56, -0.24, 0.18, 0.026, rimColor, 0.36, 0.35))
  rootGroup.add(makeInstrumentMarker(1.56, -0.24, 0.18, 0.026, rimColor, 0.36, 0.35))

  const outerSweep = makeEllipseRing(2.13, 0.45, 0.03, accentColor, 0.54)
  outerSweep.position.set(0, -0.54, 0.36)
  rootGroup.add(outerSweep)

  const middleSweep = makeEllipseRing(1.62, 0.34, 0.024, rimColor, 0.42)
  middleSweep.position.set(0, tier.upperSweepY, 0.38)
  rootGroup.add(middleSweep)

  const topSweep = makeEllipseRing(1.02, 0.22, 0.02, accentColor, 0.82)
  topSweep.position.set(0, tier.topSweepY, 0.4)
  rootGroup.add(topSweep)

  const centerDeck = makeEllipseDisc(0.64, 0.16, baseColor, 0.22)
  centerDeck.position.set(0, tier.centerDeckY, 0.37)
  rootGroup.add(centerDeck)

  const topGlow = makeGlow(accentColor, 1.55, 0.3, 0.92, tier.topGlowY)
  topGlow.position.z = 0.42
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

function supportsWebGL(): boolean {
  return Boolean(
    canvas.value &&
    typeof window !== 'undefined' &&
    ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window),
  )
}

function mountScene() {
  if (props.variant === 'compact') {
    disposeScene()
    renderer?.dispose()
    renderer = null
    return
  }

  if (!canvas.value || !supportsWebGL()) return
  renderer?.dispose()

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
  } catch {
    renderer = null
    return
  }

  renderer.setClearAlpha(0)
  buildScene()
  resize()
  renderScene()
}

onMounted(() => {
  mountScene()
  if (props.variant !== 'compact' && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(resize)
    if (host.value) observer.observe(host.value)
  }
})

watch(
  () => [props.color, props.accent, props.intensity, props.variant, props.labelDeck],
  () => mountScene(),
)

onUnmounted(() => {
  observer?.disconnect()
  disposeScene()
  renderer?.dispose()
})
</script>

<template>
  <div
    ref="host"
    class="three-pie-pedestal"
    :class="`three-pie-pedestal--${props.variant}`"
    :style="hostStyle"
    aria-hidden="true"
  >
    <HologramLightCurtain :variant="curtainVariant" />
    <span class="pedestal-orbit-overlay" aria-hidden="true"></span>
    <template v-if="props.variant === 'compact'">
      <span class="pedestal-compact-glow"></span>
      <span class="pedestal-compact-shadow"></span>
      <span class="pedestal-compact-tier pedestal-compact-tier--bottom"></span>
      <span class="pedestal-compact-tier pedestal-compact-tier--middle"></span>
      <span class="pedestal-compact-tier pedestal-compact-tier--top"></span>
      <span class="pedestal-compact-ring"></span>
    </template>
    <canvas v-else ref="canvas" />
  </div>
</template>

<style scoped>
.three-pie-pedestal {
  overflow: visible;
  pointer-events: none;
}

.pedestal-orbit-overlay {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 24%;
  width: 92%;
  height: 42%;
  overflow: hidden;
  border: 0.0625rem dashed color-mix(in srgb, var(--pedestal-accent) 56%, transparent);
  border-radius: 50%;
  opacity: calc(0.44 * var(--pedestal-intensity, 1));
  transform: translateX(-50%) perspective(14rem) rotateX(66deg);
}

.pedestal-orbit-overlay::after {
  content: '';
  position: absolute;
  top: -18%;
  bottom: -18%;
  left: -34%;
  width: 34%;
  background: linear-gradient(
    90deg,
    transparent 0,
    color-mix(in srgb, var(--instrument-rim) 24%, transparent) 28%,
    color-mix(in srgb, var(--pedestal-accent) 76%, transparent) 54%,
    color-mix(in srgb, var(--instrument-rim) 34%, transparent) 72%,
    transparent 100%
  );
  opacity: 0.08;
  transform: translate3d(0, 0, 0);
  animation: pedestal-orbit-trace-sweep var(--motion-loop-instrument) linear infinite;
  animation-delay: calc(var(--motion-phase, 0s) - 1.6s);
}

.three-pie-pedestal canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.three-pie-pedestal--compact {
  opacity: calc(0.96 * var(--pedestal-intensity, 1));
}

.pedestal-compact-glow,
.pedestal-compact-shadow,
.pedestal-compact-tier,
.pedestal-compact-ring {
  position: absolute;
  left: 50%;
  border-radius: 50%;
  transform: translateX(-50%) perspective(14rem) rotateX(66deg);
  pointer-events: none;
}

.pedestal-compact-glow {
  top: -8%;
  width: 78%;
  height: 46%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, var(--pedestal-accent) 42%, transparent),
    transparent 68%
  );
  opacity: 0.46;
}

.pedestal-compact-shadow {
  top: 58%;
  width: 108%;
  height: 34%;
  background: radial-gradient(
    ellipse at center,
    color-mix(in srgb, #000 54%, transparent),
    transparent 72%
  );
  opacity: 0.7;
}

.pedestal-compact-tier {
  border: 0.0625rem solid color-mix(in srgb, var(--instrument-base-rim) 46%, transparent);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--instrument-rim) 22%, transparent),
      color-mix(in srgb, var(--pedestal-color) 50%, transparent) 48%,
      color-mix(in srgb, #010914 28%, transparent)
    ),
    radial-gradient(
      ellipse at 50% 18%,
      color-mix(in srgb, var(--instrument-base-rim) 30%, transparent),
      transparent 58%
    ),
    radial-gradient(
      ellipse at 50% 78%,
      color-mix(in srgb, var(--pedestal-accent) 18%, transparent),
      transparent 70%
    );
  box-shadow:
    inset 0 0.0625rem 0 color-mix(in srgb, var(--instrument-rim) 26%, transparent),
    inset 0 -0.34rem 0.46rem color-mix(in srgb, #000 24%, transparent);
}

.pedestal-compact-tier::after {
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -14%;
  height: 40%;
  border-radius: 50%;
  border-bottom: 0.0625rem solid color-mix(in srgb, var(--instrument-base-rim) 38%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--instrument-base-rim) 14%, transparent),
    color-mix(in srgb, #010914 34%, transparent)
  );
  opacity: 0.78;
}

.pedestal-compact-tier--bottom {
  top: 42%;
  width: 96%;
  height: 45%;
  opacity: 0.86;
}

.pedestal-compact-tier--middle {
  top: 25%;
  width: 72%;
  height: 39%;
  opacity: 0.94;
}

.pedestal-compact-tier--top {
  top: 10%;
  width: 50%;
  height: 31%;
  border-color: color-mix(in srgb, var(--pedestal-accent) 56%, var(--instrument-base-rim) 20%);
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--instrument-rim) 32%, transparent),
      color-mix(in srgb, var(--pedestal-color) 42%, transparent) 52%,
      color-mix(in srgb, #010914 18%, transparent)
    ),
    radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--pedestal-accent) 38%, transparent),
      transparent 70%
    );
}

.pedestal-compact-ring {
  top: 15%;
  width: 82%;
  height: 45%;
  border: 0.0625rem solid color-mix(in srgb, var(--instrument-base-rim) 38%, transparent);
  background: conic-gradient(
    from 18deg,
    transparent 0 12%,
    color-mix(in srgb, var(--instrument-rim) 62%, transparent) 12% 15%,
    transparent 15% 48%,
    color-mix(in srgb, var(--pedestal-accent) 50%, transparent) 48% 54%,
    transparent 54% 76%,
    color-mix(in srgb, var(--instrument-base-rim) 36%, transparent) 76% 79%,
    transparent 79% 100%
  );
  opacity: 0.48;
}

@keyframes pedestal-orbit-trace-sweep {
  0% {
    opacity: 0.08;
    transform: translate3d(0, 0, 0);
  }

  12%,
  88% {
    opacity: 0.72;
  }

  100% {
    opacity: 0.08;
    transform: translate3d(400%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pedestal-orbit-overlay {
    opacity: 0.28;
  }

  .pedestal-orbit-overlay::after {
    animation: none;
    opacity: 0;
  }
}
</style>
