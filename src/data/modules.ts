import type { ModuleCatalogItem } from '@/types/module'
import type { DashboardConfig, FieldConfig, ModuleSettingsMap } from '@/types/config'

/** 模块目录:定义大屏可用的 9 个模块及其渲染元信息 */
export const moduleCatalog: ModuleCatalogItem[] = [
  { id: 'overview', number: '01', title: '设备总览', kind: 'overview', size: 'normal' },
  { id: 'repairOrders', number: '02', title: '维修工单', kind: 'table', size: 'wide' },
  {
    id: 'repairStats',
    number: '03',
    title: '报修统计',
    subtitle: '近7天',
    kind: 'bar',
    size: 'normal',
  },
  {
    id: 'lifeSupport',
    number: '04',
    title: '生命支持设备可用率',
    kind: 'availability',
    size: 'normal',
  },
  { id: 'inspectionOrders', number: '05', title: '巡检工单', kind: 'completion', size: 'wide' },
  {
    id: 'maintenanceStats',
    number: '06',
    title: '保养统计',
    subtitle: '近7天',
    kind: 'line',
    size: 'normal',
  },
  { id: 'ultrasound', number: '07', title: '超声设备可用率', kind: 'availability', size: 'normal' },
  { id: 'healthTrend', number: '08', title: '设备健康态势', kind: 'health', size: 'wide' },
  {
    id: 'inspectionStats',
    number: '09',
    title: '巡检统计',
    subtitle: '近7天',
    kind: 'line',
    size: 'normal',
  },
]

function fields(items: Array<Omit<FieldConfig, 'visible'>>): FieldConfig[] {
  return items.map((item) => ({ ...item, visible: true }))
}

/** 每个模块的默认字段配置:字段 key 同渲染注册表中的数据映射保持一致。 */
export const defaultModuleSettings: ModuleSettingsMap = {
  overview: {
    title: '设备总览',
    fields: fields([
      { key: 'availability', label: '设备可用率', unit: '%' },
      { key: 'total', label: '设备总数', unit: '台' },
      { key: 'available', label: '可用设备', unit: '台' },
      { key: 'repairing', label: '维修中', unit: '台' },
      { key: 'maintenanceDue', label: '待保养', unit: '台' },
      { key: 'inspectionDue', label: '待巡检', unit: '台' },
    ]),
  },
  repairOrders: {
    title: '维修工单',
    fields: fields([
      { key: 'department', label: '所属科室' },
      { key: 'equipment', label: '设备名称' },
      { key: 'code', label: '编号' },
      { key: 'duration', label: '报修时长' },
      { key: 'owner', label: '响应人' },
      { key: 'status', label: '工单状态' },
    ]),
  },
  repairStats: {
    title: '报修统计',
    subtitle: '近7天',
    fields: fields([
      { key: 'fullService', label: '全保', unit: '单' },
      { key: 'techService', label: '技保', unit: '单' },
      { key: 'vendorService', label: '厂保', unit: '单' },
    ]),
  },
  lifeSupport: {
    title: '生命支持设备可用率',
    fields: fields([
      { key: 'ecg', label: '心电图机', unit: '台' },
      { key: 'syringePump', label: '注射泵', unit: '台' },
      { key: 'infusionPump', label: '输液泵', unit: '台' },
    ]),
  },
  inspectionOrders: {
    title: '巡检工单',
    fields: fields([
      { key: 'rate', label: '本月巡检完成率', unit: '%' },
      { key: 'total', label: '巡检工单总数', unit: '单' },
      { key: 'finished', label: '已完成', unit: '单' },
      { key: 'waiting', label: '待巡检', unit: '单' },
      { key: 'overdue', label: '逾期未检', unit: '单' },
    ]),
  },
  maintenanceStats: {
    title: '保养统计',
    subtitle: '近7天',
    fields: fields([{ key: 'count', label: '保养数量', unit: '单' }]),
  },
  ultrasound: {
    title: '超声设备可用率',
    fields: fields([
      { key: 'infectionIcu', label: '感染科重症监护', unit: '台' },
      { key: 'rheumatology', label: '风湿免疫科住院', unit: '台' },
      { key: 'clinicalPharmacy', label: '临床药学组', unit: '台' },
    ]),
  },
  healthTrend: {
    title: '设备健康态势',
    fields: fields([
      { key: 'online', label: '运行正常', unit: '台' },
      { key: 'warning', label: '维保预警', unit: '台' },
      { key: 'repairing', label: '维修中', unit: '台' },
      { key: 'pending', label: '即将保养', unit: '台' },
      { key: 'score', label: '健康评分', unit: '分' },
    ]),
  },
  inspectionStats: {
    title: '巡检统计',
    subtitle: '近7天',
    fields: fields([{ key: 'count', label: '巡检数量', unit: '单' }]),
  },
}

/** 默认配置 */
export const defaultConfig: DashboardConfig = {
  themeId: 'clinical-command',
  layout: '3x3',
  moduleOrder: moduleCatalog.map((item) => item.id),
  moduleSettings: defaultModuleSettings,
}
