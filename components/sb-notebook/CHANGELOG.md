# sb-notebook changelog

## 0.1.4 · 2026-10-30
- **Focus mode**, from the icon beside the notebook's title: the sections fill the window below the shell's header, with the head put away, so wide sections get every pixel. **Exit focus**, floating at the top right, or Esc brings the page back. The `focus-mode` attribute and `focusMode` property set it quietly; a viewer's choice fires `sb-focus-mode`.

## 0.1.3 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.2 · 2026-10-20
- The head sticks below the shell's compact header while the page is scrolled, using `--sb-header-height`, rather than under it.

## 0.1.1 · 2026-10-20
- Fixed: ▲ ▼ and the outline didn't scroll to the section when clicked with a mouse. The click left the control focused, and putting focus back after redrawing threw, because the component's own stylesheet constant hid the browser's `CSS.escape`.
- **Expand all** and **Collapse all** in the head, each disabled when there's nothing to do.
- The filters and the outline start closed, however wide the notebook.

## 0.1.0 · 2026-10-20
- First release. A workshop's sections in one page: every direct child is a section with a bar showing its kind, who and when, and the codes inside it counted from `data-ref`. Key sections are open and marked, asides start collapsed, and clicking a bar collapses or opens a section. A head with ▲ ▼, the position, an outline, and filters by key, code prefix, kind and person, each with a count; filtering opens what matches and collapses the rest, and clearing brings back what was open. `reveal` opens the section holding a ref.
