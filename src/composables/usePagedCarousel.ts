import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
} from 'vue'

export interface PagedCarouselOptions {
  /** 总页数(响应式),<= 1 时不自动翻页 */
  pageCount: MaybeRefOrGetter<number>
  /** 每页停留时长(毫秒) */
  interval?: number
}

/**
 * 固定页大小的卡片轮播分页。
 *
 * 收敛可用率 / 设备分布等模块里各自手搓的
 * `setInterval + currentIndex + 重置` 逻辑。与 `usePagedList`(按 DOM
 * 高度测量行数的无缝滚动)定位不同:这里页数由调用方按固定 PAGE_SIZE
 * 切片得出,组件用 `:key="currentIndex"` 配合 <Transition> 做整页翻切。
 *
 * 页数变化时回到第一页并重启计时,兼容数据变更。
 *
 * @example
 * const { currentIndex, shouldPaginate } = usePagedCarousel({
 *   pageCount: () => pages.value.length,
 *   interval: 5000,
 * })
 */
export function usePagedCarousel(options: PagedCarouselOptions) {
  const { pageCount, interval = 5000 } = options
  const currentIndex = ref(0)
  const shouldPaginate = computed(() => toValue(pageCount) > 1)
  let timer: ReturnType<typeof setInterval> | null = null

  function nextPage() {
    if (!shouldPaginate.value) return
    currentIndex.value = (currentIndex.value + 1) % toValue(pageCount)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function start() {
    stop()
    if (shouldPaginate.value) {
      timer = setInterval(nextPage, interval)
    }
  }

  // 页数变化后回到第一页并重启计时
  watch(
    () => toValue(pageCount),
    () => {
      currentIndex.value = 0
      start()
    },
  )

  onMounted(start)
  onBeforeUnmount(stop)

  return { currentIndex, shouldPaginate }
}
