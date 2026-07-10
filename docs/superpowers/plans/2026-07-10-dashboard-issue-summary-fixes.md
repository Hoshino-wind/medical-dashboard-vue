# Dashboard Issue Summary Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 13 actionable items from `大屏问题总结.docx` while preserving the existing B方案 deep-sea holographic direction and every intentional looping animation.

**Architecture:** Extend the persisted dashboard configuration with one visual-frame option, lock table modules to the wide middle slot of each row, and reuse the existing theme token and holographic pedestal systems instead of introducing a second visual language. Consolidate inspection and maintenance orders into one semantic completion-panel component, normalize repair status at the document adapter boundary, and share a pure “nice axis” utility between ECharts components so chart behavior is testable without canvas assertions.

**Tech Stack:** Vue 3.5, TypeScript 5.6, Pinia 2, ECharts 5.5, Vitest 3, Vue Test Utils, CSS custom properties, Vite 6.

## Global Constraints

- Minimum visible dashboard text is `14px`; information-dense list text should target `16px` where the 1920×1080 layout allows it.
- The 1920×1080 columns are `500px : 824px : 500px`, centered inside the screen grid, with every work-order module in the middle column.
- Fullscreen mode hides the bottom fullscreen/theme buttons and gives their row back to the dashboard grid.
- Panel borders provide exactly three persisted modes: `borderless`, `standard`, and `stereoscopic`.
- Border, title plate, pedestal, and light-curtain colors derive from the active theme tokens.
- `待接修` rows remain pinned before the scrolling repair rows and use the warning/yellow treatment.
- Repair-order summary statistics are removed.
- Maintenance order copy is `本月保养完成率` and `待保养`; inspection order copy remains `本月巡检完成率` and `待巡检`.
- Bar and line chart axes are calculated from current values and rounded upward to a readable “nice” maximum.
- Inspection and maintenance line points display their exact values.
- Existing loop animations, reduced-motion fallbacks, and the current five theme choices remain functional.
- Do not add or fabricate backend data; only normalize the existing `待响应` repair status into the specified display status `待接修`.

---

### Task 1: Persisted three-mode panel frame

**Files:**
- Modify: `src/types/config.ts`
- Modify: `src/data/modules.ts`
- Modify: `src/stores/dashboard.ts`
- Modify: `src/components/shared/ConfigPanel.vue`
- Modify: `src/components/shared/BigScreen.vue`
- Modify: `src/styles/config.css`
- Test: `src/stores/__tests__/dashboard.test.ts`
- Test: `src/__tests__/ConfigPanel.themeSelection.test.ts`
- Test: `src/__tests__/BigScreen.reference.test.ts`
- Test: `src/__tests__/ConfigPanel.themeSelection.test.ts`
- Test: `src/stores/__tests__/dashboard.test.ts`

**Interfaces:**
- Produces: `PanelBorderMode = 'borderless' | 'standard' | 'stereoscopic'`.
- Produces: `DashboardConfig.panelBorderMode: PanelBorderMode` and `store.setPanelBorderMode(mode)`.
- Produces: `data-panel-border` on `.screen-frame`.

- [ ] **Step 1: Write failing persistence and rendering tests**

```ts
it('persists and validates the selected panel border mode', () => {
  const store = useDashboardStore()
  store.setPanelBorderMode('borderless')
  expect(store.config.panelBorderMode).toBe('borderless')
  store.resetConfig()
  expect(store.config.panelBorderMode).toBe('stereoscopic')
})

it('renders three panel border choices and applies the selected mode', async () => {
  expect(wrapper.findAll('input[name="panel-border"]')).toHaveLength(3)
  await wrapper.find('input[value="borderless"]').setValue()
  expect(store.config.panelBorderMode).toBe('borderless')
})

expect(wrapper.find('.screen-frame').attributes('data-panel-border')).toBe('stereoscopic')
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/stores/__tests__/dashboard.test.ts src/__tests__/ConfigPanel.themeSelection.test.ts src/__tests__/BigScreen.reference.test.ts`

Expected: FAIL because `panelBorderMode`, `setPanelBorderMode`, the controls, and `data-panel-border` do not exist.

- [ ] **Step 3: Implement the typed configuration contract**

```ts
export type PanelBorderMode = 'borderless' | 'standard' | 'stereoscopic'

export interface DashboardConfig {
  themeId: ThemeId
  layout: LayoutType
  panelBorderMode: PanelBorderMode
  selectedModuleIds: Array<string | null>
  moduleOrder: string[]
}
```

