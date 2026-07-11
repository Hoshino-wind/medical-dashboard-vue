# Mecha Panel Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `stereoscopic` panel border with a configurable mecha-style 3D chassis while preserving the existing `borderless` and `standard` modes.

**Architecture:** Keep `DashboardConfig.panelBorderMode` and its persisted values unchanged. Extend the shared `PanelShell` with one decorative, non-interactive mecha frame layer; scope all new visuals to `[data-panel-border='stereoscopic']`, so every main module continues to switch from the existing global configuration. Use the existing theme-derived panel tokens and motion durations so dark/light themes and reduced-motion behavior remain consistent.

**Tech Stack:** Vue 3 SFC, TypeScript, CSS custom properties and keyframes, Vitest, Vue Test Utils.

## Global Constraints

- The three stored values remain exactly `borderless`, `standard`, and `stereoscopic`.
- `standard` must preserve the current frame.
- `borderless` must preserve the current borderless flowing treatment.
- `stereoscopic` becomes the mecha-style 3D frame and is labeled `机甲立体框`.
- Keep looping border animation; reduced-motion must render a static frame.
- Do not change module dimensions, grid placement, content padding, business data, or chart behavior.
- Apply the heavy mecha chassis only to the shared main module panel, not to internal metric cards.
- Do not add dependencies or image assets.

---

### Task 1: Lock the configurable mecha-frame contract

**Files:**

- Create: `src/__tests__/PanelMechaFrame.test.ts`
- Read: `src/components/shared/PanelShell.vue`
- Read: `src/components/shared/ConfigPanel.vue`
- Read: `src/styles/panel.css`
- Read: `src/styles/config.css`

**Interfaces:**

- Consumes: existing `PanelBorderMode = 'borderless' | 'standard' | 'stereoscopic'` and `.screen-frame[data-panel-border]` state.
- Produces: a focused source-and-mount test describing the mecha structure, label, scoped CSS, looping trace, and reduced-motion fallback.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PanelShell from '@/components/shared/PanelShell.vue'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('mecha panel frame', () => {
  it('renders a decorative four-rail and four-corner chassis for the shared main panel', () => {
    const wrapper = mount(PanelShell, { props: { title: '设备总览' } })
    expect(wrapper.find('.panel-mecha-frame').attributes('aria-hidden')).toBe('true')
    expect(wrapper.findAll('.panel-mecha-rail')).toHaveLength(4)
    expect(wrapper.findAll('.panel-mecha-corner')).toHaveLength(4)
  })

  it('keeps the existing modes and turns stereoscopic into a looping mecha frame', () => {
    const panel = read('styles/panel.css')
    const configPanel = read('components/shared/ConfigPanel.vue')

    expect(panel).toContain("[data-panel-border='borderless']")
    expect(panel).toContain("[data-panel-border='standard']")
    expect(panel).toContain("[data-panel-border='stereoscopic'] .panel-mecha-frame")
    expect(panel).toContain('@keyframes panel-mecha-trace-sweep')
    expect(panel).toContain('panel-mecha-trace-sweep var(--motion-loop-panel) linear infinite')
    expect(panel).toMatch(
      /prefers-reduced-motion:[\s\S]*?\.panel-mecha-rail::after[\s\S]*?animation: none/,
    )
    expect(configPanel).toContain('机甲立体框')
  })
})
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `npm test -- --run src/__tests__/PanelMechaFrame.test.ts`

Expected: FAIL because `.panel-mecha-frame`, its rail/corner elements, the mecha animation, and the new label do not exist.

---

### Task 2: Build the shared mecha chassis and looping edge trace

**Files:**

- Modify: `src/components/shared/PanelShell.vue`
- Modify: `src/styles/panel.css`
- Test: `src/__tests__/PanelMechaFrame.test.ts`

**Interfaces:**

- Consumes: global `data-panel-border`, `--panel-frame-rim`, `--panel-frame-depth`, `--panel-frame-highlight`, `--motion-loop-panel`, and each panel's `--motion-phase`.
- Produces: `.panel-mecha-frame`, four `.panel-mecha-rail` elements, four `.panel-mecha-corner` elements, and the `panel-mecha-trace-sweep` loop.

