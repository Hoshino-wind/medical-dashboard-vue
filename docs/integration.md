# 大屏数据接口接入说明

## 接入方式

设置 `VITE_DASHBOARD_API_URL` 后，前端以 `GET` 请求该完整地址，请求头为 `Accept: application/json`。默认超时 8 秒，组件卸载时取消请求。

接口返回非 2xx、网络失败、超时或响应结构不合法时，页面显示错误状态。所有响应都会经过 `src/data/dashboardDataContract.ts` 的运行时校验。

## 响应结构

```json
{
  "header": {
    "brand": "Sunnicare 上云赋",
    "title": "医疗设备全场景智慧管理系统",
    "hospital": "江门市中心医院",
    "subtitle": "Jiangmen Central Hospital",
    "updatedAt": "2026-07-02 20:53:21"
  },
  "overview": {
    "total": 16592,
    "available": 13055,
    "availability": 99.9,
    "repairing": 44,
    "maintenanceDue": 102,
    "inspectionDue": 15354
  },
  "repairOrders": [
    {
      "department": "消毒供应中心",
      "equipName": "蒸汽清洗机",
      "repairCode": "ERB-202605040",
      "reportDuration": "57天3小时12分",
      "responder": "陈嘉诚",
      "status": "维修中"
    }
  ],
  "inspectionOrders": {
    "rate": 95.2,
    "total": 1482,
    "finished": 1411,
    "waiting": 71,
    "overdue": 12,
    "rows": [
      {
        "department": "临床药学组",
        "equipName": "微量分析天平",
        "remainLabel": "29天",
        "engineer": "刘民华"
      }
    ]
  },
  "lifeSupport": [{ "name": "心电图机", "value": 92.6, "count": 68 }],
  "ultrasound": [{ "name": "感染科重症监护", "value": 100, "count": 1 }],
  "deviceDistribution": [{ "name": "麻醉科", "count": 125, "rate": 50.5 }],
  "repairStats": {
    "labels": ["06-26", "06-27"],
    "series": [{ "name": "全保", "data": [0, 187] }]
  },
  "maintenanceStats": {
    "labels": ["06-26", "06-27"],
    "data": [100, 300]
  },
  "inspectionStats": {
    "labels": ["06-26", "06-27"],
    "data": [0, 25200]
  },
  "healthTrend": {
    "online": 15744,
    "warning": 68,
    "repairing": 44,
    "pending": 102,
    "score": 96.8,
    "rows": [
      {
        "department": "全院设备",
        "equipName": "运行正常",
        "remainLabel": "15744台",
        "engineer": "稳定"
      }
    ]
  }
}
```

## 约束

- 所有数量、比例和图表数据必须是有限数字，不能传数字字符串。
- 折线图 `data` 长度必须与 `labels` 相同。
- 柱状图每个 `series.data` 长度必须与 `labels` 相同。
- 工单必须使用命名字段对象，不接受依赖列顺序的字符串数组。
- `updatedAt` 当前作为展示文本使用，建议后端统一输出明确时区的 ISO 8601 时间。

## 配置状态

当前配置 Schema 版本为 5，保存在 localStorage 的 `medical-dashboard-config` 中：

```json
{
  "schemaVersion": 5,
  "themeId": "deep-sea-instrument",
  "panelStyle": "glass-flow",
  "layout": "3x3",
  "chartColors": {
    "ring": null,
    "pie": null,
    "bar": null,
    "horizontalBar": null
  },
  "chartTypes": {
    "repairStats": "bar",
    "maintenanceStats": "line",
    "inspectionStats": "line"
  },
  "selectedModuleIds": [
    "overview",
    "repairOrders",
    "repairStats",
    "lifeSupport",
    "inspectionOrders",
    "maintenanceStats",
    "ultrasound",
    "healthTrend",
    "inspectionStats"
  ]
}
```

`chartColors` 中的 `null` 表示继续跟随当前主题；自定义色使用 `#RRGGBB`，带透明度时使用 `#RRGGBBAA`（例如 50% 透明度为 `#1677ff80`），分别覆盖环图、饼图主色、柱状图色板和设备分布条形图。读取 v4 配置时，旧的 `bar` 颜色会同时迁移到 `bar` 与 `horizontalBar`，之后两者独立保存。

配置尚未接服务端保存/发布。接入时应新增独立配置 Repository，不应在组件或 Pinia action 中直接调用 `fetch`。
