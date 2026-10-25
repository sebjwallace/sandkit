# sb-ontology

Kinds of things and how they relate: the kinds (classes) a subject has, the things of each kind (individuals), their properties, and the relations between them. Use it wherever a sandbox is mostly about what exists and how it connects: species and what eats what, the parts of an energy system and what feeds what, claims and the sources they rest on.

It shows one ontology a few things at a time. Each view draws what its words explain, with what each kind inherits and where from, the kinds things belong to, and the problems the model has found, marked where they are. Viewers point and click to see how things connect, and drag boxes to tidy the layout.

The component draws; it never judges. Rule checking, inference and finding chains between things are the model's work: the model passes problems in as data, and lights a chain with `highlight`.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-ontology/sb-ontology.js"></script>

<sb-ontology></sb-ontology>

<script>
  const reef = document.querySelector('sb-ontology');
  reef.data = ontology;                             // the whole ontology, every time
  reef.show = ['parrotfish', 'surgeonfish', 'turf']; // the few things this view explains
  reef.problems = [{ ref: 'transect-7', text: 'No diver leads this survey' }];
  reef.addEventListener('sb-select', (e) => console.log(e.detail.type, e.detail.id));
</script>
```

## Keep each view readable

A view of boxes and arrows stops being readable at about **20 boxes; 30 at most**. An ontology may hold far more. Don't draw it all: give each view the whole ontology and `show` the handful of things its words explain, and tell a big subject as several small views, each with a heading and a paragraph. Large views work, but they're never the default.

## Data

One plain object, borrowing the words of OWL and RDFS (class, subclass, property, relation, individual) without their syntax or reasoning:

```js
{
  classes: [
    { id: 'Animal' },
    { id: 'Fish', is: ['Animal'] },
    { id: 'Grazer', is: ['Animal'], description: 'Feeds mainly on algae.' },
    { id: 'Alga' },
  ],
  properties: [
    { id: 'iucn', label: 'IUCN status', on: 'Animal', type: 'string' },
  ],
  relations: [
    { id: 'grazes', label: 'grazes', from: 'Grazer', to: 'Alga', inverse: 'is grazed by' },
  ],
  individuals: [
    { id: 'parrotfish', label: 'Bullethead parrotfish', is: ['Fish', 'Grazer'], values: { iucn: 'LC' },
      links: [{ relation: 'grazes', to: 'turf' }] },
    { id: 'turf', label: 'Turf algae', is: ['Alga'] },
  ],
}
```

| Item | Fields |
|---|---|
| Class | `id`; optional `label`, `description`, `is` (the classes it belongs to, several allowed). A class inherits from every class above it. |
| Property | `id`, `on` (the class that has it, inherited by the classes below); optional `label`, `type`, `unit`. |
| Relation | `id`, `from`, `to` (the classes it links); optional `label`, `inverse` (how it reads the other way: "is grazed by"), `description`. |
| Individual | `id`; optional `label`, `is` (its classes), `values` (by property id), `links` (`[{ relation, to }]`). Links live on the individual, so there's no separate list to keep in step. |

Any item may carry `source` (such as `SRC-3`), shown in its details. Every list is optional. Ids are unique within their list, and a name that matches nothing is passed over.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `level` | `instances` | `instances` draws individuals and their links; `schema` draws classes, their `is` links and relations. Viewers switch with Kinds and Things. |
| `empty-text` | `No ontology yet.` | Shown with no data. |

## Properties and methods

| Member | Meaning |
|---|---|
| `data` | The ontology. Setting it redraws, keeping where viewers dragged boxes. |
| `show` | The ids of the classes and individuals to draw, or `null` for all. Among individuals, a class named brings its own individuals; among classes, the classes of the individuals named come too, with every class above them, so each chain of kinds stays whole. |
| `problems` | `[{ ref, text }]`: what the model found wrong, the ref naming a class, individual or link (`from.relation.to`). A box gets a red count, a link turns red, and each problem is listed in its words. |
| `level` | `schema` or `instances`, as the attribute. Setting it doesn't fire `sb-level`. |
| `selected` | The selected class, individual or link ref, or `null`. Setting it doesn't fire `sb-select`. |
| `highlight` | A ref or a list of refs to light up: classes, individuals and links (`from.relation.to`). |
| `reveal(ref)` | Switches to the level where a class or individual is drawn (a link's or property's ref goes by its first part). Returns `true`, or `false` if the ontology has no such thing. Never selects or fires anything. |

## Viewers

- **Pointing** at a box shows its links: those going out in full, those coming in more faintly, and the boxes at their other ends.
- **Clicking** a box or link selects it, keeping that shown, and the details below the drawing tell about it. Clicking empty space clears it. Nothing moves.
- **Dragging** a box moves it, and its links follow. Where it's left is kept until the page reloads.
- **Kinds and Things** switch level.
- **Keys** under the drawing count the relations among the links (Links) and the kinds the boxes belong to (Kinds). Pointing at one lights what it names; clicking keeps it lit until it's clicked again. A kind lights everything of that kind, inherited too. A kind every box shares, or only one has, isn't listed, nor one lighting the same boxes as a more specific kind.
- **Details** for a thing: its classes (its own, and those it inherits), its problems, its values with units and the class each property comes from, its links both ways (read through `inverse` coming in), and its source. For a class: what it belongs to, its description, its problems, the classes below it, its properties and relations each marked own or with the class it comes from, and how many individuals it has. With nothing selected, the problems among what's drawn. Every name in the details selects its thing.

## Layout

Automatic and force-directed: linked things pull together, nearby boxes push apart, and among classes each sits below the classes it belongs to. It's worked out once before drawing, starting the same way every time, so a view always opens the same. It never animates or drifts; only viewers' dragging moves anything. The drawing shrinks to fit its container.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ type, id }`: `type` is `class`, `individual` or `link`; both `null` when cleared | A viewer clicks a box, a link, empty space, or a name in the details. Bubbles. |
| `sb-point` | `{ type, id }`, both `null` when the pointer leaves | The pointer or focus moves onto another box or link. Bubbles. |
| `sb-level` | `{ level }` | A viewer switches between Kinds and Things. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-ontology__bar`, `sb-ontology__group`, `sb-ontology__summary`, `sb-ontology__drawing`, `sb-ontology__links`, `sb-ontology__node` (`--selected`, `--neighbour`, `--highlighted`, `--dragging`), `sb-ontology__label`, `sb-ontology__kind`, `sb-ontology__badge`, `sb-ontology__link` (`--is`, `--out`, `--in`, `--highlighted`, `--problem`), `sb-ontology__line`, `sb-ontology__head`, `sb-ontology__hit`, `sb-ontology__verb`, `sb-ontology__legend`, `sb-ontology__legend-name`, `sb-ontology__key`, `sb-ontology__count`, `sb-ontology__details`, `sb-ontology__title`, `sb-ontology__section`, `sb-ontology__rows`, `sb-ontology__row`, `sb-ontology__relation-row`, `sb-ontology__from`, `sb-ontology__go`, `sb-ontology__problems`, `sb-ontology__problem`, `sb-ontology__muted`, `sb-ontology__empty`. Amber (`--sb-warn`) is for lighting up; red (`--sb-bad`) for problems.

Boxes carry `data-ref` with their class's or individual's id, links carry `from.relation.to` (`Fish.is.Animal` for a subclass link), and rows in the details carry `owner.property`, so a sandbox can find them (see the [locating practice](../../practices/locating.md)). Only the current level and what `show` names are drawn; `reveal` switches level.

## Notes

- **Readability:** about 20 boxes a view, 30 at most (see above). The layout compares every box with every other, so it's quick for hundreds; it isn't meant for thousands.
- **Not modelling:** what a class inherits is worked out, as reading the ontology needs it. Everything else, checking rules, inferring classes, finding chains, is the model's, passed in as `problems` and `highlight`.
- **Not yet:** editing, positions given by the sandbox, and a mark for links leading outside a view wait until a sandbox needs them.
- **Accessibility:** boxes are focusable and select with Enter or Space; keys and names in the details are buttons.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-ontology`, the console says so. Replace every `sb-ontology` in `sb-ontology.js` (tag, classes and style id all use it) to give this copy a new name.
