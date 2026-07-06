# 医疗设备数据大屏前端

Vue 3 + Vite + Tailwind CSS + ECharts 实现的医疗设备全场景智慧管理系统数据大屏原型。

## 已实现

- 9 个大屏模块组件化
- 5 套主题：医疗运维指挥、浅蓝医疗、深蓝科技、紫色渐变、蓝绿未来
- 固定 3x3 九模块大屏
- 配置页模块拖拽排序、标题配置、字段配置
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
  "themeId": "clinical-command",
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
  ],
  "moduleSettings": {
    "overview": {
      "title": "设备总览",
      "fields": [{ "key": "total", "label": "设备总数", "visible": true, "unit": "台" }]
    }
  }
}
```

当前版本使用 `localStorage` 模拟保存，配置状态由 `src/stores/dashboard.ts` 托管；接真实后端时替换 store 中的读写逻辑即可。
