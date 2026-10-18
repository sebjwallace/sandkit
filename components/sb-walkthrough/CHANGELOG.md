# sb-walkthrough changelog

## 0.1.3 · 2026-10-18
- Viewers resize the narration and the views by dragging the dividers between them, or with the arrow keys; double-clicking a divider resets it. No area goes below 120px. Sizes aren't remembered between visits.
- The views are placed by the component rather than by `data-count` styles; `data-count` is still set.

## 0.1.2 · 2026-10-18
- The manifest points to `sb-tour` for tours of the page as it stands.

## 0.1.1 · 2026-10-18
- Each view is framed, like the narration, so it's clear at a glance where one ends and the next begins.

## 0.1.0 · 2026-10-17
- First release. A story told across one to four views, one step at a time: steps written as HTML with Back, Next and arrow keys; views laid out beside the narration (on the left, or along the bottom) and outlined when a step or a pointed word focuses them, even popped out of the page; each step's refs to highlight reported in `sb-step` and `current`, and pointed words in `sb-point`.
