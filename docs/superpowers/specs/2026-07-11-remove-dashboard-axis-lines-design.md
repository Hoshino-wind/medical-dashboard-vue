# Remove Dashboard Axis Lines Design

**Date:** 2026-07-11

## Goal

Remove the three vertical luminous lines marked in the supplied dashboard screenshot:

1. The full-height center energy spine across the dashboard grid.
2. The inspection-order separator between the list and completion visualization.
3. The maintenance-order separator between the list and completion visualization.

## Selected Approach

Use direct removal instead of hiding or dimming the lines.

- Remove the `.screen-energy-spine` decorative DOM from `BigScreen.vue`.
- Remove all `.screen-energy-spine*` CSS and its now-unused `--motion-loop-spine` token.
- Remove the `.inspection-order-grid::after` and `.health-status-grid::after` separator rules, including their reduced-motion override.
- Keep the existing grid columns, gaps, panel sizes, table/pie positions, and bottom status frames unchanged.

## Preserved Visual Behavior

- Panel borders and title plates remain unchanged.
- The 500 / 824 / 500 desktop layout remains unchanged.
- Holographic pedestals, light curtains, panel flow, gauges, charts, and all unrelated loop animations remain active.
- Inspection and maintenance data, copy, pagination, and interactions remain unchanged.

## Verification

- Update component/CSS contract tests first and verify they fail against the current implementation.
- Assert that `BigScreen` no longer renders `.screen-energy-spine`.
- Assert that the two order-grid separator pseudo-element rules no longer exist.
- Retain assertions for the exact desktop columns and unrelated loop animation contracts.
- Run focused tests, then type-check, lint, the full test suite, and production build.
- Reload the running app at 1920×1080 and compare the supplied marked screenshot with the updated render; all three marked vertical lines must be absent without layout drift.

## Non-Goals

- No changes to data or business semantics.
- No changes to panel border modes or theme selection.
- No removal of horizontal rules, card outlines, chart grid lines, or other decorative motion.
