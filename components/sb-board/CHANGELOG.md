# Changelog

## 0.2.1 · 2026-11-07
- Manifest: lines between lit parts and a tray of related records are off "Not yet". The veil already shows what's lit together, and records are pulled onto a board from the tags search instead, so the board needs neither.

## 0.2.0 · 2026-11-07
- **Breaking:** rebuilt as a board that lays itself out. Nothing used the old one, so there's nothing to migrate: `layout` is now `{ items: [{ ref, x, y, group?, size? }], links: [{ from, to, label?, tone? }] }`, with `x` and `y` a rough place from 0 to 100, and the board does the measuring, aligning, framing and routing. Frames, pen marks, exact positions, `movable`, `changes`, `revert` and `sb-moves` are gone.
- Added line styles: `lines` is `curved` (the default), `straight` or `square`, and viewers can change it with a button.
- While tags are chosen on the page, everything on the board that doesn't carry them sits behind a dark veil. An item carrying any has a coloured dot for each above it.
- A group can be written once, `{ label, x, y, items }`, with its items stacking in order. A component's ref can be on the top element it draws.
- Problems also go to the console, so nothing needs wiring to see them.
- Added `placed` and `problems`, so an agent can check a board without a screenshot, `arrange()`, and full screen.
- A scroll asked of the board, such as stepping through what's lit or a tour, now moves the camera.

## 0.1.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.0 · 2026-10-24
- First release. A board to pan and zoom, holding the sandbox's own content placed by ref from a layout, with labelled frames behind them grouping things by role, and pen marks on top (box, circle, underline, label and arrow), anchored to refs so they follow what they mark; items the layout leaves out set in a row below; fitted to the whole board until a viewer or the sandbox moves it; `reveal(ref, place)` for items, frames and marks, and `fit()`. On a `movable` board viewers drag items, their moves remembered with an `id` and checked against the layout when it changes; `changes` says what moved in words, with `sb-moves` on each drop and `revert()` to put things back.
