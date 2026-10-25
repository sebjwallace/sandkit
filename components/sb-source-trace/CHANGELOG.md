# sb-source-trace changelog

## 0.1.3 · 2026-10-25
- Demo: what's derived from a source is a readable copy of it (a recording's transcript, a spreadsheet's table), never the agent's analysis, which lives in the items, as the sources practice now says.

## 0.1.2 · 2026-10-26
- Added `drawNode`, so a sandbox can draw sources and items in its own look while the trace lays them out, joins, lights and follows them; and `nodeSize`, the size they're drawn at.

## 0.1.1 · 2026-10-19
- Manifest: trace mode is now `sb-trace-mode`, in the shell's mode picker, rather than wired in the page.

## 0.1.0 · 2026-10-19
- First release. Why something in a model is there, as one graph flowing left to right: the items it rests on, the sources they cite and what those were derived from to its left, everything resting on it to its right. Sources are paper, items plain boxes; clicking a source fires `sb-open`, clicking an item traces from it, with a trail and Back. Unknown ids, loops and items resting on nothing cited are drawn. Lines skipping columns pass between the boxes. Big graphs scroll, opening on the subject, and the trace can go full screen. The tracing, `traceSources`, is plain JSON and runs from Node through `tools/analyse.mjs trace`.
