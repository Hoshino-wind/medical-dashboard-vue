# Approved whole-glyph overrides

Place visually reviewed monochrome PNG glyph masks in the Heavy directory:

- `heavy/U+8D44.png`

The filename is the Unicode code point. White pixels are ink and black pixels are
empty space. The builder tight-crops and normalizes the mask to the existing font
metrics. An approved override takes precedence over component recipes, reference-board
traces, and the Noto fallback.

Use an override when a new character needs a one-off optical correction that cannot be
expressed cleanly by reusable components.
