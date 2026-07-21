import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 让固定画布在预览容器内按宽高约束等比缩放。 */
export function useScaledPreview(baseWidth: number, baseHeight: number) {
  const previewRef = ref<HTMLElement | null>(null)
  const previewScale = ref(1)
  let observer: ResizeObserver | undefined

  function measurePreview() {
    const element = previewRef.value
    if (!element) return
    previewScale.value = Math.min(
      element.clientWidth / baseWidth,
      element.clientHeight / baseHeight,
    )
  }

  onMounted(() => {
    if (typeof ResizeObserver === 'undefined') return
    observer = new ResizeObserver(measurePreview)
    if (previewRef.value) {
      observer.observe(previewRef.value)
      measurePreview()
    }
  })

  onBeforeUnmount(() => observer?.disconnect())

  return { previewRef, previewScale }
}
