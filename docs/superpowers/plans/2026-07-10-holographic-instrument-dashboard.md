# Holographic Instrument Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有医疗设备九宫格大屏改造成统一、精密、高端的全息仪器系统，同时保留所有循环动画、数据结构、路由和布局能力。

**Architecture:** 继续使用现有 Vue 3 组件、CSS 文件分层、ECharts、SVG 与 Three.js 组合。先建立由现有主题变量派生的仪器 token 和跨模块动效层，再按全局框架、模块组合、仪表、饼图、柱图、折线图、配置编辑器的顺序逐层改造；业务数据与公开组件接口默认保持不变。

**Tech Stack:** Vue 3.5、TypeScript 5.6、Pinia、Vue Router、ECharts 5、Three.js、CSS Custom Properties、Vitest、Vue Test Utils、Vite。

## Global Constraints

- 保留 3×3 九宫格总体结构，并继续支持现有 2×3 布局。
- 保留深蓝高端科技方向，不改为浅色医疗后台；其余四套主题仍必须可用。
- 强化而非删除 2.5D。
- 保留现有循环动画；如果画面过于繁忙，优先降低循环动画亮度、拉长周期并错开相位，不直接移除循环生命感。
- 默认模式允许多个循环同时存在，但同一时刻最多一个主高亮和两个辅助高亮。
- 只有用户主动开启 `prefers-reduced-motion` 时才关闭持续旋转、呼吸和扫光。
- 数据内容、指标口径、空数据、mock 数据、接口、路由和移动端不在本计划范围内。
- 不新增大型 UI 框架，不把未使用的 `ThreeHologramBase.vue` 接回大屏。
- 1920×1080 目标接近稳定 60fps；持续动画优先使用 `transform` 和 `opacity`。

## File Structure

### Create

- `src/styles/motion.css` — 跨组件共享的循环周期、背景扫描、状态能量脉冲和 reduced-motion 降级。
- `src/composables/useInstrumentLoop.ts` — 饼图自动旋转所需的 rAF 生命周期、页面隐藏暂停和 reduced-motion 控制。
- `src/composables/__tests__/useInstrumentLoop.test.ts` — 仪器循环生命周期测试。
- `src/__tests__/HolographicVisualSystem.test.ts` — 全息 token、循环保留、脊柱和面板等级的结构契约测试。
- `src/components/charts/__tests__/Pie3D.test.ts` — 饼图自动旋转、暂停、清理和键盘行为测试。
- `src/components/charts/__tests__/LineAreaChart.test.ts` — 时间轨迹与末点脉冲配置测试。

### Modify

- `src/main.ts` — 导入共享 motion 样式。
- `src/styles/tokens.css` — 仪器材质、字体、循环周期和强度 token。
- `src/styles/layout.css` — 中央能量脊柱、背景扫描和全局纵深。
- `src/styles/header.css` — 标题核心与脊柱连接、统一循环周期。
- `src/styles/panel.css` — A/B/C 面板等级、仪器角标和错峰循环。
- `src/styles/rings.css` — 仪表家族、待机呼吸和相位继承。
- `src/styles/modules.css` — 总览、可用率、巡检和保养模块组合。
- `src/styles/tables.css` — 全息数据终端、状态能量点和连续仪器坞。
- `src/styles/charts.css` — 柱图地面、折线轨迹、循环扫光和图表底栏。
- `src/styles/config.css` — 全息布局编辑器、合法/非法槽位、主题色板、确认层和预览。
- `src/components/shared/BigScreen.vue` — 中央能量脊柱。
- `src/components/shared/PanelShell.vue` — 装饰层语义与仪器角标。
- `src/components/shared/WorkOrderTable.vue` — 状态语义 class 与能量点。
- `src/components/shared/ConfigPanel.vue` — 安全移除、拖拽预检查、确认层、主题/布局预览和全屏预览。
- `src/components/modules/OverviewModule.vue` — 主仪表尺寸与环绕结构。
- `src/components/modules/AvailabilityModule.vue` — 三仪表错峰相位与阵列纵深。
- `src/components/modules/CompletionModule.vue` — 巡检诊断仪器循环。
- `src/components/modules/HealthTrendModule.vue` — 健康诊断仪器循环。
- `src/components/charts/HealthPieChart.vue` — 启用饼图循环。
- `src/components/charts/Pie3D.vue` — 实现现有 `autoRotate` 接口。
- `src/components/charts/CubeBarChart.vue` — 地面网格、倒影与最高柱脉冲。
- `src/components/charts/cubeBarGeometry.ts` — 最高柱和倒影纯函数。
- `src/components/charts/LineAreaChart.vue` — 末点 `effectScatter` 循环脉冲。
- `src/components/charts/EChart.vue` — 可访问名称透传。
- `src/components/visual/HologramGauge.vue` — 700ms 数值推进与待机 class。
- `src/components/visual/HologramGaugeBase.vue` — 三层底座统一周期和相位。
- `src/components/visual/ThreePiePedestal.vue` — 低成本循环轨道覆盖层。
- `src/stores/dashboard.ts` — 纯拖拽合法性预检查接口。
- 相关现有测试文件 — 更新已被新视觉契约替代的脆弱源码断言。

---

### Task 1: Establish Instrument Tokens And Shared Motion Layer

**Files:**
- Create: `src/styles/motion.css`
- Create: `src/__tests__/HolographicVisualSystem.test.ts`
- Modify: `src/styles/tokens.css`
- Modify: `src/main.ts`
- Modify: `src/__tests__/themeAdaptation.test.ts`

**Interfaces:**
- Consumes: existing `--chart-*`, `--surface-*`, `--instrument-*`, `--accent-*` theme variables.
- Produces: `--instrument-structure`, `--instrument-core`, `--instrument-reflection`, `--instrument-surface-*`, `--motion-loop-*`, `--motion-phase`, and shared keyframes used by every later task.

- [ ] **Step 1: Write the failing visual-contract test**

Create `src/__tests__/HolographicVisualSystem.test.ts` with the shared source reader and first contract:

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('holographic instrument visual system', () => {
  it('defines theme-derived instrument roles and preserves looping motion by default', () => {
    const tokens = read('styles/tokens.css')
    const motion = read('styles/motion.css')
    const main = read('main.ts')

    expect(tokens).toContain('--instrument-structure: var(--chart-primary)')
    expect(tokens).toContain('--instrument-core: var(--instrument-rim)')
    expect(tokens).toContain('--instrument-reflection: var(--chart-tertiary)')
    expect(tokens).toContain('--motion-loop-panel: 10.8s')
    expect(tokens).toContain('--motion-loop-instrument: 7.2s')
    expect(tokens).toContain('--motion-loop-spine: 12.8s')
    expect(motion).toContain('@keyframes instrument-energy-pulse')
    expect(motion).toContain('@keyframes instrument-background-scan')
    expect(motion).toContain('infinite')
    expect(motion).toContain('@media (prefers-reduced-motion: reduce)')
    expect(main).toContain("import './styles/motion.css'")
  })
})
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts`

Expected: FAIL because `motion.css` and the new instrument tokens do not exist.

- [ ] **Step 3: Add exact role and motion tokens**

Append inside `:root` in `src/styles/tokens.css`:

```css
  --instrument-structure: var(--chart-primary);
  --instrument-structure-bright: var(--accent-2);
  --instrument-core: var(--instrument-rim);
  --instrument-reflection: var(--chart-tertiary);
  --instrument-surface-top: color-mix(in srgb, var(--surface-strong) 64%, transparent);
  --instrument-surface-bottom: color-mix(in srgb, var(--surface) 74%, transparent);
  --instrument-edge-outer: color-mix(in srgb, var(--glass-edge) 72%, transparent);
  --instrument-edge-inner: color-mix(in srgb, var(--instrument-rim) 28%, transparent);
  --instrument-font-data: "DIN Alternate", "SFMono-Regular", "Roboto Mono", Consolas, monospace;
  --motion-ease-instrument: cubic-bezier(0.22, 0.61, 0.36, 1);
  --motion-enter-background: 300ms;
  --motion-enter-header: 500ms;
  --motion-enter-panel: 520ms;
  --motion-loop-title: 9.4s;
  --motion-loop-panel: 10.8s;
  --motion-loop-instrument: 7.2s;
  --motion-loop-status: 6.4s;
  --motion-loop-spine: 12.8s;
  --motion-loop-background: 14.4s;
  --motion-intensity-a: 1;
  --motion-intensity-b: 0.72;
  --motion-intensity-c: 0.48;
  --motion-phase: 0s;
  --motion-local-phase: 0s;
