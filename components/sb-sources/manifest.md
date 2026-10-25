# sb-sources

A sandbox's source material, as cards of paper to search, filter and sort. Use it wherever a sandbox rests on material people gathered: interviews, documents, data, notes and its own analyses. People see what the sandbox knows, who said it and when, how far each source has been checked, which have been replaced, and which files are still waiting to be catalogued.

Each source is a card of paper with its labelled details, so material looks like material wherever it appears. Filters show how many sources each value would give, so the shape of the material shows at a glance. It follows the [sources practice](../../practices/sources.md), which says how sources are catalogued.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-sources/sb-sources.js"></script>

<sb-sources></sb-sources>

<script>
  const list = document.querySelector('sb-sources');
  list.catalogue = (await (await fetch('sources/catalogue.json')).json()).sources;
  list.files = await (await fetch('/_sandkit/files?dir=sources')).json();   // optional: shows files not yet catalogued
  list.addEventListener('sb-open', (e) => showSource(e.detail.id));
</script>
```

The page loads the catalogue and the file list and hands them over; the component never fetches. Reading the sandbox's files needs it served (see the practice). Without the server, leave `files` out: everything else works.

## Data

**`catalogue`** is the catalogue's `sources`. Every field is optional apart from `id`; only those given are shown.

| Field | Shown as |
|---|---|
| `id`, `title`, `summary` | The code, title and summary on the card. |
| `format`, `path` | The format badge (`transcript · txt`). |
| `author`, `authored`, `status` | Labelled details. The status has a coloured dot (`inbox`, `catalogued`, `reviewed`, `superseded`). |
| `supersedes` | "Supersedes SRC-1" on this card, and "Superseded by SRC-3" on the one it replaces, which is faded and struck through. |
| `derivedFrom` | "Derived from SRC-2, SRC-3". A source with any is not primary. |
| `stance`, `tags` | Filtered and searched, not shown. |

**`files`** is the server's listing of the sources folder, `[{ path, size, modified }]`. Files no source's `path` names are shown after the cards as not yet catalogued, apart from `catalogue.json` and `.gitkeep`.

## Properties

| Property | Meaning |
|---|---|
| `catalogue` | The sources, shown in their own order unless sorted. Copied when set. Without any, the component says "No sources catalogued yet." |
| `files` | The files in the sources folder. Optional. |
| `query` | The search text. Shows sources whose id, title, summary, author or tags hold every word, ignoring case. Mirrors the search box. Files not yet catalogued always show. |
| `filter` | `{ author, format, stance, status, written, primary }`, each optional. The first four are lists of values: a source shows when it has any of a detail's values, and every detail given must agree. `written` is `[from, to]` (`'2026-01-01'`), leaving out sources written outside it or undated. `primary: true` leaves out derived sources. Mirrors the filters; Clear filters sets `{}`. |
| `sort` | `'newest'`, `'oldest'`, `'title'`, `'author'`, or `null` for the catalogue's order. Sources missing the detail go last. Mirrors the menu. |
| `selected` | The id of the source that's open, marked with an outline. Clicking a card sets it. `null` for none. |
| `highlight` | Source ids to light up: `['SRC-3']`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-open` | `{ id }` | A viewer clicks a card, or presses Enter on it. It's selected first. Bubbles. |
| `sb-point` | `{ id }`, `id` `null` when pointing stops | A viewer points at another card (hover or focus). Bubbles. |

Searching, filtering and sorting fire no events: they change only what this list shows.

## What it shows

- **Filters with counts.** Author, format, stance and status each offer every value in the catalogue, with how many sources it would show alongside the search and the other filters. A value that would show none fades but stays, so nothing moves under the pointer. Statuses run in the order a source moves through them; other values most common first.
- **Dates written.** A slider over the whole span of `authored` dates, a tick for each source, with two handles to choose a stretch. It shows when at least two dates differ.
- **Replaced sources** stay listed, faded and struck through, saying what replaced them, so a citation of an old source can still be followed.
- **Not yet catalogued.** Files waiting in the folder are dashed outlines after the cards, and the count says how many ("7 sources · 2 not yet catalogued"), so nothing waits unseen.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-bg`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`. Its own: `--sb-sources-paper` (the cards' colour, warm by default), `--sb-sources-font` (the typeface for titles and summaries, a serif by default) and `--sb-sources-fold` (the folded corner's size, `16px`). Set the paper and font to match `--sb-source-paper` and `--sb-source-font` when a sandbox changes them.

Classes: `sb-sources__bar`, `sb-sources__search`, `sb-sources__sort`, `sb-sources__count`, `sb-sources__filters`, `sb-sources__facet` (a detail's label), `sb-sources__value` (a filter chip, `--none` when it would show nothing; pressed ones carry `aria-pressed="true"`), `sb-sources__tally`, `sb-sources__clear`, `sb-sources__range`, `sb-sources__handle`, `sb-sources__tick` (`--out`), `sb-sources__between`, `sb-sources__list`, `sb-sources__card` (`--lit`, `--selected`, `--superseded`), `sb-sources__paper`, `sb-sources__id`, `sb-sources__format`, `sb-sources__title`, `sb-sources__summary`, `sb-sources__fields`, `sb-sources__status` (`--inbox`, `--catalogued`, `--reviewed`, `--superseded`), `sb-sources__links`, `sb-sources__group`, `sb-sources__file`, `sb-sources__path`, `sb-sources__size`, `sb-sources__empty`.

Each card carries `data-ref` with its source's id, so a sandbox can find it (see the [locating practice](../../practices/locating.md)); cards a viewer's search or filters hide aren't drawn, so aren't found.

Give the element a height (for example `height: 600px`) so the cards scroll under the filters, or leave it to grow with its content. The cards fill as many columns as fit, each at least 230px wide.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets. The catalogue and file list are the sandbox's, loaded by the page.
- **Trust:** a catalogue's text is only ever shown as text.
- **Accessibility:** cards, chips and the menu can be reached with Tab; Enter or Space opens a card; the slider's handles move with the arrow keys, a day at a time.
- **Renaming:** if another component on the page is already called `sb-sources`, the console says so. Replace every `sb-sources` in `sb-sources.js` (tag, classes, tokens and style id all use it) to give this copy a new name.
