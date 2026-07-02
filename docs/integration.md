# 数据大屏接口接入说明

## 目标

前端当前使用 mock 数据，后端只需要按本文结构提供数据接口，即可替换 mock 数据源。

## 配置接口

### 获取大屏配置

`GET /api/dashboard/config`

响应：

```json
{
  "themeId": "deep-blue",
  "layout": "3x3",
  "moduleOrder": [
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

### 保存大屏配置

`POST /api/dashboard/config`

请求体同上。

字段说明：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| themeId | string | 主题 ID |
| layout | string | `2x3` 或 `3x3` |
| moduleOrder | string[] | 9 个模块 ID 的排序 |

## 展示数据接口

### 获取全部大屏数据

`GET /api/dashboard/data`

响应：

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
    ["消毒供应中心", "蒸汽清洗机", "ERB-202605040", "57天3小时12分", "陈嘉诚", "维修中"]
  ],
  "inspectionOrders": {
    "rate": 95.2,
    "total": 1482,
    "finished": 1411,
    "waiting": 71,
    "overdue": 12,
    "rows": [
      ["临床药学组", "微量分析天平", "29天", "刘民华"]
    ]
  },
  "lifeSupport": [
    { "name": "心电图机", "value": 92.6, "count": 68 }
  ],
  "ultrasound": [
    { "name": "感染科重症监护", "value": 100, "count": 1 }
  ],
  "repairStats": {
    "labels": ["06-26", "06-27"],
    "series": [
      { "name": "全保", "data": [0, 187] }
    ]
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
    "score": 96.8
  }
}
```

## 前端替换位置

- mock 数据：`src/data/dashboard.js`
- 配置保存：`src/composables/useDashboardConfig.js`
- 图表组件：`src/components/modules/ChartModule.vue`
- 模块渲染入口：`src/components/ModuleRenderer.vue`

## 状态约定

工单状态建议使用以下枚举：

```text
维修中
配件运输中
已接修
待上门
已完成
```

状态颜色由前端主题变量控制，后端只传状态文本即可。
