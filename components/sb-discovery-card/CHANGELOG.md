# sb-discovery-card changelog

## 0.1.7 · 2026-11-06
- Carries `tags` as `data-tags`, on the card, a card in a fold and a passage, and announces them with `sb-highlight`, so the page-wide `sb-highlighting` script can light what shares a tag. With no tags, it announces as before. `working` tags are never read.
- Paper no longer hides an outline on what holds it, so a lit passage or source can be seen.

## 0.1.6 · 2026-11-06
- Carries `data-sb-announces`, so the page-wide `sb-highlighting` script leaves its announcing to it.

## 0.1.5 · 2026-11-05
- Two new kinds: `capability`, a constraint's opposite, and `contract`, what people agree shapes a domain.
- A contract wears its own material, in every variant but compact a sheet in a double rule, with a serif title, its `scope`, numbered `articles` of clauses that open and light what they name, and the `parties`' signature lines. Compact, it keeps the double rule.
- A contract has `definitions`, shown above its articles when expanded, and a fourth variant, `document`: written out in full to be read cold or printed, with each clause's `details` and `cited` words, `notes` and lettered `schedules`, nothing to open or fold, black on white whatever the theme, its clauses kept whole wherever it's flowed into pages. A sandbox saves it as a PDF with the browser's own print dialog.
- New status word: `available` reads as good.

## 0.1.4 · 2026-10-29
- Fourteen new kinds, for weighing choices, naming problems and recording ways of working: `hypothesis`, `problem` and `incident` with what we know; `strategy`, `dispute`, `requirement`, `principle`, `pattern`, `antipattern`, `optimization`, `solution`, `option`, `tradeoff` and `recommendation` with where we're going. Each has its own icon and tone.
- A card can carry a `title`, a few words after its code in the header, compact or full.
- New status words: `chosen`, `improving`, `followed`, `applied`, `solved`, `resolved`, `settled` and `removed` read as good; `worsening` and `present` as bad; `steady` and `set aside` as muted.

## 0.1.3 · 2026-10-26
- A new kind, `excerpt`, in yellow, its icon a dotted box round a few lines: a piece of one source, on its paper and always compact, showing its words (and page), a region of an image, or rows of data (`excerpt: { source, quote?, page?, image?, region?, rows?, columns? }`). It lights for its source's code too.
- A passage in a fold can name its `excerpt`: it goes by the excerpt's code, opens it, and lights for it or its source.

## 0.1.2 · 2026-10-25
- The element carries `data-ref`, `data-kind` and `data-status` as soon as it's given a card, before it's on the page, so a page can place it, on a board for instance, before it's drawn.

## 0.1.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.0 · 2026-10-25
- First release. One card of domain discovery in 26 kinds, each with its icon and tone; compact, normal and expanded; strips and folds of passages, cards, options and slots; sources always compact, on paper; a footer with when, by whom and in which iteration it was made, and anything else; `sb-open` and `sb-highlight`.
