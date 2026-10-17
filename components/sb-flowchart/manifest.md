# sb-flowchart

A flowchart, optionally in swim lanes: the steps and decisions of a process, and who does each one. Use it wherever a sandbox runs a process: an order going through a business, a patient through a clinic, a request through a system, a recipe.

The chart lays itself out from its structure: each step comes one rank after the steps that lead to it, in its own lane. As the sandbox runs the process, it marks the step it's on and the way it came.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-flowchart/sb-flowchart.js"></script>

<sb-flowchart direction="right"></sb-flowchart>

<script>
  const chart = document.querySelector('sb-flowchart');
  chart.data = {
    lanes: [{ id: 'customer', label: 'Customer' }, { id: 'shop', label: 'Shop' }],
    nodes: [
      { id: 'order', label: 'Places an order', kind: 'start', lane: 'customer' },
      { id: 'stock', label: 'In stock?', kind: 'decision', lane: 'shop' },
      { id: 'send', label: 'Sends it', lane: 'shop' },
      { id: 'wait', label: 'Waits for stock', lane: 'shop' }
    ],
    edges: [
      { from: 'order', to: 'stock' },
      { from: 'stock', to: 'send', label: 'yes' },
      { from: 'stock', to: 'wait', label: 'no' },
      { from: 'wait', to: 'stock' }
    ]
  };
  chart.visited = { nodes: ['order'], edges: ['order->stock'] };
  chart.active = { nodes: ['stock'] };
</script>
```

## Data

`data` is `{ lanes, nodes, edges }`. Only `nodes` is required.

| Lane field | Required | Meaning |
|---|---|---|
| `id` | yes | Named by nodes' `lane`. |
| `label` | no | Shown in the lane's heading. Defaults to `id`. |

| Node field | Required | Meaning |
|---|---|---|
| `id` | yes | Identifies the node. |
| `label` | no | Shown in the node, with `\n` between lines. Defaults to `id`. |
| `kind` | no | `start`, `end`, `step` (the default), `decision` or `data`. Each has its own shape. |
| `lane` | no | The lane it sits in. Without one, or naming no lane, it goes in the first. |
| `tone` | no | `good`, `warn` or `bad`, coloured with the theme's status tokens. |

| Edge field | Required | Meaning |
|---|---|---|
| `from`, `to` | yes | The nodes it joins. Edges to missing nodes, or from a node to itself, aren't drawn. |
| `id` | no | Identifies the edge. Defaults to `from->to`. |
| `label` | no | Shown near where it starts, such as a decision's answer. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `direction` | `down` | `down` runs top to bottom, with lanes as columns. `right` runs left to right, with lanes as rows. Also a property. |

## Properties

| Property | Meaning |
|---|---|
| `data` | `{ lanes, nodes, edges }`. Setting it lays the chart out again. |
| `active` | `{ nodes: [ids], edges: [ids] }`: where the process is now. |
| `visited` | `{ nodes: [ids], edges: [ids] }`: the way it came. |
| `direction` | As the attribute. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ type, id }` | A node (`type: 'node'`) or an edge (`type: 'edge'`) is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-flowchart__svg`, `sb-flowchart__lane`, `sb-flowchart__lane-head`, `sb-flowchart__lane-label`, `sb-flowchart__node` (with the kind, such as `--decision`, the tone, `--active` and `--visited`), `sb-flowchart__shape`, `sb-flowchart__label`, `sb-flowchart__edge` (`--active`, `--visited`), `sb-flowchart__line`, `sb-flowchart__arrow`, `sb-flowchart__edge-label`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md),** to run the process a step at a time, setting `active` and `visited` on each tick.
- **[`sb-log`](../sb-log/manifest.md),** to record each step taken. On the log's `sb-select`, make the entry's step `active`.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `active` when the prose points at a step.

## Notes

- **Layout:** a step's rank is its longest way in from the start. Edges that lead back to an earlier step are loops; they don't push their target further on. Steps sharing a rank and a lane sit side by side, in the order given.
- **Lines:** right-angled. A decision's branches to the side leave from its sides. A line that skips steps goes around them, and a loop goes back around the far side of its lane and joins its target's way in.
- **Size:** drawn at its real size, never scaled. It takes the width of its container, and a wider chart scrolls within it rather than shrinking its text; `direction="right"` grows wide with many steps.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-flowchart`, the console says so. Replace every `sb-flowchart` in `sb-flowchart.js` to give this copy a new name.
