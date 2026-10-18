# sb-c4 changelog

## 0.1.1 · 2026-10-18
- Boxes carry `data-ref` with their element's id, and a line carrying one relationship with an id carries that id, so a sandbox can find them on the page.
- `reveal` returns `true`, or `false` if there's no such element.

## 0.1.0 · 2026-10-17
- First release. A C4 architecture walked into level by level, with a path back out: one nested model, each view drawing a boundary with its neighbours around it and every relationship rolled up to the boxes that can be seen; automatic layout, lines that bow round boxes and labels kept clear; pointing, highlighting (marking boxes that hold what is highlighted), reveal and selection.
