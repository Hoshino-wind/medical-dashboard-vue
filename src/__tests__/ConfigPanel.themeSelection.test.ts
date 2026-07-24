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

  it('switches the card frame style independently from the color theme', async () => {
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
    const initialThemeId = store.config.themeId

    const chamferedStyle = wrapper.find('[data-testid="panel-style-chamfered-instrument"]')

    expect(chamferedStyle.exists()).toBe(true)
    await chamferedStyle.setValue()
    await flushPromises()

    expect(store.config.panelStyle).toBe('chamfered-instrument')
    expect(store.config.themeId).toBe(initialThemeId)
    expect(wrapper.find('.panel-style-radio.active').text()).toContain('立体边框')
  })

  it('configures the chart type of each statistics card independently', async () => {
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

    expect(
      (wrapper.find('[data-testid="chart-type-repairStats-bar"]').element as HTMLInputElement)
        .checked,
    ).toBe(true)
    expect(
      (wrapper.find('[data-testid="chart-type-maintenanceStats-line"]').element as HTMLInputElement)
        .checked,
    ).toBe(true)

    await wrapper.find('[data-testid="chart-type-repairStats-line"]').setValue()
    await flushPromises()

    expect(store.config.chartTypes.repairStats).toBe('line')
    expect(store.config.chartTypes.maintenanceStats).toBe('line')
    expect(
      (wrapper.find('[data-testid="chart-type-repairStats-line"]').element as HTMLInputElement)
        .checked,
    ).toBe(true)
  })

  it('offers borderless as the middle of three card styles', async () => {
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
    const styleOptions = wrapper.findAll('.panel-style-radio')

    expect(styleOptions).toHaveLength(3)
    expect(styleOptions.map((option) => option.text())).toEqual(['流光玻璃', '无边框', '立体边框'])

    const borderlessStyle = wrapper.find('[data-testid="panel-style-borderless"]')
    expect(borderlessStyle.exists()).toBe(true)
    await borderlessStyle.setValue()
    await flushPromises()

    expect(store.config.panelStyle).toBe('borderless')
    expect(wrapper.find('.panel-style-radio.active').text()).toContain('无边框')
  })

  it('configures and persists custom colors for rings and progress bars', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: { BigScreen: true },
      },
    })
    const store = useDashboardStore(pinia)

    await wrapper.find('[data-testid="ring-color-mode-custom"]').setValue()
    await wrapper.find('[data-testid="ring-custom-color"]').setValue('#f05a28')
    await wrapper.find('[data-testid="bar-color-mode-custom"]').setValue()
    await wrapper.find('[data-testid="bar-custom-color"]').setValue('#3456c8')
    await flushPromises()

    expect(store.config.ringColorMode).toBe('custom')
    expect(store.config.ringCustomColor).toBe('#f05a28')
    expect(store.config.barColorMode).toBe('custom')
    expect(store.config.barCustomColor).toBe('#3456c8')
    expect(JSON.parse(window.localStorage.getItem('medical-dashboard-config') ?? '{}')).toMatchObject(
      {
        schemaVersion: 3,
        ringColorMode: 'custom',
        ringCustomColor: '#f05a28',
        barColorMode: 'custom',
        barCustomColor: '#3456c8',
      },
    )
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

  it('does not show the configured slot count in the properties panel', () => {
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
        stubs: {
          BigScreen: true,
        },
      },
    })

    expect(wrapper.find('.property-summary').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('已配置')
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
