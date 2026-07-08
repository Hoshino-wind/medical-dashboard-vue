import { describe, expect, it } from 'vitest'
import { parseBigScreenFakeData } from '../parseBigScreenFakeData'

const source = String.raw`
生命支持设备可用率：
const fakeList = [
  { deviceName: '除颤仪', total: 4, percent: "90.0" },
  // { deviceName: '忽略项', total: 1, percent: "1.0" },
  { deviceName: '呼吸机', total: 3, percent: "80.5" },
]

设备分布台数占比：
const fakedeviceDataRaw = [
  { departmentName: '麻醉科', targetCount: 125, rate: 50.5 },
]

设备总览：
const deviceTotal = ref(16592);
const availableDevice = ref(13055);
const usageRate = ref('99.9'); // 使用率
const repairing = ref(44);
const toMaintain = ref(102);
const toInspect = ref(15354);

保养工单：
const fakeTableData = [
  { department: '紧急医学救援队', equipName: '呼吸机', remainDays: 0, engineerName: '/' },
]

保养统计：
const fakechartData = {
  subBusiness: ['2025-07', '2025-08'],
  UpKeepTotal: [200, 180]
}

巡检统计：
const fakechartData = {
  subBusiness: ['2025-07', '2025-08'],
  InspectionTotal: [220, 160]
}

巡检工单：
const fakeTableData = [
  { department: '耳鼻咽喉科', equipName: '冷藏冷冻机', remainDays: 10, engineerName: '张三' },
]

维修工单：
const fakeTableData = [
  {
    department: "手术麻醉中心",
    equipName: "史塞克台车",
    repairCode: "00001",
    repairReportDuration: "0天0小时23分",
    repairDuration: "0天0小时23分",
    responder: "/",
    status: "待响应"
  },
]

超声设备可用率：
const fakeList = [
  { departmentName: '手术室', totalCount: 4, availabilityRate: '80.0' },
]

报修统计：
const fakechartData = {
  subBusiness: ['2025-07', '2025-08'],
  FullyInsuredDeviceTotal: [23, 11],
  TechnicalInsuredDeviceTotal: [10, 48],
  FactoryInsureDeviceTotal: [12, 36]
}
`

describe('parseBigScreenFakeData', () => {
  it('parses the dashboard fake-data text by section instead of repeated variable names', () => {
    const parsed = parseBigScreenFakeData(source)

    expect(parsed.lifeSupport).toEqual([
      { name: '除颤仪', count: 4, value: 90 },
      { name: '呼吸机', count: 3, value: 80.5 },
    ])
    expect(parsed.deviceDistribution).toEqual([{ name: '麻醉科', count: 125, rate: 50.5 }])
    expect(parsed.overview).toEqual({
      total: 16592,
      available: 13055,
      availability: 99.9,
      repairing: 44,
      maintenanceDue: 102,
      inspectionDue: 15354,
    })
    expect(parsed.maintenanceOrders).toEqual([
      { department: '紧急医学救援队', equipName: '呼吸机', remainDays: 0, engineerName: '/' },
    ])
    expect(parsed.inspectionOrders).toEqual([
      { department: '耳鼻咽喉科', equipName: '冷藏冷冻机', remainDays: 10, engineerName: '张三' },
    ])
    expect(parsed.repairOrders).toEqual([
      {
        department: '手术麻醉中心',
        equipName: '史塞克台车',
        repairCode: '00001',
        repairReportDuration: '0天0小时23分',
        repairDuration: '0天0小时23分',
        responder: '/',
        status: '待响应',
      },
    ])
    expect(parsed.ultrasound).toEqual([{ name: '手术室', count: 4, value: 80 }])
    expect(parsed.maintenanceStats).toEqual({ labels: ['2025-07', '2025-08'], data: [200, 180] })
    expect(parsed.inspectionStats).toEqual({ labels: ['2025-07', '2025-08'], data: [220, 160] })
    expect(parsed.repairStats).toEqual({
      labels: ['2025-07', '2025-08'],
      series: [
        { name: '全保', data: [23, 11] },
        { name: '技保', data: [10, 48] },
        { name: '厂保', data: [12, 36] },
      ],
    })
  })

  it('throws a section-level error when an expected block is missing', () => {
    expect(() => parseBigScreenFakeData('生命支持设备可用率：\nconst fakeList = []')).toThrow(
      '缺少数据段: 设备分布台数占比',
    )
  })
})