Set the default to `stereoscopic`, validate saved values against all three literals, include the field in save/reset, and expose:

```ts
function setPanelBorderMode(panelBorderMode: PanelBorderMode) {
  config.panelBorderMode = panelBorderMode
}
```

- [ ] **Step 4: Add accessible visual choices and screen binding**

Add a `边框样式` fieldset with radio inputs named `panel-border`, visible previews for `无边框流光 / 标准边框 / 立体框架`, and call `store.setPanelBorderMode`. Bind `:data-panel-border="store.config.panelBorderMode"` on `.screen-frame` so both the main route and config preview use the same state.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm test --run src/stores/__tests__/dashboard.test.ts src/__tests__/ConfigPanel.themeSelection.test.ts src/__tests__/BigScreen.reference.test.ts`

Expected: PASS.

Commit: `git commit -am "feat: add selectable dashboard frame modes"`

### Task 2: Center-weighted layout, fullscreen density, and 14px floor

**Files:**
- Modify: `src/components/shared/BigScreen.vue`
- Modify: `src/components/shared/ConfigPanel.vue`
- Modify: `src/stores/dashboard.ts`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/config.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/panel.css`
- Modify: `src/styles/tables.css`
- Modify: `src/components/charts/CubeBarChart.vue`
- Test: `src/__tests__/BigScreen.reference.test.ts`
- Test: `src/__tests__/themeAdaptation.test.ts`

**Interfaces:**
- Consumes: `DashboardConfig.panelBorderMode` from Task 1.
- Produces: `.screen-frame.is-screen-fullscreen` state and exact `500px / 824px / 500px` baseline columns.

- [ ] **Step 1: Write failing layout/fullscreen/font tests**

```ts
expect(layoutCss).toContain('minmax(0, 31.25rem) minmax(0, 51.5rem) minmax(0, 31.25rem)')
expect(tokensCss).toContain('--dashboard-list-font-scale: 1.28')

await fullscreenButton.trigger('click')
expect(wrapper.find('.screen-frame').classes()).toContain('is-screen-fullscreen')
expect(wrapper.find('.screen-actions').exists()).toBe(false)

expect(store.canPlaceModuleInSlot('repairOrders', 0)).toBe(false)
expect(store.canPlaceModuleInSlot('repairOrders', 1)).toBe(true)
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/stores/__tests__/dashboard.test.ts src/__tests__/ConfigPanel.themeSelection.test.ts src/__tests__/BigScreen.reference.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: FAIL on the equal grid, visible action bar, missing fullscreen class, and old font scale.

- [ ] **Step 3: Implement the center-weighted grid and fullscreen state**

Bind `is-screen-fullscreen` whenever real or faux fullscreen is active, render `.screen-actions` only when not fullscreen, and make fullscreen `.screen-frame` use two rows (`header + content`) so the dashboard receives the reclaimed height. Change both 2×3 and 3×3 desktop grids to exact design-base columns:

```css
grid-template-columns: minmax(0, 31.25rem) minmax(0, 51.5rem) minmax(0, 31.25rem);
justify-content: center;
```

Constrain table modules to slot indices `1`, `4`, and `7`; update load normalization, placement checks, drag previews, and config-slot proportions so old saved layouts cannot render a table in a 500px side column.

- [ ] **Step 4: Raise dashboard type sizes without changing config-workbench density**

Set `--dashboard-list-font-scale: 1.28`, convert CubeBar axis/value text to the existing `chartFontSize(...)` helper, and remove any visible module labels below `14px` at the 1920 baseline. Keep compact configuration-only labels unchanged when they are outside the dashboard canvas.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm test --run src/__tests__/BigScreen.reference.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: PASS.

Commit: `git commit -am "fix: widen work order panels and fullscreen canvas"`

### Task 3: Theme-aware title plates and three frame treatments

**Files:**
- Modify: `src/components/shared/PanelShell.vue`
- Modify: `src/styles/panel.css`
- Test: `src/__tests__/HolographicVisualSystem.test.ts`
- Test: `src/__tests__/themeAdaptation.test.ts`

**Interfaces:**
- Consumes: `.screen-frame[data-panel-border]` from Task 1.
- Produces: one shared panel DOM that renders borderless flow, standard frame, or stereoscopic layered frame purely through theme-aware CSS.

- [ ] **Step 1: Write failing visual-contract tests**

```ts
expect(panelStyles).toContain("[data-panel-border='borderless']")
expect(panelStyles).toContain("[data-panel-border='standard']")
expect(panelStyles).toContain("[data-panel-border='stereoscopic']")
expect(panelStyles).toContain('.panel-title-plate')
expect(panelShell).toContain('panel-title-plate')
expect(panelStyles).toContain('var(--chart-primary)')
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: FAIL because the three selectors and title plate element do not exist.

