# 医疗设备数据大屏前端

Vue 3、TypeScript、Pinia、Vite 与 ECharts 实现的医疗设备运营大屏。项目支持 2×3 / 3×3 布局、五套主题、三种面板样式、模块拖放配置、异步数据状态和视觉回归测试。

## 当前能力

- 10 个配置驱动的业务模块，默认展示 9 个
- 模块目录与渲染注册表采用判别联合，数据键、变体和布局类型受编译期约束
- 配置以槽位数组为唯一事实来源，并对旧 `moduleOrder` 配置执行版本迁移
- 页面级数据仓库支持运行时响应校验、8 秒超时和请求取消
- 未配置后端时明确使用内置原型数据
- Vitest 单元/组件测试、Playwright 交互测试与 1920×1080 视觉基线
- CI 自动执行 lint、类型检查、测试、构建、包体预算和浏览器测试

## 本地启动

```bash
pnpm install
pnpm dev
```

默认地址为 `http://localhost:5173/`，配置页为 `http://localhost:5173/config`。

## 数据源

复制环境变量示例并填写完整数据接口地址：

```bash
cp .env.example .env.local
```

```dotenv
VITE_DASHBOARD_API_URL=https://example.test/api/dashboard/data
```

留空时使用打包内置的原型数据。接口 JSON 必须满足 [接口接入说明](./docs/integration.md)，否则页面进入错误状态而不是把脏数据传给组件。

## 质量命令

```bash
pnpm test:run       # 单元与组件测试
pnpm e2e            # 交互和视觉回归
pnpm build          # 类型检查和生产构建
pnpm check          # lint + 类型 + 单测 + 构建 + 包体预算
pnpm check:ci       # 完整质量门禁，额外包含 Playwright
```

更新经过确认的视觉基线：

```bash
pnpm exec playwright test e2e/visual.spec.ts --update-snapshots
```

## 核心目录

```text
src/
  app/                         应用级错误观测
  components/modules/          业务展示模块
  components/charts/           图表实现
  components/shared/           页面壳与无业务基础组件
  config/moduleRegistry.ts     模块组件与 Props 解析
  data/modules.ts              模块元数据唯一来源
  data/dashboardRepository.ts  HTTP / 原型数据适配
  data/dashboardDataContract.ts 运行时数据契约
  features/dashboard-config/   配置迁移和布局领域规则
  stores/dashboard.ts          全局展示配置状态
e2e/                           浏览器交互和视觉测试
```

架构边界、状态归属和扩展步骤见 [架构说明](./docs/architecture.md)。

## 当前边界

- 大屏展示数据可以接 HTTP API。
- 布局和主题配置目前只保存在浏览器 localStorage，尚未接入服务端发布接口。
- 项目是运营大屏前端，不包含身份认证、权限服务和医疗器械法规能力。
