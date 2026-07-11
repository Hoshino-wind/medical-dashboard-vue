# Remove Dashboard Axis Lines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the full-screen center energy spine and the inspection/maintenance vertical separators without changing layout or other holographic motion.

**Architecture:** Delete the center-spine decorative DOM and its dedicated CSS/token rather than hiding it. Delete the order-grid separator pseudo-elements while leaving both grid definitions untouched, then update existing static contract assertions so future test runs match the selected design.

**Tech Stack:** Vue 3, TypeScript, CSS custom properties, Vitest source-contract tests.

## Global Constraints

- Keep the 500 / 824 / 500 desktop grid and all module positions unchanged.
- Preserve panel frames, title plates, pedestals, light curtains, charts, and unrelated loop animations.
- Remove only the three vertical luminous lines marked in the supplied screenshot.
- The user explicitly waived regression execution for this change; update existing test contracts but do not run test, type-check, lint, build, or browser-regression commands.

---

### Task 1: Remove the three vertical luminous lines

**Files:**
- Modify: `src/components/shared/BigScreen.vue`
- Modify: `src/styles/layout.css`
- Modify: `src/styles/modules.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/__tests__/BigScreen.reference.test.ts`
- Modify: `src/__tests__/HolographicVisualSystem.test.ts`
- Modify: `src/__tests__/WorkOrderPanels.test.ts`

**Interfaces:**
- Removes: `.screen-energy-spine` and all `.screen-energy-spine-*` decorative nodes.
- Removes: `.inspection-order-grid::after` and `.health-status-grid::after` separator layers.
- Preserves: `.screen-grid`, `.inspection-order-grid`, and `.health-status-grid` geometry.

- [x] **Step 1: Update existing static contracts without executing them**

Change `BigScreen.reference.test.ts` to assert:

```ts
expect(wrapper.find('.screen-energy-spine').exists()).toBe(false)
```

Change `HolographicVisualSystem.test.ts` to assert that `layout.css` does not contain `.screen-energy-spine`, while retaining the exact column assertion and other motion assertions.

Change `WorkOrderPanels.test.ts` to assert that `modules.css` contains neither separator selector:

```ts
expect(moduleStyles).not.toContain('.inspection-order-grid::after')
expect(moduleStyles).not.toContain('.health-status-grid::after')
```

Remove the obsolete `--motion-loop-spine` expectation.

- [x] **Step 2: Remove the center-spine implementation**

Delete this block from `BigScreen.vue`:

```vue
<span class="screen-energy-spine" aria-hidden="true">
  <i class="screen-energy-spine-core"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--top"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--middle"></i>
  <i class="screen-energy-spine-node screen-energy-spine-node--bottom"></i>
</span>
```

Delete all `.screen-energy-spine*` rules from `layout.css`, their reduced-motion selectors, and the unused `--motion-loop-spine` token from `tokens.css`.

- [x] **Step 3: Remove both order-panel separator layers**

Delete the shared `.inspection-order-grid::after, .health-status-grid::after` rule and its reduced-motion override from `modules.css`. Do not change `grid-template-columns`, `gap`, padding, or panel contents.

- [x] **Step 4: Inspect the patch and commit**

Run only non-regression source checks:

```bash
git diff --check
git diff --stat
git status --short
```

Commit:

```bash
git add docs/superpowers/plans/2026-07-11-remove-dashboard-axis-lines.md \
  src/components/shared/BigScreen.vue \
  src/styles/layout.css src/styles/modules.css src/styles/tokens.css \
  src/__tests__/BigScreen.reference.test.ts \
  src/__tests__/HolographicVisualSystem.test.ts \
  src/__tests__/WorkOrderPanels.test.ts
git commit -m "fix: remove dashboard axis lines"
```