```

- [ ] **Step 4: Create the shared loop keyframes**

Create `src/styles/motion.css`:

```css
@keyframes instrument-energy-pulse {
  0%, 100% { opacity: 0.34; filter: brightness(0.92); }
  46% { opacity: 0.82; filter: brightness(1.18); }
}

@keyframes instrument-background-scan {
  0% { opacity: 0; transform: translate3d(0, -115%, 0); }
  12%, 72% { opacity: 0.22; }
  100% { opacity: 0; transform: translate3d(0, 115%, 0); }
}

@keyframes instrument-orbit-sweep {
  from { transform: translateX(-50%) perspective(14rem) rotateX(66deg) rotateZ(0deg); }
  to { transform: translateX(-50%) perspective(14rem) rotateX(66deg) rotateZ(360deg); }
}

@keyframes instrument-data-scan {
  0% { opacity: 0; transform: translate3d(0, -120%, 0); }
  16%, 68% { opacity: 0.34; }
  100% { opacity: 0; transform: translate3d(0, 120%, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .screen-frame *,
  .config-workbench * {
    scroll-behavior: auto;
  }
}
```

Import it in `src/main.ts` immediately after `tokens.css`:

```ts
import './styles/tokens.css'
import './styles/motion.css'
import './styles/base.css'
```

- [ ] **Step 5: Replace obsolete hard-coded animation-duration assertions**

In `src/__tests__/themeAdaptation.test.ts`, replace the assertion for literal `panel-card-enter 520ms` with:

```ts
expect(tokenStyles).toContain('--motion-enter-panel: 520ms')
expect(panelStyles).toContain('var(--motion-enter-panel)')
```

Keep the existing theme-driven, equal-column, SVG, and reduced-motion assertions.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: PASS.

```bash
git add src/main.ts src/styles/tokens.css src/styles/motion.css src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts
git commit -m "style: establish holographic instrument motion tokens"
```

---

### Task 2: Build The Central Energy Spine And A/B/C Panel Hierarchy

**Files:**
- Modify: `src/components/shared/BigScreen.vue`
- Modify: `src/components/shared/PanelShell.vue`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/header.css`
- Modify: `src/styles/panel.css`
- Modify: `src/__tests__/BigScreen.reference.test.ts`
- Modify: `src/__tests__/HolographicVisualSystem.test.ts`

**Interfaces:**
- Consumes: Task 1 instrument and motion tokens.
- Produces: `.screen-energy-spine`, `.panel-corners`, inherited `--panel-edge-weight`, `--panel-glow-weight`, and per-slot `--motion-phase`.

- [ ] **Step 1: Add failing component and CSS-contract assertions**

Add to `BigScreen.reference.test.ts`:

```ts
expect(wrapper.find('.screen-energy-spine').exists()).toBe(true)
expect(wrapper.find('.screen-energy-spine').attributes('aria-hidden')).toBe('true')
expect(wrapper.findAll('module-renderer-stub')).toHaveLength(9)
```

Add to `HolographicVisualSystem.test.ts`:

```ts
it('uses a central energy spine and positional panel levels without changing equal columns', () => {
  const layout = read('styles/layout.css')
  const panel = read('styles/panel.css')

  expect(layout).toContain('.screen-energy-spine')
  expect(layout).toContain('animation: instrument-background-scan')
  expect(layout).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
  expect(panel).toContain('.screen-grid > .panel:nth-child(3n + 2)')
  expect(panel).toContain('--panel-edge-weight: 100%')
  expect(panel).toContain('--panel-edge-weight: 84%')
  expect(panel).toContain('--panel-edge-weight: 72%')
  expect(panel).toContain('var(--motion-phase)')
})
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run: `pnpm test --run src/__tests__/BigScreen.reference.test.ts src/__tests__/HolographicVisualSystem.test.ts`

Expected: FAIL because the spine, corners and panel tiers are absent.

- [ ] **Step 3: Add semantic decorative layers**

In `BigScreen.vue`, place the spine after the module loop but inside `.screen-grid` so the existing panel `nth-child` positions remain 1–9:

```vue
<span class="screen-energy-spine" aria-hidden="true">
  <i class="screen-energy-spine-core"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--top"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--middle"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--bottom"></i>
</span>
```

In `PanelShell.vue`, mark the existing flow as decorative and add one corner layer:

```vue
<span class="panel-border-flow" aria-hidden="true"></span>
<span class="panel-corners" aria-hidden="true"></span>
```

- [ ] **Step 4: Implement the spine and ambient scan**

Add to `layout.css`:

```css
.screen-grid {
  position: relative;
  isolation: isolate;
}

.screen-grid > .panel {
  position: relative;
  z-index: 1;
}

.screen-energy-spine {
  position: absolute;
  z-index: 0;
  top: -0.8rem;
  bottom: -0.3rem;
  left: 50%;
  width: 0.18rem;
  pointer-events: none;
  transform: translateX(-50%);
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--instrument-structure) 22%, transparent) 10% 90%, transparent);
  box-shadow: 0 0 1.4rem color-mix(in srgb, var(--instrument-structure) 14%, transparent);
}

.screen-energy-spine-core {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 0 32%, var(--instrument-core) 48%, transparent 66% 100%);
  animation: instrument-background-scan var(--motion-loop-spine) linear infinite;
}

.screen-energy-spine-node {
  position: absolute;
  left: 50%;
  width: 0.52rem;
  aspect-ratio: 1;
  border: 0.0625rem solid color-mix(in srgb, var(--instrument-core) 42%, transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: instrument-energy-pulse var(--motion-loop-instrument) ease-in-out infinite;
}

.screen-energy-spine-node--top { top: 16.5%; }
.screen-energy-spine-node--middle { top: 50%; animation-delay: -2.4s; }
.screen-energy-spine-node--bottom { top: 83.5%; animation-delay: -4.8s; }

.screen-frame::after {
  content: '';
  position: absolute;
  z-index: 0;
  inset: 4.8rem 0.65rem 2.4rem;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--instrument-structure-bright) 7%, transparent), transparent);
  animation: instrument-background-scan var(--motion-loop-background) linear infinite;
}
```

- [ ] **Step 5: Implement panel levels, corner material and choreography**

At the top of `.panel` in `panel.css`, set C-level defaults and use them in edge colors:

```css
  --panel-edge-weight: 72%;
  --panel-glow-weight: 10%;
  --panel-motion-intensity: var(--motion-intensity-c);
```

Add level overrides and slot phases:

```css
.panel--overview,
.panel--availability {
  --panel-edge-weight: 84%;
  --panel-glow-weight: 16%;
  --panel-motion-intensity: var(--motion-intensity-b);
}

.screen-grid > .panel:nth-child(3n + 2) {
  --panel-edge-weight: 100%;
  --panel-glow-weight: 24%;
  --panel-motion-intensity: var(--motion-intensity-a);
}

.screen-grid > .panel:nth-child(1) { --motion-phase: 0s; animation-delay: 850ms; }
.screen-grid > .panel:nth-child(2) { --motion-phase: -1s; animation-delay: 650ms; }
.screen-grid > .panel:nth-child(3) { --motion-phase: -2s; animation-delay: 850ms; }
.screen-grid > .panel:nth-child(4) { --motion-phase: -3s; animation-delay: 1020ms; }
.screen-grid > .panel:nth-child(5) { --motion-phase: -4s; animation-delay: 820ms; }
.screen-grid > .panel:nth-child(6) { --motion-phase: -5s; animation-delay: 1020ms; }
.screen-grid > .panel:nth-child(7) { --motion-phase: -6s; animation-delay: 1190ms; }
.screen-grid > .panel:nth-child(8) { --motion-phase: -7s; animation-delay: 990ms; }
.screen-grid > .panel:nth-child(9) { --motion-phase: -8s; animation-delay: 1190ms; }

.panel-corners {
  position: absolute;
  z-index: 2;
  inset: 0.22rem;
  pointer-events: none;
  background:
    linear-gradient(var(--instrument-edge-inner), var(--instrument-edge-inner)) left top / 0.9rem 0.0625rem no-repeat,
    linear-gradient(var(--instrument-edge-inner), var(--instrument-edge-inner)) left top / 0.0625rem 0.9rem no-repeat,
    linear-gradient(var(--instrument-edge-inner), var(--instrument-edge-inner)) right bottom / 0.9rem 0.0625rem no-repeat,
    linear-gradient(var(--instrument-edge-inner), var(--instrument-edge-inner)) right bottom / 0.0625rem 0.9rem no-repeat;
  opacity: var(--panel-motion-intensity);
}
```

Change `.panel-border-flow` to use:

```css
animation:
  panel-border-flow-spin var(--motion-loop-panel) linear infinite,
  panel-border-breathe var(--motion-loop-status) ease-in-out infinite;
