# sb-kanban changelog

## 0.2.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.2.0 · 2026-10-24
- **Breaking:** renamed from `sb-board`. Replace every `sb-board` with `sb-kanban`: the script path (`components/sb-kanban/sb-kanban.js`), the tag, and the classes (`sb-board__card` becomes `sb-kanban__card`, and so on).

## 0.1.1 · 2026-10-18
- Cards and columns carry `data-ref` with their id, beside `data-id` and `data-column`, so a sandbox can find them on the page.

## 0.1.0 · 2026-10-17
- First release. Cards in columns, each column counted against its limit and flagged when over it; cards that moved marked with the column they came from, and new cards marked; dragging or arrow keys asking the sandbox to move a card; selecting, pointing and highlighting of cards and columns.
