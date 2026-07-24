# Design QA — 浅色主题三套卡片边框

## Visual truth and implementation state

- Reference 1 / 流光玻璃: `/Users/gaozengyu/.codex/generated_images/019f8268-47c9-7bd1-ac74-bd395e7feb8c/call_NiDCg9FFfkoRf7GeoeU1stuq.png` (`1748 × 900`)
- Reference 2 / 无边框: `/Users/gaozengyu/.codex/generated_images/019f8268-47c9-7bd1-ac74-bd395e7feb8c/call_W4yr3wECQYMSNKQuTrgucFh8.png` (`1764 × 892`)
- Reference 3 / 立体边框: `/Users/gaozengyu/.codex/generated_images/019f8268-47c9-7bd1-ac74-bd395e7feb8c/call_Tf1tYy9Amd9DQNMkzxFskJK6.png` (`1701 × 925`), with the user's later override to remove every cut corner and use a light glass card plane.
- Implementation: `http://127.0.0.1:5173/`
- Theme and layout: `light-medical`, `3行3列`, entrance animation settled
- Verified states:
  - `glass-flow`: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/light-glass-flow.png`
  - `borderless`: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/light-borderless.png`
  - `chamfered-instrument`: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-no-chamfer-qa/02-no-chamfer-glass.png`
- Comparison viewport: `1834 × 927` CSS pixels, DPR `1`
- Normalization: each reference was aspect-preserving padded to `1834 × 927`; each implementation capture is an exact `1834 × 927` screenshot.
- Full comparisons:
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/glass-full-comparison.png`
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/borderless-full-comparison.png`
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/chamfered-full-comparison.png`
- Focus comparisons:
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/glass-focus-comparison.png`
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/borderless-focus-comparison.png`
  - `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-panel-qa/comparisons/chamfered-focus-comparison.png`
- No-chamfer refinement viewport: `1280 × 720` CSS pixels, DPR `1`.
- No-chamfer before/after comparison: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/medical-dashboard-no-chamfer-qa/before-after-comparison.png`

## Fidelity surfaces

- Typography and copy: the live dashboard font, all module titles, suffixes, table copy, chart labels, and responsive truncation behavior are unchanged.
- Layout and spacing: the existing 3×3 dashboard geometry and panel internals are preserved. Only the light-theme panel chrome and title markers change between the three styles.
- Flowing glass: uses an opaque near-white glass surface, one restrained cool blue-gray outline, a subtle animated edge flow, and the reference-style three-bar title marker.
- Borderless: removes border, mechanical frame, and close-range outline shadows. Separation comes from the white card plane, dashboard gutter, and one broad low-contrast elevation shadow.
- Raised glass frame: the existing `chamfered-instrument` configuration key now renders a continuous rounded perimeter, a translucent near-white glass plane, restrained backdrop blur, static title bars, and rounded compact status frames. No light-theme panel or compact frame uses `clip-path`.
- Color and theme isolation: all new light rules are scoped to `data-theme-id="light-medical"` and the selected `data-panel-style`; dark-theme panel styles are untouched.
- Image and chart quality: existing logos, gauges, hologram bases, ECharts canvases, and chart legends remain sharp and uncropped at the verification viewport.

## Comparison history

1. Pass 1 implemented the three selected references as three independent light-theme shells while retaining existing content and dark-theme behavior.
2. Combined full and focused comparisons found P2 issues: the glass shell looked too blue and doubled at the edge, borderless retained a close outline, chamfered framing was too faint, and light mechanical frames leaked into the other two styles.
3. Pass 2 raised light-surface opacity, reduced glass flow intensity, removed the borderless tight shadow, restored static title markers, and scoped light mechanical frames exclusively to `chamfered-instrument`.
4. A second same-viewport comparison found the chamfered style still too close to borderless at full-dashboard scale. The final pass increased perimeter frame contrast and thickness and added a restrained bevel shadow.
5. Final full and focused comparisons show three clearly differentiated shells with no remaining actionable P0, P1, or P2 visual issue. Reference data values differ from the live rotating mock feed; this does not affect the verified panel-border treatment.
6. The user then overrode the third option's cut-corner treatment. The refinement replaced the polygon clips on both the panel and compact frame with continuous rounded frames and changed the card plane to a restrained light-glass surface.
7. The `1280 × 720` before/after comparison confirms that every outer and compact corner is continuous, the glass surface remains readable, and the third style still differs clearly from borderless. No actionable P0, P1, or P2 issue remains.

## Functional and runtime verification

- Configuration interaction: switched through “流光玻璃”, “无边框”, and “立体边框”; each selection updated the dashboard `data-panel-style` correctly.
- Restored state: the preview is left on `light-medical` + `chamfered-instrument`.
- Runtime: all nine panels render in each style, the dashboard is nonblank, and no framework error overlay appears.
- No-chamfer geometry: the live panel and frame both compute `clip-path: none`; both use a continuous `6.67px` radius at the verified viewport; the panel computes an `8px` backdrop blur with `1.08` saturation.
- Console: no warnings or errors; only Vite connection and hot-update debug messages.
- Automated checks: ESLint passed; Vue TypeScript build passed; `29` test files / `98` tests passed.
- Production check: Vite production build passed.
- Formatting: Prettier and `git diff --check` passed.

final result: passed

---

# Previous QA record — 图三医疗脉冲卡片标题

## Visual truth and implementation state

- Reference: `/Users/gaozengyu/.codex/generated_images/019f68dd-ab30-77f3-90d3-c4b56cc94d20/exec-47545ae6-a87c-4afa-b412-957722f36cd5.png`
- User-reported mismatch crop: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/codex-clipboard-ec62f663-c996-43eb-be1c-b450029f38b0.png`
- Implementation: `http://127.0.0.1:5173/`
- Implementation screenshot: `/tmp/medical-dashboard-title-text-up-final.png`
- State: `deep-sea-instrument` theme, `chamfered-instrument` panel style, entrance animation settled
- Comparison viewport: reference and implementation both `1767 × 890`
- Full comparison: `/tmp/medical-dashboard-title-text-up-final-comparison.png`
- Focused title comparison: `/tmp/medical-dashboard-title-text-up-final-focused-comparison.png` (reference above, implementation below)