animation-delay: var(--motion-phase), calc(var(--motion-phase) - 0.8s);
```

Keep the current `@media (prefers-reduced-motion: reduce)` block, but scope animation removal only inside that media query.

- [ ] **Step 6: Connect the title core to the spine**

Add to `header.css`:

```css
.dashboard-header::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.64rem;
  width: 0.12rem;
  height: 0.95rem;
  background: linear-gradient(180deg, var(--instrument-core), transparent);
  box-shadow: 0 0 0.9rem color-mix(in srgb, var(--instrument-structure-bright) 32%, transparent);
  transform: translateX(-50%);
  animation: instrument-energy-pulse var(--motion-loop-title) ease-in-out infinite;
}
```

- [ ] **Step 7: Run tests and commit**

Run: `pnpm test --run src/__tests__/BigScreen.reference.test.ts src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: PASS with nine modules and equal grid columns unchanged.

```bash
git add src/components/shared/BigScreen.vue src/components/shared/PanelShell.vue src/styles/layout.css src/styles/header.css src/styles/panel.css src/__tests__/BigScreen.reference.test.ts src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts
git commit -m "style: add central energy spine and panel hierarchy"
```

---

### Task 3: Compose The Overview, Availability And Work-Order Instrument Modules

**Files:**
- Modify: `src/components/modules/OverviewModule.vue`
- Modify: `src/components/modules/AvailabilityModule.vue`
- Modify: `src/components/modules/CompletionModule.vue`
- Modify: `src/components/modules/HealthTrendModule.vue`
- Modify: `src/components/shared/WorkOrderTable.vue`
- Modify: `src/styles/modules.css`
- Modify: `src/styles/tables.css`
- Modify: `src/__tests__/AvailabilityModule.test.ts`
- Modify: `src/__tests__/WorkOrderPanels.test.ts`

**Interfaces:**
- Consumes: inherited `--motion-phase`, current module props and existing paging composables.
- Produces: status tone classes, `.status-energy-dot`, local phase inheritance, continuous data-terminal scan and connected instrument-dock styling.

- [ ] **Step 1: Write failing semantic and phase tests**

Update the ring stub in `AvailabilityModule.test.ts` to expose inherited style:

```ts
const RingStub = {
  props: ['value', 'label', 'count'],
  template: '<div class="ring-stub" v-bind="$attrs">{{ label }} {{ value }} {{ count }}</div>',
}
```

Add:

```ts
it('assigns staggered loop phases without changing the three-item page', () => {
  const wrapper = mount(AvailabilityModule, {
    props: { items: [
      { name: '除颤仪', value: 90, count: 4 },
      { name: '呼吸机', value: 90, count: 3 },
      { name: '监护仪', value: 90, count: 32 },
    ] },
    global: { stubs: { AvailabilityMetricRing: RingStub } },
  })

  expect(wrapper.findAll('.ring-stub').map((item) => item.attributes('style'))).toEqual([
    '--motion-local-phase: 0s;',
    '--motion-local-phase: -1.4s;',
    '--motion-local-phase: -2.8s;',
  ])
})
```

Add to `WorkOrderPanels.test.ts`:

```ts
expect(wrapper.findAll('.status-energy-dot').length).toBeGreaterThan(0)
expect(wrapper.find('.status-pill').classes()).toContain('status-pill--warn')
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm test --run src/__tests__/AvailabilityModule.test.ts src/__tests__/WorkOrderPanels.test.ts`

Expected: FAIL because phase styles and semantic status dots are absent.

- [ ] **Step 3: Increase the overview instrument and phase the availability array**

In `OverviewModule.vue`, change the base ring from 132px to 145px:

```ts
const overviewRingSize = pxToRem(145)
```

In `AvailabilityModule.vue`, expose the index and assign the exact local phase:

```vue
<AvailabilityMetricRing
  v-for="(item, itemIndex) in currentPage"
  :key="item.name"
  :value="item.value"
  :label="item.name"
  :count="item.count"
  :size="ringSize"
  :style="{ '--motion-local-phase': `${itemIndex * -1.4}s` }"
/>
```

- [ ] **Step 4: Replace inline-only work-order state with semantic tones**

Replace `statusStyle` with:

```ts
function statusTone(value: string): 'warn' | 'danger' | 'purple' | 'good' {
  if (value === PENDING_REPAIR_STATUS) return 'warn'
  if (value.includes('维修')) return 'danger'
  if (value.includes('配件')) return 'purple'
  return 'good'
}
```

Replace both status-cell spans with:

```vue
<span
  v-if="cellIndex === row.length - 1"
  class="status-pill"
  :class="`status-pill--${statusTone(String(cell))}`"
>
  <i class="status-energy-dot" aria-hidden="true"></i>
  {{ cell }}
</span>
```

- [ ] **Step 5: Add the connected module material and preserve loops**

Add to `modules.css`:

```css
.overview-layout,
.availability-page {
  position: relative;
}

.overview-layout::before,
.availability-page::before {
  content: '';
  position: absolute;
  z-index: 0;
  left: 12%;
  right: 12%;
  top: 50%;
  height: 0.0625rem;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--instrument-structure) 24%, transparent), transparent);
  box-shadow: 0 0 0.8rem color-mix(in srgb, var(--instrument-structure) 12%, transparent);
}

.availability-page > :nth-child(2) {
  z-index: 2;
  transform: translateY(-0.35rem) scale(1.04);
}

.inspection-order-grid,
.health-status-grid {
  position: relative;
}

.inspection-order-grid::after,
.health-status-grid::after {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 3rem;
  left: var(--module-list-width, 64%);
  width: 0.0625rem;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--instrument-core) 36%, transparent), transparent);
  animation: instrument-energy-pulse var(--motion-loop-status) ease-in-out infinite;
  animation-delay: var(--motion-phase);
  pointer-events: none;
}
```

Add to `tables.css`:

```css
.paged-viewport::after {
  content: '';
  position: absolute;
  z-index: 3;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0 44%, color-mix(in srgb, var(--instrument-structure-bright) 9%, transparent) 50%, transparent 56% 100%);
  animation: instrument-data-scan var(--motion-loop-background) linear infinite;
  animation-delay: var(--motion-phase);
}

.status-pill { gap: 0.28rem; }
.status-energy-dot {
  width: 0.34rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--status-tone);
  box-shadow: 0 0 0.55rem color-mix(in srgb, var(--status-tone) 72%, transparent);
  animation: instrument-energy-pulse var(--motion-loop-status) ease-in-out infinite;
  animation-delay: var(--motion-phase);
}
.status-pill--warn { --status-tone: var(--warn); }
.status-pill--danger { --status-tone: var(--danger); }
.status-pill--purple { --status-tone: var(--accent-3); }
.status-pill--good { --status-tone: var(--good); }
```

Add the new scan and pulse selectors to the existing reduced-motion blocks so they use `animation: none` only inside those blocks.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/__tests__/AvailabilityModule.test.ts src/__tests__/WorkOrderPanels.test.ts`

Expected: PASS; pagination and all existing text/count assertions remain unchanged.

```bash
git add src/components/modules/OverviewModule.vue src/components/modules/AvailabilityModule.vue src/components/modules/CompletionModule.vue src/components/modules/HealthTrendModule.vue src/components/shared/WorkOrderTable.vue src/styles/modules.css src/styles/tables.css src/__tests__/AvailabilityModule.test.ts src/__tests__/WorkOrderPanels.test.ts
git commit -m "style: compose connected holographic dashboard modules"
```

---

### Task 4: Unify The Hologram Gauge Family

**Files:**
- Modify: `src/components/visual/HologramGauge.vue`
- Modify: `src/components/visual/HologramGaugeBase.vue`
- Modify: `src/components/visual/AvailabilityMetricRing.vue`
- Modify: `src/styles/rings.css`
- Modify: `src/components/visual/__tests__/HologramGauge.test.ts`

**Interfaces:**
- Consumes: existing gauge props unchanged and inherited `--motion-phase` / `--motion-local-phase`.
- Produces: `.is-idle`, 700ms value progression, three-layer base loop using shared duration tokens.

- [ ] **Step 1: Add failing idle and loop assertions**

Add to `HologramGauge.test.ts`:

```ts
it('keeps a zero-value gauge alive as an idle instrument', () => {
  const wrapper = mount(HologramGauge, { props: { value: 0 } })

  expect(wrapper.classes()).toContain('is-idle')
  expect(wrapper.find('.gauge-base-scan').exists()).toBe(true)
  expect(wrapper.find('.hologram-gauge-value').text()).toBe('0%')
})
```

Update the rAF finish timestamp in test setup from `1200` to `700`, then add a source assertion in `HolographicVisualSystem.test.ts`:

```ts
const gaugeBase = read('components/visual/HologramGaugeBase.vue')
expect(gaugeBase).toContain('var(--motion-loop-instrument)')
expect(gaugeBase).toContain('var(--motion-local-phase)')
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm test --run src/components/visual/__tests__/HologramGauge.test.ts src/__tests__/HolographicVisualSystem.test.ts`

Expected: FAIL because `.is-idle` and shared loop tokens are absent.

- [ ] **Step 3: Add idle state and 700ms progression**

In `HologramGauge.vue`:

```ts
const GAUGE_ANIMATION_DURATION = 700
const isIdle = computed(() => Math.max(0, props.value || 0) === 0)
```

Use the constant in `run()`:

```ts
const progress = Math.min(1, (ts - start) / GAUGE_ANIMATION_DURATION)
```

Extend the root classes:

```vue
:class="{
  'is-large': large,
  'has-inside-label': insideLabel,
  'is-complete': isComplete,
  'is-idle': isIdle,
}"
```

- [ ] **Step 4: Retain and retime the three-layer base loops**

In `HologramGaugeBase.vue`, replace the scan animation declaration with:

```css
animation: gauge-base-scan-sweep var(--motion-loop-instrument) linear infinite;
animation-delay: calc(var(--motion-phase, 0s) + var(--motion-local-phase, 0s));
```

In `rings.css`, add:

```css
.hologram-gauge-ring::before {
  animation: instrument-energy-pulse var(--motion-loop-instrument) ease-in-out infinite;
  animation-delay: calc(var(--motion-phase, 0s) + var(--motion-local-phase, 0s) - 0.9s);
}

