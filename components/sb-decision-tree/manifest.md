# sb-decision-tree

A decision tree: questions that branch on their answers down to outcomes. Use it wherever a sandbox decides things by rules of this shape: lending, triage, eligibility, diagnosis, identification keys, a machine-learning classifier.

Trace a case through it and it shows the way the case went, with its value at each question. It also marks the answers the case didn't give that would have led to a different outcome, labelled with where they lead, so the questions that decided the case stand out from those that didn't matter. With counts, each branch is as thick as the share of cases that took it.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-decision-tree/sb-decision-tree.js"></script>

<sb-decision-tree direction="right"></sb-decision-tree>

<script>
  const tree = document.querySelector('sb-decision-tree');
  tree.root = { id: 'income', question: 'Income?', children: [
    { id: 'decline', answer: 'under 30k', outcome: 'Decline', tone: 'bad' },
    { id: 'debt', answer: '30k or more', question: 'Debt ratio?', children: [
      { id: 'approve', answer: 'up to 0.4', outcome: 'Approve', tone: 'good' },
      { id: 'refer', answer: 'over 0.4', outcome: 'Refer', tone: 'warn' }
    ] }
  ] };

  // The model applies its rules, and records the way the case went.
  tree.trace = [{ id: 'income', value: '42k' }, { id: 'debt', value: '0.3' }, { id: 'approve' }];
  tree.counts = { income: 200, decline: 50, debt: 150, approve: 110, refer: 40 };
</script>
```

## Nodes

`root` is the first question. A node with `children` is a question; one without is an outcome.

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Identifies the node, unique across the tree. Numbers are treated as text. |
| `question` | no | A question's text, with `\n` between lines. Defaults to `id`. |
| `outcome` | no | An outcome's text. Defaults to `id`. Outcomes with the same text are the same outcome. |
| `answer` | no | Labels the branch into this node from its question. |
| `tone` | no | `good`, `warn` or `bad`, coloured with the theme's status tokens. Most useful on outcomes. |
| `children` | no | The answers to a question, in order. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `direction` | `down` | `down` grows the tree down the page; `right` grows it across. Also a property. |

## Properties

| Property | Meaning |
|---|---|
| `root` | The tree. Setting it lays it out again, keeping the trace and highlight. `null` shows nothing. |
| `trace` | The way one case went: `[{ id, value }, …]`, from the root on, as the model decided it. `value` is optional, shown on the question's stem. A trace ending at a question is a case still on its way. `[]` clears it. |
| `counts` | `{ id: number }`: how many cases reached each node. Added to the branch's answer, and the branch drawn thicker the more cases took it. |
| `highlight` | Ids of nodes to point at. |
| `direction` | As the attribute. |

With a trace, everything off the case's way is faded. A branch not taken, from a question the case went on from, is marked as an alternative when it leads to any outcome other than the case's, and labelled with the outcomes it leads to ("→ Approve or Refer"). One that leads only to the case's own outcome isn't marked, since that answer wouldn't have changed anything. The component never evaluates a rule: the trace is the model's.

Setting properties never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ node }` | A node is clicked. `node` is the object as given. Bubbles. |
| `sb-point` | `{ node }`, or `null` | The pointer moves onto another node, or leaves the tree. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-decision-tree__svg`, `sb-decision-tree__node` (`--question` or `--outcome`, the tone, `--on-path`, `--current`, `--off`, `--highlighted`; carries `data-node-id`, and `data-ref` with the same id so a sandbox can find it: see the [locating practice](../../practices/locating.md)), `sb-decision-tree__shape`, `sb-decision-tree__label`, `sb-decision-tree__branch`, `sb-decision-tree__answer` and `sb-decision-tree__otherwise` (all three `--taken`, `--off`, `--alternative`; carry `data-branch-id`, the id of the node they lead to), `sb-decision-tree__value` (carries `data-value-id`).

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-parameters`](../sb-parameters/manifest.md),** for the case's figures: on each change, run the model and set `trace`, so viewers move a figure and watch the case take another way.
- **[`sb-table`](../sb-table/manifest.md),** for many cases: on the table's `sb-select`, trace the chosen row.
- **[`sb-rules`](../sb-rules/manifest.md),** when the tree is written as rules too: on `sb-select`, mark the rule behind the node.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce a node's ref from `sb-point`, so a question and its mentions in the prose light up together.

## Notes

- **Layout:** each outcome takes the next place across, and each question sits centred over its answers, so nothing overlaps. Answers sit on the branches, with room left for what they lead to.
- **Size:** drawn at its real size, never scaled. It takes the width of its container, and a wider tree scrolls within it rather than shrinking its text. Made for trees of up to a few dozen outcomes.
- **Left for later:** each outcome's mix of cases (how sure it is), editing the tree, and folding branches away wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-decision-tree`, the console says so. Replace every `sb-decision-tree` in `sb-decision-tree.js` (tag, classes and style id all use it) to give this copy a new name.
