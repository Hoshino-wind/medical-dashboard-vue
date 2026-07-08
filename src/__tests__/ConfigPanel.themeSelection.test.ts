import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ConfigPanel from '@/components/shared/ConfigPanel.vue'
import { useDashboardStore } from '@/stores/dashboard'

describe('ConfigPanel workbench configuration', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('moves the current theme indicator when a theme is selected', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    expect(wrapper.find('.theme-radio.active').text()).toContain('蓝黑')

    const daylightTheme = wrapper
      .findAll('.theme-radio')
      .find((card) => card.text().includes('浅蓝'))

    expect(daylightTheme).toBeTruthy()
    await daylightTheme!.find('input').setValue()
    await flushPromises()

    expect(store.config.themeId).toBe('light-medical')
    expect(wrapper.find('.theme-radio.active').text()).toContain('浅蓝')
  })

  it('switches between 3x3 and 2x3 layout slot counts', async () => {
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
        stubs: {
          BigScreen: true,
        },
      },
    })

    expect(wrapper.findAll('.layout-slot')).toHaveLength(9)

    const twoByThree = wrapper
      .findAll('.property-radio')
      .find((radio) => radio.text().includes('2行3列'))

    expect(twoByThree).toBeTruthy()
    await twoByThree!.find('input').setValue()
    await flushPromises()

    expect(wrapper.findAll('.layout-slot')).toHaveLength(6)
  })

  it('adds an available business component into an empty layout slot', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    expect(wrapper.find('[data-testid="available-deviceDistribution"]').exists()).toBe(true)

    await wrapper.find('[data-testid="layout-slot-0"]').trigger('click')
    await flushPromises()

    expect(store.config.selectedModuleIds).not.toContain('overview')
    expect(store.config.selectedModuleIds[0]).toBeNull()

    await wrapper.find('[data-testid="available-deviceDistribution"]').trigger('click')
    await flushPromises()

    expect(store.config.selectedModuleIds).toContain('deviceDistribution')
    expect(wrapper.text()).toContain('设备分布台数占比')
  })

  it('removes a layout component when it is dragged back to the business component pool', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    await wrapper.find('[data-testid="layout-slot-1"]').trigger('dragstart')
    await wrapper.find('.component-picker').trigger('drop')
    await flushPromises()

    expect(store.config.selectedModuleIds[1]).toBeNull()
    expect(store.availableModules.map((item) => item.id)).toContain('repairOrders')
  })

  it('swaps two layout components when one slot is dragged onto another occupied slot', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    await wrapper.find('[data-testid="layout-slot-0"]').trigger('dragstart')
    await wrapper.find('[data-testid="layout-slot-2"]').trigger('drop')
    await flushPromises()

    expect(store.config.selectedModuleIds.slice(0, 3)).toEqual([
      'repairStats',
      'repairOrders',
      'overview',
    ])
  })

  it('keeps one table component per layout row', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    store.clearSelectedModules()
    store.placeModuleInSlot('repairOrders', 0)
    await flushPromises()

    const placed = store.placeModuleInSlot('inspectionOrders', 1)
    await flushPromises()

    expect(placed).toBe(false)
    expect(store.config.selectedModuleIds[1]).toBeNull()
    expect(wrapper.text()).toContain('维修工单')
  })

  it('shows a warning when a second table component is dropped into the same row', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: {
          BigScreen: true,
        },
      },
    })
    const store = useDashboardStore(pinia)

    store.clearSelectedModules()
    store.placeModuleInSlot('repairOrders', 0)
    await flushPromises()

    await wrapper.find('[data-testid="available-inspectionOrders"]').trigger('dragstart')
    await wrapper.find('[data-testid="layout-slot-1"]').trigger('drop')
    await flushPromises()

    expect(store.config.selectedModuleIds[1]).toBeNull()
    expect(wrapper.find('.config-rule-toast.visible').text()).toContain(
      '每一行只允许存在一个【表格】类型组件',
    )
  })
})
