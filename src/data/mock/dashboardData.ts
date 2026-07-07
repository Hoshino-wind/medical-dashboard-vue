import type { DashboardData } from '@/types/dashboard'

/**
 * Mock 业务数据。
 *
 * 注意:组件不应直接 import 此文件,请通过 `useDashboardData()` 获取。
 * 这样未来接入真实后端时,只需替换 composable 内部实现即可。
 */
export const dashboardData: DashboardData = {
  header: {
    brand: 'Sunnicare 上云赋',
    title: '医疗设备全场景智慧管理系统',
    hospital: '江门市中心医院',
    subtitle: 'Jiangmen Central Hospital',
    updatedAt: '2026-07-02 20:53:21',
  },
  overview: {
    total: 16592,
    available: 13055,
    availability: 99.9,
    repairing: 44,
    maintenanceDue: 102,
    inspectionDue: 15354,
  },
  repairOrders: [
    ['消毒供应中心', '蒸汽清洗机', 'ERB-202605040', '57天3小时12分', '陈嘉诚', '维修中'],
    ['手术中心', '4K内窥镜荧光摄像', 'ERB-202606106', '27天5小时59分', '李明杰', '维修中'],
    ['神经外科ICU住院', '呼吸机', 'ERB-202606381', '16天8小时53分', '胡萍', '配件运输中'],
    ['中区口腔门诊', '牙科综合治疗台', 'ERB-202606516', '12天6小时20分', '李东菱', '已接修'],
    ['心血管内科', '除颤监护仪', 'ERB-202606421', '8天9小时11分', '吴良美', '已接修'],
  ],
  inspectionOrders: {
    rate: 95.2,
    total: 1482,
    finished: 1411,
    waiting: 71,
    overdue: 12,
    rows: [
      ['临床药学组', '微量分析天平', '29天', '刘民华'],
      ['临床药学组', '分析天平', '29天', '刘民华'],
      ['临床药学组', 'APCI源', '29天', '刘民华'],
      ['临床药学组', '恒温干燥箱', '29天', '刘民华'],
    ],
  },
  lifeSupport: [
    { name: '心电图机', value: 92.6, count: 68 },
    { name: '注射泵', value: 94.7, count: 717 },
    { name: '输液泵', value: 94.8, count: 210 },
  ],
  ultrasound: [
    { name: '感染科重症监护', value: 100, count: 1 },
    { name: '风湿免疫科住院', value: 100, count: 1 },
    { name: '临床药学组', value: 100, count: 1 },
  ],
  repairStats: {
    labels: ['06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02'],
    series: [
      { name: '全保', data: [0, 187, 274, 0, 331, 102, 36] },
      { name: '技保', data: [0, 0, 0, 49, 102, 8, 0] },
      { name: '厂保', data: [0, 0, 0, 0, 0, 0, 0] },
    ],
  },
  maintenanceStats: {
    labels: ['06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02'],
    data: [1100, 2400, 6900, 8600, 5800, 1900, 1800],
  },
  inspectionStats: {
    labels: ['06-26', '06-27', '06-28', '06-29', '06-30', '07-01', '07-02'],
    data: [0, 30000, 16000, 16000, 19000, 18500, 18000],
  },
  healthTrend: {
    online: 15744,
    warning: 68,
    repairing: 44,
    pending: 102,
    score: 96.8,
    rows: [
      ['全院设备', '运行正常', '15,744台', '稳定'],
      ['生命支持设备', '维保预警', '68台', '需排查'],
      ['普通诊疗设备', '维修中', '44台', '处理中'],
      ['重点科室设备', '即将保养', '102台', '待安排'],
    ],
  },
}
