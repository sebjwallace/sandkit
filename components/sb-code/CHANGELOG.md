# sb-code changelog

## 0.1.2 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.1 · 2026-10-19
- Viewers can close the variables beside the code to its heading, and open it again. The `variables` attribute starts it `open` (the default), `closed`, or `none` to leave it out, and always says how it is.
- With an `id`, each viewer's choice to open or close the variables is remembered.
- Each value keeps to one line, cut short when long: hovering shows it in full, and clicking a variable opens it until clicked again.
- `sb-point { line }` (or `null`) fires as the pointer moves between lines, so a sandbox can announce what a line concerns.
- The variables stay beside the code at every width, sharing the space, rather than moving below it when narrow, so opening them never shifts the page.
- The variables' heading is now the `sb-code__toggle` summary of an `sb-code__pane`, rather than the table's caption.

## 0.1.0 · 2026-10-17
- First release. Code or pseudocode, coloured by a configurable syntax (keywords, literals and comment markers, with defaults for pseudocode, JavaScript and Python), stepped through a trace recorded by the model: the current line marked, variables beside it with changes marked, a note per step, optional controls, and lines and variables that can be pointed at.
