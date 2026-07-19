# Reusable glyph components

This directory is the deterministic component library for future glyph expansion.
Store white-on-black monochrome PNG components under `heavy/` or `orbit/`, then compose
them in `../component-recipes.json`.

Example recipe:

```json
{
  "version": 1,
  "styles": {
    "heavy": {
      "characters": {
        "U+8D44": {
          "advance": 1000,
          "components": [
            { "file": "zi-left.png", "x": 80, "y": 105, "width": 390, "height": 770 },
            { "file": "ci-right.png", "x": 470, "y": 105, "width": 450, "height": 770 }
          ]
        }
      }
    }
  }
}
```

Coordinates use the same top-left-origin 1000-unit glyph cell as the generated fonts.
`mode` defaults to `add`; use `"mode": "subtract"` for a reviewed negative-space cut.
The recipe output is already normalized, so its baseline and optical size are under
the recipe author's control.
