import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import HeaderBar from '@/components/shared/HeaderBar.vue'
import hospitalLogo from '@/assets/jiangmen-central-hospital-logo.png'
import sunnicareLogo from '@/assets/sunnicare-logo.png'

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
})