- [ ] **Step 1: Add one inert decorative layer to `PanelShell`**

```vue
<span class="panel-mecha-frame" aria-hidden="true">
  <i class="panel-mecha-rail panel-mecha-rail--top"></i>
  <i class="panel-mecha-rail panel-mecha-rail--right"></i>
  <i class="panel-mecha-rail panel-mecha-rail--bottom"></i>
  <i class="panel-mecha-rail panel-mecha-rail--left"></i>
  <i class="panel-mecha-corner panel-mecha-corner--top-left"></i>
  <i class="panel-mecha-corner panel-mecha-corner--top-right"></i>
  <i class="panel-mecha-corner panel-mecha-corner--bottom-right"></i>
  <i class="panel-mecha-corner panel-mecha-corner--bottom-left"></i>
</span>
```

- [ ] **Step 2: Scope the chassis to the third mode**

Add a hidden-by-default absolute layer. Under `[data-panel-border='stereoscopic']`, render a dark outer shell, a bright outer rim, a recessed inner rail, stepped corner armor, and segmented top/bottom/side rails. Derive all colors from the existing panel tokens; keep the layer `pointer-events: none` and below header/body content.

- [ ] **Step 3: Add the loop and breathing behavior**

Use `panel-mecha-trace-sweep` on rail pseudo-elements so a short highlight moves along the rail rather than flashing the whole card. Use `--motion-phase` to offset the nine cards. Keep the current title mini-bar loop and existing border flow for the other modes.

- [ ] **Step 4: Add reduced-motion and light-theme rules**

Inside the existing reduced-motion query, stop the mecha trace and retain its static midpoint glow. Under the light theme, reinterpret the same tokens as pale alloy rails with restrained blue highlights and no black panel fill.

- [ ] **Step 5: Run the focused test to verify GREEN**

Run: `npm test -- --run src/__tests__/PanelMechaFrame.test.ts`

Expected: PASS with no warnings.

---

### Task 3: Make the configuration preview match the live mecha mode

**Files:**

- Modify: `src/components/shared/ConfigPanel.vue`
- Modify: `src/styles/config.css`
- Test: `src/__tests__/PanelMechaFrame.test.ts`

**Interfaces:**

- Consumes: the existing radio value `stereoscopic` and theme tokens.
- Produces: the user-facing label `机甲立体框` and a miniature stepped-corner/segmented-rail preview.

- [ ] **Step 1: Rename only the visible label**

Change `立体框架` to `机甲立体框`; keep the radio value and store call as `stereoscopic`.

- [ ] **Step 2: Restyle the third preview**

Use its existing element and pseudo-elements to show a dark recessed inner plate, four chamfered armor corners, and a bright segmented center rail. Do not change the other two previews.

- [ ] **Step 3: Re-run the focused test**

Run: `npm test -- --run src/__tests__/PanelMechaFrame.test.ts`

Expected: PASS.

---

### Task 4: Verify the implementation without a full regression pass

**Files:**

- Create: `design-qa.md`
- Inspect: reference image and local dashboard at `http://127.0.0.1:4173/`

**Interfaces:**

- Consumes: the selected reference screenshot and the rendered `stereoscopic` mode.
- Produces: a visual comparison record and final pass/block state.

- [ ] **Step 1: Run low-cost static checks**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 2: Open the existing local dashboard and select `机甲立体框`**

Confirm the nine main modules receive the chassis, internal metric cards remain lightweight, and switching among all three options updates immediately.

- [ ] **Step 3: Compare reference and implementation at the same dashboard state**

Record hierarchy, corner geometry, rail segmentation, light restraint, title integration, and any remaining P3 polish in `design-qa.md`. The final line must be `final result: passed` before handoff, or `final result: blocked` if visual inspection is unavailable.

- [ ] **Step 4: Commit the scoped change**

```bash
git add docs/superpowers/plans/2026-07-11-mecha-panel-frame.md \
  src/__tests__/PanelMechaFrame.test.ts \
  src/components/shared/PanelShell.vue \
  src/components/shared/ConfigPanel.vue \
  src/styles/panel.css \
  src/styles/config.css \
  design-qa.md
git commit -m "feat: add configurable mecha panel frame"
```
