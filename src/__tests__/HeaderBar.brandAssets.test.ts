import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import HeaderBar from '@/components/shared/HeaderBar.vue'
import hospitalLogo from '@/assets/jiangmen-central-hospital-logo.png'
import sunnicareLogo from '@/assets/sunnicare-logo.png'

const headerBarCss = readFileSync(resolve('src/components/shared/HeaderBar.css'), 'utf8')

enableAutoUnmount(afterEach)

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

  it('draws the decorative paths with dedicated theme tokens', () => {
    const wrapper = mount(HeaderBar, { props: { data: header } })
    const primaryStops = wrapper.findAll('.header-stop-primary')
    const secondaryStops = wrapper.findAll('.header-stop-secondary')
    const tertiaryStops = wrapper.findAll('.header-stop-tertiary')

    expect(primaryStops).not.toHaveLength(0)
    expect(secondaryStops).not.toHaveLength(0)
    expect(tertiaryStops).not.toHaveLength(0)
    expect(primaryStops.every((stop) => stop.attributes('stop-color') === 'var(--header-path-primary)'))
      .toBe(true)
    expect(
      secondaryStops.every(
        (stop) => stop.attributes('stop-color') === 'var(--header-path-secondary)',
      ),
    ).toBe(true)
    expect(
      tertiaryStops.every((stop) => stop.attributes('stop-color') === 'var(--header-path-accent)'),
    ).toBe(true)
  })

  it('keeps both side header chips on the dedicated header palette', () => {
    const sideHeaderCss = headerBarCss.slice(0, headerBarCss.indexOf('.title-frame'))

    expect(sideHeaderCss).toContain('var(--header-path-primary)')
    expect(sideHeaderCss).toContain('var(--header-path-secondary)')
    expect(sideHeaderCss).toContain('var(--header-path-accent)')
    expect(sideHeaderCss).not.toContain('var(--chart-primary)')
    expect(sideHeaderCss).not.toContain('var(--chart-secondary)')
    expect(sideHeaderCss).not.toContain('var(--glass-edge)')
  })

  it('moves only the hospital copy left while keeping the badge group in place', () => {
    expect(headerBarCss).toMatch(
      /\.hospital-chip\s*\{[\s\S]*?transform:\s*translate\(0\.125rem,\s*-0\.0625rem\);[\s\S]*?\}/,
    )
    expect(headerBarCss).toMatch(
      /\.hospital-copy\s*\{[\s\S]*?transform:\s*translateX\(-1\.25rem\);[\s\S]*?\}/,
    )
  })
})
