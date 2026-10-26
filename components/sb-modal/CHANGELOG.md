# sb-modal changelog

## 0.1.3 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.2 · 2026-10-25
- Modals stack: one opened over another lies on top with its own backdrop. A modal inside another's content now closes alone; its clicks used to close the outer one too.

## 0.1.1 · 2026-10-25
- Added sizes. `size="full"` fills the window but for a margin; `--sb-modal-height` joins `--sb-modal-width` for any other size.
- Added `expandable`: a button that switches between the default size and full size, reporting `sb-size`.

## 0.1.0 · 2026-10-17
- First release. A window over the page, built on the browser's modal dialog: a heading, content, actions, and `sb-close` saying how the viewer closed it.
