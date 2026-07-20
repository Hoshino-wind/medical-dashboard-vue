# Design QA — 图三医疗脉冲卡片标题

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
