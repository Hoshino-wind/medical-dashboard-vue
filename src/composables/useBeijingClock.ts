import { onMounted, onUnmounted, ref } from 'vue'

/**
 * 北京时间(Asia/Shanghai)时钟。
 *
 * 每秒更新,返回格式化文本 `YYYY-MM-DD HH:mm 星期X` 的 ref。
 * 从 HeaderBar 内联函数抽出为组合式,便于复用与单测。
 */
export function useBeijingClock() {
  const text = ref('')
  let timer: ReturnType<typeof setInterval> | null = null

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  })

  const pad = (value: string): string => (value.length < 2 ? `0${value}` : value)

  const tick = (): void => {
    const map: Record<string, string> = {}
    for (const part of formatter.formatToParts(new Date())) {
      map[part.type] = part.value
    }
    let hour = pad(map.hour ?? '0')
    if (hour === '24') hour = '00'
    text.value = `${map.year}-${pad(map.month)}-${pad(map.day)} ${hour}:${pad(map.minute)} ${map.weekday}`
  }

  onMounted(() => {
    tick()
    timer = setInterval(tick, 1000)
  })

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  })

  return { text }
}
