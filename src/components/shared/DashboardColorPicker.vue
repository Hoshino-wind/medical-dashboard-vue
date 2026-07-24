<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch, type CSSProperties } from 'vue'
import { ChevronDown, RotateCcw } from 'lucide-vue-next'
import {
  dashboardColorToHsva,
  dashboardHsvaToColor,
  type DashboardHsvaColor,
} from '@/features/dashboard-config'

const props = defineProps<{
  label: string
  description: string
  value: string
  overridden: boolean
  testId: string
  dark: boolean
}>()

const emit = defineEmits<{
  change: [color: string]
  reset: []
}>()

const triggerRef = ref<HTMLButtonElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const saturationRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const isSaturationDragging = ref(false)
const hue = ref(0)
const saturation = ref(100)
const brightness = ref(100)
const alpha = ref(1)
const hexDraft = ref('#1677ff')
const alphaDraft = ref('100')
const panelPosition = ref<CSSProperties>({ top: '0px', left: '0px' })

const hsva = computed<DashboardHsvaColor>(() => ({
  h: hue.value,
  s: saturation.value,
  v: brightness.value,
  a: alpha.value,
}))
const currentColor = computed(() => dashboardHsvaToColor(hsva.value))
const opaqueColor = computed(() => dashboardHsvaToColor({ ...hsva.value, a: 1 }).slice(0, 7))
const alphaPercent = computed(() => Math.round(alpha.value * 100))
const triggerLabel = computed(() => `${opaqueColor.value.toUpperCase()} · ${alphaPercent.value}%`)
const saturationStyle = computed<CSSProperties>(() => ({
  '--picker-hue': `hsl(${hue.value} 100% 50%)`,
}))
const saturationThumbStyle = computed<CSSProperties>(() => ({
  left: `${saturation.value}%`,
  top: `${100 - brightness.value}%`,
}))
const alphaStyle = computed<CSSProperties>(() => ({
  '--picker-color': opaqueColor.value,
}))
const swatchStyle = computed<CSSProperties>(() => ({
  '--swatch-color': currentColor.value,
}))

function syncFromValue(value: string) {
  const next = dashboardColorToHsva(value)
  if (!next) return

  hue.value = next.h
  saturation.value = next.s
  brightness.value = next.v
  alpha.value = next.a
  hexDraft.value = value.slice(0, 7)
  alphaDraft.value = String(Math.round(next.a * 100))
}

function commitColor() {
  hexDraft.value = opaqueColor.value
  alphaDraft.value = String(alphaPercent.value)
  emit('change', currentColor.value)
}

function updatePanelPosition() {
  const trigger = triggerRef.value
  const panel = panelRef.value
  if (!trigger || !panel) return

  const triggerRect = trigger.getBoundingClientRect()
  const width = panel.offsetWidth || 286
  const height = panel.offsetHeight || 286
  const gutter = 10
  const left = Math.min(
    window.innerWidth - width - gutter,
    Math.max(gutter, triggerRect.right - width),
  )
  const belowTop = triggerRect.bottom + 8
  const top =
    belowTop + height <= window.innerHeight - gutter
      ? belowTop
      : Math.max(gutter, triggerRect.top - height - 8)

  panelPosition.value = { left: `${left}px`, top: `${top}px` }
}

function addPopoverListeners() {
  document.addEventListener('pointerdown', handleOutsidePointerDown, true)
  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
}

function removePopoverListeners() {
  document.removeEventListener('pointerdown', handleOutsidePointerDown, true)
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
}

async function togglePanel() {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    removePopoverListeners()
    return
  }

  syncFromValue(props.value)
  await nextTick()
  updatePanelPosition()
  addPopoverListeners()
}

function closePanel() {
  if (!isOpen.value) return
  isOpen.value = false
  removePopoverListeners()
}

function handleOutsidePointerDown(event: PointerEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target) || panelRef.value?.contains(target)) return
  closePanel()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  closePanel()
  triggerRef.value?.focus()
}

function updateSaturation(event: PointerEvent) {
  const field = saturationRef.value
  if (!field) return
  const rect = field.getBoundingClientRect()
  saturation.value = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
  brightness.value = Math.min(
    100,
    Math.max(0, 100 - ((event.clientY - rect.top) / rect.height) * 100),
  )
  commitColor()
}

function startSaturationDrag(event: PointerEvent) {
  event.preventDefault()
  isSaturationDragging.value = true
  saturationRef.value?.setPointerCapture(event.pointerId)
  updateSaturation(event)
}

function continueSaturationDrag(event: PointerEvent) {
  if (isSaturationDragging.value) updateSaturation(event)
}

function stopSaturationDrag() {
  isSaturationDragging.value = false
}

function handleHueInput(event: Event) {
  hue.value = Number((event.target as HTMLInputElement).value)
  commitColor()
}

