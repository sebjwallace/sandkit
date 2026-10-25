# sb-tree

Nested things, as in a file system or an outline: branches that open and close, with lines joining each thing to the one it belongs to. Use it wherever a sandbox has things inside things: folders, chapters, teams, a classification, the parts of a machine.

Everything a viewer can do, the sandbox can do too: open and close branches, open the way to a node, select it, point at it. A highlighted node inside a closed branch marks that branch, so pointing never disappears into a fold.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-tree/sb-tree.js"></script>

<sb-tree></sb-tree>

<script>
  const tree = document.querySelector('sb-tree');
  tree.nodes = [
    { id: 'docs', label: 'Documents', meta: '2 files', children: [
      { id: 'cv', label: 'CV.pdf', meta: '120 KB' },
      { id: 'bills', label: 'Bills.xlsx', meta: '48 KB', tone: 'warn' }
    ] }
  ];
  tree.reveal('cv');
  tree.selected = 'cv';
  tree.addEventListener('sb-select', (e) => show(e.detail.node));
</script>
```

## Nodes

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Identifies the node, unique across the whole tree. Numbers are treated as text. |
| `label` | no | Shown in the row. Defaults to `id`. |
| `meta` | no | A quiet detail on the right, such as a size or a count. |
| `tone` | no | `good`, `warn` or `bad`. Colours the label with the theme's status tokens. |
| `children` | no | Nested nodes. A node with `children`, even an empty list, is a branch and can open; one without is a leaf. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `empty-text` | `Nothing here.` | Shown when there are no nodes. |

## Properties and methods

| Member | Meaning |
|---|---|
| `nodes` | The top-level nodes. Setting them redraws the tree, keeping what was open and selected by id. |
| `expanded` | The ids of the open branches. Branches start closed. |
| `selected` | The selected node's id, or `null`. |
| `highlight` | Ids of nodes to point at. A closed branch holding one is marked. |
| `expand(id)`, `collapse(id)`, `toggle(id)` | Open or close one branch. |
| `expandAll()`, `collapseAll()` | Open or close every branch. |
| `reveal(id)` | Open every branch on the way to a node, and scroll it into view. Doesn't select it. Returns `true`, or `false` if there's no such node. |

Setting properties and calling methods never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ node }` | A viewer clicks a row, or presses Enter or Space on it. Bubbles. |
| `sb-toggle` | `{ node, expanded }` | A viewer opens or closes a branch, with its arrow or the keyboard. Bubbles. |

## Keyboard

The tree takes one Tab stop. Up and Down move through the visible rows; Home and End go to the first and last. Right opens a branch, or moves into an open one; Left closes it, or moves out to its parent. Enter or Space selects.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Its own custom properties, to set on the element: `--sb-tree-row` (row height, `26px`), `--sb-tree-indent` (`18px`), `--sb-tree-line` (the guide lines' colour).

Classes: `sb-tree__group`, `sb-tree__item` (`--selected`, `--highlighted`, `--holds-highlight`), `sb-tree__row`, `sb-tree__twisty`, `sb-tree__label`, `sb-tree__meta`, `sb-tree__empty`. Items carry `data-ref` with their node's id (folded ones too, since every node is drawn, so the page can find them: see the [locating practice](../../practices/locating.md)), `data-tone`, and the tree's ARIA states (`aria-expanded`, `aria-selected`, `aria-level`).

Give the element a height (for example `max-height: 320px`) so a long tree scrolls.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Size:** every node is drawn, open or not, which suits the hundreds of nodes a sandbox shows. Very large trees would need drawing on demand.
- **Renaming:** if another component on the page is already called `sb-tree`, the console says so. Replace every `sb-tree` in `sb-tree.js` to give this copy a new name.