.hologram-gauge.is-idle .hologram-gauge-ring {
  box-shadow:
    0 0 1rem color-mix(in srgb, var(--gauge-tone) 18%, transparent),
    inset 0 0 0.9rem color-mix(in srgb, var(--instrument-core) 10%, transparent);
}

.hologram-gauge-value,
.hologram-gauge-count {
  font-family: var(--instrument-font-data);
  font-variant-numeric: tabular-nums;
}
```

The existing reduced-motion block must set the ring pulse and scan to `animation: none` without hiding the value or base.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test --run src/components/visual/__tests__/HologramGauge.test.ts src/__tests__/HolographicVisualSystem.test.ts`

Expected: PASS.

```bash
git add src/components/visual/HologramGauge.vue src/components/visual/HologramGaugeBase.vue src/components/visual/AvailabilityMetricRing.vue src/styles/rings.css src/components/visual/__tests__/HologramGauge.test.ts src/__tests__/HolographicVisualSystem.test.ts
git commit -m "style: unify holographic gauge instruments"
```

---

### Task 5: Implement The Shared Instrument Loop And Pie Auto-Rotation

**Files:**
- Create: `src/composables/useInstrumentLoop.ts`
- Create: `src/composables/__tests__/useInstrumentLoop.test.ts`
- Create: `src/components/charts/__tests__/Pie3D.test.ts`
- Modify: `src/components/charts/Pie3D.vue`
- Modify: `src/__tests__/themeAdaptation.test.ts`

**Interfaces:**
- Consumes: existing `Pie3D.autoRotate` and `Pie3D.rotation` props.
- Produces: `useInstrumentLoop(step, enabled)` returning `{ pause, resume, isReducedMotion }`; Pie3D uses it without changing callers.

- [ ] **Step 1: Write failing composable lifecycle tests**

Create `useInstrumentLoop.test.ts` with a small host component and assert:

```ts
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useInstrumentLoop } from '@/composables/useInstrumentLoop'

describe('useInstrumentLoop', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('runs, pauses, resumes and cancels the animation frame', () => {
    const callbacks: FrameRequestCallback[] = []
    const cancel = vi.fn()
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
      callbacks.push(callback)
      return callbacks.length
    }))
    vi.stubGlobal('cancelAnimationFrame', cancel)
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const step = vi.fn()
    const exposed: Record<string, () => void> = {}
    const Host = defineComponent({
      setup() {
        Object.assign(exposed, useInstrumentLoop(step, () => true))
        return () => null
      },
    })
    const wrapper = mount(Host)
    callbacks.shift()?.(100)
    callbacks.shift()?.(116)
    expect(step).toHaveBeenCalledWith(16)
    exposed.pause()
    exposed.resume()
    wrapper.unmount()
    expect(cancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Implement the loop lifecycle**

Create `useInstrumentLoop.ts`:

```ts
import { onMounted, onUnmounted, ref } from 'vue'

export function useInstrumentLoop(step: (deltaMs: number) => void, enabled: () => boolean) {
  const isReducedMotion = ref(false)
  let frame = 0
  let previous = 0
  let paused = false
  let media: MediaQueryList | null = null

  const tick = (time: number) => {
    if (!paused && !isReducedMotion.value && enabled()) {
      if (previous > 0) step(Math.min(64, time - previous))
      previous = time
    } else {
      previous = time
    }
    frame = requestAnimationFrame(tick)
  }

  const syncMotionPreference = () => {
    isReducedMotion.value = media?.matches ?? false
  }
  const syncVisibility = () => {
    paused = document.hidden
  }
  const pause = () => { paused = true }
  const resume = () => { paused = document.hidden }

  onMounted(() => {
    media = window.matchMedia('(prefers-reduced-motion: reduce)')
    syncMotionPreference()
    media.addEventListener('change', syncMotionPreference)
    document.addEventListener('visibilitychange', syncVisibility)
    frame = requestAnimationFrame(tick)
  })

  onUnmounted(() => {
    cancelAnimationFrame(frame)
    media?.removeEventListener('change', syncMotionPreference)
    document.removeEventListener('visibilitychange', syncVisibility)
  })

  return { pause, resume, isReducedMotion }
}
```

- [ ] **Step 3: Write failing Pie3D behavior tests**

Create `Pie3D.test.ts` with fake rAF and two cases:

```ts
it('changes segment geometry when autoRotate is enabled', async () => {
  const wrapper = mount(Pie3D, { props: { items, autoRotate: true } })
  const before = wrapper.find('.pie3d-top-segment').attributes('d')
  callbacks.shift()?.(100)
  callbacks.shift()?.(116)
  await nextTick()
  expect(wrapper.find('.pie3d-top-segment').attributes('d')).not.toBe(before)
})

it('keeps segment geometry stable when autoRotate is disabled', async () => {
  const wrapper = mount(Pie3D, { props: { items, autoRotate: false } })
  const before = wrapper.find('.pie3d-top-segment').attributes('d')
  callbacks.shift()?.(100)
  callbacks.shift()?.(116)
  await nextTick()
expect(wrapper.find('.pie3d-top-segment').attributes('d')).toBe(before)
})

it('uses one unique theme-derived top-light gradient per segment', () => {
  const wrapper = mount(Pie3D, { props: { items } })
  const gradients = wrapper.findAll('.pie3d-top-light')
  expect(gradients).toHaveLength(items.length)
  expect(new Set(gradients.map((gradient) => gradient.attributes('id'))).size).toBe(items.length)
  expect(wrapper.find('.pie3d-top-segment').attributes('fill')).toContain('url(#pie3d-top-')
})
```

The test setup must stub `matchMedia`, `requestAnimationFrame` and `cancelAnimationFrame`, and must verify unmount calls `cancelAnimationFrame`.

- [ ] **Step 4: Implement Pie3D auto-rotation and interaction pause**

In `Pie3D.vue`:

```ts
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import { useInstrumentLoop } from '@/composables/useInstrumentLoop'

const rotationOffset = ref(0)
const startAngle = computed(
  () => BASE_START_ANGLE + ((props.rotation + rotationOffset.value) * Math.PI) / 180,
)
const { pause: pauseRotation, resume: resumeRotation } = useInstrumentLoop(
  (deltaMs) => {
    rotationOffset.value = (rotationOffset.value + deltaMs * 0.0025) % 360
  },
  () => props.autoRotate,
)

function handlePointerLeave() {
  hideTooltip()
  resumeRotation()
}
```

Extend `RenderedSegment` with `gradientId`, `highlightColor`, and `shadowColor`, then assign them in `renderedSegments`:

```ts
gradientId: `pie3d-top-${componentUid}-${index}`,
highlightColor: colorMix(segment.color, 58, props.theme?.variables['--instrument-rim'] ?? '#d7fbff'),
shadowColor: colorMix(segment.color, 68, props.theme?.variables['--bg'] ?? '#020814'),
```

Inside the existing SVG `<defs>`, add:

```vue
<linearGradient
  v-for="segment in renderedSegments"
  :id="segment.gradientId"
  :key="segment.gradientId"
  class="pie3d-top-light"
  x1="0"
  y1="0"
  x2="1"
  y2="1"
