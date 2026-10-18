# sb-id changelog

## 0.1.2 · 2026-10-18
- Each pill carries `data-ref` with its code, so a sandbox can find every mention on the page.

## 0.1.1 · 2026-10-17
- Added: hovering or focusing a pill announces its code with a page-wide `sb-highlight` event, and a pill lights up when its code is announced from elsewhere, so pills work as references into equations, diagrams and anything else following the highlighting practice.

## 0.1.0 · 2026-10-17
- First release. Identifying codes as pills, resolved through `sb-resolve`, with a definition card on hover and page-wide highlighting on click.
