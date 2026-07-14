import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testDir = dirname(fileURLToPath(import.meta.url))
const assetPath = join(testDir, '../assets/panel-frame-mechanical-reference.png')
const panelStylePath = join(testDir, '../styles/panel.css')

describe('mechanical panel frame asset', () => {
  it('keeps the referenced PNG available in source control', () => {
    expect(existsSync(assetPath)).toBe(true)

    const asset = readFileSync(assetPath)
    expect([...asset.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10])

    const panelStyles = readFileSync(panelStylePath, 'utf8')
    const references = panelStyles.match(/panel-frame-mechanical-reference\.png/g) ?? []
    expect(references).toHaveLength(4)
  })
})
