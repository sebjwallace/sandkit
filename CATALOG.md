# Catalog

Everything Sandkit offers, one line each. Read a practice before the components that support it, and a component's `manifest.md` for its full contract. Use components through their manifests; you don't need to read their source.

## Practices

How to do something well in a sandbox. Plain instructions, for people and agents alike.

| Practice | What it covers |
|---|---|
| [Building a sandbox](practices/building-a-sandbox.md) | Start here. The end-to-end method: setting up the folder, copying components in, the model, chapters, checking. |
| [Highlighting](practices/highlighting.md) | Point at one thing and see it light up everywhere: the page-wide `sb-highlight` event, and wiring components in. Supported by `sb-math` and `sb-id`. |
| [Identifiers](practices/identifiers.md) | Short, stable codes for the things in a sandbox, and citing them everywhere. Supported by `sb-id`. |

## Shell

| Part | What it does |
|---|---|
| [Sandbox shell](shell/manifest.md) | The environment around a sandbox: header, goal, full screen, settings and theming. |

## Components

| Component | What it does |
|---|---|
| [`sb-callout`](components/sb-callout/manifest.md) | A stand-out block for definitions, notes, tips, questions, answers and warnings; optionally collapsible. |
| [`sb-chart`](components/sb-chart/manifest.md) | Values over time as lines, with reference lines, the latest values marked, and a legend. |
| [`sb-controls`](components/sb-controls/manifest.md) | Play, pause, step, reset and speed. Keeps the clock and tells the sandbox how many steps to take. |
| [`sb-erd`](components/sb-erd/manifest.md) | Entities and their fields, with each reference drawn from the exact field to the exact field it refers to. |
| [`sb-flowchart`](components/sb-flowchart/manifest.md) | A process laid out from its structure, optionally in swim lanes running down or across; the current step and the way it came marked. |
| [`sb-graph`](components/sb-graph/manifest.md) | State machines, workflows and networks: active nodes, edges and rule lines lit up; things moving along edges. |
| [`sb-id`](components/sb-id/manifest.md) | An identifying code as a pill: hover explains it, click highlights every mention. |
| [`sb-log`](components/sb-log/manifest.md) | A stream of things that happened, in order: tones, columns, expandable detail, selection. |
| [`sb-math`](components/sb-math/manifest.md) | Equations in native MathML whose marked parts light up, and are lit by, what they stand for. |
| [`sb-matrix`](components/sb-matrix/manifest.md) | A matrix or vector in brackets, inline or on its own: editable, with coloured and highlighted rows, columns and cells. |
| [`sb-panel`](components/sb-panel/manifest.md) | A frame viewers can pop out into a floating window, drag, resize, collapse, make full screen and dock back. |
| [`sb-parameters`](components/sb-parameters/manifest.md) | The knobs people turn: labelled sliders with live values, changes from defaults marked, reset. |
| [`sb-plane`](components/sb-plane/manifest.md) | A 2D coordinate plane: draggable vectors, points and shapes, and matrices that visibly move space. |
| [`sb-rules`](components/sb-rules/manifest.md) | The rules a model follows, with the one about to apply and the one just applied marked. |
| [`sb-table`](components/sb-table/manifest.md) | Rows and columns to sort, search and filter, with the cells that just changed marked. |
| [`sb-tabs`](components/sb-tabs/manifest.md) | Tabs over panels, for chapters or views: one part at a time, remembered per viewer, nestable. |
| [`sb-timeline`](components/sb-timeline/manifest.md) | A bounded stretch of progress to scrub or play, with named moments: transformations, cycles, stages. |
