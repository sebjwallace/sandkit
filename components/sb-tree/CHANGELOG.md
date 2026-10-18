# sb-tree changelog

## 0.1.1 · 2026-10-18
- Each item carries `data-ref` with its node's id (it was an undocumented `data-id`), so a sandbox can find a node on the page.
- `reveal` returns `true`, or `false` if there's no such node.

## 0.1.0 · 2026-10-17
- First release. Nested nodes with guide lines, branches that open and close, selection, highlighting that marks closed branches holding a highlighted node, the keyboard of a tree view, and methods to open, close and reveal from outside.
