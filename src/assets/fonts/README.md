# Dashboard subset fonts

This directory contains the two selected dashboard-only font directions:

- `MedDash Rounded Heavy Subset`: the heavier rounded mechanical direction.
- `MedDash Rounded Orbit Subset`: the lighter rounded orbital direction.

Each family is exported as installable TTF and browser-ready WOFF2. The subsets cover
the current dashboard title, module titles, title suffixes, digits, and the punctuation
used by dashboard metrics. Unsupported body-copy characters intentionally fall back to
the next font in the CSS stack.

The approved concept boards are retained in `references/`. Rendered proofs in
`previews/` are generated from the actual TTF files, not from the concept images.

## CSS

Import `dashboard-subset-fonts.css`, then choose one of the variables:

```css
.dashboard-title {
  font-family: var(--font-dashboard-rounded-heavy);
}

.panel-title-text {
  font-family: var(--font-dashboard-rounded-orbit);
}
```

The application imports this stylesheet from `src/main.ts`. The main dashboard title
uses the heavy family, while panel titles use the orbit family.

## Rebuild

The generator uses the pinned packages in `scripts/fonts/requirements.txt` plus the
SHA-256-locked OFL source `NotoSansCJKsc-Regular.otf`:

```bash
python scripts/fonts/build_dashboard_subset_fonts.py \
  --noto-font /path/to/NotoSansCJKsc-Regular.otf
```

Existing glyphs are copied from the approved TTF seeds and verified against the locked
outline fingerprints, so rebuilding cannot silently drift them. Add future characters
to `scripts/fonts/dashboard-extra-glyphs.txt`. New characters are reported as one of:

- approved whole-glyph override;
- reusable component recipe;
- reference-board trace;
- review-only Noto fallback.

The release gate rejects new characters that remain review-only. See
`scripts/fonts/README.md` for the complete review and acceptance workflow. The modified
fonts remain licensed under the SIL Open Font License 1.1; see `OFL.txt` and the
embedded font metadata.
