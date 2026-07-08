import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export interface PagedListOptions {
  /** 每页停留时长(ms) */
  holdMs?: number
  /** 翻页动画时长(ms) */
  flipMs?: number
}

/**
 * 列表整页翻页(非连续滚动)。
 *
 * 按可视区高度自动测算每页能放几行,把数据切成若干"页",每页占满一个
 * 可视区高度;定时整页向上翻,翻到最后再无缝回到第 1 页。序号按页连续
 * 递增(第 1 页 1..n、第 2 页 n+1..),不会像连续滚动那样错位。
 *
 * 用法:
 *   - `viewportRef` 绑定 `overflow:hidden` 的可视区(`.paged-viewport`)
 *   - `trackRef` 绑定内部轨道(`.paged-track`),挂 `:style="trackStyle"` 与 `@transitionend="onFlipEnd"`
 *   - `renderPages` 用于外层 v-for(每项是一页的行数组);`pageStart(pi)` 给出该页首行的全局序号
 */
export function usePagedList<T>(source: Ref<readonly T[]>, options: PagedListOptions = {}) {
  const holdMs = options.holdMs ?? 3600
  const flipMs = options.flipMs ?? 720

  const viewportRef = ref<HTMLElement | null>(null)
  const trackRef = ref<HTMLElement | null>(null)
  const perPage = ref(0)
  const currentPage = ref(0)
  const animating = ref(true)

  const pages = computed<T[][]>(() => {
    const items = source.value
    if (perPage.value <= 0 || items.length <= perPage.value) return [items.slice()]
    const result: T[][] = []
    for (let i = 0; i < items.length; i += perPage.value) {
      result.push(items.slice(i, i + perPage.value))
    }
    return result
  })

  const shouldPage = computed(() => pages.value.length > 1)

  /** 末尾追加首页克隆:翻到最后一页后能无缝回到第 1 页 */
  const renderPages = computed<T[][]>(() =>
    shouldPage.value ? [...pages.value, pages.value[0]] : pages.value,
  )

  const trackStyle = computed<Record<string, string>>(() => ({
    // translate3d 强制独立合成层,翻页位移交给 GPU,避免主线程繁忙时掉帧
    transform: `translate3d(0, -${currentPage.value * 100}%, 0)`,
    transition: animating.value ? `transform ${flipMs}ms cubic-bezier(0.65, 0, 0.35, 1)` : 'none',
  }))

  /** renderPages 里第 pageIndex 页首行对应的全局起始序号(克隆页折回第 1 页) */
  function pageStart(pageIndex: number): number {
    return (pageIndex % pages.value.length) * perPage.value
  }

  function prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }

  function measure() {
    const viewport = viewportRef.value
    const track = trackRef.value
    if (!viewport || !track) return
    const row = track.querySelector('tr')
    const rowHeight = row instanceof HTMLElement ? row.offsetHeight : 0
    const viewportHeight = viewport.clientHeight
    if (rowHeight <= 0 || viewportHeight <= 0) return
    const fit = Math.max(1, Math.floor(viewportHeight / rowHeight))
    if (fit !== perPage.value) {
      perPage.value = fit
      currentPage.value = 0
    }
  }

  let timer: ReturnType<typeof setInterval> | undefined
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
  function start() {
    stop()
    if (!shouldPage.value || prefersReducedMotion()) return
    timer = setInterval(() => {
      currentPage.value += 1
    }, holdMs)
  }

  /**
   * 翻到克隆页(视觉上=第 1 页)后,瞬时无动画归零,实现无缝循环。
   * 只处理轨道自身的 transform 过渡 —— 过滤掉行 background/transform 过渡冒泡上来的
   * transitionend,避免误触发归零导致跳动。
   */
  function onFlipEnd(event: TransitionEvent) {
    if (event.target !== trackRef.value || event.propertyName !== 'transform') return
    if (currentPage.value < pages.value.length) return
    animating.value = false
    currentPage.value = 0
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        animating.value = true
      }),
    )
  }

  let observer: ResizeObserver | undefined
  onMounted(() => {
    nextTick(() => {
      measure()
      start()
    })
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measure()
      })
      if (viewportRef.value) observer.observe(viewportRef.value)
    }
  })

  onBeforeUnmount(() => {
    stop()
    observer?.disconnect()
  })

  watch(source, () => {
    currentPage.value = 0
    nextTick(() => {
      measure()
      start()
    })
  })

  // 分页数变化(测算完 perPage / 数据变动)后,重启定时器
  watch(shouldPage, () => start())

  return {
    viewportRef,
    trackRef,
    renderPages,
    trackStyle,
    pageStart,
    onFlipEnd,
  }
}
