import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MechanicalFrame from '@/components/visual/MechanicalFrame.vue'
import PanelShell from '@/components/shared/PanelShell.vue'
describe('MechanicalFrame', () => {
  it('mounts independent image frames for the panel and its title', () => {
    const wrapper = mount(PanelShell, {
      props: { title: '保修统计', subtitle: '近7天', variant: 'line' },
      slots: { default: '<div>内容</div>' },
    })

    expect(wrapper.findAllComponents(MechanicalFrame)).toHaveLength(2)
    expect(wrapper.findAll('.mechanical-frame--panel')).toHaveLength(1)
    expect(wrapper.findAll('.mechanical-frame--compact')).toHaveLength(1)
  })
})
