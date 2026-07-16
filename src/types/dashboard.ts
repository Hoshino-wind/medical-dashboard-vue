/**
 * 大屏业务数据模型。
 *
 * 这是 mock 数据的"接口契约":所有 mock 数据都实现这些类型,
 * 组件 props 也引用这些类型,从而消除原先 `data: Object` 的类型黑洞。
 * 未来接入真实后端时,只需保证接口返回结构满足这些类型即可平滑替换。
 */

/** 顶部品牌信息 */
export interface HeaderData {
  brand: string
  title: string
  hospital: string
  subtitle: string
  updatedAt: string
}

/** 设备总览 */
export interface OverviewData {
  total: number
  available: number
  availability: number
  repairing: number
  maintenanceDue: number
  inspectionDue: number
}

/** 维修工单:一行数据为字符串数组,顺序对应表头 */
export type RepairOrder = string[]

/** 巡检工单聚合 */
export interface InspectionOrders {
  rate: number
  total: number
  finished: number
  waiting: number
  overdue: number
  rows: string[][]
}

/** 设备可用率条目(生命支持 / 超声) */
export interface AvailabilityItem {
  name: string
  value: number
  count: number
}

/** 设备分布台数占比条目 */
export interface DeviceDistributionItem {
  name: string
  count: number
  rate: number
}

/** 报修统计的多系列数据 */
export interface ChartSeries {
  name: string
  data: number[]
}

/** 柱状图(报修统计)数据 */
export interface BarChartData {
  labels: string[]
  series: ChartSeries[]
}

/** 折线图(保养/巡检统计)数据 */
export interface LineChartData {
  labels: string[]
  data: number[]
}

/** 可由折线图和柱状图共同消费的笛卡尔坐标图表数据。 */
export type CartesianChartData = BarChartData | LineChartData

/** 设备健康状态 */
export interface HealthTrendData {
  online: number
  warning: number
  repairing: number
  pending: number
  score: number
  rows: string[][]
}

/** 大屏全量数据聚合 */
export interface DashboardData {
  header: HeaderData
  overview: OverviewData
  repairOrders: RepairOrder[]
  inspectionOrders: InspectionOrders
  lifeSupport: AvailabilityItem[]
  ultrasound: AvailabilityItem[]
  deviceDistribution: DeviceDistributionItem[]
  repairStats: BarChartData
  maintenanceStats: LineChartData
  inspectionStats: LineChartData
  healthTrend: HealthTrendData
}
