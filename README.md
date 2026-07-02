# 医疗设备数据大屏前端

Vue 3 + Vite + Tailwind CSS + ECharts 实现的医疗设备全场景智慧管理系统数据大屏原型。

## 已实现

- 9 个大屏模块组件化
- 4 套主题：浅蓝医疗、深蓝科技、紫色渐变、蓝绿未来
- 3x3 / 2x3 布局切换
- 配置页模块拖拽排序
- 配置本地保存和发布演示
- ECharts 图表主题适配
- mock 数据驱动
- 桌面大屏和移动端响应式基础适配

## 启动

```bash
pnpm install
pnpm dev
```

默认地址：

```text
http://localhost:5173/
```

## 构建

```bash
pnpm build
```

## 目录

```text
src/
  components/          大屏组件和配置页组件
  components/modules/  业务模块
  composables/         配置状态
  data/                mock 数据、主题、模块配置
  styles.css           Tailwind 入口和主题化样式
docs/
  integration.md       后端接口接入说明
```

## 配置结构

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

当前版本使用 `localStorage` 模拟保存，接真实后端时替换 `src/composables/useDashboardConfig.js` 中的读写逻辑即可。
