import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import ConfigPanel from '@/components/shared/ConfigPanel.vue'
import { useDashboardStore } from '@/stores/dashboard'

const testDir = dirname(fileURLToPath(import.meta.url))

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
    expect(styleOptions.map((option) => option.text())).toEqual([
      '流光玻璃',
      '无边框',
      '立体边框',
    ])

    const borderlessStyle = wrapper.find('[data-testid="panel-style-borderless"]')
    expect(borderlessStyle.exists()).toBe(true)
    await borderlessStyle.setValue()
    await flushPromises()

    expect(store.config.panelStyle).toBe('borderless')
    expect(wrapper.find('.panel-style-radio.active').text()).toContain('无边框')
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

  it('uses active theme colors for available business component cards', () => {
    const configPanel = readFileSync(
      join(testDir, '../components/shared/ConfigPanel.vue'),
      'utf8',
    )
    const cardBlock =
      configPanel.match(/\.business-component-card\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const interactiveBlock =
      configPanel.match(
        /\.business-component-card:hover,[\s\S]*?\.business-component-card:focus-visible\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(cardBlock).toContain('var(--accent)')
    expect(cardBlock).toContain('var(--surface-strong)')
    expect(cardBlock).not.toContain('#f2f3f5')
    expect(interactiveBlock).toContain('var(--accent)')
    expect(interactiveBlock).not.toContain('background: #ffffff')
  })

  it('renders property group legends as theme-aware section dividers', () => {
    const configPanel = readFileSync(
      join(testDir, '../components/shared/ConfigPanel.vue'),
      'utf8',
    )
    const legendBlock = configPanel.match(/\.property-group legend\s*\{[\s\S]*?\n\}/)?.[0] ?? ''
    const markerBlock =
      configPanel.match(/\.property-group legend::before\s*\{[\s\S]*?\n\}/)?.[0] ?? ''

    expect(legendBlock).toContain('width: 100%')
    expect(legendBlock).toContain('var(--accent)')
    expect(legendBlock).toContain('var(--text)')
    expect(legendBlock).not.toContain('background: #111')
    expect(markerBlock).toContain("content: ''")
    expect(markerBlock).toContain('var(--accent)')
  })

  it('removes all panel border layers in borderless mode', () => {
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const borderlessPanelBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='borderless'\][\s\S]*?\.screen-grid\s*>\s*\.panel\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const borderlessBeforeBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='borderless'\][\s\S]*?\.panel::before\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const borderlessFlowBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='borderless'\][\s\S]*?\.panel-border-flow\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(borderlessPanelBlock).toContain('border: 0')
    expect(borderlessPanelBlock).toContain('box-shadow: none')
    expect(borderlessBeforeBlock).toContain('display: none')
    expect(borderlessFlowBlock).toContain('display: none')
  })

  it('centers chamfered panel titles on the outer mechanical frame', () => {
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const chamferedTitleBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-header--main\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedBodyBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?>\s*\.panel-body\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedTitleFrameBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-title-frame\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedTitleTextBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-title-text\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedUnderlineBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.panel-title-text::after\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(chamferedTitleBlock).toContain('z-index: 5')
    expect(chamferedTitleBlock).toContain('padding-top: 0')
    expect(chamferedTitleBlock).toContain('padding-bottom: 0.0625rem')
    expect(chamferedTitleBlock).toContain('display: grid')
    expect(chamferedTitleBlock).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)')
    expect(chamferedBodyBlock).toContain('height: calc(100% - 2.4375rem)')
    expect(chamferedTitleFrameBlock).toContain('min-height: 2.375rem')
    expect(chamferedTitleFrameBlock).toContain('grid-column: 2')
    expect(chamferedTitleFrameBlock).toContain('align-items: center')
    expect(chamferedTitleTextBlock).toContain('padding-bottom: 0')
    expect(chamferedUnderlineBlock).toContain('display: none')
  })

  it('gives chamfered status summary cards enough text height and a shorter width', () => {
    const panelStyles = readFileSync(join(testDir, '../styles/panel.css'), 'utf8')
    const mechanicalFrame = readFileSync(
      join(testDir, '../components/visual/MechanicalFrame.vue'),
      'utf8',
    )
    const chamferedModuleGridBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?:is\(\.inspection-order-grid,\s*\.health-status-grid\)\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedSummaryBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.module-status-summary\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedSummaryItemBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.module-status-summary\s*>\s*div\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const chamferedCompactFrameBlock =
      panelStyles.match(
        /\.dashboard-shell\[data-panel-style='chamfered-instrument'\][\s\S]*?\.module-status-summary\s+\.mechanical-frame--compact\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''
    const purpleCompactFrameBlock =
      mechanicalFrame.match(
        /:global\(\.is-purple\s*>\s*\.mechanical-frame--compact\)\s*\{[\s\S]*?\n\}/,
      )?.[0] ?? ''

    expect(chamferedModuleGridBlock).toContain('grid-template-rows: minmax(0, 1fr) 3.25rem')
    expect(chamferedSummaryBlock).toContain('width: calc(100% - 1.25rem)')
    expect(chamferedSummaryBlock).toContain('height: 3.25rem')
    expect(chamferedSummaryBlock).toContain('justify-self: center')
    expect(chamferedSummaryItemBlock).toContain('width: calc(100% - 0.75rem)')
    expect(chamferedSummaryItemBlock).toContain('min-height: 3.25rem')
    expect(chamferedSummaryItemBlock).toContain('padding: 0.375rem 0.625rem')
    expect(chamferedCompactFrameBlock).toContain('display: block')
    expect(chamferedCompactFrameBlock).toContain('height: auto')
    expect(chamferedCompactFrameBlock).toContain('border-width: 0.5625rem')
    expect(chamferedCompactFrameBlock).toContain('border-image-width: 0.5625rem')
    expect(purpleCompactFrameBlock).toContain('opacity: 0.82')
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
