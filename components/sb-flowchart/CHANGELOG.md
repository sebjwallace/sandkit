# sb-flowchart changelog

## 0.1.2 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.1 · 2026-10-18
- Steps and lanes carry `data-ref` with their id, replacing undocumented `data-node-id` and `data-lane-id`, and edges given an `id` carry it too, so a sandbox can find them on the page. Each lane is grouped in `sb-flowchart__lane-group`.

## 0.1.0 · 2026-10-17
- First release. A flowchart laid out from its structure, with optional swim lanes running down or to the right, five kinds of step, right-angled lines that go around steps and loop back, and the active step and the way it came marked.
