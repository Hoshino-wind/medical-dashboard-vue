import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ConfigPanel from '@/components/shared/ConfigPanel.vue'
import { themes } from '@/data/themes'
import { useDashboardStore } from '@/stores/dashboard'

const originalRequestFullscreen = HTMLElement.prototype.requestFullscreen

describe('ConfigPanel workbench configuration', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    HTMLElement.prototype.requestFullscreen = originalRequestFullscreen
    vi.useRealTimers()
    vi.restoreAllMocks()
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

  it('keeps slot clicks safe and removes a component only through its explicit control', async () => {
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

    expect(store.config.selectedModuleIds[0]).toBe('overview')

    await wrapper.find('[data-testid="remove-layout-slot-0"]').trigger('click')
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

  it('announces a table-row conflict when moving a chart would swap two tables together', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: { BigScreen: true },
      },
    })
    const store = useDashboardStore(pinia)
    const before = [...store.config.selectedModuleIds]

    await wrapper.find('[data-testid="layout-slot-0"]').trigger('dragstart')
    await wrapper.find('[data-testid="layout-slot-4"]').trigger('drop')
    await flushPromises()

    expect(store.config.selectedModuleIds).toEqual(before)
    expect(wrapper.find('.config-rule-toast.visible').text()).toContain(
      '每一行只允许存在一个【表格】类型组件',
    )
    expect(wrapper.find('.config-rule-toast.visible').text()).not.toContain('没有可用区域')
  })

  it('previews allowed and blocked slots as soon as a component drag starts', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [pinia],
        stubs: { BigScreen: true },
      },
    })
    const store = useDashboardStore(pinia)
    store.clearSelectedModules()
    store.placeModuleInSlot('repairOrders', 0)
    await flushPromises()

    await wrapper.find('[data-testid="available-inspectionOrders"]').trigger('dragstart')

    expect(wrapper.find('[data-testid="layout-slot-1"]').classes()).toContain('is-drop-blocked')
    expect(wrapper.find('[data-testid="layout-slot-3"]').classes()).toContain('is-drop-allowed')
  })

  it('marks a successful installation briefly and then clears the placement state', async () => {
    vi.useFakeTimers()
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
        stubs: { BigScreen: true },
      },
    })

    await wrapper.find('[data-testid="available-deviceDistribution"]').trigger('dragstart')
    await wrapper.find('[data-testid="layout-slot-6"]').trigger('drop')
    await flushPromises()

    expect(wrapper.find('[data-testid="layout-slot-6"]').classes()).toContain('is-placed')

    vi.advanceTimersByTime(520)
    await flushPromises()

    expect(wrapper.find('[data-testid="layout-slot-6"]').classes()).not.toContain('is-placed')
  })

  it('requires confirmation for destructive clear and reset actions', async () => {
    const pinia = createPinia()
    const wrapper = mount(ConfigPanel, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: { BigScreen: true },
      },
    })
    const store = useDashboardStore(pinia)
    const original = [...store.config.selectedModuleIds]

    const clearTrigger = wrapper.find('.config-shell-actions .is-clear')
    await clearTrigger.trigger('click')
    await flushPromises()
    const dialog = wrapper.find('[role="alertdialog"]')
    const dialogButtons = wrapper.findAll('[role="alertdialog"] button')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-labelledby')).toBe('config-confirm-title')
    expect(document.activeElement).toBe(dialogButtons[0].element)

    const confirmButton = dialogButtons[1].element as HTMLElement
    confirmButton.focus()
    await dialogButtons[1].trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(dialogButtons[0].element)

    await dialog.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('[role="alertdialog"]').exists()).toBe(false)
    expect(document.activeElement).toBe(clearTrigger.element)
    expect(store.config.selectedModuleIds).toEqual(original)

    await clearTrigger.trigger('click')
    await wrapper.findAll('[role="alertdialog"] button')[1].trigger('click')
    expect(store.config.selectedModuleIds.some(Boolean)).toBe(false)

    store.setLayout('2x3')
    await wrapper.find('.config-shell-actions .is-reset').trigger('click')
    await wrapper.findAll('[role="alertdialog"] button')[1].trigger('click')
    expect(store.config.layout).toBe('3x3')
    wrapper.unmount()
  })

  it('renders theme and layout previews and requests fullscreen on the live preview element', async () => {
    const requestFullscreen = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    HTMLElement.prototype.requestFullscreen = requestFullscreen
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
        stubs: { BigScreen: true },
      },
    })

    expect(wrapper.findAll('.theme-swatch-dot')).toHaveLength(themes.length * 3)
    expect(wrapper.findAll('.layout-choice-preview.is-2x3 i')).toHaveLength(6)
    expect(wrapper.findAll('.layout-choice-preview.is-3x3 i')).toHaveLength(9)

    await wrapper.find('[data-testid="preview-fullscreen"]').trigger('click')
    await flushPromises()

    expect(requestFullscreen).toHaveBeenCalledTimes(1)
    expect(requestFullscreen.mock.contexts[0]).toBe(wrapper.find('.config-live-preview').element)
  })

  it('keeps local auto-save feedback visible independently from publish feedback', async () => {
    const wrapper = mount(ConfigPanel, {
      global: {
        plugins: [createPinia()],
        stubs: { BigScreen: true },
      },
    })

    expect(wrapper.find('.config-save-state').text()).toContain('修改自动保存到本机')
    expect(wrapper.find('.config-published-state').exists()).toBe(false)

    await wrapper.find('.config-publish-button').trigger('click')

    expect(wrapper.find('.config-save-state').text()).toContain('修改自动保存到本机')
    expect(wrapper.find('.config-published-state').text()).toContain('已发布')
  })
})
