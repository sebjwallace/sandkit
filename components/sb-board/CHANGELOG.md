# sb-board changelog

## 0.1.0 · 2026-10-24
- First release. A board to pan and zoom, holding the sandbox's own content placed by ref from a layout, with labelled frames behind them grouping things by role, and pen marks on top (box, circle, underline, label and arrow), anchored to refs so they follow what they mark; items the layout leaves out set in a row below; fitted to the whole board until a viewer or the sandbox moves it; `reveal(ref, place)` for items, frames and marks, and `fit()`. On a `movable` board viewers drag items, their moves remembered with an `id` and checked against the layout when it changes; `changes` says what moved in words, with `sb-moves` on each drop and `revert()` to put things back.
