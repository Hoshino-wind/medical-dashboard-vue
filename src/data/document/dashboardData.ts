import rawDashboardData from './bigScreenData.txt?raw'
import { parseBigScreenFakeData } from './parseBigScreenFakeData'
import type {
  DashboardData,
  HealthTrendData,
  InspectionOrders,
  RepairOrder,
} from '@/types/dashboard'
import type {
  ParsedBigScreenFakeData,
  ParsedRepairOrderItem,
  ServiceOrderItem,
} from './parseBigScreenFakeData'

const parsedDashboardData = parseBigScreenFakeData(rawDashboardData)

export const dashboardData: DashboardData = toDashboardData(parsedDashboardData)

function toDashboardData(source: ParsedBigScreenFakeData): DashboardData {
  return {
    header: {
      brand: 'Sunnicare 上云赋',
      title: '医疗设备全场景智慧管理系统',
      hospital: '江门市中心医院',
      subtitle: 'Jiangmen Central Hospital',
      updatedAt: '2026-07-02 20:53:21',
    },
    overview: source.overview,
    repairOrders: source.repairOrders.map(toRepairOrderRow),
    inspectionOrders: toInspectionOrders(source.inspectionOrders),
    lifeSupport: source.lifeSupport,
    ultrasound: source.ultrasound,
    deviceDistribution: source.deviceDistribution,
    repairStats: source.repairStats,
    maintenanceStats: source.maintenanceStats,
    inspectionStats: source.inspectionStats,
    healthTrend: toMaintenanceTrend(source),
  }
}

function toRepairOrderRow(order: ParsedRepairOrderItem): RepairOrder {
  return [
    order.department,
    order.equipName,
    order.repairCode,
    order.repairReportDuration,
    order.responder,
    order.status,
  ]
}

function toInspectionOrders(orders: ServiceOrderItem[]): InspectionOrders {
  const overdue = orders.filter((order) => numericRemainDays(order.remainDays) <= 0).length
  const waiting = orders.length - overdue

  return {
    rate: 0,
    total: orders.length,
    finished: 0,
    waiting,
    overdue,
    rows: orders.map(toServiceOrderRow),
  }
}

function toMaintenanceTrend(source: ParsedBigScreenFakeData): HealthTrendData {
  const warning = source.maintenanceOrders.filter(
    (order) => numericRemainDays(order.remainDays) <= 0,
  ).length
  const pending = source.maintenanceOrders.length - warning

  return {
    online: source.overview.available,
    warning,
    repairing: source.overview.repairing,
    pending,
    score: source.overview.availability,
    rows: source.maintenanceOrders.map(toServiceOrderRow),
  }
}

function toServiceOrderRow(order: ServiceOrderItem): string[] {
  return [
    order.department,
    order.equipName,
    formatRemainDays(order.remainDays),
    order.engineerName,
  ]
}

function formatRemainDays(value: number | string): string {
  return typeof value === 'number' ? `${value}天` : value
}

function numericRemainDays(value: number | string): number {
  if (typeof value === 'number') {
    return value
  }

  const match = value.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}