>
  <stop offset="0" :stop-color="segment.highlightColor" />
  <stop offset="0.48" :stop-color="segment.topColor" />
  <stop offset="1" :stop-color="segment.shadowColor" />
</linearGradient>
```

Replace the top face fill with:

```vue
:fill="`url(#${segment.gradientId})`"
```

Replace the root shell's existing `@pointerleave="hideTooltip"` with the following interaction bindings:

```vue
@pointerenter="pauseRotation"
@pointerleave="handlePointerLeave"
@focusin="pauseRotation"
@focusout="resumeRotation"
```

Retain segment keyboard focus and tooltip behavior.

- [ ] **Step 5: Remove source-lock assertions that prohibit the approved loop**

In `themeAdaptation.test.ts`, delete the assertion that forbids a rotation rAF implementation. Replace it with:

```ts
expect(pie3d).toContain('useInstrumentLoop')
expect(pie3d).toContain('props.autoRotate')
expect(pie3d).toContain('pie3d-top-light')
expect(pie3d).toContain('segment.highlightColor')
expect(pie3d).toContain('segment.shadowColor')
expect(pie3d).not.toContain('WebGLRenderer')
```

Replace the earlier “flat top faces without gradients” test with:

```ts
it('renders pie top faces with unique theme-derived instrument lighting', () => {
  const pie3d = readSource('components/charts/Pie3D.vue')

  expect(pie3d).toContain('class="pie3d-top-light"')
  expect(pie3d).toContain(':id="segment.gradientId"')
  expect(pie3d).toContain(':fill="`url(#${segment.gradientId})`"')
  expect(pie3d).toContain("props.theme?.variables['--instrument-rim']")
  expect(pie3d).toContain("props.theme?.variables['--bg']")
  expect(pie3d).not.toMatch(/#(?:20f1d4|123e63|0a8fb7|2f8dff|45d8ff|53fff0|4defff|265d85)/i)
})
```

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/composables/__tests__/useInstrumentLoop.test.ts src/components/charts/__tests__/Pie3D.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: PASS.

```bash
git add src/composables/useInstrumentLoop.ts src/composables/__tests__/useInstrumentLoop.test.ts src/components/charts/Pie3D.vue src/components/charts/__tests__/Pie3D.test.ts src/__tests__/themeAdaptation.test.ts
git commit -m "feat: add lifecycle-safe holographic pie rotation"
```

---

### Task 6: Add The Diagnostic Pie Pedestal Loop And Integrate Consumers

**Files:**
- Modify: `src/components/visual/ThreePiePedestal.vue`
- Modify: `src/components/charts/HealthPieChart.vue`
- Modify: `src/components/modules/CompletionModule.vue`
- Modify: `src/__tests__/WorkOrderPanels.test.ts`
- Modify: `src/__tests__/HolographicVisualSystem.test.ts`

**Interfaces:**
- Consumes: Task 5 `Pie3D.autoRotate`; existing pedestal props unchanged.
- Produces: `.pedestal-orbit-overlay` CSS loop and enabled rotation for the two diagnostic pie consumers.

- [ ] **Step 1: Add failing integration assertions**

In `WorkOrderPanels.test.ts`, make the Pie3D stub accept `autoRotate` and expose it:

```ts
const PieStub = {
  props: ['items', 'total', 'tone', 'autoRotate'],
  template: '<div class="pie-stub" data-test="pie-chart" :data-auto-rotate="autoRotate">{{ total }}</div>',
}
```

Assert both diagnostic modules pass `true`:

```ts
expect(wrapper.find('[data-test="pie-chart"]').attributes('data-auto-rotate')).toBe('true')
```

Add to `HolographicVisualSystem.test.ts`:

```ts
const pedestal = read('components/visual/ThreePiePedestal.vue')
expect(pedestal).toContain('pedestal-orbit-overlay')
expect(pedestal).toContain('var(--motion-loop-instrument)')
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test --run src/__tests__/WorkOrderPanels.test.ts src/__tests__/HolographicVisualSystem.test.ts`

Expected: FAIL because the overlay and auto-rotate props are absent.

- [ ] **Step 3: Add a low-cost pedestal orbit valid for compact and WebGL variants**

Add before the compact/WebGL branch in `ThreePiePedestal.vue`:

```vue
<span class="pedestal-orbit-overlay" aria-hidden="true"></span>
```

Add scoped styles:

```css
.three-pie-pedestal { position: relative; }
.pedestal-orbit-overlay {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 24%;
  width: 92%;
  height: 42%;
  border: 0.0625rem dashed color-mix(in srgb, var(--pedestal-accent) 56%, transparent);
  border-radius: 50%;
  opacity: calc(0.44 * var(--pedestal-intensity, 1));
  transform: translateX(-50%) perspective(14rem) rotateX(66deg);
  animation: instrument-orbit-sweep var(--motion-loop-instrument) linear infinite;
  animation-delay: calc(var(--motion-phase, 0s) - 1.6s);
}

@media (prefers-reduced-motion: reduce) {
  .pedestal-orbit-overlay { animation: none; opacity: 0.28; }
}
```

This keeps the WebGL pedestal static, avoiding a second permanent renderer loop while retaining visible cyclic motion.

- [ ] **Step 4: Enable approved pie loops in both consumers**

Add `auto-rotate` to the `Pie3D` calls in `CompletionModule.vue` and `HealthPieChart.vue`:

```vue
<Pie3D
  auto-rotate
  :items="inspectionPieItems"
  :height="chartHeight"
  :thickness="7"
  :rotation="150"
  :theme="theme"
  :tone="themeColor('--data-inspection-pie-finished', '#20e8ff')"
  :accent="themeColor('--data-inspection-pie-waiting', '#7efcff')"
/>
```

```vue
<Pie3D
  auto-rotate
  :items="items"
  :height="chartHeight"
  :thickness="7"
  :rotation="150"
  :theme="theme"
  :tone="tone ?? themeColor(theme, '--data-health-pie-good', '#1cf3ff')"
  :accent="themeColor(theme, '--data-health-pie-warning', '#6ef5ff')"
  :surface="themeColor(theme, '--instrument-base', '#33566c')"
/>
```

Keep each component’s current `rotation="150"`, thickness and theme tones.

- [ ] **Step 5: Run tests and commit**

Run: `pnpm test --run src/__tests__/WorkOrderPanels.test.ts src/components/charts/__tests__/Pie3D.test.ts src/__tests__/HolographicVisualSystem.test.ts`

Expected: PASS.

```bash
git add src/components/visual/ThreePiePedestal.vue src/components/charts/HealthPieChart.vue src/components/modules/CompletionModule.vue src/__tests__/WorkOrderPanels.test.ts src/__tests__/HolographicVisualSystem.test.ts
git commit -m "style: animate diagnostic pie instruments"
```

---

### Task 7: Upgrade The 2.5D Cube Bar Instrument

**Files:**
- Modify: `src/components/charts/cubeBarGeometry.ts`
- Modify: `src/components/charts/CubeBarChart.vue`
- Modify: `src/styles/charts.css`
- Modify: `src/components/charts/__tests__/cubeBarGeometry.test.ts`
- Modify: `src/components/charts/__tests__/CubeBarChart.test.ts`

**Interfaces:**
- Consumes: current `BarChartData`, theme tones and existing geometry functions.
- Produces: `findPeakSeriesIndex(values): number`, `.cube-bar-ground-scan`, and peak-column metadata.

- [ ] **Step 1: Write failing pure-geometry tests**

Add to `cubeBarGeometry.test.ts`:

```ts
expect(findPeakSeriesIndex([4, 12, 8])).toBe(1)
expect(findPeakSeriesIndex([])).toBe(-1)
```

Import the new functions from `cubeBarGeometry`.

- [ ] **Step 2: Implement pure helpers**

Add to `cubeBarGeometry.ts`:

```ts
export function findPeakSeriesIndex(values: number[]): number {
  if (values.length === 0) return -1
  return values.reduce((peak, value, index) => value > values[peak] ? index : peak, 0)
}
```

- [ ] **Step 3: Add failing component assertions for peak and ground layers**

In `CubeBarChart.test.ts`, after finishing the opening animation:

```ts
expect(wrapper.find('.cube-bar-ground-scan').exists()).toBe(true)
expect(wrapper.find('.cube-bar-chart').attributes('data-peak-series')).toBe('0')
```

Keep the existing grouped-column assertions.

- [ ] **Step 4: Add peak metadata and the persistent ground scan**

In `CubeBarChart.vue`, compute the global peak series:

```ts
const peakSeriesIndex = computed(() => {
  const totals = props.data.series.map((item) => item.data.reduce((sum, value) => sum + value, 0))
  return findPeakSeriesIndex(totals)
})
```

Import `findPeakSeriesIndex` and update the root template:

```vue
<div class="cube-bar-chart" :data-peak-series="peakSeriesIndex">
  <span class="cube-bar-ground-scan" aria-hidden="true"></span>
  <div class="cube-bar-legend" aria-hidden="true">
    <span v-for="item in legendItems" :key="item.name" :style="item.textStyle">
      <i :style="item.swatchStyle"></i>{{ item.name }}
    </span>
  </div>
  <EChart class="chart-bar" :option="option" height="100%" />
</div>
```

When rendering the peak series top face, add a brighter themed shadow only for `seriesIndex === peakSeriesIndex.value`; keep all fill colors theme-derived.

- [ ] **Step 5: Add the perspective-grid loop and reflection material**

Add to `charts.css`:

```css
.cube-bar-chart { position: relative; overflow: hidden; }
.cube-bar-ground-scan {
  position: absolute;
  z-index: 0;
  left: 8%;
  right: 4%;
  bottom: 8%;
  height: 28%;
  pointer-events: none;
  background:
    repeating-linear-gradient(90deg, transparent 0 2.9rem, color-mix(in srgb, var(--instrument-structure) 10%, transparent) 3rem),
    repeating-linear-gradient(0deg, transparent 0 1.45rem, color-mix(in srgb, var(--instrument-structure) 8%, transparent) 1.5rem);
  opacity: 0.34;
  transform: perspective(18rem) rotateX(62deg);
  transform-origin: bottom;
}

.cube-bar-ground-scan::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--instrument-core) 18%, transparent), transparent);
  animation: instrument-data-scan var(--motion-loop-background) linear infinite;
  animation-delay: var(--motion-phase);
}
```

Disable only the moving `::after` layer inside reduced-motion.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/components/charts/__tests__/cubeBarGeometry.test.ts src/components/charts/__tests__/CubeBarChart.test.ts`