- [ ] **Step 3: Add the reusable title plate**

Wrap the current number/title/subtitle content in `.panel-title-plate`, using a theme-tinted clipped background, luminous leading edge, and layered highlight. Keep the existing title bars and accessible heading text.

- [ ] **Step 4: Implement all three frame modes with existing decorative nodes**

Use `.panel-border-flow`, `.panel-corners`, `::before`, and `::after` as follows:

```css
.screen-frame[data-panel-border='borderless'] .panel-shell { border-color: transparent; }
.screen-frame[data-panel-border='borderless'] .panel-border-flow { opacity: .72; }
.screen-frame[data-panel-border='standard'] .panel-shell { /* current restrained frame */ }
.screen-frame[data-panel-border='stereoscopic'] .panel-shell { /* layered bevel + luminous corners */ }
```

Do not remove `panel-border-flow-spin` or `panel-border-breathe`; adjust only opacity, mask, depth, and theme-derived color.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm test --run src/__tests__/HolographicVisualSystem.test.ts src/__tests__/themeAdaptation.test.ts`

Expected: PASS.

Commit: `git commit -am "feat: add theme-aware holographic panel frames"`

### Task 4: Overview mini frames and reusable light-curtain pedestals

**Files:**
- Modify: `src/components/modules/OverviewModule.vue`
- Create: `src/components/visual/HologramLightCurtain.vue`
- Modify: `src/components/visual/HologramGauge.vue`
- Modify: `src/components/visual/HologramGaugeBase.vue`
- Modify: `src/components/visual/ThreePiePedestal.vue`
- Modify: `src/components/shared/MetricRing.vue`
- Modify: `src/components/visual/AvailabilityMetricRing.vue`
- Modify: `src/styles/rings.css`
- Modify: `src/components/modules/AvailabilityModule.vue`
- Modify: `src/components/modules/CompletionModule.vue`
- Modify: `src/styles/modules.css`
- Test: `src/components/visual/__tests__/HologramGauge.test.ts`
- Test: `src/__tests__/HolographicVisualSystem.test.ts`
- Test: `src/__tests__/AvailabilityModule.test.ts`

**Interfaces:**
- Produces: `curtainVariant?: 'cylinder' | 'fan'` on the holographic gauge/base.
- Produces: theme-aware `.hologram-light-curtain--cylinder` and `.hologram-light-curtain--fan` layers.

- [ ] **Step 1: Write failing pedestal and overview tests**

```ts
expect(wrapper.find('.hologram-light-curtain--cylinder').exists()).toBe(true)
expect(wrapper.findAll('.overview-stat-frame')).toHaveLength(5)
expect(source).toContain("curtainVariant?: 'cylinder' | 'fan'")
expect(moduleStyles).toContain('font-family: var(--instrument-font-data)')
```

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/components/visual/__tests__/HologramGauge.test.ts src/__tests__/HolographicVisualSystem.test.ts src/__tests__/AvailabilityModule.test.ts`

Expected: FAIL because curtain variants and overview frame hooks do not exist.

- [ ] **Step 3: Extend the existing pedestal instead of creating a parallel component**

Add one shared `HologramLightCurtain.vue` effect with two CSS variants. `cylinder` is a narrow vertical scanning curtain for the overview center; `fan` is a wider trapezoidal curtain for availability and order pie pedestals. Drive fill, glow, and opacity with gauge/pedestal theme tokens, keep the base scan loop, and honor the existing reduced-motion rule.

- [ ] **Step 4: Upgrade the five overview frames and center number**

Add `.overview-stat-frame` hooks, clipped theme-tinted borders, corner highlights, and a subtle internal sweep. Apply `var(--instrument-font-data)` to the center value and five statistics, keep the current Lucide icons, and keep all numbers legible at 14px or above.

- [ ] **Step 5: Reuse the pedestal variants in availability and order modules**

Pass `curtain-variant="fan"` to availability and order visualizations and keep `curtain-variant="cylinder"` in the overview. No JavaScript timers or rendering loops should be introduced; reuse CSS animation tokens.

- [ ] **Step 6: Verify GREEN and commit**

