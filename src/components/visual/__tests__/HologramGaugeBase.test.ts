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
    expect(wrapper.attributes('style')).toContain('--holo-speed-middle: 6.19s')
    expect(wrapper.classes()).toContain('is-counter-clockwise')
  })

  it('projects a layered wide inverted-trapezoid beam from a bright top deck', () => {
    const wrapper = mount(HologramGaugeBase)

    const beams = wrapper.findAll('.gauge-base-beam')
    const outerBeam = wrapper.find('.gauge-base-beam--outer')
    const innerBeam = wrapper.find('.gauge-base-beam--inner')
    const topDeck = wrapper.find('.gauge-base-deck--top')

    expect(beams).toHaveLength(3)
    expect(wrapper.find('.gauge-base-ray').exists()).toBe(false)
    expect(wrapper.find('.gauge-base-core').exists()).toBe(false)
    // 倒梯形:底部平口发射(96/124 @29)向上张开到宽顶边(-40/260 @-21),约 140~150°
    expect(outerBeam.attributes('d')).toContain('M96 29')
    expect(outerBeam.attributes('d')).toContain('124 29')
    expect(outerBeam.attributes('d')).toContain('L-40 -21')
    expect(outerBeam.attributes('d')).toContain('260 -21')
    expect(innerBeam.attributes('d')).toContain('L18 -21')
    expect(wrapper.find('.gauge-base-beam--core').attributes('fill')).toMatch(/-beam-core\)$/)
    expect(topDeck.attributes('fill')).toMatch(/-top-deck\)$/)
    expect(wrapper.find('.gauge-base-dot').attributes('r')).toBe('1.8')
  })

  it('renders a maintainable projector housing around the emission aperture', () => {
    const wrapper = mount(HologramGaugeBase)

    expect(wrapper.find('.hologram-gauge-volume').exists()).toBe(true)
    expect(wrapper.findAll('.gauge-base-tier')).toHaveLength(3)
    expect(wrapper.find('.gauge-base-aperture').exists()).toBe(true)
    expect(wrapper.find('.gauge-base-aperture-ring').exists()).toBe(true)
    expect(wrapper.find('.gauge-base-status-window').exists()).toBe(true)
    expect(wrapper.findAll('.gauge-base-strut')).toHaveLength(2)
    expect(wrapper.findAll('.gauge-base-fastener')).toHaveLength(2)
  })

  it('rotates only lightweight deck details while expensive filtered surfaces stay static', () => {
    const wrapper = mount(HologramGaugeBase)

    const rotors = wrapper.findAll('.gauge-base-rotor')

    expect(rotors).toHaveLength(3)
    expect(wrapper.findAll('.gauge-base-deck')).toHaveLength(3)
    expect(wrapper.findAll('.gauge-base-rotor .gauge-base-deck')).toHaveLength(0)
    expect(wrapper.findAll('.gauge-base-rotor .gauge-base-aperture')).toHaveLength(0)
    expect(wrapper.findAll('.gauge-base-rotor [filter]')).toHaveLength(0)
    expect(wrapper.findAll('.gauge-base-rotor .gauge-base-rotor-spokes')).toHaveLength(3)
    expect(wrapper.findAll('.gauge-base-rotor .gauge-base-rotor-nodes')).toHaveLength(3)
    expect(wrapper.find('.gauge-base-scan').exists()).toBe(false)
    expect(wrapper.find('.gauge-base-orbit--rotating').exists()).toBe(false)
  })
})
