import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import HeaderBar from '@/components/shared/HeaderBar.vue'
import hospitalLogo from '@/assets/jiangmen-central-hospital-logo.png'
import sunnicareLogo from '@/assets/sunnicare-logo.png'

enableAutoUnmount(afterEach)

const testDir = dirname(fileURLToPath(import.meta.url))

const header = {
  brand: 'Sunnicare 上云赋',
  title: '医疗设备全场景智慧管理系统',
  hospital: '江门市中心医院',
  subtitle: 'Jiangmen Central Hospital',
  updatedAt: '2026-07-18 14:46:00',
}

describe('HeaderBar brand assets', () => {
  it('renders the supplied transparent brand and hospital logos', () => {
    const wrapper = mount(HeaderBar, { props: { data: header } })

    expect(wrapper.get('.brand-logo').attributes('src')).toBe(sunnicareLogo)
    expect(wrapper.get('.brand-logo').attributes('alt')).toBe('Sunnicare 上云赋')
    expect(wrapper.get('.hospital-badge').attributes('src')).toBe(hospitalLogo)
    expect(wrapper.get('.hospital-badge').attributes('alt')).toBe('江门市中心医院院徽')
  })

  it('mirrors both connector paths around the 1400-unit header center', () => {
    const wrapper = mount(HeaderBar, { props: { data: header } })
    const leftConnector = wrapper.get('[data-header-connector="left"]')
    const rightConnector = wrapper.get('[data-header-connector="right"]')
    const leftStep = wrapper.get('[data-header-step="left"]')
    const rightStep = wrapper.get('[data-header-step="right"]')

    expect(rightConnector.attributes('d')).toBe(leftConnector.attributes('d'))
    expect(rightStep.attributes('d')).toBe(leftStep.attributes('d'))
    expect(rightConnector.attributes('transform')).toBe('translate(1400 0) scale(-1 1)')
    expect(rightStep.attributes('transform')).toBe('translate(1400 0) scale(-1 1)')
  })

  it('keeps the hospital lockup inside the header without squeezing its copy', () => {
    const source = readFileSync(join(testDir, '../components/shared/HeaderBar.vue'), 'utf8')
    const chipBlock =
      [...source.matchAll(/^\.hospital-chip\s*\{[\s\S]*?\n\}/gm)]
        .map((match) => match[0])
        .find((block) => block.includes('justify-content: flex-end')) ?? ''
    const copyBlock = source.match(/^\.hospital-copy\s*\{[\s\S]*?\n\}/m)?.[0] ?? ''
    const subtitleBlock = source.match(/^\.hospital-subtitle\s*\{[\s\S]*?\n\}/m)?.[0] ?? ''

    expect(chipBlock).toContain('overflow: visible')
    expect(chipBlock).toContain('clip-path: none')
    expect(copyBlock).toContain('flex: 1 1 0')
    expect(copyBlock).toContain('padding: 0.35rem 1.1rem 0.35rem 1.75rem')
    expect(copyBlock).toContain('transform: none')
    expect(subtitleBlock).toContain('overflow: visible')
    expect(subtitleBlock).toContain('white-space: nowrap')
  })
})
