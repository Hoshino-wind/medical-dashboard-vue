import { describe, it, expect, beforeEach } from 'vitest'
import { readStorage, writeStorage } from '../storage'

describe('storage 工具', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('writeStorage 写入后 readStorage 能读回', () => {
    writeStorage('test-key', { a: 1, b: 'hello' })
    const result = readStorage<{ a: number; b: string }>('test-key')
    expect(result).toEqual({ a: 1, b: 'hello' })
  })

  it('readStorage 读取不存在的 key 返回 null', () => {
    expect(readStorage('nonexistent')).toBeNull()
  })

  it('readStorage 遇到非法 JSON 返回 null 而非抛错', () => {
    window.localStorage.setItem('bad-json', '{invalid}')
    expect(readStorage('bad-json')).toBeNull()
  })
})
