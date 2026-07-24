import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CompletionModule from '@/components/modules/CompletionModule.vue'
import WorkOrderTable from '@/components/modules/WorkOrderTable.vue'
import HealthTrendModule from '@/components/modules/HealthTrendModule.vue'
import { themes } from '@/data/themes'

const CountUpStub = {
  props: ['value'],
  template: '<span>{{ value }}</span>',
}

const PieStub = {
  props: ['items', 'total', 'tone'],
  template: '<div class="pie-stub" data-test="pie-chart">{{ total }}</div>',
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
            {
              department: '血液科层流病房',
              equipName: '不锈钢床头柜',
              remainLabel: '25天',
              engineer: '叶茂永',
            },
            {
              department: '血液科层流病房',
              equipName: '病房对讲机',
              remainLabel: '25天',
              engineer: '叶茂永',
            },
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
    expect(wrapper.text()).toContain('本月保养完成率')
    expect(wrapper.text()).toContain('总数1482单')
    expect(wrapper.text()).toContain('已完成1411单')
    expect(wrapper.text()).toContain('待保养71单')
    expect(wrapper.find('[data-test="pie-chart"]').exists()).toBe(true)
    expect(wrapper.find('.inspection-status-summary .is-total').exists()).toBe(true)
  })

  it('renders health trend as a compact status list plus full-width bottom status summary', () => {
    const wrapper = mount(HealthTrendModule, {
      props: {
        theme: themes[0],
        data: {
          online: 15744,
          warning: 68,
          repairing: 44,
          pending: 102,
          score: 96.8,
          rows: [
            {
              department: '运行正常',
              equipName: '生命支持设备',
              remainLabel: '15,744台',
              engineer: '稳定',
            },
            {
              department: '维保预警',
              equipName: '呼吸机/监护仪',
              remainLabel: '68台',
              engineer: '需排查',
            },
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          HealthPieChart: PieStub,
        },
      },
    })

    expect(wrapper.find('.health-status-grid').exists()).toBe(true)
    expect(wrapper.find('.health-status-table').exists()).toBe(true)
    expect(wrapper.find('.health-pie-panel').exists()).toBe(true)
    expect(wrapper.find('.health-status-summary').exists()).toBe(true)
    expect(wrapper.find('.health-pie-panel .health-status-summary').exists()).toBe(false)
    expect(wrapper.text()).toContain('生命支持设备')
    expect(wrapper.text()).toContain('本月保养完成率')
    expect(wrapper.text()).toContain('运行正常15744台')
    expect(wrapper.text()).toContain('维保预警68台')
    expect(wrapper.text()).toContain('维修中44台')
    expect(wrapper.text()).toContain('待保养102台')
    expect(wrapper.find('[data-test="pie-chart"]').exists()).toBe(true)
    const pie = wrapper.findComponent(PieStub)
    expect(pie.props('tone')).toBe('#1677ff')
    expect(pie.props('items')[0]).toMatchObject({
      name: '运行正常',
      color: '#1677ff',
    })
  })

  it('does not render the removed static repair summary row', () => {
    const wrapper = mount(WorkOrderTable, {
      props: {
        rows: [
          {
            department: '手术中心',
            equipName: '监护仪',
            repairCode: 'ERB-1',
            reportDuration: '2天',
            responder: '李明',
            status: '维修中',
          },
          {
            department: '检验科',
            equipName: '分析仪',
            repairCode: 'ERB-2',
            reportDuration: '1天',
            responder: '王华',
            status: '待接修',
          },
        ],
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
        },
      },
    })

    expect(wrapper.find('.work-order-summary').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('维修中44单')
    expect(wrapper.text()).not.toContain('配件运输中18单')
    expect(wrapper.text()).not.toContain('待接修1单')
    expect(wrapper.text()).not.toContain('已维修1326单')
  })

  it('pins pending repair orders before the scrolling repair list with distinct status colors and no vertical warning stripes', () => {
    const wrapper = mount(WorkOrderTable, {
      props: {
        rows: [
          {
            department: '手术中心',
            equipName: '监护仪',
            repairCode: 'ERB-1',
            reportDuration: '2天',
            responder: '李明',
            status: '维修中',
          },
          {
            department: '检验科',
            equipName: '分析仪',
            repairCode: 'ERB-2',
            reportDuration: '1天',
            responder: '王华',
            status: '待接修',
          },
          {
            department: '放射科',
            equipName: 'DR 摄影系统',
            repairCode: 'ERB-3',
            reportDuration: '8小时',
            responder: '赵敏',
            status: '配件运输中',
          },
          {
            department: '急诊科',
            equipName: '除颤仪',
            repairCode: 'ERB-4',
            reportDuration: '3小时',
            responder: '陈诚',
            status: '待接修',
          },
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
    expect(pinnedTable.find('.status-pill').attributes('style')).toContain('var(--warn)')
    expect(scrollingViewport.find('.status-pill').attributes('style')).toContain('var(--danger)')
  })

  it('renders list rows without row number badges or a default active first row', () => {
    const repairOrders = mount(WorkOrderTable, {
      props: {
        rows: [
          {
            department: '手术中心',
            equipName: '监护仪',
            repairCode: 'ERB-1',
            reportDuration: '2天',
            responder: '李明',
            status: '维修中',
          },
          {
            department: '检验科',
            equipName: '分析仪',
            repairCode: 'ERB-2',
            reportDuration: '1天',
            responder: '王华',
            status: '已维修',
          },
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
            {
              department: '临床药学组',
              equipName: '微量分析天平',
              remainLabel: '29天',
              engineer: '刘民华',
            },
            {
              department: '临床药学组',
              equipName: '分析天平',
              remainLabel: '29天',
              engineer: '刘民华',
            },
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
    const maintenanceOrders = mount(HealthTrendModule, {
      props: {
        theme: themes[1],
        data: {
          online: 15744,
          warning: 68,
          repairing: 44,
          pending: 102,
          score: 96.8,
          rows: [
            {
              department: '全院设备',
              equipName: '运行正常',
              remainLabel: '15,744台',
              engineer: '稳定',
            },
            {
              department: '生命支持设备',
              equipName: '维保预警',
              remainLabel: '68台',
              engineer: '需排查',
            },
          ],
        },
      },
      global: {
        stubs: {
          CountUp: CountUpStub,
          HealthPieChart: PieStub,
        },
      },
    })

    for (const wrapper of [repairOrders, inspectionOrders, maintenanceOrders]) {
      expect(wrapper.findAll('.table-row-icon')).toHaveLength(0)
      expect(wrapper.findAll('tbody tr.is-active')).toHaveLength(0)
    }
  })
})
