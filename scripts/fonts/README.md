# Deterministic dashboard font extension

The two dashboard fonts are extended from their current TTF files instead of being
redrawn from image prompts. Existing glyphs are copied byte-for-shape from the seed
font and checked against `font-glyph-lock.json` after every build.

## Add characters

1. Add the new characters to `dashboard-extra-glyphs.txt`.
2. Build a review version with the pinned Noto Sans CJK SC source:

   ```bash
   python scripts/fonts/build_dashboard_subset_fonts.py \
     --noto-font /path/to/NotoSansCJKsc-Regular.otf \
     --output-dir /tmp/medical-dashboard-font-review
   ```

3. Inspect `/tmp/medical-dashboard-font-review/previews/` and its
   `font-build-report.json`. A review build never modifies the production font files.
4. For any character reported as `noto-fallback`, add either:
   - an approved whole-glyph PNG under `approved-glyphs/<style>/`, or
   - reusable component PNGs plus a recipe in `component-recipes.json`.
5. Run the release gate. It refuses unapproved new fallback glyphs:

   ```bash
   python scripts/fonts/build_dashboard_subset_fonts.py \
     --noto-font /path/to/NotoSansCJKsc-Regular.otf \
     --require-approved-new-glyphs
   ```

6. After visual approval, lock the accepted outlines:

   ```bash
   python scripts/fonts/build_dashboard_subset_fonts.py \
     --noto-font /path/to/NotoSansCJKsc-Regular.otf \
     --require-approved-new-glyphs \
     --accept-current-glyphs
   ```

Subsequent builds preserve every locked glyph. A changed seed outline causes the build
to fail before it can silently replace the approved design.

## Reproducible environment

Install `requirements.txt`. The first approved build for a source-font/environment
combination must include `--update-build-lock`; later builds verify the source SHA-256
and dependency versions automatically.

The pinned source can be downloaded from the commit recorded in
`font-build-lock.json`:

```bash
curl -fL -o /tmp/NotoSansCJKsc-Regular.otf \
  https://raw.githubusercontent.com/notofonts/noto-cjk/f8d157532fbfaeda587e826d4cd5b21a49186f7c/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf
```

`--refresh-existing` is intentionally exceptional: it disables seed preservation and
must only be used when deliberately redesigning the existing family.
