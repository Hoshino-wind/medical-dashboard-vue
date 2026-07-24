import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DeviceDistributionModule from '@/components/modules/DeviceDistributionModule.vue'

describe('DeviceDistributionModule color configuration', () => {
  it('exposes the configured custom color through the module skin variable', () => {
    const wrapper = mount(DeviceDistributionModule, {
      props: {
        items: [{ name: '监护设备', count: 25, rate: 50 }],
        barColorMode: 'custom',
        barCustomColor: '#3456c8',
      },
    })

    const root = wrapper.get('.device-distribution')
    expect(root.classes()).toContain('bar-custom')
    expect(root.attributes('style')).toContain('--custom-bar-color: #3456c8')
  })
})
