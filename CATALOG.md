# Catalog

Everything Sandkit offers, one line each. Read a practice before the components that support it, and a component's `manifest.md` for its full contract. Use components through their manifests; you don't need to read their source.

## Practices

How to do something well in a sandbox. Plain instructions, for people and agents alike.

| Practice | What it covers |
|---|---|
| [Building a sandbox](practices/building-a-sandbox.md) | Start here. The end-to-end method: setting up the folder, copying components in, the model, chapters, checking. |
| [Highlighting](practices/highlighting.md) | Point at one thing and see it light up everywhere: the page-wide `sb-highlight` event, and wiring components in. Supported by `sb-math` and `sb-id`. |
| [Locating](practices/locating.md) | Find everywhere a ref appears and go to it, through closed tabs and folded branches: `data-ref` on parts, `reveal(ref)`, and the sandbox's `goTo`. Supported by `sb-tabs`, `sb-tree`, `sb-id`, `sb-table`, `sb-rules` and `sb-graph`. |
| [Journal](practices/journal.md) | What changed in a sandbox and why, one entry per version, and where it stands now: for audit and handover. Retired codes recorded in the model. |
| [Identifiers](practices/identifiers.md) | Short, stable codes for the things in a sandbox, and citing them everywhere. Supported by `sb-id`. |

## Shell

| Part | What it does |
|---|---|
| [Sandbox shell](shell/manifest.md) | The environment around a sandbox: header, goal, full screen, settings and theming. |

## Components

| Component | What it does |
|---|---|
| [`sb-annotate`](components/sb-annotate/manifest.md) | Text with the parts that matter marked: pointing shows each mark's note just above it, clicking pins it, and kinds are counted in a legend. |
| [`sb-bars`](components/sb-bars/manifest.md) | Things compared on one measure: bars on one scale, sorted or not, with reference lines and each bar's change since the last update. |
| [`sb-board`](components/sb-board/manifest.md) | Things moving through stages, as cards in columns: each column counted against its limit, cards that just moved marked with where they came from, drags asked of the model. |
| [`sb-c4`](components/sb-c4/manifest.md) | A C4 software architecture walked into level by level, with a path back out; relationships deep inside roll up to every view. |
| [`sb-callout`](components/sb-callout/manifest.md) | A stand-out block for definitions, notes, tips, questions, answers and warnings; optionally collapsible. |
| [`sb-chart`](components/sb-chart/manifest.md) | Values over time as lines, with reference lines, the latest values marked, and a legend. |
| [`sb-code`](components/sb-code/manifest.md) | Code or pseudocode stepped through a trace the model records: the running line marked, variables beside it with changes shown. |
| [`sb-controls`](components/sb-controls/manifest.md) | Play, pause, step, reset and speed. Keeps the clock and tells the sandbox how many steps to take. |
| [`sb-decision-tree`](components/sb-decision-tree/manifest.md) | Questions branching on their answers down to outcomes: one case traced with its value at each question, the answers that would have changed its outcome marked, branches thickened by how many cases took them. |
| [`sb-erd`](components/sb-erd/manifest.md) | Entities and their fields, with each reference drawn from the exact field to the exact field it refers to. |
| [`sb-flowchart`](components/sb-flowchart/manifest.md) | A process laid out from its structure, optionally in swim lanes running down or across; the current step and the way it came marked. |
| [`sb-graph`](components/sb-graph/manifest.md) | State machines, workflows and networks: active nodes, edges and rule lines lit up; things moving along edges. |
| [`sb-grid`](components/sb-grid/manifest.md) | Cells across space coloured by state or value: a legend counting each state, painting reported to the model, changes marked. |
| [`sb-id`](components/sb-id/manifest.md) | An identifying code as a pill: hover explains it, click highlights every mention. |
| [`sb-image`](components/sb-image/manifest.md) | An image to zoom and pan, starting on the part that matters, with boxes and pins that prose can glide to and light up. |
| [`sb-json`](components/sb-json/manifest.md) | JSON shown cleanly, with the paths that matter spotlit and the rest folded away; a clicked line shows its path and the note written for it. |
| [`sb-log`](components/sb-log/manifest.md) | A stream of things that happened, in order: tones, columns, expandable detail, selection. |
| [`sb-math`](components/sb-math/manifest.md) | Equations in native MathML whose marked parts light up, and are lit by, what they stand for. |
| [`sb-matrix`](components/sb-matrix/manifest.md) | A matrix or vector in brackets, inline or on its own: editable, with coloured and highlighted rows, columns and cells. |
| [`sb-modal`](components/sb-modal/manifest.md) | A window over the page for the one thing that deserves attention now: a heading, content and actions, reporting how the viewer closed it. |
| [`sb-panel`](components/sb-panel/manifest.md) | A frame viewers can pop out into a floating window, drag, resize, collapse, make full screen and dock back. |
| [`sb-parameters`](components/sb-parameters/manifest.md) | The knobs people turn: labelled sliders with live values, changes from defaults marked, reset. |
| [`sb-plane`](components/sb-plane/manifest.md) | A 2D coordinate plane: draggable vectors, points and shapes, and matrices that visibly move space. |
| [`sb-rules`](components/sb-rules/manifest.md) | The rules a model follows, with the one about to apply and the one just applied marked. |
| [`sb-scrubber`](components/sb-scrubber/manifest.md) | A bounded stretch of progress to scrub or play, with named moments: transformations, cycles, stages. |
| [`sb-sequence`](components/sb-sequence/manifest.md) | Who says what to whom, in order: lifelines, calls, replies and notes, played a message at a time. |
| [`sb-stat`](components/sb-stat/manifest.md) | Headline figures: each change since the last update, coloured as good or bad news, with targets and bars. |
| [`sb-statechart`](components/sb-statechart/manifest.md) | States inside states, parallel regions and history: every active state marked, what can happen now and what a guard holds back, and the last step's exits, transitions and entries numbered in order. |
| [`sb-table`](components/sb-table/manifest.md) | Rows and columns to sort, search and filter, with the cells that just changed marked. |
| [`sb-tabs`](components/sb-tabs/manifest.md) | Tabs over panels, for chapters or views: one part at a time, remembered per viewer, nestable. |
| [`sb-timeline`](components/sb-timeline/manifest.md) | Events laid out in time: moments and spans in lanes, a line for now fading what's still to come, zoomed and panned by viewers or glided to a stretch by the sandbox. |
| [`sb-tree`](components/sb-tree/manifest.md) | Nested things, as in a file system or an outline: branches that open and close, joined by lines, driven by viewers and the sandbox alike. |
| [`sb-venn`](components/sb-venn/manifest.md) | Two or three sets as overlapping circles: every region named, counted and marked when empty, read out in words when pointed at, with what changed region since the last update marked. |
| [`sb-walkthrough`](components/sb-walkthrough/manifest.md) | A story told across several views, a step at a time: each step outlines the views to look at and names what to highlight in them. |
| [`sb-wireframe`](components/sb-wireframe/manifest.md) | A wireframe prototype written in plain HTML: one screen or a clickable flow, its parts pointed at and highlighted, themed by a few colours. |
| [`sb-xref`](components/sb-xref/manifest.md) | Where a thing appears and what it's linked to: every place on the page a ref shows up, grouped by view, with hidden ones marked; the model's links to walk along, with a trail and Back. |