function handleAlphaInput(event: Event) {
  alpha.value = Number((event.target as HTMLInputElement).value) / 100
  commitColor()
}

function handleHexDraft(event: Event) {
  hexDraft.value = (event.target as HTMLInputElement).value
}

function commitHexDraft() {
  const normalized = hexDraft.value.trim().replace(/^#?/, '#')
  const next = dashboardColorToHsva(normalized)
  if (!next || normalized.length !== 7) {
    hexDraft.value = opaqueColor.value
    return
  }

  hue.value = next.h
  saturation.value = next.s
  brightness.value = next.v
  commitColor()
}

function handleAlphaDraft(event: Event) {
  alphaDraft.value = (event.target as HTMLInputElement).value
}

function commitAlphaDraft() {
  const percent = Number(alphaDraft.value)
  if (!Number.isFinite(percent)) {
    alphaDraft.value = String(alphaPercent.value)
    return
  }

  alpha.value = Math.min(100, Math.max(0, percent)) / 100
  commitColor()
}

function resetColor() {
  closePanel()
  emit('reset')
}

watch(() => props.value, syncFromValue, { immediate: true })
onBeforeUnmount(removePopoverListeners)
</script>

<template>
  <div class="dashboard-color-picker">
    <div class="dashboard-color-picker-copy">
      <strong>{{ label }}</strong>
      <span>{{ description }}</span>
    </div>

    <button
      ref="triggerRef"
      class="dashboard-color-picker-trigger"
      :class="{ active: isOpen }"
      type="button"
      :data-testid="testId"
      :aria-label="`${label}，当前值 ${triggerLabel}`"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      @click="togglePanel"
      @keydown="handleKeydown"
    >
      <span class="dashboard-color-picker-swatch" :style="swatchStyle"></span>
      <output>{{ triggerLabel }}</output>
      <ChevronDown aria-hidden="true" />
    </button>

    <button
      v-if="overridden"
      class="dashboard-color-picker-reset"
      type="button"
      :data-testid="`${testId}-reset`"
      :aria-label="`${label}恢复跟随主题`"
      @click="resetColor"
    >
      <RotateCcw aria-hidden="true" />
      <span>恢复主题</span>
    </button>
    <span v-else class="dashboard-color-picker-theme-state">主题</span>

    <Teleport to="body">
      <section
        v-if="isOpen"
        ref="panelRef"
        class="dashboard-color-picker-panel"
        :class="{ 'is-dark': dark }"
        :style="panelPosition"
        :data-testid="`${testId}-panel`"
        role="dialog"
        :aria-label="`${label}颜色选择器`"
        @keydown="handleKeydown"
      >
        <div
          ref="saturationRef"
          class="dashboard-color-saturation"
          :style="saturationStyle"
          role="slider"
          aria-label="饱和度与亮度"
          :aria-valuetext="`饱和度 ${Math.round(saturation)}%，亮度 ${Math.round(brightness)}%`"
          tabindex="0"
          @pointerdown="startSaturationDrag"
          @pointermove="continueSaturationDrag"
          @pointerup="stopSaturationDrag"
          @pointercancel="stopSaturationDrag"
        >
          <span class="dashboard-color-saturation-thumb" :style="saturationThumbStyle"></span>
        </div>

        <div class="dashboard-color-sliders">
          <input
            class="dashboard-color-hue"
            type="range"
            min="0"
            max="360"
            step="1"
            :value="hue"
            aria-label="色相"
            @input="handleHueInput"
          />
          <input
            class="dashboard-color-alpha"
            type="range"
            min="0"
            max="100"
            step="1"
            :value="alphaPercent"
            :style="alphaStyle"
            aria-label="透明度"
            @input="handleAlphaInput"
          />
          <span class="dashboard-color-panel-swatch" :style="swatchStyle" aria-hidden="true"></span>
        </div>

        <div class="dashboard-color-values">
          <label class="dashboard-color-format">
            <span class="sr-only">颜色格式</span>
            <select aria-label="颜色格式">
              <option>HEX</option>
            </select>
          </label>
          <label class="dashboard-color-hex-input">
            <span class="sr-only">十六进制颜色</span>
            <input
              :value="hexDraft"
              maxlength="7"
              spellcheck="false"
              aria-label="十六进制颜色"
              @input="handleHexDraft"
              @change="commitHexDraft"
              @blur="commitHexDraft"
              @keydown.enter.prevent="commitHexDraft"
            />
          </label>
          <label class="dashboard-color-alpha-input">
            <span class="sr-only">透明度百分比</span>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              :value="alphaDraft"
              aria-label="透明度百分比"
              @input="handleAlphaDraft"
              @change="commitAlphaDraft"
              @blur="commitAlphaDraft"
              @keydown.enter.prevent="commitAlphaDraft"
            />
            <span>%</span>
          </label>
        </div>
      </section>
    </Teleport>
  </div>
</template>

<style scoped src="./DashboardColorPicker.css"></style>
