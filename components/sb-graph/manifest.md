# sb-graph

Things joined by connections: state machines, workflows, networks, flows. Each node and each connection can be highlighted as active, down to a single line of a connection's label, and things can be shown moving along the connections.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-graph/sb-graph.js"></script>

<sb-graph></sb-graph>

<script>
  const graph = document.querySelector('sb-graph');
  graph.data = {
    nodes: [{ id: 'locked', label: 'Locked', shape: 'circle' }, { id: 'open', label: 'Unlocked', shape: 'circle' }],
    edges: [
      { from: 'locked', to: 'open', label: 'coin' },
      { from: 'open', to: 'locked', label: 'push' }
    ]
  };
  graph.active = { nodes: ['locked'] };
  graph.addEventListener('sb-select', (e) => console.log(e.detail.type, e.detail.id));
</script>
```

## Data

| Node field | Required | Meaning |
|---|---|---|
| `id` | yes | Identifies the node. |
| `label` | no | Shown in the node. Defaults to `id`. |
| `x`, `y` | no | Position. If any node has none, all are placed evenly around a circle. |
| `shape` | no | `box` (default) or `circle`. |
| `tone` | no | `good`, `warn` or `bad`, coloured with the theme's status tokens. |
| `terminal` | no | Draws a second ring, as for a final state. Circles only. |
| `sublabel` | no | A second line of text. Boxes only. |
| `value`, `max` | no | A meter filled to `value / max`. Boxes only. |

| Edge field | Required | Meaning |
|---|---|---|
| `from`, `to` | yes | The nodes it joins. The same node twice draws a loop. |
| `id` | no | Identifies the edge. Defaults to `from->to`. |
| `label` | no | Text, with `\n` between lines, or a list of lines, each text or `{ id, text }`. A line with an id can be highlighted on its own. |

| Token field | Meaning |
|---|---|
| `from`, `to` | The nodes it travels between. It follows their edge, if there is one. |
| `progress` | From `0` (at `from`) to `1` (at `to`). |
| `label`, `title` | Short text on the token, and longer text on hover. |

## Properties

| Property | Meaning |
|---|---|
| `data` | `{ nodes, edges, tokens }`. Setting it redraws the graph. |
| `active` | `{ nodes, edges, lines }`: ids of what is happening now. |
| `selected` | The selected node's id. Attribute or property. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ type, id }` | A node (`type: 'node'`) or an edge (`type: 'edge'`) is pressed. Pressing a node also selects it. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-graph__node` (with `--box` or `--circle`, `--active`, `--selected`, `--terminal`, and the tone), `sb-graph__shape`, `sb-graph__ring`, `sb-graph__label`, `sb-graph__sublabel`, `sb-graph__meter`, `sb-graph__edge` (`--active`), `sb-graph__edge-label`, `sb-graph__line--active`, `sb-graph__token`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-controls`](../sb-controls/manifest.md),** to step a state machine or run a network, setting `active` and `tokens` on each tick.
- **[`sb-log`](../sb-log/manifest.md),** to record each transition. On the log's `sb-select`, highlight the edge the entry concerns.

## Notes

- **The graph is framed to fit its content, and never scaled up,** so a small graph stays small. It shrinks to fit narrow containers.
- **Self-loops point away from the middle of the graph,** and edges that run both ways between two nodes bow apart.
- **Positions are in pixels.** Leave room between nodes for labels.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-graph`, the console says so. Replace every `sb-graph` in `sb-graph.js` to give this copy a new name.