Expected: PASS; grouped columns and opening animation remain intact.

```bash
git add src/components/charts/cubeBarGeometry.ts src/components/charts/CubeBarChart.vue src/styles/charts.css src/components/charts/__tests__/cubeBarGeometry.test.ts src/components/charts/__tests__/CubeBarChart.test.ts
git commit -m "style: upgrade the 2.5d cube bar instrument"
```

---

### Task 8: Build The Shared Time-Trajectory Line Instrument

**Files:**
- Create: `src/components/charts/__tests__/LineAreaChart.test.ts`
- Modify: `src/components/charts/LineAreaChart.vue`
- Modify: `src/components/charts/EChart.vue`
- Modify: `src/components/modules/ChartModule.vue`
- Modify: `src/styles/charts.css`

**Interfaces:**
- Consumes: current `LineChartData`, `Theme`, and `variant` values.
- Produces: an `effectScatter` last-point series, accessible chart label, and shared line-instrument class without changing data.

- [ ] **Step 1: Write failing option tests**

Create `LineAreaChart.test.ts` using an `EChart` stub that exposes `option` and assert:

```ts
expect(option.series[0].type).toBe('line')
expect(option.series[1].type).toBe('effectScatter')
expect(option.series[1].data).toEqual([['2025-12', 32]])
expect(option.series[1].rippleEffect.period).toBe(5)
expect(wrapper.findComponent(EChartStub).props('ariaLabel')).toContain('保养统计')
```

Add a second case for `variant="inspection"` and assert it uses `--data-inspection-line` rather than the maintenance token.

- [ ] **Step 2: Run the test and verify failure**

Run: `pnpm test --run src/components/charts/__tests__/LineAreaChart.test.ts`

Expected: FAIL because no effect-scatter series or aria label exists.

- [ ] **Step 3: Add the terminal pulse series**

In `LineAreaChart.vue`, compute the last point:

```ts
const lastPoint = computed<[string, number] | null>(() => {
  const index = Math.min(props.data.labels.length, props.data.data.length) - 1
  return index >= 0 ? [props.data.labels[index], props.data.data[index]] : null
})
```

Append to `series` after the existing line:

```ts
{
  type: 'effectScatter',
  coordinateSystem: 'cartesian2d',
  data: lastPoint.value ? [lastPoint.value] : [],
  symbolSize: 10,
  z: 5,
  rippleEffect: { period: 5, scale: 2.4, brushType: 'stroke' },
  itemStyle: { color: pointColor, shadowBlur: 14, shadowColor: lineColor },
  tooltip: { show: false },
}
```

Pass an accessible name:

```vue
<EChart
  :class="`chart-${variant}`"
  :option="option"
  :aria-label="`${variant === 'inspection' ? '巡检统计' : '保养统计'}时间轨迹图`"
  height="100%"
/>
```

- [ ] **Step 4: Forward accessibility in EChart**

Add `ariaLabel?: string` to `EChart.vue` props and bind it to `.chart-shell`:

```vue
<div
  class="chart-shell"
  :class="{ 'is-ready': isChartReady }"
  :style="{ height }"
  role="img"
  :aria-label="ariaLabel"
>
```

- [ ] **Step 5: Add the time-track ambient material**

Add to `charts.css`:

```css
.line-chart-body {
  position: relative;
  isolation: isolate;
}
.line-chart-body::after {
  content: '';
  position: absolute;
  z-index: 0;
  inset: auto 7% 4% 7%;
  height: 22%;
  pointer-events: none;
  background: radial-gradient(ellipse at center, color-mix(in srgb, var(--data-maintenance-line) 14%, transparent), transparent 70%);
  animation: instrument-energy-pulse var(--motion-loop-instrument) ease-in-out infinite;
  animation-delay: var(--motion-phase);
}
```

Use `.panel--line:nth-child(3n) .line-chart-body::after` or the existing chart variant class to switch the inspection glow to `--data-inspection-line`. Disable only the pulse in reduced-motion.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/components/charts/__tests__/LineAreaChart.test.ts src/__tests__/WorkOrderPanels.test.ts`

Expected: PASS.

```bash
git add src/components/charts/LineAreaChart.vue src/components/charts/EChart.vue src/components/modules/ChartModule.vue src/styles/charts.css src/components/charts/__tests__/LineAreaChart.test.ts
git commit -m "style: add animated time-trajectory charts"
```

---

### Task 9: Add Pure Layout Placement Preflight To The Store

**Files:**
- Modify: `src/stores/dashboard.ts`
- Modify: `src/stores/__tests__/dashboard.test.ts`

**Interfaces:**
- Consumes: current layout capacity and table-row conflict rules.
- Produces: `canPlaceModuleInSlot(moduleId: string, slotIndex: number): boolean` and `canMoveSelectedModule(fromIndex: number, toIndex: number): boolean` with no state mutation.

- [ ] **Step 1: Write failing pure-preflight tests**

Add to `dashboard.test.ts`:

```ts
it('preflights table placement without mutating layout state', () => {
  const store = useDashboardStore()
  store.clearSelectedModules()
  store.placeModuleInSlot('repairOrders', 0)
  const before = [...store.config.selectedModuleIds]

  expect(store.canPlaceModuleInSlot('inspectionOrders', 1)).toBe(false)
  expect(store.canPlaceModuleInSlot('inspectionOrders', 3)).toBe(true)
  expect(store.config.selectedModuleIds).toEqual(before)
})

it('preflights a selected-module move without mutating layout state', () => {
  const store = useDashboardStore()
  const before = [...store.config.selectedModuleIds]
  const allowed = store.canMoveSelectedModule(0, 2)

  expect(allowed).toBe(true)
  expect(store.config.selectedModuleIds).toEqual(before)
})
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test --run src/stores/__tests__/dashboard.test.ts`

Expected: FAIL because both methods are undefined.

- [ ] **Step 3: Implement and reuse the pure checks**

Add to the store:

```ts
function canPlaceModuleInSlot(moduleId: string, slotIndex: number) {
  if (slotIndex < 0 || slotIndex >= slotCount.value) return false
  if (!moduleCatalog.some((item) => item.id === moduleId)) return false

  const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
  const currentIndex = next.indexOf(moduleId)
  if (currentIndex >= 0) next[currentIndex] = null
  next[slotIndex] = moduleId
  return !hasRowTableConflict(next)
}