Run: `pnpm test --run src/components/visual/__tests__/HologramGauge.test.ts src/__tests__/HolographicVisualSystem.test.ts src/__tests__/AvailabilityModule.test.ts`

Expected: PASS.

Commit: `git commit -am "feat: strengthen holographic dashboard pedestals"`

### Task 5: Correct repair, inspection, and maintenance order behavior

**Files:**
- Modify: `src/components/shared/WorkOrderTable.vue`
- Modify: `src/components/modules/CompletionModule.vue`
- Modify: `src/config/moduleRegistry.ts`
- Modify: `src/data/document/dashboardData.ts`
- Modify: `src/types/dashboard.ts`
- Modify: `src/styles/tables.css`
- Modify: `src/styles/modules.css`
- Test: `src/__tests__/WorkOrderPanels.test.ts`
- Test: `src/composables/__tests__/useDashboardData.test.ts`

**Interfaces:**
- Produces: `OrderCompletionVariant = 'inspection' | 'maintenance'`.
- Produces: `CompletionModule` prop `variant?: OrderCompletionVariant`, defaulting to `inspection`.
- Produces: `DashboardData.maintenanceOrders: InspectionOrders` (same aggregate shape, separate semantic name).
- Produces: canonical repair status mapping `待响应 -> 待接修` at the document adapter.

- [ ] **Step 1: Replace the old expectations with failing semantic tests**

```ts
expect(wrapper.find('.work-order-summary').exists()).toBe(false)
expect(data.repairOrders.some((row) => row.at(-1) === '待响应')).toBe(false)
expect(data.repairOrders.some((row) => row.at(-1) === '待接修')).toBe(true)

const maintenance = mount(CompletionModule, { props: { variant: 'maintenance', data } })
expect(maintenance.text()).toContain('本月保养完成率')
expect(maintenance.text()).toContain('待保养')
expect(maintenance.text()).not.toContain('待巡检')
```

Also assert each bottom metric has its own framed class and the center separator element remains present.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/__tests__/WorkOrderPanels.test.ts src/composables/__tests__/useDashboardData.test.ts`

Expected: FAIL because the repair summary exists, raw status is `待响应`, and maintenance uses the health-status component/copy.

- [ ] **Step 3: Normalize status and remove the repair summary**

In `toRepairOrderRow`, canonicalize only the known source alias:

```ts
const status = source.status === '待响应' ? '待接修' : source.status
return [source.department, source.deviceName, source.code, source.duration, source.responder, status]
```

Remove the summary markup and `CountUp` import from `WorkOrderTable.vue`, change `.work-order-module` to one flexible row, and retain the existing partition so `待接修` remains pinned and yellow while every other row stays in `usePagedList`.

- [ ] **Step 4: Consolidate inspection and maintenance orders**

Make `CompletionModule` derive copy from `variant`:

```ts
const copy = computed(() => props.variant === 'maintenance'
  ? { rate: '本月保养完成率', waiting: '待保养' }
  : { rate: '本月巡检完成率', waiting: '待巡检' })
```

Map the existing maintenance service rows to the `InspectionOrders` aggregate shape, expose them as `maintenanceOrders`, and configure registry kind `health` to render `CompletionModule` with `variant: 'maintenance'`. Keep the catalog ID `healthTrend` for saved-layout compatibility.

- [ ] **Step 5: Frame each bottom metric and strengthen the center separator**

Give every summary item its own theme-aware inset border, corner glint, and shallow pedestal surface. Keep the existing animated center separator, increase its light core and shadow falloff, and preserve reduced-motion behavior.

- [ ] **Step 6: Verify GREEN and commit**

Run: `pnpm test --run src/__tests__/WorkOrderPanels.test.ts src/composables/__tests__/useDashboardData.test.ts`

Expected: PASS.

Commit: `git commit -am "fix: align repair and maintenance order semantics"`

### Task 6: Shared dynamic chart axes and exact point labels

**Files:**
- Create: `src/components/charts/chartAxisScale.ts`
- Create: `src/components/charts/__tests__/chartAxisScale.test.ts`
- Modify: `src/components/charts/CubeBarChart.vue`
- Modify: `src/components/charts/LineAreaChart.vue`
- Modify: `src/components/charts/__tests__/CubeBarChart.test.ts`
- Modify: `src/components/charts/__tests__/LineAreaChart.test.ts`

**Interfaces:**
- Produces: `resolveCountAxisScale(values: number[]): { max: number; interval: number }`.
- Consumes: finite non-negative series maxima from both chart components.

- [ ] **Step 1: Write failing utility and chart-option tests**

```ts
expect(resolveCountAxisScale([48])).toEqual({ max: 60, interval: 10 })
expect(resolveCountAxisScale([250])).toEqual({ max: 300, interval: 50 })
expect(resolveCountAxisScale([])).toEqual({ max: 5, interval: 1 })

