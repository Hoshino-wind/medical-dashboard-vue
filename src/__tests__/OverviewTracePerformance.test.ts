import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const moduleStyles = readFileSync(join(sourceRoot, 'styles/modules.css'), 'utf8')

function blockAfter(source: string, token: string) {
  const tokenIndex = source.indexOf(token)
  if (tokenIndex < 0) return ''

  const blockStart = source.indexOf('{', tokenIndex)
  let depth = 0
  for (let index = blockStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') depth -= 1
    if (depth === 0) return source.slice(blockStart + 1, index)
  }

  return ''
}

describe('overview trace animation performance', () => {
  it('moves the looping trace with a compositor transform instead of left', () => {
    const trace = blockAfter(moduleStyles, '.overview-stat-frame::after')
    const keyframes = blockAfter(moduleStyles, '@keyframes overview-frame-trace')

    expect(trace).toContain(
      'animation: overview-frame-trace var(--motion-loop-status) linear infinite',
    )
    expect(trace).toContain('transform: translate3d(0, 0, 0)')
    expect(keyframes).toContain('transform: translate3d(425%, 0, 0)')
    expect(keyframes).not.toMatch(/\bleft\s*:/)
  })

  it('keeps the trace static and visible for reduced motion', () => {
    const reducedMotion = blockAfter(moduleStyles, '@media (prefers-reduced-motion: reduce)')
    const reducedTrace = blockAfter(reducedMotion, '.overview-stat-frame::after')

    expect(reducedTrace).toContain('left: 58%')
    expect(reducedTrace).toContain('animation: none')
    expect(reducedTrace).toContain('opacity: 0.4')
  })
})
