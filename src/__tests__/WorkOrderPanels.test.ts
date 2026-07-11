import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import CompletionModule from '@/components/modules/CompletionModule.vue'
import WorkOrderTable from '@/components/shared/WorkOrderTable.vue'
import { moduleRegistry } from '@/config/moduleRegistry'
import { dashboardData } from '@/data/document/dashboardData'
import { moduleCatalog } from '@/data/modules'
import { themes } from '@/data/themes'

const testDir = dirname(fileURLToPath(import.meta.url))

const CountUpStub = {
  props: ['value'],
  template: '<span>{{ value }}</span>',
}

const PieStub = {
  props: ['items', 'total', 'tone', 'autoRotate'],
  template:
    '<div class="pie-stub" data-test="pie-chart" :data-auto-rotate="autoRotate"><span v-for="item in items" :key="item.name">{{ item.name }}</span>{{ total }}</div>',
}

describe('work order style panels', () => {
  it('renders inspection orders as a compact detail list plus full-width bottom status summary', () => {
    const wrapper = mount(CompletionModule, {
      props: {
        data: {
          rate: 95.2,
          total: 1482,
          finished: 1411,
          waiting: 71,
          overdue: 12,
          rows: [
            ['血液科层流病房', '不锈钢床头柜', '25天', '叶茂永'],
            ['血液科层流病房', '病房对讲机', '25天', '叶茂永'],
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          Pie3D: PieStub,
        },
      },
    })

    expect(wrapper.find('.inspection-order-grid').exists()).toBe(true)
    expect(wrapper.find('.inspection-order-table').exists()).toBe(true)
    expect(wrapper.find('.inspection-pie-panel').exists()).toBe(true)
    expect(wrapper.find('.inspection-status-summary').exists()).toBe(true)
    expect(wrapper.find('.inspection-pie-panel .inspection-status-summary').exists()).toBe(false)
    expect(wrapper.text()).toContain('血液科层流病房')
    expect(wrapper.text()).toContain('本月巡检完成率')
    expect(wrapper.text()).toContain('总数1482单')
    expect(wrapper.text()).toContain('已完成1411单')
    expect(wrapper.text()).toContain('待巡检71单')
    expect(wrapper.find('[data-test="pie-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pie-chart"]').attributes('data-auto-rotate')).toBe('true')
    expect(wrapper.find('.inspection-status-summary .is-total').exists()).toBe(true)
    expect(wrapper.findAll('.module-status-summary > .module-status-metric')).toHaveLength(3)
  })

  it('renders maintenance orders with maintenance-specific copy', () => {
    const wrapper = mount(CompletionModule, {
      props: {
        variant: 'maintenance',
        data: {
          rate: 88.6,
          total: 1482,
          finished: 1313,
          waiting: 169,
          overdue: 12,
          rows: [
            ['紧急医学救援队', '呼吸机', '0天', '/'],
            ['耳鼻咽喉科', '冷藏冷冻机', '10天', '欧阳张三'],
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          Pie3D: PieStub,
        },
      },
    })

    expect(wrapper.find('.inspection-order-grid').exists()).toBe(true)
    expect(wrapper.find('.inspection-order-table').exists()).toBe(true)
    expect(wrapper.find('.inspection-pie-panel').exists()).toBe(true)
    expect(wrapper.find('.inspection-status-summary').exists()).toBe(true)
    expect(wrapper.text()).toContain('紧急医学救援队')
    expect(wrapper.text()).toContain('本月保养完成率')
    expect(wrapper.text()).toContain('待保养')
    expect(wrapper.text()).not.toContain('待巡检')
    expect(wrapper.find('[data-test="pie-chart"]').text()).toContain('逾期未保养')
    expect(wrapper.find('[data-test="pie-chart"]').text()).not.toContain('逾期未检')
    expect(wrapper.find('[data-test="pie-chart"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="pie-chart"]').attributes('data-auto-rotate')).toBe('true')
    expect(wrapper.findAll('.module-status-summary > .module-status-metric')).toHaveLength(3)
  })

  it('routes the saved healthTrend catalog slot to maintenance completion orders', () => {
    const healthModule = moduleCatalog.find((module) => module.id === 'healthTrend')!
    const theme = themes[0]!

    expect(moduleRegistry.health.component).toBe(moduleRegistry.completion.component)
    expect(
      moduleRegistry.health.resolveProps(healthModule, { data: dashboardData, theme }),
    ).toEqual({ data: dashboardData.maintenanceOrders, theme, variant: 'maintenance' })
  })

  it('uses status tone variables and a breathing divider for completion orders', () => {
    const moduleStyles = readFileSync(join(testDir, '../styles/modules.css'), 'utf8')

    expect(moduleStyles).toContain('--status-tone')
    expect(moduleStyles).toContain('.module-status-summary b')
    expect(moduleStyles).toContain('grid-template-columns: auto auto auto')
    expect(moduleStyles).toContain('.module-status-summary b > span')
    expect(moduleStyles).toContain('height: 1rem')
    expect(moduleStyles).toContain('.module-status-metric::before')
    expect(moduleStyles).toContain('.module-status-metric::after')
    expect(moduleStyles).toContain('.inspection-status-summary .is-total')
    expect(moduleStyles).toContain('--data-inspection-pie-finished')
    expect(moduleStyles).toContain('--data-inspection-pie-waiting')
    expect(moduleStyles).toContain('--data-inspection-pie-overdue')
    expect(moduleStyles).toContain('--data-health-pie-good')
    expect(moduleStyles).toContain('--data-health-pie-warning')
    expect(moduleStyles).toContain('--data-health-pie-repairing')
    expect(moduleStyles).toContain('--data-health-pie-pending')

    expect(moduleStyles).not.toContain('.inspection-order-grid::after')
    expect(moduleStyles).not.toContain('.health-status-grid::after')
    expect(moduleStyles).toContain('.pie-summary-panel::before')
    expect(moduleStyles).toContain('.pie-summary-panel::after')
    expect(moduleStyles).toContain('@keyframes completion-divider-breathe')
    expect(moduleStyles).toContain(
      'animation: completion-divider-breathe var(--motion-loop-status) ease-in-out infinite',
    )
  })

  it('does not render a stale static summary below repair orders', () => {
    const wrapper = mount(WorkOrderTable, {
      props: {
        headers: ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态'],
        rows: [
          ['手术中心', '监护仪', 'ERB-1', '2天', '李明', '维修中'],
          ['检验科', '分析仪', 'ERB-2', '1天', '王华', '待接修'],
        ],
      },
    })

    expect(wrapper.find('.work-order-summary').exists()).toBe(false)
  })

  it('pins pending repair orders before the scrolling repair list with distinct status colors and no vertical warning stripes', () => {
    const tableStyles = readFileSync(join(testDir, '../styles/tables.css'), 'utf8')
    const wrapper = mount(WorkOrderTable, {
      props: {
        headers: ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态'],
        rows: [
          ['手术中心', '监护仪', 'ERB-1', '2天', '李明', '维修中'],
          ['检验科', '分析仪', 'ERB-2', '1天', '王华', '待接修'],
          ['放射科', 'DR 摄影系统', 'ERB-3', '8小时', '赵敏', '配件运输中'],
          ['急诊科', '除颤仪', 'ERB-4', '3小时', '陈诚', '待接修'],
        ],
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
        },
      },
    })

    const pinnedTable = wrapper.find('.work-order-pinned-table')
    const scrollingViewport = wrapper.find('.paged-viewport')

    expect(pinnedTable.exists()).toBe(true)
    expect(pinnedTable.findAll('tbody tr.is-pending-repair')).toHaveLength(2)
    expect(pinnedTable.text()).toContain('待接修')
    expect(scrollingViewport.text()).not.toContain('待接修')
    expect(scrollingViewport.text()).toContain('维修中')
    expect(scrollingViewport.text()).toContain('配件运输中')
    expect(tableStyles).toContain('.work-order-pinned-table .is-pending-repair')
    expect(wrapper.findAll('.status-energy-dot').length).toBeGreaterThan(0)
    expect(wrapper.find('.status-pill').classes()).toContain('status-pill--warn')
    expect(
      tableStyles.match(/\.work-order-pinned-table \.is-pending-repair td\s*\{[\s\S]*?\n\}/)?.[0] ?? '',
    ).not.toContain('inset 0.1875rem 0 0')
  })

  it('renders list rows without row number badges or a default active first row', () => {
    const repairOrders = mount(WorkOrderTable, {
      props: {
        headers: ['所属科室', '设备名称', '编号', '报修时长', '响应人', '工单状态'],
        rows: [
          ['手术中心', '监护仪', 'ERB-1', '2天', '李明', '维修中'],
          ['检验科', '分析仪', 'ERB-2', '1天', '王华', '已维修'],
        ],
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
        },
      },
    })
    const inspectionOrders = mount(CompletionModule, {
      props: {
        data: {
          rate: 95.2,
          total: 1482,
          finished: 1411,
          waiting: 71,
          overdue: 12,
          rows: [
            ['临床药学组', '微量分析天平', '29天', '刘民华'],
            ['临床药学组', '分析天平', '29天', '刘民华'],
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          Pie3D: PieStub,
        },
      },
    })
    const maintenanceOrders = mount(CompletionModule, {
      props: {
        variant: 'maintenance',
        data: {
          rate: 88.6,
          total: 1482,
          finished: 1313,
          waiting: 169,
          overdue: 12,
          rows: [
            ['紧急医学救援队', '呼吸机', '0天', '/'],
            ['耳鼻咽喉科', '冷藏冷冻机', '10天', '欧阳张三'],
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          Pie3D: PieStub,
        },
      },
    })

    for (const wrapper of [repairOrders, inspectionOrders, maintenanceOrders]) {
      expect(wrapper.findAll('.table-row-icon')).toHaveLength(0)
      expect(wrapper.findAll('tbody tr.is-active')).toHaveLength(0)
    }
  })

  it('keeps CountUp in chart summaries but not in the repair table', () => {
    const workOrderTable = readFileSync(join(testDir, '../components/shared/WorkOrderTable.vue'), 'utf8')
    const chartModule = readFileSync(join(testDir, '../components/modules/ChartModule.vue'), 'utf8')

    expect(workOrderTable).not.toContain("import CountUp from './CountUp.vue'")
    expect(workOrderTable).not.toContain('<CountUp')
    expect(chartModule).toContain("import CountUp from '../shared/CountUp.vue'")
    expect(chartModule).toContain('<CountUp :value="lineFooter.value"')
  })
})