expect(lineOption.yAxis.max).toBe(60)
expect(lineOption.yAxis.interval).toBe(10)
expect(lineOption.series[0].label).toMatchObject({ show: true, position: 'top' })
```

For CubeBar, assert the option no longer floors the axis at `400` and its label fonts use `chartFontSize`.

- [ ] **Step 2: Run tests and verify RED**

Run: `pnpm test --run src/components/charts/__tests__/chartAxisScale.test.ts src/components/charts/__tests__/CubeBarChart.test.ts src/components/charts/__tests__/LineAreaChart.test.ts`

Expected: FAIL because `getNiceAxisScale` and dynamic line-axis/point-label options do not exist.

- [ ] **Step 3: Implement a pure 1/2/5 nice-number scale**

```ts
export function resolveCountAxisScale(values: number[]) {
  const peak = Math.max(0, ...values.filter((value) => Number.isFinite(value) && value >= 0))
  if (peak <= 0) return { max: 5, interval: 1 }
  const rawStep = peak / 5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const factor = [1, 2, 2.5, 5, 10].find((candidate) => candidate >= normalized) ?? 10
  const interval = Math.max(1, Math.ceil(factor * magnitude))
  let max = Math.ceil(peak / interval) * interval
  if (max - peak < interval / 2) max += interval
  return { max, interval }
}
```

Use the maximum individual series value for grouped bars and the maximum point value for each line chart.

- [ ] **Step 4: Apply axis scales and exact labels to both ECharts options**

Replace CubeBar’s `Math.max(400, ...)` logic and fixed `100` interval with the shared result. Replace LineArea’s `50000/12000` and fixed intervals with the shared result. Add exact-value labels to line series with theme-aware color, `chartFontSize(10)` or larger (resolving to at least 14px), and grid top/right padding that prevents clipping.

- [ ] **Step 5: Verify GREEN and commit**

Run: `pnpm test --run src/components/charts/__tests__/chartAxisScale.test.ts src/components/charts/__tests__/CubeBarChart.test.ts src/components/charts/__tests__/LineAreaChart.test.ts`

Expected: PASS.

Commit: `git add src/components/charts && git commit -m "fix: derive dashboard chart axes from current values"`

### Task 7: Full regression and visual comparison

**Files:**
- Modify only if a regression is found in the files above.

**Interfaces:**
- Consumes: all completed tasks.
- Produces: evidence that the source document’s 13 requirements hold at the 1920×1080 baseline.

- [ ] **Step 1: Run repository verification**

Run:

```bash
pnpm type-check
pnpm lint
pnpm test --run
pnpm build
git diff --check
```

Expected: all commands exit `0`, with no test failures, TypeScript errors, lint errors, build failures, or whitespace errors.

- [ ] **Step 2: Browser-check the default 1920×1080 state**

Open `http://127.0.0.1:4173/` in the selected in-app browser and verify:

1. center work-order column is visibly wider than side columns;
2. all nine panels fit without clipping and visible text is at least 14px;
3. default stereoscopic border, title plates, mini overview frames, and theme-colored light curtains render;
4. repair summary is absent and yellow `待接修` rows are pinned above scrolling rows;
5. inspection and maintenance panels use correct copy and individually framed metrics;
6. bar axes follow current values and line points display exact labels;
7. loop animations continue and console has no new warnings/errors.

- [ ] **Step 3: Browser-check interactive variants**

Switch all three border modes in `/config`, verify live preview and main screen match, sample at least the deep-sea and light themes, enter fullscreen and verify action buttons disappear, then exit via Escape and verify they return.

- [ ] **Step 4: Compare before/after screenshots and fix visible regressions**

Compare the 1920×1080 before screenshot and new screenshot side-by-side, checking title alignment, panel padding, borders, text clipping, chart labels, and light-theme contrast. Any fix repeats the smallest relevant RED/GREEN test cycle before browser re-check.

- [ ] **Step 5: Final verification commit**

Run: `git status --short` and confirm only intentional plan/code/test files are modified.

Commit: `git commit -am "fix: address dashboard issue summary"` only if final QA introduced additional tracked changes.
