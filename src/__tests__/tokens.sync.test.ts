import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { themes } from '@/data/themes'

/**
 * 单一事实来源守卫。
 *
 * `src/styles/tokens.css` 的 :root 兜底值必须与 `src/data/themes.ts` 中
 * "深海指挥蓝"(deep-sea-instrument)主题逐字段一致(见 tokens.css 顶部说明):
 * 它是主题 JS 挂载前的首帧防闪烁兜底,以及脱离主题上下文时 var(--xxx) 的取值。
 *
 * 早先二者靠注释提醒人工核对,极易漂移。此测试把该约束固化为可执行断言:
 * 改了主题却忘了同步 tokens.css(或反之),测试立即失败并列出漂移字段。
 */
const FALLBACK_THEME_ID = 'deep-sea-instrument'

// vitest 从项目根运行,故用 cwd 定位源文件(jsdom 下 import.meta.url 是 http://,
// 且 .css?raw 会被 vitest 的 CSS mock 吞成空串,均不可用)。
const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf-8')

/** 从 CSS 文本中读取某个自定义属性的值(取第一处声明,值内不含分号) */
function readCssVar(css: string, name: string): string | null {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`))
  return match ? match[1].trim() : null
}

describe('tokens.css 与主题保持单一事实来源', () => {
  const fallbackTheme = themes.find((theme) => theme.id === FALLBACK_THEME_ID)

  it(`存在兜底主题 ${FALLBACK_THEME_ID}`, () => {
    expect(fallbackTheme).toBeDefined()
  })

  it('tokens.css 的每个 CSS 变量都与兜底主题逐字段一致', () => {
    const variables = fallbackTheme!.variables
    const mismatches: string[] = []

    for (const [name, expected] of Object.entries(variables)) {
      const actual = readCssVar(tokensCss, name)
      const want = String(expected).trim()
      if (actual !== want) {
        mismatches.push(`  ${name}: tokens.css=${actual ?? '(缺失)'}  应为  ${want}`)
      }
    }

    expect(
      mismatches,
      `tokens.css 已与 ${FALLBACK_THEME_ID} 主题漂移,请同步以下变量:\n${mismatches.join('\n')}`,
    ).toEqual([])
  })
})
