# 前端架构说明

## 定位

项目采用 Vue SPA 的增量模块化结构。现阶段只有大屏展示与配置两个工作流，因此保留现有目录习惯，不引入额外状态库或完整 FSD 目录迁移。

## 依赖方向

```text
App / Router
  -> BigScreen / ConfigPanel
    -> dashboard-config feature / Pinia config store
    -> module catalog / module registry
      -> business modules
        -> charts / visual primitives
    -> dashboard repository
      -> runtime data contract
```

约束：

- 展示组件不直接请求网络。
- 服务端数据由 `useDashboardData` 在页面级持有，不复制进 Pinia。
- Pinia 只持有跨页面共享的主题、布局和模块配置。
- `selectedModuleIds` 是布局唯一事实来源，数组下标对应槽位。
- 模块 ID、数据键、变体、宽度和展示类型必须在 `ModuleCatalogItem` 判别联合中保持一致。
- 外部 JSON 必须先经过运行时契约，组件不能消费 `unknown` 或 API DTO。

## 新增模块

1. 在 `src/types/module.ts` 增加模块联合成员，声明固定 ID、kind、dataKey 和布局能力。
2. 在 `src/data/modules.ts` 增加满足该成员的目录项。
3. 在 `src/config/moduleRegistry.ts` 注册组件与 Props 解析器。
4. 为模块公共行为增加组件测试；视觉变化更新 Playwright 基线。
5. 运行 `pnpm check:ci`。

如果新模块复用现有 kind 和展示组件，通常只需要修改类型联合与模块目录；引入新 kind 时编译器会要求补齐注册表和解析分支。

## 配置迁移

持久化配置包含 `schemaVersion`。读取时接受旧版 `moduleOrder`，但只将其迁移为当前槽位数组，保存后不再写回旧字段。未来修改持久化结构时，应在 `configPersistence.ts` 增加显式迁移并补充 Store 测试。

## 数据边界

- `dashboardRepository.ts` 决定使用 HTTP 或内置原型数据。
- `dashboardDataContract.ts` 将外部 `unknown` 转换为 `DashboardData`。
- 请求错误使用稳定错误码区分取消、超时、网络、HTTP 和无效数据。
- `useDashboardData.ts` 管理 loading、error、并发去重和卸载取消。

当前只实现查询，没有服务端配置发布、鉴权和离线缓存。

## 组件与样式边界

- `WorkOrderTable` 属于业务模块层，不能放回 `components/shared`。
- `CubeBarChart.vue` 只管理 Props、动画生命周期和图例；几何、图形注册、option 与 custom series 渲染分别由同目录模块负责。
- `Pie3D.vue` 只组合视图；几何计算和交互/旋转生命周期分别独立维护。
- 组件私有样式与组件同目录；全局仪表和模块样式按核心、主题覆盖和业务子模块拆分，单个 CSS 文件控制在 400 行以内。
- 组件测试断言渲染结构与状态变化；计算样式、交互和最终视觉由 Playwright 验证，不读取 `.vue` 或 `.css` 源码字符串。

## 质量门禁

Pull Request 和 main 分支提交执行：

1. ESLint
2. TypeScript / Vue 类型检查
3. Vitest 单元与组件测试
4. Vite 生产构建
5. JS 与静态资源包体预算
6. Playwright 交互测试
7. 1920×1080 深色与浅色视觉回归

依赖由 Dependabot 每周检查。真实服务端发布、鉴权和监控平台不属于本前端仓库的实施范围。
