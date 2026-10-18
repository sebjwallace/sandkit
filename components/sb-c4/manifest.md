# sb-c4

A software architecture you can walk into, in the style of the C4 model: people and systems at the top; the apps and databases inside a system one level down; the components inside an app below that. Use it wherever a sandbox explains how a piece of software is built, or what depends on what.

The sandbox describes the whole architecture once, as nested elements and the relationships between them. Each view shows one level, with a path at the top to come back out. Relationships deep inside roll up to the boxes that can be seen, so every view tells the truth about the detail underneath.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-c4/sb-c4.js"></script>

<sb-c4 root-label="Shop"></sb-c4>

<script>
  const c4 = document.querySelector('sb-c4');
  c4.model = {
    elements: [
      { id: 'shopper', name: 'Shopper', kind: 'person', description: 'Buys things online' },
      { id: 'shop', name: 'Shop system', kind: 'system', description: 'Takes orders', children: [
        { id: 'web', name: 'Storefront', kind: 'container', technology: 'React' },
        { id: 'db', name: 'Orders', kind: 'database', technology: 'PostgreSQL' }
      ] },
      { id: 'pay', name: 'Payment provider', kind: 'system', external: true }
    ],
    relationships: [
      { id: 'buy', from: 'shopper', to: 'web', label: 'Shops using', technology: 'HTTPS' },
      { from: 'web', to: 'db', label: 'Saves orders in' },
      { from: 'web', to: 'pay', label: 'Takes payment through' }
    ]
  };
  c4.addEventListener('sb-navigate', (e) => console.log('Now inside', e.detail.path));
</script>
```

## Model

| Element field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique across the whole model, at every depth. |
| `name` | no | Shown in the box. Defaults to `id`. |
| `kind` | no | `person`, `system` (the default), `container`, `component`, `database` or `queue`. Each has its shape, and its name in the box. |
| `technology` | no | Shown after the kind: `[Container: React]`. |
| `description` | no | What it's for, in a line or two. Long descriptions are cut to three lines. |
| `external` | no | `true` for anything outside your own estate. Drawn grey. |
| `tone` | no | `good`, `warn` or `bad`, for something to notice. |
| `children` | no | The elements inside it. A box with children can be entered. |

| Relationship field | Required | Meaning |
|---|---|---|
| `from`, `to` | yes | Any two elements, at any depth. Describe them where they really happen, between the parts that call each other. |
| `label` | no | What the relationship is, such as "Saves orders in". |
| `technology` | no | How, such as `HTTPS` or `SQL`, shown under the label. |
| `id` | no | Names it for `highlight`. |

## Views

- **The overview** (`path` `[]`) shows the top-level elements.
- **Inside an element,** its children sit within a dashed boundary named after it. The elements outside that its children talk to are drawn around it: those that call in above, those called below. Elements outside that don't talk to its children aren't shown.
- **Relationships roll up.** Each end of a relationship is drawn at the box that stands for it in this view: the element itself if it can be seen, otherwise the box it's inside. A relationship from deep inside the API to the mainframe is drawn from the API, or from the whole system at the top. Relationships joining the same two boxes become one line, labelled with how many there are; pointing at it lists them.
- **Layout is automatic:** each view's boxes are placed in rows by who calls whom. Lines bow round boxes they'd otherwise cross, and labels move along their lines to stay clear of boxes and each other.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `root-label` | `Overview` | The first step of the path, for the top level. |

## Properties and methods

| Member | Meaning |
|---|---|
| `model` | `{ elements, relationships }`. Setting it redraws, keeping the path as far as it still leads. |
| `path` | The ids of the elements we're inside, outermost first; `[]` for the top. Only elements with children can be entered, from their parent; a path stops at the first step that can't. Setting it doesn't fire `sb-navigate`. |
| `highlight` | `{ elements: [ids], relationships: [ids] }`: what to point at. An element that can be seen is outlined; one folded inside a box marks that box. A relationship lights the line it's rolled into. |
| `reveal(id)` | Goes to the view where an element can be seen, and highlights it. Returns `true`, or `false` if there's no such element. Doesn't fire `sb-navigate`. |

## Viewers

- **Going in:** click a box's "⤢ n inside", or double-click the box.
- **Coming out:** click a step of the path, or press Escape (the diagram takes focus when clicked).
- **Pointing** at a box lights it, its lines and the boxes at their other ends, fading the rest; pointing at a line lights it and its two boxes.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-navigate` | `{ path }` | A viewer goes in or out. Bubbles. |
| `sb-select` | `{ type: 'element', id }`, or `{ type: 'relationship', relationships }` | A box, or a line (with every relationship it carries), is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-c4__path`, `sb-c4__step` (the current one has `aria-current`), `sb-c4__divider`, `sb-c4__svg`, `sb-c4__boundary`, `sb-c4__boundary-label`, `sb-c4__element` (with its kind, such as `--person`, and `--external`, the tone, `--highlighted`, `--holds-highlight`, `--faded`), `sb-c4__shape`, `sb-c4__name`, `sb-c4__kind`, `sb-c4__description`, `sb-c4__inside`, `sb-c4__relationship` (`--highlighted`, `--faded`), `sb-c4__line`, `sb-c4__arrow`, `sb-c4__label`, `sb-c4__label-detail`.

Boxes carry `data-ref` with their element's id, and a line carrying a single relationship with an `id` carries that id, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). Only the current view is drawn, so an element inside a box that hasn't been entered isn't on the page to find; `reveal` goes to it.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-tree`](../sb-tree/manifest.md),** as an outline of the same model: on the tree's `sb-select`, `reveal` the element; on `sb-navigate`, `reveal` the path in the tree.
- **[`sb-sequence`](../sb-sequence/manifest.md),** for one request through the parts: highlight the relationship of the sequence's current message.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, or call `reveal` when the prose names a part.

## Notes

- **Size:** drawn at its real size, never scaled. It takes the width of its container, and a wider view scrolls within it.
- **Not yet:** tracing a flow through the levels, an animated zoom, and hand-placed positions wait until a sandbox needs them.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-c4`, the console says so. Replace every `sb-c4` in `sb-c4.js` to give this copy a new name.
