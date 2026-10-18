# Two pages

A tiny sandbox in two pages, for testing pages and exporting: a lemonade stand where the price of a cup changes how many sell. `tools/test.mjs` exports it; the checklist below is the manual test. It uses Sandkit's files from the repo (`../../../`) rather than a copy in `lib/sandkit/`, so run the export tool as `node tools/export.mjs`, from the repo.

## Checklist

1. Open `index.html` by double-clicking it. The header shows both pages, the current one marked; clicking moves between them. Drag the price and the takings follow.
2. On either page, press Export (the download icon). Unticking **Include images** changes the prompt; **Copy prompt** copies it.
3. Run `node tools/export.mjs tools/fixtures/two-pages/second.html`. The report lists only that page's files: no `index.html`, no `sb-parameters`.
4. Double-click `export/second.html`. It runs: the chart shows, the lemon shows, the profits match the original.
5. The header says "Exported <date> · version 0.2.0 · Sandkit <version>"; the other page is struck through and isn't a link; there's no Export button.
6. Move the exported file somewhere else (the Desktop) and open it again: it still works, so nothing was left as a reference.
7. Send it to yourself and open it from email or Teams.
8. Export again with `--no-images`: the lemon is gone, its description in its place.
