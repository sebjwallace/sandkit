# Lineage: seeing a domain evolve

A mock-up of an idea: the way to understand a domain is to follow it from its beginnings and watch it grow, one idea at a time. The domain is the station departure board from `demos/departure-board/`, kept apart from it.

Open `index.html` by double-clicking it. `NOTES.md` records what each step taught us.

## The idea

Everything that evolves starts small and simple, and grows step by step (Kenneth Stanley and Jeff Clune's work on open-ended evolution). So the departure board's model is kept as a **lineage**: a series of small, runnable versions, each one idea richer than its parent, each with a note on what caused it. Rivals that were tried and set aside stay visible as dead ends, the stepping stones not taken.

Beside it, a **map** of the principled space: every combination of the facts a version knows, grouped into regions that look the same on the board, so few principles covering many cases show as big undivided tiles. It's redrawn as the lineage is stepped. Fog, showing how much of the space is known, comes next.

## What's here

| File | What it is |
|---|---|
| `index.html` | The lineage as a tree, a stepper along its trunk, and the selected version's board, cause, growth, facts and map. |
| `lineage.js` | Every version, written out in full, running one against the trains, and grouping its scenarios into the map's regions. |
| `style.css` | The page's look, and the board's. |
| `NOTES.md` | Findings, step by step. |

It's a mock-up: plain HTML around Sandkit's shell and `sb-scrubber`.
