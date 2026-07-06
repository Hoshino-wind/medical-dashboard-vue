import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import BigScreen from '@/components/shared/BigScreen.vue'

describe('BigScreen reference layout', () => {
  it('marks the default screen as aligned to the 1920x1080 3x3 reference', () => {
    const wrapper = mount(BigScreen, {
      global: {
        plugins: [createPinia()],
        stubs: {
          HeaderBar: true,
          ModuleRenderer: true,
          FooterKpiBar: {
            props: ['items'],
            template:
              '<footer class="footer-stub" :data-count="items?.length">{{ items?.[0]?.label }}</footer>',
          },
        },
      },
    })

    expect(wrapper.find('.screen-frame').attributes('data-reference-design')).toBe(
      'medical-equipment-1920x1080',
    )
    expect(wrapper.find('.screen-grid').attributes('data-layout')).toBe('3x3')
    expect(wrapper.find('.footer-stub').attributes('data-count')).toBe('6')
    expect(wrapper.find('.footer-stub').text()).toContain('重点设备数')
  })
})