function canMoveSelectedModule(fromIndex: number, toIndex: number) {
  const next = normalizeSlotIds(config.selectedModuleIds, config.layout)
  if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length) return false
  if (!next[fromIndex]) return false
  ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
  return !hasRowTableConflict(next)
}
```

Call these functions at the start of `placeModuleInSlot` and `moveSelectedModule`, then expose both from the store return object. Keep localStorage watching unchanged.

- [ ] **Step 4: Run tests and commit**

Run: `pnpm test --run src/stores/__tests__/dashboard.test.ts`

Expected: PASS.

```bash
git add src/stores/dashboard.ts src/stores/__tests__/dashboard.test.ts
git commit -m "feat: expose pure dashboard placement preflight"
```

---

### Task 10: Make Config-Editor Interactions Explicit And Safe

**Files:**
- Modify: `src/components/shared/ConfigPanel.vue`
- Modify: `src/__tests__/ConfigPanel.themeSelection.test.ts`

**Interfaces:**
- Consumes: Task 9 store preflight methods, existing auto-persistence, current themes and BigScreen preview.
- Produces: explicit remove buttons, drop-state classes, confirmation state, `requestPreviewFullscreen()`, published-at feedback and theme/layout preview markup.

- [ ] **Step 1: Replace the click-to-delete test and add failing interaction cases**

Extend test imports and preserve the original fullscreen method:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { themes } from '@/data/themes'

const originalRequestFullscreen = HTMLElement.prototype.requestFullscreen

afterEach(() => {
  HTMLElement.prototype.requestFullscreen = originalRequestFullscreen
  vi.restoreAllMocks()
})
```

Change the existing slot-removal test to assert:

```ts
await wrapper.find('[data-testid="layout-slot-0"]').trigger('click')
expect(store.config.selectedModuleIds[0]).toBe('overview')

await wrapper.find('[data-testid="remove-layout-slot-0"]').trigger('click')
expect(store.config.selectedModuleIds[0]).toBeNull()
```

Add these concrete test cases after creating a fresh wrapper and store in each case:

```ts
await wrapper.find('[data-testid="available-inspectionOrders"]').trigger('dragstart')
expect(wrapper.find('[data-testid="layout-slot-1"]').classes()).toContain('is-drop-blocked')
expect(wrapper.find('[data-testid="layout-slot-3"]').classes()).toContain('is-drop-allowed')

await wrapper.find('.config-shell-actions .is-clear').trigger('click')
expect(wrapper.find('[role="alertdialog"]').exists()).toBe(true)
await wrapper.find('[role="alertdialog"] button').trigger('click')
expect(store.config.selectedModuleIds.some(Boolean)).toBe(true)

expect(wrapper.findAll('.theme-swatch-dot')).toHaveLength(themes.length * 3)
expect(wrapper.find('[data-testid="preview-fullscreen"]').exists()).toBe(true)
```

For the fullscreen case, stub and assert the exact call context:

```ts
const requestFullscreen = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
HTMLElement.prototype.requestFullscreen = requestFullscreen
await wrapper.find('[data-testid="preview-fullscreen"]').trigger('click')
await flushPromises()
expect(requestFullscreen).toHaveBeenCalledTimes(1)
expect(requestFullscreen.mock.contexts[0]).toBe(wrapper.find('.config-live-preview').element)
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm test --run src/__tests__/ConfigPanel.themeSelection.test.ts`

Expected: FAIL because the explicit controls and states are absent.

- [ ] **Step 3: Add state and cleanup for placement, confirmation and fullscreen**

Add to `ConfigPanel.vue`:

```ts
type ConfirmAction = 'clear' | 'reset' | null
const confirmAction = ref<ConfirmAction>(null)
const placedSlotIndex = ref<number | null>(null)
let placedTimer: number | undefined

function slotDropState(index: number) {
  if (!draggedModuleId.value) return null
  if (draggedSlotIndex.value !== null) {
    return store.canMoveSelectedModule(draggedSlotIndex.value, index) ? 'allowed' : 'blocked'
  }
  return store.canPlaceModuleInSlot(draggedModuleId.value, index) ? 'allowed' : 'blocked'
}

function confirmDestructiveAction() {
  if (confirmAction.value === 'clear') store.clearSelectedModules()
  if (confirmAction.value === 'reset') store.resetConfig()
  confirmAction.value = null
}

async function requestPreviewFullscreen() {
  await previewRef.value?.requestFullscreen?.()
}
```

On successful drop, set `placedSlotIndex.value = index`, clear the old timer, and remove it after 520ms. Clear `warningTimer` and `placedTimer` in `onBeforeUnmount`.

- [ ] **Step 4: Replace the layout slot with a safe group and remove button**

Use a non-button draggable group:

```vue
<div
  v-for="(module, index) in slotItems"
  :key="index"
  class="layout-slot"
  :class="[
    module ? `is-${moduleDisplayType(module)}` : 'is-empty',
    slotDropState(index) === 'allowed' && 'is-drop-allowed',
    slotDropState(index) === 'blocked' && 'is-drop-blocked',
    placedSlotIndex === index && 'is-placed',
    dragOverSlot === index && 'is-drag-over',
  ]"
  role="group"
  :aria-label="module ? `布局位置 ${index + 1}：${module.title}` : `空布局位置 ${index + 1}`"
  :draggable="Boolean(module)"
  :data-testid="`layout-slot-${index}`"
  @dragstart="handleSlotDragStart(index, module)"
  @dragenter.prevent="dragOverSlot = index"
  @dragover.prevent
  @drop.prevent="handleSlotDrop(index)"
  @dragend="clearDragState"
>
  <span v-if="module" class="layout-slot-title">{{ module.title }}</span>
  <span v-else class="layout-slot-empty">将业务组件拖动至此处</span>
  <button
    v-if="module"
    class="layout-slot-remove"
    type="button"
    :data-testid="`remove-layout-slot-${index}`"
    :aria-label="`移除${module.title}`"
    @click.stop="store.removeModuleFromLayout(index)"
  >
    <X class="h-3.5 w-3.5" aria-hidden="true" />
  </button>
</div>
```

- [ ] **Step 5: Add theme/layout previews, clear/reset confirmation and fullscreen preview**

Render three theme swatches from `theme.preview`, render 6/9-cell layout thumbnails inside the existing radio labels, change the action text to “发布演示”, and add:

```vue
<span class="layout-choice-preview is-2x3" aria-hidden="true">
  <i v-for="cell in 6" :key="cell"></i>
</span>

<span class="layout-choice-preview is-3x3" aria-hidden="true">
  <i v-for="cell in 9" :key="cell"></i>
</span>

<span class="theme-swatch" aria-hidden="true">
  <i
    v-for="color in theme.preview"
    :key="color"
    class="theme-swatch-dot"
    :style="{ '--swatch-color': color }"
  ></i>
</span>
```

Give the destructive trigger buttons stable classes and confirmation-only handlers:

```vue
<button class="app-button is-clear" type="button" @click="confirmAction = 'clear'">清空布局</button>
<button class="app-button is-reset" type="button" @click="confirmAction = 'reset'">重置</button>
```

Add the fullscreen action:

```vue
<button data-testid="preview-fullscreen" class="app-button" type="button" @click="requestPreviewFullscreen">
  全屏预览
</button>
```

Replace direct clear/reset handlers with `confirmAction = 'clear'` and `confirmAction = 'reset'`. Render one inline dialog:

```vue
<div v-if="confirmAction" class="config-confirm-layer" role="alertdialog" aria-modal="true">
  <strong>{{ confirmAction === 'clear' ? '确认清空当前布局？' : '确认恢复默认配置？' }}</strong>
  <button type="button" @click="confirmAction = null">取消</button>
  <button type="button" class="is-danger" @click="confirmDestructiveAction">确认</button>
</div>
```

Keep the current store watcher and show “修改自动保存到本机” independently from `已发布 HH:mm:ss`.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/__tests__/ConfigPanel.themeSelection.test.ts src/stores/__tests__/dashboard.test.ts src/__tests__/App.navigation.test.ts`

Expected: PASS.

```bash
git add src/components/shared/ConfigPanel.vue src/__tests__/ConfigPanel.themeSelection.test.ts
git commit -m "feat: make dashboard configuration interactions explicit"
```

---

### Task 11: Apply The Holographic Editor Material And Preserve Preview Loops

**Files:**
- Modify: `src/styles/config.css`
- Modify: `src/__tests__/HolographicVisualSystem.test.ts`

**Interfaces:**
- Consumes: Task 10 markup and global instrument tokens.
- Produces: dark component cards, installation-slot depth, drop state material, theme swatches, confirmation overlay, preview fullscreen material and long-period editor loops.

- [ ] **Step 1: Add failing editor-style contract assertions**

Add to `HolographicVisualSystem.test.ts`:

```ts
it('styles the configuration page as a loop-enabled holographic editor', () => {
  const config = read('styles/config.css')
  expect(config).toContain('.is-drop-allowed')
  expect(config).toContain('.is-drop-blocked')
  expect(config).toContain('.is-placed')
  expect(config).toContain('.theme-swatch-dot')
  expect(config).toContain('.config-live-preview:fullscreen')
  expect(config).toContain('var(--motion-loop-background)')
  expect(config).toContain('@media (prefers-reduced-motion: reduce)')
})
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts`

Expected: FAIL because the new editor selectors are absent.

- [ ] **Step 3: Replace saturated component and slot fills with instrument material**

Replace the `.business-component-card` and filled-slot backgrounds with:

```css
.business-component-card,
.layout-slot {
  position: relative;
  border: 0.0625rem solid var(--instrument-edge-outer);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--instrument-core) 7%, transparent), transparent 42%),
    linear-gradient(145deg, var(--instrument-surface-top), var(--instrument-surface-bottom));
  color: var(--text);
  box-shadow:
    inset 0 0.0625rem 0 var(--instrument-edge-inner),
    0 0.45rem 1rem color-mix(in srgb, var(--bg) 38%, transparent);
}

