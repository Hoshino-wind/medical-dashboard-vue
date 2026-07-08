import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export interface SeamlessScrollOptions {
  /** 滚动速度(px/s),越大越快 */
  speed?: number
}

/**
 * 无缝跑马灯列表滚动。
 *
 * 当列表内容高度超过可视区时,把数据复制一份接在后面,轨道整体匀速
 * `translateY(-50%)` 上滚 —— 滚满一份高度即回到起点,视觉上首尾无缝。
 * 内容不溢出(数据少)时不复制、不滚动,保持静态。
 *
 * 用法:
 *   - `viewportRef` 绑定到 `overflow:hidden` 的可视区(通常 `.marquee-viewport`)
 *   - `trackRef` 绑定到内部滚动轨道(`.marquee-track`),并挂 `is-scrolling` 与 `scrollStyle`
 *   - `renderItems` 用于 v-for;用 `index % baseCount` 还原原始序号/配色/高亮
 */
export function useSeamlessScroll<T>(source: Ref<readonly T[]>, options: SeamlessScrollOptions = {}) {
  const speed = options.speed ?? 26

  const viewportRef = ref<HTMLElement | null>(null)
  const trackRef = ref<HTMLElement | null>(null)
  const shouldScroll = ref(false)
  const contentHeight = ref(0)

  /** 溢出时复制一份数据,保证 -50% 位移后首尾无缝衔接 */
  const renderItems = computed(() =>
    shouldScroll.value ? [...source.value, ...source.value] : [...source.value],
  )

  /** 原始条数,用于把复制出来的项还原成正确序号 */
  const baseCount = computed(() => source.value.length || 1)

  const scrollStyle = computed<Record<string, string>>(() => {
    const style: Record<string, string> = {}
    if (shouldScroll.value) {
      style['--marquee-duration'] = `${Math.max(6, contentHeight.value / speed)}s`
    }
    return style
  })

  function measure() {
    const viewport = viewportRef.value
    const track = trackRef.value
    if (!viewport || !track) return
    const copies = shouldScroll.value ? 2 : 1
    const single = track.scrollHeight / copies
    contentHeight.value = single
    shouldScroll.value = single > viewport.clientHeight + 1
  }

  let observer: ResizeObserver | undefined
  onMounted(() => {
    nextTick(measure)
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measure())
      if (viewportRef.value) observer.observe(viewportRef.value)
    }
  })
  onBeforeUnmount(() => observer?.disconnect())

  watch(source, () => nextTick(measure))

  return { viewportRef, trackRef, shouldScroll, scrollStyle, renderItems, baseCount }
}
