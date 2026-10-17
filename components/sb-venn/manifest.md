# sb-venn

Two or three sets as overlapping circles, and every region they make: animals that are mammals and lay eggs, patients with both conditions, people who tested positive but aren't ill, the features three products share. Use it wherever a sandbox sorts things by properties that overlap, and the combinations matter.

Every region is named by a ref, counted, and marked "none" when empty, since an empty overlap is often the finding. Pointing at a region reads it out in words ("In Mammals and Lay eggs, not Live in water: Platypus and Echidna"), and things that changed region since the last update are marked, saying where they were.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-venn/sb-venn.js"></script>

<sb-venn universe="All animals"></sb-venn>

<script>
  const venn = document.querySelector('sb-venn');
  venn.sets = [
    { id: 'mammal', label: 'Mammals' },
    { id: 'water', label: 'Live in water' },
    { id: 'eggs', label: 'Lay eggs' }
  ];
  venn.items = model.animals;   // [{ id: 'platypus', label: 'Platypus', sets: ['mammal', 'eggs'] }, …]

  venn.highlight = { regions: ['mammal&eggs'] };
  venn.addEventListener('sb-select', (e) => { if (e.detail.item) showFacts(e.detail.item.id); });
</script>
```

## Regions

A region's ref names exactly the sets it's in, joined by `&`, in any order. With sets `a`, `b` and `c`:

| Ref | Region |
|---|---|
| `'a'` | In `a` only. |
| `'a&b'` | In `a` and `b`, not `c`. |
| `'a&b&c'` | In all three. |
| `''` | Outside every set. Shown in the bottom-left corner, only when something is there. |

So `'a'` is a region (in `a` only), while the whole of set `a` is highlighted through `sets`. Set ids must not contain `&`.

## Sets, items and counts

| Set field | Meaning |
|---|---|
| `id` | Identifies the set; items and refs name it. |
| `label` | Shown beside its circle, with how many it holds. Defaults to `id`. |
| `tone` | `accent`, `good`, `warn`, `bad` or `muted`. Defaults to `accent`, `good` and `warn` in turn. |

| Item field | Meaning |
|---|---|
| `id` | Identifies the item across updates, for marking changes and for `highlight`. Required. |
| `label` | Its name in the diagram. Defaults to `id`. Long names are shortened to fit, with the full name as a tooltip. |
| `sets` | The ids of the sets it's in. None puts it outside them all. |
| `tone` | `good`, `warn` or `bad`. Colours its name. |

A region lists its items' names, in the order of `items`, as many as fit, then "+3 more". Every name is read out on pointing at the region.

Without items, give `counts` instead: `{ 'a': 12, 'a&b': 3, '': 40 }`. Regions not named count as 0.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `universe` | none | A label for everything considered, at the top left of the frame, such as "1,000 people screened". |
| `show` | names | `counts` shows each region's count even when there are items, for large groups. |
| `empty-text` | `Give two or three sets.` | Shown unless there are two or three sets. |

## Properties

| Property | Meaning |
|---|---|
| `sets` | Two or three sets. |
| `items` | The things to sort into regions. Setting them marks every item that changed region since the last time (→) or is new (+); pointing at it says where it was. The marks last until the next update. The diagram keeps its own record, so a model may edit its items in place. |
| `counts` | How many are in each region, by ref, when there are no items. Used only while `items` is unset (`null`). Setting counts, or items with `show="counts"`, shows each region's change since the last time (+2, −1). |
| `highlight` | `{ sets: [id, …], regions: [ref, …], items: [id, …] }`: what to point at. The first highlighted thing is read out under the diagram. |

## Events

Each event's detail is one of `{ set }`, `{ region }` or `{ item }`, where `set` and `item` are the objects given, and `region` is `{ ref, sets, count, items }`.

| Event | Detail | When |
|---|---|---|
| `sb-point` | as above, or `null` | The pointer moves onto another set label, region or item, or leaves the diagram; or one of them takes focus. Bubbles. |
| `sb-select` | as above | A set label, region or item is clicked, or Enter is pressed on it. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-good`, `--sb-warn`, `--sb-bad`.

Classes: `sb-venn__svg`, `sb-venn__universe`, `sb-venn__universe-label`, `sb-venn__circle` (the fill) and `sb-venn__outline` (both carry `data-set` and a tone class such as `sb-venn--good`, which sets `--sb-venn-tone`), `sb-venn__region` (the shading of one region, carries `data-region`), `sb-venn__label`, `sb-venn__total`, `sb-venn__contents` (a region's texts, carries `data-region`), `sb-venn__item` (carries `data-item` and `data-tone`), `sb-venn__marker`, `sb-venn__more`, `sb-venn__none`, `sb-venn__count`, `sb-venn__delta`, `sb-venn__reading`, `sb-venn__empty`. Modifiers `sb-venn--highlighted`, `sb-venn--pointed` and `sb-venn--empty` (a count of 0) apply where they fit.

The diagram is drawn at a fixed size (400 by 320 pixels for two sets, 480 by 410 for three), and shrinks to fit a narrower space.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-parameters`](../sb-parameters/manifest.md),** to change the rule or the rates behind the sets: set `items` or `counts` again and watch what moves.
- **[`sb-table`](../sb-table/manifest.md),** for the items with a column per set, when viewers need to search or sort them; on `sb-select` of a region, filter the table to its `items`.
- **[`sb-bars`](../sb-bars/manifest.md),** when the regions' exact sizes matter, since the circles are all the same size.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce refs from `sb-point`, so "mammals that lay eggs" in the prose and its region light each other up.

## Notes

- **Layout:** fixed and symmetric; the circles don't change size with their counts. Four sets, and circles sized by count, wait until a sandbox needs them.
- **Size:** each region fits a handful of names (three to six, depending on the region). Beyond that use `show="counts"`, and let the reading list the names.
- **Accessibility:** set labels, items and region counts are focusable; focus points at them, and Enter selects. The line under the diagram reads out what is pointed at, politely.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-venn`, the console says so. Replace every `sb-venn` in `sb-venn.js` (tag, classes, style id and clip ids all use it) to give this copy a new name.
