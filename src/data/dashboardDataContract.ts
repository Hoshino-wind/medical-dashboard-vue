import type {
  AvailabilityItem,
  BarChartData,
  ChartSeries,
  DashboardData,
  DeviceDistributionItem,
  HealthTrendData,
  InspectionOrders,
  LineChartData,
  OverviewData,
  RepairOrder,
  ServiceOrderRow,
} from '@/types/dashboard'

type UnknownRecord = Record<string, unknown>

export class DashboardDataValidationError extends Error {
  constructor(
    public readonly path: string,
    expected: string,
  ) {
    super(`大屏数据字段 ${path} 应为${expected}`)
    this.name = 'DashboardDataValidationError'
  }
}

function record(value: unknown, path: string): UnknownRecord {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as UnknownRecord
  }
  throw new DashboardDataValidationError(path, '对象')
}

function array(value: unknown, path: string): unknown[] {
  if (Array.isArray(value)) return value
  throw new DashboardDataValidationError(path, '数组')
}

function string(value: unknown, path: string): string {
  if (typeof value === 'string') return value
  throw new DashboardDataValidationError(path, '字符串')
}

function number(value: unknown, path: string): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  throw new DashboardDataValidationError(path, '有限数字')
}

function parseHeader(value: unknown): DashboardData['header'] {
  const source = record(value, 'header')
  return {
    brand: string(source.brand, 'header.brand'),
    title: string(source.title, 'header.title'),
    hospital: string(source.hospital, 'header.hospital'),
    subtitle: string(source.subtitle, 'header.subtitle'),
    updatedAt: string(source.updatedAt, 'header.updatedAt'),
  }
}

function parseOverview(value: unknown): OverviewData {
  const source = record(value, 'overview')
  return {
    total: number(source.total, 'overview.total'),
    available: number(source.available, 'overview.available'),
    availability: number(source.availability, 'overview.availability'),
    repairing: number(source.repairing, 'overview.repairing'),
    maintenanceDue: number(source.maintenanceDue, 'overview.maintenanceDue'),
    inspectionDue: number(source.inspectionDue, 'overview.inspectionDue'),
  }
}

function parseRepairOrders(value: unknown): RepairOrder[] {
  return array(value, 'repairOrders').map((item, index) => {
    const path = `repairOrders[${index}]`
    const source = record(item, path)
    return {
      department: string(source.department, `${path}.department`),
      equipName: string(source.equipName, `${path}.equipName`),
      repairCode: string(source.repairCode, `${path}.repairCode`),
      reportDuration: string(source.reportDuration, `${path}.reportDuration`),
      responder: string(source.responder, `${path}.responder`),
      status: string(source.status, `${path}.status`),
    }
  })
}

function parseServiceRows(value: unknown, path: string): ServiceOrderRow[] {
  return array(value, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const source = record(item, itemPath)
    return {
      department: string(source.department, `${itemPath}.department`),
      equipName: string(source.equipName, `${itemPath}.equipName`),
      remainLabel: string(source.remainLabel, `${itemPath}.remainLabel`),
      engineer: string(source.engineer, `${itemPath}.engineer`),
    }
  })
}

function parseInspectionOrders(value: unknown): InspectionOrders {
  const source = record(value, 'inspectionOrders')
  return {
    rate: number(source.rate, 'inspectionOrders.rate'),
    total: number(source.total, 'inspectionOrders.total'),
    finished: number(source.finished, 'inspectionOrders.finished'),
    waiting: number(source.waiting, 'inspectionOrders.waiting'),
    overdue: number(source.overdue, 'inspectionOrders.overdue'),
    rows: parseServiceRows(source.rows, 'inspectionOrders.rows'),
  }
}

function parseAvailabilityItems(value: unknown, path: string): AvailabilityItem[] {
  return array(value, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const source = record(item, itemPath)
    return {
      name: string(source.name, `${itemPath}.name`),
      value: number(source.value, `${itemPath}.value`),
      count: number(source.count, `${itemPath}.count`),
    }
  })
}

function parseDeviceDistribution(value: unknown): DeviceDistributionItem[] {
  return array(value, 'deviceDistribution').map((item, index) => {
    const path = `deviceDistribution[${index}]`
    const source = record(item, path)
    return {
      name: string(source.name, `${path}.name`),
      count: number(source.count, `${path}.count`),
      rate: number(source.rate, `${path}.rate`),
    }
  })
}

function parseStringArray(value: unknown, path: string): string[] {
  return array(value, path).map((item, index) => string(item, `${path}[${index}]`))
}

function parseNumberArray(value: unknown, path: string): number[] {
  return array(value, path).map((item, index) => number(item, `${path}[${index}]`))
}

function assertSeriesLength(labels: string[], data: number[], path: string) {
  if (labels.length !== data.length) {
    throw new DashboardDataValidationError(
      path,
      `与 labels 等长的数组（当前 ${data.length}/${labels.length}）`,
    )
  }
}

function parseLineChart(value: unknown, path: string): LineChartData {
  const source = record(value, path)
  const labels = parseStringArray(source.labels, `${path}.labels`)
  const data = parseNumberArray(source.data, `${path}.data`)
  assertSeriesLength(labels, data, `${path}.data`)
  return { labels, data }
}

function parseChartSeries(value: unknown, labels: string[], path: string): ChartSeries[] {
  return array(value, path).map((item, index) => {
    const itemPath = `${path}[${index}]`
    const source = record(item, itemPath)
    const data = parseNumberArray(source.data, `${itemPath}.data`)
    assertSeriesLength(labels, data, `${itemPath}.data`)
    return { name: string(source.name, `${itemPath}.name`), data }
  })
}

function parseBarChart(value: unknown): BarChartData {
  const source = record(value, 'repairStats')
  const labels = parseStringArray(source.labels, 'repairStats.labels')
  return { labels, series: parseChartSeries(source.series, labels, 'repairStats.series') }
}

function parseHealthTrend(value: unknown): HealthTrendData {
  const source = record(value, 'healthTrend')
  return {
    online: number(source.online, 'healthTrend.online'),
    warning: number(source.warning, 'healthTrend.warning'),
    repairing: number(source.repairing, 'healthTrend.repairing'),
    pending: number(source.pending, 'healthTrend.pending'),
    score: number(source.score, 'healthTrend.score'),
    rows: parseServiceRows(source.rows, 'healthTrend.rows'),
  }
}

/** 外部 JSON 和内置样例都必须通过同一运行时契约后才能进入组件层。 */
export function parseDashboardData(value: unknown): DashboardData {
  const source = record(value, '$')
  return {
    header: parseHeader(source.header),
    overview: parseOverview(source.overview),
    repairOrders: parseRepairOrders(source.repairOrders),
    inspectionOrders: parseInspectionOrders(source.inspectionOrders),
    lifeSupport: parseAvailabilityItems(source.lifeSupport, 'lifeSupport'),
    ultrasound: parseAvailabilityItems(source.ultrasound, 'ultrasound'),
    deviceDistribution: parseDeviceDistribution(source.deviceDistribution),
    repairStats: parseBarChart(source.repairStats),
    maintenanceStats: parseLineChart(source.maintenanceStats, 'maintenanceStats'),
    inspectionStats: parseLineChart(source.inspectionStats, 'inspectionStats'),
    healthTrend: parseHealthTrend(source.healthTrend),
  }
}
