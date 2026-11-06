# sb-id changelog

## 0.1.4 · 2026-11-06
- A pill lights when its code is named in a list on `sb-highlight` (`refs`), not only as the lone `ref`. Carries `data-sb-announces` and `data-sb-lights`, so the page-wide `sb-highlighting` script leaves it to itself.
- Fixed: moving straight from a pill to something else that announces could turn its light off, because the pill said it had stopped pointing too late. A pill now announces on pointer events, and a tap shows its card without announcing.

## 0.1.3 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.2 · 2026-10-18
- Each pill carries `data-ref` with its code, so a sandbox can find every mention on the page.

## 0.1.1 · 2026-10-17
- Added: hovering or focusing a pill announces its code with a page-wide `sb-highlight` event, and a pill lights up when its code is announced from elsewhere, so pills work as references into equations, diagrams and anything else following the highlighting practice.

## 0.1.0 · 2026-10-17
- First release. Identifying codes as pills, resolved through `sb-resolve`, with a definition card on hover and page-wide highlighting on click.
