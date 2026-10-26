# sb-discovery-card changelog

## 0.1.3 · 2026-10-26
- A new kind, `excerpt`, in yellow, its icon a dotted box round a few lines: a piece of one source, on its paper and always compact, showing its words (and page), a region of an image, or rows of data (`excerpt: { source, quote?, page?, image?, region?, rows?, columns? }`). It lights for its source's code too.
- A passage in a fold can name its `excerpt`: it goes by the excerpt's code, opens it, and lights for it or its source.

## 0.1.2 · 2026-10-25
- The element carries `data-ref`, `data-kind` and `data-status` as soon as it's given a card, before it's on the page, so a page can place it, on a board for instance, before it's drawn.

## 0.1.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.0 · 2026-10-25
- First release. One card of domain discovery in 26 kinds, each with its icon and tone; compact, normal and expanded; strips and folds of passages, cards, options and slots; sources always compact, on paper; a footer with when, by whom and in which iteration it was made, and anything else; `sb-open` and `sb-highlight`.
