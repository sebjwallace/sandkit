# Catalog

Everything Sandkit offers, one line each. Read a practice before the components that support it, and a component's `manifest.md` for its full contract. Use components through their manifests; you don't need to read their source.

## Practices

How to do something well in a sandbox. Plain instructions, for people and agents alike.

| Practice | What it covers |
|---|---|
| [Building a sandbox](practices/building-a-sandbox.md) | Start here. The end-to-end method: setting up the folder, copying components in, the model, chapters, checking. |
| [Identifiers](practices/identifiers.md) | Short, stable codes for the things in a sandbox, and citing them everywhere. Supported by `sb-id`. |

## Shell

| Part | What it does |
|---|---|
| [Sandbox shell](shell/manifest.md) | The environment around a sandbox: header, goal, full screen, settings and theming. |

## Components

| Component | What it does |
|---|---|
| [`sb-chart`](components/sb-chart/manifest.md) | Values over time as lines, with reference lines, the latest values marked, and a legend. |
| [`sb-controls`](components/sb-controls/manifest.md) | Play, pause, step, reset and speed. Keeps the clock and tells the sandbox how many steps to take. |
| [`sb-graph`](components/sb-graph/manifest.md) | State machines, workflows and networks: active nodes, edges and rule lines lit up; things moving along edges. |
| [`sb-id`](components/sb-id/manifest.md) | An identifying code as a pill: hover explains it, click highlights every mention. |
| [`sb-log`](components/sb-log/manifest.md) | A stream of things that happened, in order: tones, columns, expandable detail, selection. |
| [`sb-panel`](components/sb-panel/manifest.md) | A frame viewers can pop out into a floating window, drag, resize, collapse, make full screen and dock back. |
| [`sb-parameters`](components/sb-parameters/manifest.md) | The knobs people turn: labelled sliders with live values, changes from defaults marked, reset. |
| [`sb-rules`](components/sb-rules/manifest.md) | The rules a model follows, with the one about to apply and the one just applied marked. |