## Fidelity surfaces

- Typography: rounded dashboard font preserved; chamfered titles use a calibrated 1.375rem size, 550 weight, 0.075em tracking, and restrained cyan glow.
- Layout and spacing: compact raised title frames are removed. The existing title group and its background patch retain their calibrated positions; only the live title text receives an additional 0.1875rem upward translation. The patch still extends 2.25rem left and 8rem right across the full ECG and node-line ornaments. Suffixes stay in the third grid column and all nine title frames fit without clipping.
- Color and tokens: the opaque title patch mixes the active theme's `--bg` and `--bg-soft` tokens, while ornament glow continues to derive from the existing chart/title tokens. The patch therefore hides the border cleanly without introducing a foreign hard-coded color.
- Asset quality: two generated RGBA assets have clean transparent backgrounds: a compact left ECG pulse and a right two-level line with one filled lower node and one hollow upper ring.
- Copy and content: the live dashboard titles, suffixes, charts, tables, and data are preserved; only the selected title treatment changed.

## Comparison history

1. Earlier handoff missed a P1 fidelity mismatch that became obvious in the user's close crop: one combined background image was scaled to the title frame, compressing both ornaments and changing their proportions as title length changed.
2. Split pass 1 replaced the combined image with separately anchored left/right assets. The focused comparison then found P2 issues: the ECG amplitude was too high and the right nodes were too faint and vertically misaligned.
3. Split passes 2–4 corrected the left pulse width/amplitude, restored the filled lower node and hollow upper ring, moved the lower line beneath the title, and returned the title to a lighter optical weight.
4. The next user correction identified a P2 structural mismatch: the title was visually transparent, so the panel's top border remained visible through the center instead of breaking behind a colored title strip.
5. The final pass added a flat opaque theme-colored mask behind the live title, raised the two ornaments and text above it, and disabled the mask in the independent light-theme treatment. Same-viewport full and focused comparisons found no remaining actionable P0, P1, or P2 issues. Minor raster silhouette differences remain P3.
6. The user then identified a P2 refinement: the title group still sat slightly low and the background patch covered only the live text, leaving the extended ornament images without the same dark backing.
7. The latest pass moved the full header group upward by 0.1875rem and expanded the mask to the measured ornament footprint. The focused comparison confirms that the upper border now breaks behind the entire title graphic rather than only behind the characters; no actionable P0, P1, or P2 issue remains.
8. The user clarified the next refinement as title-only movement: the ornaments, mask, and upper border must not move again.
9. The final text-only pass adds a 0.1875rem translation exclusively to `.panel-title-text`. Browser geometry confirms the title moves upward by 2.47px at the verified viewport while the title frame remains untransformed and ornament/mask geometry is unchanged. The focused comparison shows no clipping or collision.

## Functional and runtime verification

- Configuration interaction: switched from “立体边框” to “流光玻璃” and back; the checked state updated correctly, and the dashboard returned to `data-panel-style="chamfered-instrument"` with both ornaments visible.
- Runtime: all eighteen ornament images load, all nine title text bounds fit their frames, every chamfered title exposes the expanded opaque pseudo-element mask, title text computes a 2.47px upward translation while the frame stays untransformed, and all panels settle to opacity 1.
- Console: no warnings or errors.
- Automated checks: 7 targeted tests passed across title styling, title suffix rendering, and mechanical-frame behavior.
- Production check: type-check and Vite production build passed.

---

## Previous QA record — maintenance-completion hologram spacing

- Source visual truth: `/var/folders/q_/stm9rb6j583855y2_zw379kw0000gn/T/codex-clipboard-d403e833-847b-4fb9-8d8d-729bd071f8f0.png`
- Implementation screenshot: `/tmp/medical-dashboard-full-after-base-1.5rem.jpg`
- Focused implementation crop: `/tmp/medical-dashboard-pie-after-base-1.5rem.jpg`
- Combined comparison: `/tmp/medical-dashboard-pie-comparison-base-1.5rem.jpg`
- Viewport: `1280 × 720`
- State: default dark dashboard with both maintenance-completion cards rendered with animated 2.5D pies and hologram bases.

The prior full-dashboard comparison confirmed that both adjusted pie cards remained inside their panel bounds, retained the existing grid proportions, and did not collide with their titles or bottom status summaries. The surrounding tables, charts, panel chrome, and dashboard density were unchanged.

- Typography, copy, colors, and visual tokens were unchanged.
- Both bases were moved another `1.5rem` lower (`top: 3.25rem` to `4.75rem`) while the pies remained unchanged.
- The existing SVG pie and hologram-base rendering remained sharp without cropping or new raster artifacts.
- Geometry regression, production build, type-check, browser rendering, and console verification passed with no actionable P0, P1, or P2 findings.

final result: passed
