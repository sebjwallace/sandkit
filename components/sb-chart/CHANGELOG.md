# sb-chart changelog

## 0.1.2 · 2026-10-20
- Manifest: `highlight` takes a list, which it always has; the manifest read as if it took one name.

## 0.1.1 · 2026-10-17
- Pointing at the chart shows a guide line with each line's value there; `sb-point` follows the pointer and `sb-select` reports clicks, by position.
- `xLabels` label positions along the bottom, as many as fit; `marks` draw labelled events as vertical lines.
- `highlight` brings series forward and fades the rest, and makes reference lines and marks stand out; pointing at a line or its legend entry does the same. Series and marks take an optional `id`.
- `current` marks a position with a cursor, and the legend gives the values there.

## 0.1.0 · 2026-10-17
- First release. Values over time as lines, with toned reference lines, the latest values marked, a legend for several lines, and support for negative values.