.business-component-card.is-table,
.layout-slot.is-table { --slot-tone: var(--good); }
.business-component-card.is-chart,
.layout-slot.is-chart { --slot-tone: var(--accent-3); }
```

Use `--slot-tone` only for a thin edge, badge and selection glow; do not restore full blue/green surfaces.

- [ ] **Step 4: Add installation-slot and placement states**

```css
.layout-slot.is-empty {
  background:
    linear-gradient(90deg, transparent 49.5%, color-mix(in srgb, var(--instrument-structure) 16%, transparent) 50%, transparent 50.5%),
    linear-gradient(0deg, transparent 49.5%, color-mix(in srgb, var(--instrument-structure) 16%, transparent) 50%, transparent 50.5%),
    color-mix(in srgb, var(--surface) 44%, transparent);
}
.layout-slot.is-drop-allowed {
  border-color: var(--instrument-structure-bright);
  box-shadow: inset 0 0 1.4rem color-mix(in srgb, var(--instrument-structure) 20%, transparent), 0 0 1rem color-mix(in srgb, var(--instrument-structure-bright) 28%, transparent);
}
.layout-slot.is-drop-blocked {
  border-color: color-mix(in srgb, var(--warn) 82%, transparent);
  box-shadow: inset 0 0 1rem color-mix(in srgb, var(--warn) 16%, transparent);
}
.layout-slot.is-placed::after {
  content: '';
  position: absolute;
  inset: 18%;
  border: 0.0625rem solid var(--instrument-structure-bright);
  opacity: 0;
  animation: config-placement-wave 520ms var(--motion-ease-instrument);
}
@keyframes config-placement-wave {
  0% { opacity: 0.9; transform: scale(0.72); }
  100% { opacity: 0; transform: scale(1.32); }
}
```

- [ ] **Step 5: Style theme previews, confirmation and fullscreen preview**

```css
.theme-swatch-dot {
  width: 0.7rem;
  aspect-ratio: 1;
  border: 0.0625rem solid color-mix(in srgb, var(--instrument-core) 34%, transparent);
  border-radius: 50%;
  background: var(--swatch-color);
}
.config-confirm-layer {
  position: absolute;
  z-index: 12;
  inset: 50% auto auto 50%;
  display: grid;
  min-width: 20rem;
  gap: 0.9rem;
  padding: 1.2rem;
  border: 0.0625rem solid var(--instrument-edge-outer);
  background: color-mix(in srgb, var(--surface-strong) 92%, var(--bg));
  box-shadow: 0 0 2rem color-mix(in srgb, var(--instrument-structure) 24%, transparent);
  transform: translate(-50%, -50%);
}
.config-live-preview {
  transition: border-color 380ms ease, background 380ms ease, box-shadow 380ms ease;
}
.config-live-preview:fullscreen {
  margin: 0;
  background: linear-gradient(180deg, var(--bg-top), var(--bg-bottom));
}
.config-shell::after {
  content: '';
  position: absolute;
  inset: 4.25rem 0 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--instrument-structure-bright) 6%, transparent), transparent);
  animation: instrument-background-scan var(--motion-loop-background) linear infinite;
}
```

Add `.app-button:focus-visible`, `.layout-slot-remove:focus-visible`, and all new loop selectors to the existing reduced-motion block. Do not key the `<BigScreen />` by theme; its loops must not restart on every theme change.

- [ ] **Step 6: Run tests and commit**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts src/__tests__/ConfigPanel.themeSelection.test.ts`

Expected: PASS.

```bash
git add src/styles/config.css src/__tests__/HolographicVisualSystem.test.ts
git commit -m "style: transform config into a holographic editor"
```

---

### Task 12: Run Full Regression, Rendered Visual QA And Performance Check

**Files:**
- No planned source modification; this task begins as verification-only.
- If a check exposes a regression, add a failing test to the owning test file from Tasks 1–11, patch only that owning source file, and rerun the complete gate.
- Update `docs/superpowers/specs/2026-07-10-medical-dashboard-holographic-instrument-design.md` only when the user approves a design-contract change.

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: verified 3×3, 2×3, five-theme, config-editor and reduced-motion behavior with screenshots.

- [ ] **Step 1: Run the automated quality gate**

Run:

```bash
pnpm type-check
pnpm lint
pnpm test --run
pnpm build
```

Expected: all commands exit 0. If a failure predates this branch, capture the exact command and failure before deciding whether it is out of scope.

- [ ] **Step 2: Start the production-like preview**

Run: `pnpm preview --host 127.0.0.1`

Expected: Vite prints a local preview URL and the dashboard loads without console errors.

- [ ] **Step 3: Capture the 1920×1080 3×3 deep-sea screen**

Use the in-app Browser at exactly 1920×1080. Capture after the two-second entrance completes and verify:

- Title → central spine → central modules → side instruments is visible at thumbnail size.
- Nine panels remain equal-width and no content clips.
- Panel, header, gauge, status, pie and chart loops are all still alive after two seconds.
- Loops have visibly different phases; there is no synchronized full-screen flash.
- Empty/zero data remains unchanged and the idle gauge still breathes.
- Browser console has no warnings or errors introduced by the redesign.

Save as `/tmp/medical-dashboard-holographic-qa/01-deep-sea-3x3.png` and inspect the saved image before accepting it.

- [ ] **Step 4: Check 2×3 and all five themes**

Use the config editor to switch to 2×3 and each theme. For each state verify the central spine, instrument material, readable text and loop continuity. Capture at least:

- `/tmp/medical-dashboard-holographic-qa/02-light-2x3.png`
- `/tmp/medical-dashboard-holographic-qa/03-violet-3x3.png`

Do not change data or routes during this check.

- [ ] **Step 5: Check the configuration editor**

At the normal desktop viewport verify:

- Component cards use dark instrument material instead of saturated full fills.
- Dragging a table shows legal and blocked slots before drop.
- Invalid drop preserves layout and announces the reason.
- Clicking a slot does not delete it; explicit remove does.
- Clear/reset confirmation can cancel and confirm safely.
- Fullscreen preview shows the current live BigScreen and all loops continue.

Save as `/tmp/medical-dashboard-holographic-qa/04-config-editor.png` and inspect it.

- [ ] **Step 6: Check reduced motion as the only loop-off mode**

Emulate `prefers-reduced-motion: reduce` and verify:

- Persistent rotation, breathing, scan and pulse stop.
- Values, chart geometry, status meaning and focus indicators remain visible.
- Returning to the default preference restores loops without a reload when supported.

- [ ] **Step 7: Inspect runtime performance**

Observe the 1920×1080 screen for at least 15 seconds after entrance. Confirm:

- No repeated WebGL renderer creation.
- No increasing console error count.
- No visible layout shift or periodic blank frame.
- Animations remain smooth enough for display use; if not, reduce blur radius and opacity before reducing or removing loop count.

- [ ] **Step 8: Re-run gates after visual fixes and close verification**

Run again:

```bash
pnpm type-check
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Expected: all commands exit 0.

If a regression required code changes, commit that repair with its owning task's exact source and test files before rerunning this step. If no files changed during verification, do not create an empty verification commit.

## Plan Self-Review Checklist

- Spec coverage: global hierarchy, 2.5D, all nine modules, loop preservation, config editor, accessibility, reduced motion and 1920×1080 verification are each mapped to a task.
- Scope: no task changes data, routes, mobile layout or mock content.
- Type consistency: store preflight names, `Pie3D.autoRotate`, `useInstrumentLoop`, motion token names and CSS state classes are consistent across producer and consumer tasks.
- Performance: no task reconnects the unused multi-instance WebGL gauge base; permanent motion uses CSS or one lifecycle-safe Pie3D rAF loop per visible pie.
- No placeholders: every task identifies files, exact interfaces, commands, expected results and commit boundaries.
