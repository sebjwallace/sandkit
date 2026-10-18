# sb-profile

The shape and value domain of a set of same-shaped records: every field across all samples, what types it holds, how often it's there, and the values it takes. Use it wherever a sandbox works from data: orders, sightings, events, survey answers, sensor readings.

It leads with what's surprising: fields that never change, fields that are keys, fields that are sometimes missing, fields holding more than one type, and values seen only once. Each is marked on its field in words. When the samples change, say because the sandbox narrowed them, every field whose presence or variety changed is marked with what it was, and a field that vanished stays in place to say so.

The analysis also runs from Node, without a page, so an agent can profile source material before a sandbox exists (see **Agent use**).

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-profile/sb-profile.js"></script>

<sb-profile></sb-profile>

<script>
  const prof = document.querySelector('sb-profile');
  prof.options = { id: 'orderId' };
  prof.samples = orders;              // raw samples: the element profiles them itself
  prof.addEventListener('sb-select', (e) => {
    prof.samples = orders.filter((order) => order[e.detail.path] === e.detail.value);
  });
</script>
```

## Samples and options

`samples` is an array of objects, as they come: nested objects, arrays, `null` and mixed types are all fine. Fields are named by path:

| Path | Means |
|---|---|
| `customer.address.city` | A field inside nested objects. |
| `items` | An array field. Its numbers are the arrays' lengths. |
| `items[]` | The array's elements, every element counted. |
| `items[].sku` | A field of the elements. |

| Option | Default | Meaning |
|---|---|---|
| `limit` | `20` | How many of each field's most common values to list. |
| `id` | none | The path of the field that identifies each sample, so findings name samples by it. Without it, samples are named by position (`#4` is `samples[4]`). |
| `path` | none | Profile the records at this path in each sample instead; an array there gives one record per element. |

## The result

The `profile` property, the class's `profile()` and `tools/analyse.mjs` all give the same plain JSON. The same samples always give the same result.

```js
{
  count: 1240,
  findings: [
    { kind: 'constant', path: 'currency', value: 'GBP' },
    { kind: 'unique', path: 'orderId' },
    { kind: 'sometimes-missing', path: 'refund', present: 96, of: 1240 },
    { kind: 'mixed-types', path: 'amount', types: { number: 1238, string: 2 }, samples: ['ORD-88', 'ORD-412'] },
    { kind: 'rare-values', path: 'status', values: ['disputed'] },
  ],
  fields: [
    { path: 'status', present: 1240, types: { string: 1240 }, distinct: 5,
      values: [{ value: 'delivered', count: 980 }, …], more: 0 },
    { path: 'amount', present: 1240, types: { number: 1238, string: 2 }, distinct: 911, values: […], more: 891,
      numbers: { min: 0.5, max: 2310, mean: 64.2, histogram: [{ from: 0, to: 250, count: 1102 }, …] } },
    { path: 'items', present: 1240, types: { array: 1240 }, distinct: 0, values: [], more: 0,
      lengths: { min: 1, max: 14, mean: 2.6, histogram: […] } },
    …
  ],
}
```

Fields come parents first, each level in the order first seen. `present` counts samples with the field; `types` counts every value by JSON type (`null`, `boolean`, `number`, `string`, `array`, `object`); `distinct`, `values` and `more` cover plain values only. Histograms have about ten bins of a round width, and never narrower than 1 for whole numbers.

Findings come by kind, in this order, then by path:

| Kind | Found when | Says |
|---|---|---|
| `constant` | One value wherever the field is, seen at least 5 times. | "always GBP" |
| `unique` | A different value every time, seen at least 5 times: likely a key. | "every value different" |
| `sometimes-missing` | Absent from some of the objects that could hold it. `of` counts the samples for a top-level field, else the times its parent was an object, so a missing parent isn't reported again for every field inside it. | "missing in 8%" |
| `mixed-types` | More than one type, `null` included. `samples` names up to five holding the less common types. | "2 are strings" |
| `rare-values` | Values seen once, in a field with at most `limit` distinct values and at least 5 values for each. | "seen once: disputed" |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `empty-text` | `No samples yet.` | Shown when there are no samples. |

