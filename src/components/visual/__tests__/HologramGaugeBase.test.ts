import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HologramGaugeBase from '@/components/visual/HologramGaugeBase.vue'

describe('HologramGaugeBase', () => {
  it('supports standalone tone and animation controls', () => {
    const wrapper = mount(HologramGaugeBase, {
      props: {
        tone: '#20e8ff',
        speed: 7.2,
        direction: 'counter-clockwise',
        intensity: 0.9,
      },
    })

    expect(wrapper.attributes('style')).toContain('--gauge-tone: #20e8ff')
    expect(wrapper.attributes('style')).toContain('--gauge-tone-soft: color-mix')
    expect(wrapper.attributes('style')).toContain('--gauge-tone-bright: color-mix')
    expect(wrapper.attributes('style')).toContain('--holo-speed: 7.2s')
    expect(wrapper.classes()).toContain('is-counter-clockwise')
  })

  it('projects a layered point-source beam from a bright top deck', () => {
    const wrapper = mount(HologramGaugeBase)

    const beams = wrapper.findAll('.gauge-base-beam')
    const outerBeam = wrapper.find('.gauge-base-beam--outer')
    const innerBeam = wrapper.find('.gauge-base-beam--inner')
    const topDeck = wrapper.find('.gauge-base-deck--top')

    expect(beams).toHaveLength(3)
    expect(wrapper.find('.gauge-base-ray').exists()).toBe(false)
    expect(wrapper.find('.gauge-base-core').exists()).toBe(false)
    expect(outerBeam.attributes('d')).toContain('-58')
    expect(outerBeam.attributes('d')).toContain('L38 -58')
    expect(outerBeam.attributes('d')).toContain('182 -58')
    expect(innerBeam.attributes('d')).toContain('-48')
    expect(wrapper.find('.gauge-base-beam--core').attributes('fill')).toMatch(/-beam-core\)$/)
    expect(topDeck.attributes('fill')).toMatch(/-top-deck\)$/)
    expect(wrapper.find('.gauge-base-dot').attributes('r')).toBe('1.8')
  })
})
