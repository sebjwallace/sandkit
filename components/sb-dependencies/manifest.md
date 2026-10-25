# sb-dependencies

What goes with what in a set of same-shaped records: which fields determine others, which change together, which optional fields are present together, and which rules nearly hold, with the samples that break them. Use it wherever a sandbox works from data and the data carries rules: orders, sightings, events, survey answers, sensor readings.

It leads with the near-misses, since a rule that holds 97% of the time and the samples that break it are often the most valuable thing in the data. Rules that follow from others are drawn as chains, what wasn't considered is said and why, and when the samples change, every rule that appeared, disappeared or changed strength is marked.

The analysis also runs from Node, without a page, so an agent can find a data set's rules before a sandbox exists (see **Agent use**).

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-dependencies/sb-dependencies.js"></script>

<sb-dependencies></sb-dependencies>

<script>
  const deps = document.querySelector('sb-dependencies');
  deps.options = { id: 'orderId' };
  deps.samples = orders;              // raw samples: the element analyses them itself
  deps.addEventListener('sb-select', (e) => showSamples(e.detail.samples));
</script>
```

## Samples and options

`samples` is an array of objects, as they come. Fields are named by path, dotted for nested objects (`customer.address.city`). Values are compared as given, so `1` and `'1'` are different values, and `null` is a value of its own. A rule is compared only over the samples that have both its fields.

| Option | Default | Meaning |
|---|---|---|
| `id` | none | The path of the field that identifies each sample, so exceptions name samples by it. Without it, samples are named by position (`#4` is `samples[4]`). |
| `threshold` | `0.95` | The weakest near-miss reported, as a share of the samples compared. |
| `pairs` | `false` | Also look for two fields that together determine another, where neither alone does. Slower, and gives more findings. |
| `path` | none | Analyse the records at this path in each sample instead; an array there gives one record per element. |
| `maxFields` | `60` | The most fields considered, in the order first seen. |

## The result

The `dependencies` property, the class's `dependencies()` and `tools/analyse.mjs` all give the same plain JSON. The same samples always give the same result.

```js
{
  count: 120,
  findings: [
    { kind: 'determines', from: ['country'], to: 'currency', holds: 1, of: 120 },
    { kind: 'determines', from: ['sku'], to: 'department', holds: 1, of: 120, via: 'category' },
    { kind: 'determines', from: ['country'], to: 'vatRate', holds: 0.975, of: 120, exceptions: [
        { value: { country: 'IE' }, usual: 0.23, odd: [{ value: 0.05, count: 2, samples: ['ORD-1024', 'ORD-1105'] }] }, … ] },
    { kind: 'together', fields: ['sku', 'productName', 'unitPrice'] },
    { kind: 'present-together', fields: ['refund', 'refundReason'], present: 33 },
  ],
  fields: ['country', 'currency', 'vatRate', 'sku', …],   // the fields considered
  skipped: [{ path: 'orderId', reason: 'unique' }, { path: 'channel', reason: 'constant' }],
}
```

Findings come exact rules first, then near-misses, strongest first, then groups that change together, then groups present together; within each, in the order the fields were first seen.

| Kind | Found when |
|---|---|
| `determines` | Each value of `from` goes with one value of `to`. `holds` is the share of the `of` samples compared that agree: 1 for an exact rule, down to `threshold` for a near-miss. A near-miss lists `exceptions`: for each `from` value that breaks it, the `usual` value and the `odd` ones out, each with its `count` and up to five `samples`; at most ten, the worst first, with `more` saying how many others. An exact rule that follows from two others has `via`, the field it goes through. `from` holds two fields only with `pairs`. |
| `together` | Fields that each determine the others exactly, so they always change together: one group rather than every rule between them. The group stands in for its fields, so rules to and from it are given with its first field. |
| `present-together` | Fields present in some samples but not all, and always present together or absent together. `present` counts the samples that have them. |

What it takes for a finding to count, so small data doesn't look full of findings:

- **A rule needs at least 5 samples, on average, for each value it goes from.** A field with nearly as many values as samples determines everything by accident.
- **A near-miss must make at most half the mistakes of always guessing the most common value,** so a field that is nearly constant isn't determined by everything.
- **Present together needs at least 5 samples with the fields and 5 without.**

`skipped` lists what wasn't considered for rules, and why: `unique` (every value different, seen at least 5 times: a key determines everything, which says nothing), `constant` (one value: anything determines it), `array` (array elements aren't compared yet; use `path` to analyse them as records) and `max-fields` (over the limit). Skipped fields can still be present together.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `empty-text` | `No samples yet.` | Shown when there are no samples. |

## Properties and methods

| Member | Meaning |
|---|---|
| `samples` | The samples. Setting them analyses them and marks what changed since the last samples: rules and groups that are new, gone (struck through, in place) or of a different strength (with what it was). The marks last until the next update. |
| `options` | `{ id, threshold, pairs, path, maxFields }`, passed to the analysis. Setting them analyses again. |
| `dependencies` | Read-only: the result for the current samples and options. |
| `SbDependencies.dependencies(samples, options)` | The analysis itself, on the class, drawing nothing: `customElements.get('sb-dependencies').dependencies(samples)`. `dependencies.markdown(result)` gives the short summary `--md` prints. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ samples, finding }` | An exception's samples are clicked, or chosen from the keyboard: the ids (or positions) of the odd samples for that value, and the near-miss they break. Bubbles. |

Clicking a near-miss's strength ("holds in 97.5%: 3 exceptions") opens or closes its exceptions, and fires nothing.

## Agent use

The analysis runs without a page, from Node:

    node <sandkit>/tools/analyse.mjs dependencies data/*.json [--md] [--id orderId] [--threshold 0.95] [--pairs] [--path items]

It reads JSON files (one sample, or an array of them), JSON Lines files and folders of them, and returns the same result as the element's `dependencies` property: compact JSON by default, or with `--md` a short summary, near-misses and their exceptions first, then rules, then groups. Run it after profiling the data.

The findings are evidence, not truth. A rule seen in the data is an **inference** until someone confirms it, and an exception is a **question** until someone explains it. Record them so in the sandbox's knowledge, with codes (see the [identifiers practice](../../practices/identifiers.md)), and ask the person about the exceptions.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-warn`, `--sb-radius`.

Classes: `sb-dependencies__summary`, `sb-dependencies__heading`, `sb-dependencies__list`, `sb-dependencies__row` (`--near`), `sb-dependencies__item` (`--gone`), `sb-dependencies__field`, `sb-dependencies__strength`, `sb-dependencies__mark`, `sb-dependencies__exceptions`, `sb-dependencies__samples`, `sb-dependencies__more`, `sb-dependencies__skipped`, `sb-dependencies__empty`. Every field name carries `data-ref` with its path, so a sandbox can find a field everywhere it's mentioned (see the [locating practice](../../practices/locating.md)); a sandbox that gives fields codes maps them itself.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Node:** the same script loads in Node, where it hands its analysis to `module.exports` and defines no element.
- **Size:** fifty fields over twenty thousand samples take about a second. Pairs take much longer, which is why they're opt-in.
- **Paths:** keys containing `.` make ambiguous paths.
- **Accessibility:** near-misses' strengths and exceptions' samples are buttons, opened and chosen with Enter.
- **Renaming:** if another component on the page is already called `sb-dependencies`, the console says so. Replace every `sb-dependencies` in `sb-dependencies.js` (tag, classes and style id all use it) to give this copy a new name.