## Properties and methods

| Member | Meaning |
|---|---|
| `samples` | The samples. Setting them profiles them and marks what changed since the last samples: presence (as a share of the samples) and distinct counts, each with what it was, and fields none of the new samples have, shown as gone. The marks last until the next update. |
| `options` | `{ limit, id, path }`, passed to the analysis. Setting them profiles again. |
| `profile` | Read-only: the result for the current samples and options. |
| `expanded` | Paths of the fields whose values are shown. |
| `highlight` | `{ fields: [path, …], values: [[path, value], …], kinds: [kind, …] }`: what to point at. A kind lights every field with that finding. A value its row isn't showing marks the row. |
| `SbProfile.profile(samples, options)` | The analysis itself, on the class, drawing nothing: `customElements.get('sb-profile').profile(samples)`. `profile.markdown(result)` gives the short summary `--md` prints. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-point` | `{ path }`, `{ path, value }`, `{ path, kind }`, `{ kind }`, or `null` | The pointer moves onto another field, value, finding or count in the summary, or leaves; or one of them takes focus. Bubbles. |
| `sb-select` | `{ path, value }` | A value is clicked, or chosen from the keyboard. The value is as it was in the samples, so `1` and `'1'` stay apart. Bubbles. |

Clicking a field's name or one of its findings opens or closes its values, and fires nothing.

## Agent use

The analysis runs without a page, from Node:

    node <sandkit>/tools/analyse.mjs profile data/*.json [--md] [--limit 20] [--id orderId] [--path items]

It reads JSON files (one sample, or an array of them), JSON Lines files and folders of them, and returns the same result as the element's `profile` property: compact JSON by default, or with `--md` a short summary, findings first. Profile data before designing a model, and read the findings instead of the samples. In a page, call it without drawing anything: `customElements.get('sb-profile').profile(samples, options)`.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-warn`, `--sb-radius`.

Classes: `sb-profile__summary`, `sb-profile__tally`, `sb-profile__kind` (a count in the summary, `--highlighted`, carries `data-kind`), `sb-profile__table`, `sb-profile__head`, `sb-profile__field` (`--highlighted`, `--holds-highlight`, `--gone`), `sb-profile__name`, `sb-profile__types`, `sb-profile__present`, `sb-profile__meter`, `sb-profile__distinct`, `sb-profile__changed`, `sb-profile__was`, `sb-profile__findings`, `sb-profile__finding` (`--highlighted`, carries `data-kind`), `sb-profile__detail`, `sb-profile__caption`, `sb-profile__values`, `sb-profile__value` (`--literal`, `--rare`, `--odd`, `--highlighted`), `sb-profile__bar`, `sb-profile__count`, `sb-profile__more`, `sb-profile__histogram`, `sb-profile__bin`, `sb-profile__axis`, `sb-profile__empty`. Field rows carry `data-ref` with their path, so a sandbox can find them (see the [locating practice](../../practices/locating.md)); a sandbox that gives fields codes maps them itself.

Give the element a `max-height` with `overflow: auto` on `.sb-profile__table` for long schemas.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-table`](../sb-table/manifest.md),** for the samples themselves: on `sb-select`, filter the table's rows to the samples holding the value, and set the profile's `samples` to the same ones.
- **[`sb-json`](../sb-json/manifest.md),** for one sample in full: spotlight the path a viewer points at, so a field's place in a real record shows beside its profile.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, and announce refs from `sb-point`, so "the gaps" or "the misspelt status" in the prose and the profile light each other up.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Node:** the same script loads in Node, where it hands its analysis to `module.exports` and defines no element.
- **Size:** tens of thousands of samples profile in well under a second.
- **Paths:** keys containing `.`, `[` or `]` make ambiguous paths.
- **Accessibility:** field names and values are buttons; focus points at them, and Enter opens or selects.
- **Renaming:** if another component on the page is already called `sb-profile`, the console says so. Replace every `sb-profile` in `sb-profile.js` (tag, classes and style id all use it) to give this copy a new name.
