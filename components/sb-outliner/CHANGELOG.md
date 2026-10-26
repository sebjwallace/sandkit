# sb-outliner changelog

## 0.1.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.0 · 2026-10-22
- First release. A floating panel outlining what can be pointed at, items opening into one level of parts, with headings. Pointing at an entry announces `sb-highlight` with its trace in `refs`, marking it strongly and the rest of the trace faintly; two pins per entry, a fill and an outline, send every pinned trace as `sb-pins` whenever pins, the outline or the model change, dropping pins on refs that are gone. Glow fades pinned highlights to 5% and back through `--sb-glow`. Dragged by its bar; ✕ closes it, and the shell's `panels` slot gives it a header button. Remembers pins, open items, glow and whether it's open per viewer, with an `id`.
