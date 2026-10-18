# sb-xref

Where a thing appears, and what it's linked to. Choose a ref, such as a rule's code, and the cross-reference lists every place on the page it shows up, grouped by view, with a snippet of each: in the table, the prose and the diagram, even in a closed tab. Clicking a place goes there. Below, what the model says the thing rests on, cites or affects; clicking one of those moves to it, so a chain of evidence becomes something to walk. A trail of what's been looked at, with Back, means wandering never loses anyone.

The cross-reference never searches the page. The sandbox finds the places (`placesOf` in the [locating practice](../../practices/locating.md)) and the model gives the links; the component lists them and says what the viewer chose.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-xref/sb-xref.js"></script>

<sb-xref></sb-xref>

<script>
  const xref = document.querySelector('sb-xref');
  function showXref(ref) {
    xref.subject = { ref, title: model.find(ref).name, kind: 'Rule' };
    xref.places = placesOf(ref).map((place) => ({ view: viewOf(place), context: place.textContent.trim() }));
    xref.links = model.linksOf(ref);   // [{ relation: 'rests on', ref: 'CLM-012', title: 'Stores reorder weekly' }, …]
  }
  xref.addEventListener('sb-go', (e) => goTo(e.detail.ref, e.detail.index));
  xref.addEventListener('sb-follow', (e) => showXref(e.detail.ref));
  xref.addEventListener('sb-back', (e) => showXref(e.detail.ref));
</script>
```

The locating practice's "Listing where a ref appears" has the whole of this wiring, `viewOf` included.

## Data

| Subject field | Required | Meaning |
|---|---|---|
| `ref` | yes | The ref being looked at, shown as a code. |
| `title` | no | What it is, in words. |
| `kind` | no | What sort of thing it is, such as "Rule". |

| Place field | Required | Meaning |
|---|---|---|
| `view` | no | The view it's in, such as a chapter or a diagram. Places are grouped by view, in the order views first appear. |
| `context` | no | A short snippet around it. Each mention of the ref in it is marked. |
| `hidden` | no | `true` when it's out of sight for now, in a closed tab or a folded branch: shown as "Hidden for now: going there opens it". |
| `unavailable` | no | Why it can't be gone to, such as "Hidden by your search". Shown with the reason, and clicking it does nothing, so a viewer's own choices stand. |

| Link field | Required | Meaning |
|---|---|---|
| `relation` | yes | How the subject is linked, in the model's words: "rests on", "cites", "affects". Links are grouped by relation, in the order relations first appear. |
| `ref` | yes | What it's linked to. |
| `title` | no | That thing, in words. |

Places are listed in the order given, which should be page order, and each keeps its position in `places` as its `index`.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `empty-text` | `Choose something to see where it appears.` | Shown while there's no subject. |

## Properties and methods

| Member | Meaning |
|---|---|
| `subject` | `{ ref, title, kind }`, or `null`. Setting a different ref puts the one before on the trail. |
| `places` | Where the subject appears. |
| `links` | What the model links it to. Empty leaves out the "Linked to" section. |
| `trail` | Read only. The subjects looked at before this one, oldest first. The latest few show as crumbs. |
| `clearTrail()` | Forget the trail, for example when the sandbox resets. |

Setting properties and calling methods never fires the events below; they are for what viewers do.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-go` | `{ ref, index }` | A place is clicked. Go there with `goTo(ref, index)`. Places that are `unavailable` fire nothing. Bubbles. |
| `sb-follow` | `{ ref }` | A link is clicked. Look the ref up and set a new `subject`, `places` and `links`. Bubbles. |
| `sb-back` | `{ ref }` | Back or a crumb is clicked. The component has already gone back to that subject; set its `places` and `links` again, since they may have changed. Bubbles. |
| `sb-highlight` | `{ ref }` | Fired on `document` while a place (its subject's ref) or a link (its ref) is pointed at or focused, and `{ ref: null }` after, as in the [highlighting practice](../../practices/highlighting.md). |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-radius`.

Classes: `sb-xref__trail`, `sb-xref__back`, `sb-xref__crumb`, `sb-xref__here`, `sb-xref__head`, `sb-xref__code`, `sb-xref__title`, `sb-xref__kind`, `sb-xref__count`, `sb-xref__section`, `sb-xref__group`, `sb-xref__group-name`, `sb-xref__list`, `sb-xref__place` (`--unavailable`), `sb-xref__state`, `sb-xref__link`, `sb-xref__empty`. The ref inside a place's context is a `mark`.

Its rows never carry `data-ref`: they are ways to places, not places, or the cross-reference would list itself.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-panel`](../sb-panel/manifest.md),** around it, so it floats beside the model while viewers jump about. A modal would hide the very places being gone to.
- **[`sb-id`](../sb-id/manifest.md) pills:** on a pill's `sb-select`, show its `code` in the cross-reference, so any code on the page opens where else it appears.
- **[The locating practice](../../practices/locating.md),** for `placesOf` and `goTo`, and **[the identifiers practice](../../practices/identifiers.md),** for the codes it follows.

## Notes

- **Retired refs:** say so in the subject's `title`, and give what replaced it as links with `relation: 'replaced by'`.
- **Other pages** aren't listed: finding across pages waits for an index and links into each page.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-xref`, the console says so. Replace every `sb-xref` in `sb-xref.js` to give this copy a new name.
