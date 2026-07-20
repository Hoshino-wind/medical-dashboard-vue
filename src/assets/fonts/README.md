# Dashboard subset fonts

This directory contains one dashboard-only font direction:

- `MedDash Rounded Heavy Subset`: the heavier rounded mechanical direction.

The family is exported as installable TTF and browser-ready WOFF2. The subset covers
the current dashboard title, module titles, title suffixes, digits, and the punctuation
used by dashboard metrics. Unsupported body-copy characters intentionally fall back to
the next font in the CSS stack.

The approved concept boards are retained in `references/`. Rendered proofs in
`previews/` are generated from the actual TTF files, not from the concept images.

## CSS

Import `dashboard-subset-fonts.css`, then use the single Heavy variable:

```css
.dashboard-title {
  font-family: var(--font-dashboard-rounded-heavy);
}

```

The application imports this stylesheet from `src/main.ts`. The main dashboard title
and panel titles both use the Heavy family.

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
