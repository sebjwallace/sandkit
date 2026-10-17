# sb-erd

An entity relationship diagram: the things a body of information is made of, their fields, and how they refer to each other. Use it wherever a sandbox needs to show how information is kept: a library's books, members and loans; a shop's orders and products; a clinic's patients and appointments.

Every line starts at the very field that holds the reference, level with its row, and ends at the very field it refers to. Nobody has to guess which field a line belongs to. Pointing at either end lights up the whole relationship.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-erd/sb-erd.js"></script>

<sb-erd></sb-erd>

<script>
  const erd = document.querySelector('sb-erd');
  erd.entities = [
    { id: 'customers', name: 'Customer', x: 0, y: 0, fields: [
      { name: 'id', type: 'int', key: 'primary' },
      { name: 'name', type: 'text' }
    ] },
    { id: 'orders', name: 'Order', x: 260, y: 0, fields: [
      { name: 'id', type: 'int', key: 'primary' },
      { name: 'customer_id', type: 'int', references: 'customers.id' }
    ] }
  ];
  erd.highlight = { fields: ['orders.customer_id'] };
  erd.addEventListener('sb-select', (e) => console.log(e.detail.entity, e.detail.field));
</script>
```

## Data

| Entity field | Required | Meaning |
|---|---|---|
| `id` | yes | Identifies the entity, in references and highlights. No dots. |
| `name` | no | The title. Defaults to `id`. |
| `x`, `y` | no | The box's top-left corner, in pixels. If any entity has none, all are placed side by side. |
| `tone` | no | `good`, `warn` or `bad`, coloured with the theme's status tokens. |
| `fields` | no | The rows, in order. |

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | Shown in the row. Identifies the field as `'<entity id>.<name>'`. |
| `type` | no | Shown on the right, muted. |
| `key` | no | `primary` marks the row PK. |
| `references` | no | `'<entity id>.<field name>'`: draws a line to that field and marks the row FK. Naming only the entity ends the line at its title. A reference to an entity that doesn't exist draws nothing. |

## Properties

| Property | Meaning |
|---|---|
| `entities` | The entities. Setting them redraws the diagram. |
| `highlight` | `{ entities: [id, …], fields: ['entity.field', …] }`: what to point at. A highlighted field lights every line it is an end of, and the field (or entity) at the other end. |

Pointing at a field or a line lights it the same way, while the pointer is there, on top of `highlight`.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ entity, field }` | A field, a line (its referencing field) or a title (`field: null`) is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-erd__svg`, `sb-erd__entity` (`--highlighted`, and the tone), `sb-erd__fill`, `sb-erd__head`, `sb-erd__name`, `sb-erd__outline`, `sb-erd__field` (`--primary`, `--highlighted`), `sb-erd__row`, `sb-erd__key`, `sb-erd__field-name`, `sb-erd__type`, `sb-erd__link` (`--highlighted`), `sb-erd__line`, `sb-erd__end` (the starting dot and the arrow).

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-table`](../sb-table/manifest.md),** for the records themselves. On `sb-select`, show the chosen entity's rows; highlight the column of a chosen field.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so a sentence about "who borrowed what" lights the fields that record it.

## Notes

- **Lines leave the side of their row that faces the target** and enter the target's facing side. When boxes overlap side to side, or a field refers to its own entity, the line leaves and enters on the right, bowing out past both.
- **Positions are in pixels.** Leave about 100 pixels between boxes side by side, for the lines to turn in. Text widths are estimated, so very long names may need more.
- **The diagram is framed to fit its content, and never scaled up,** so a small diagram stays small. It shrinks to fit narrow containers.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-erd`, the console says so. Replace every `sb-erd` in `sb-erd.js` to give this copy a new name.
