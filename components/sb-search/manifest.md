# sb-search

A collection to search, filter, sort and group, shown as a list, a grid or a table, in the page or full screen. Use it wherever a sandbox holds many comparable things for people to explore: services on a network, assets on a grid, species in a survey, cases on a ward, papers in a review.

The search knows nothing about the domain. Give it an array of objects and it works out the rest: every field is searched and can be sorted, and text fields with a few repeated values become filters and groups. Say more through `fields` where the defaults fall short, and hand it functions of the sandbox's own where the sandbox knows better.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-search/sb-search.js"></script>

<sb-search placeholder="Search services…">
  <div slot="detail" id="service-detail"></div>
</sb-search>

<script>
  const search = document.querySelector('sb-search');
  search.items = model.services;   // [{ id: '1A10', route: 'Leeds → York', operator: 'Northern', delay: 0, tone: 'warn' }, …]

  // Optional: say more about the fields, what the list and grid show, and presets.
  search.fields = [
    { key: 'route', label: 'Route' },
    { key: 'operator', label: 'Operator' },
    { key: 'delay', label: 'Delay', format: (minutes) => `${minutes} min`, range: true }
  ];
  search.card = { title: 'id', subtitle: 'route', details: ['operator', 'delay'] };
  search.presets = [{ label: 'Late first', sort: { key: 'delay', direction: 'descending' } }];
  search.preset = 'Late first';

  search.addEventListener('sb-select', (e) => showService(e.detail.item));
</script>
```

## Items

Each item is an object of the sandbox's fields, plus two the search reads itself:

| Item field | Meaning |
|---|---|
| `id` | Identifies the item: carried as `data-ref`, used by `highlight` and `reveal`, and keeps the chosen item chosen when the items are set again. |
| `tone` | `good`, `warn` or `bad`. A bar down the item's edge in the theme's status colour. Say why in a field too, so tone is never the only sign. |

Values may be text, numbers, dates (treated as their timestamps) or lists, such as tags. An item with several values in a field counts once under each of them in filters and groups, and one with none (an empty list) under Not set. Tags often have more values than a filter is offered for by default, so give the field `filter: true`.

## Fields

`fields` says which fields there are, in order, and what each does. Without it, every field of the first item is used, except `id` and `tone`. Every option is optional except `key`.

| Field option | Default | Meaning |
|---|---|---|
| `key` | | The item field. |
| `label` | `key` | Its name, on filters, headings and columns. |
| `format` | | `(value, item) => text`, shown instead of the plain value and searched as shown. Filter values and group headings call it without `item`. |
| `value` | `item[key]` | `(item) => value`, the value to filter, sort, group and range by, worked out from the item. Lets a field be derived, such as a band from a number, or a time of day from `"07:25"`. |
| `compare` | numbers by size, text naturally | `(a, b) => number`, the field's own order, for sorting, groups and filter values. Such as `Good, Fair, Poor`. |
| `search` | `true` | Whether the search looks in it. |
| `sort` | `true` | Whether it's offered under Sort. |
| `filter` | text with 2–8 values repeated across the items | Shows a button for each value, with how many items it would show. |
| `group` | as `filter` | Whether it's offered under Group. |
| `range` | `false` | For numbers and dates: a slider with two handles choosing a stretch of the field's span, with a tick for each value. |
| `step` | `1` for whole numbers, else any | How far a range handle moves. |

Name a filter or group only for fields with a few values a reader cares about, such as status, kind or region. A filter of thirty values is a wall to read; derive a field with fewer values with `value` instead.

## Card

`card` says what the list and grid show of each item: `{ title, subtitle, details: [key, …] }`, each a field's key. Without it, the first field is the title and the next four are details. The table shows every field.

Keep it short: a title, a line and two or three details. When the search matches a field the card doesn't show, the item says where it was found ("Found in Calls at Doncaster"), so no result appears without a reason.

## Presets

`presets` lists named sets of criteria for viewers to choose from, in a Preset menu:

```js
search.presets = [
  { id: 'trouble', label: 'Trouble first', filters: { status: ['Delayed', 'Cancelled'] }, sort: { key: 'delay', direction: 'descending' } },
  { label: 'Morning peak', ranges: { departs: [420, 570] }, group: 'operator', view: 'table' }
];
search.preset = 'trouble';   // by id, or by label when there's no id
```

A preset may set `query`, `regex`, `filters`, `ranges`, `sort`, `group` and `view`. Choosing one sets what it names and resets the rest of the criteria, so it shows the same however it's reached; the view changes only when it names one. Once a viewer changes the criteria, the menu shows None and `preset` is `null`.

## Detail

A child with `slot="detail"` is the sandbox's own content about the chosen item. The search keeps it through every redraw, and inside the frame in full screen, but never reads it: fill it on `sb-select`, as text or elements the sandbox makes.

| `detail` attribute | Meaning |
|---|---|
| `pane` (default) | A pane beside the results, headed by the item's title, shown while an item is chosen. Closing it (its button, or Escape) lets go of the item and fires `sb-select` with `null`. Below the results when the search is narrow. |
| `free` | The search holds the content but neither places nor hides it. For content that shows itself, such as a modal dialog or a popover opened on `sb-select`. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `view` | `list` | `list`, `grid` or `table`. |
| `placeholder` | `Search…` | The search box's placeholder. |
| `limit` | `200` | Draw at most this many results, with a button to show the rest. |
| `empty-text` | `Nothing yet.` | Shown when there are no items. |
| `detail` | `pane` | How the detail slot is shown (see Detail). |
| `fullscreen` | off | Reflects `fullscreen`. |

## Properties and methods

| Member | Meaning |
|---|---|
| `items` | The items, in their own order. Setting them again keeps the criteria, and the chosen item when one with the same `id` remains. |
| `fields` | The fields (see Fields). Reading it gives each field's options as used. |
| `card` | What the list and grid show (see Card). |
| `presets`, `preset` | See Presets. |
| `query` | The search text. |
| `regex` | Whether the search text is a regular expression. Case is ignored either way. An unreadable one says so and searches nothing out. |
| `filters` | `{ key: [value, …] }`: the filter values chosen. Within a field any value fits; across fields, all must. |
| `ranges` | `{ key: [from, to] }`: the ranges chosen, only those narrower than the field's span. |
| `sort` | `{ key, direction }`, with `direction` `ascending` (the default) or `descending`, or `null` for the items' own order. Empty values go last. |
| `group` | The key of the field to group by, or `null`. |
| `view` | Reflects the attribute. |
| `fullscreen` | Lays the search over the whole page, with the criteria pinned at the top while the results scroll. Escape leaves it. |
| `filtersOpen` | Whether the filters are shown (default `true`). Closed, the values chosen are listed beside the Filters toggle. |
| `match` | `(item, { text, regex }) => boolean`, replacing the built-in search. Matches are then not marked, nor said where they were found. |
| `filter` | `(item) => boolean`, a filter the model or the sandbox's own controls decide, applied with the viewer's. |
| `highlight` | Ids of the items to point at: one, a list, or `null`. |
| `selected` | The chosen item, or `null`. Setting it opens the detail pane. |
| `results` | The items the search and filters let through, in the order shown. |
| `detail` | Reflects the attribute. |
| `reveal(ref)` | Scrolls to the item with this `id`, drawing past `limit` if needed. Returns `false` if the search or filters hide it, and leaves them as they are. |
| `clear()` | Clears the search, filters and ranges. Sort, group and view stay. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ item }` | An item is chosen (clicked, or Enter or Space), or `{ item: null }` when the detail pane is closed. Bubbles. |
| `sb-change` | `{ preset, query, regex, filters, ranges, sort, group, view, fullscreen, results }` | A viewer changes the criteria, the view or full screen. Not fired when the sandbox sets them. Bubbles. |

## Styling

Theme tokens: `--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`, `--sb-radius`, `--sb-lift`, `--sb-lift-shadow`, `--sb-drop`. Its own: `--sb-search-lift` and `--sb-search-shadow` (the criteria, the pane and the items), `--sb-search-inset` (the results' padding).

The search sits in a border; inside, the criteria and the detail pane are lifted and the results dropped a step below them, so its parts stay apart from each other and from the page.

Classes: `sb-search__frame` (`--full`), `sb-search__criteria`, `sb-search__bar`, `sb-search__input`, `sb-search__regex`, `sb-search__count`, `sb-search__problem`, `sb-search__select` (`sb-search__preset`, `sb-search__sort`, `sb-search__group`), `sb-search__views`, `sb-search__full`, `sb-search__toggle`, `sb-search__chosen`, `sb-search__filters`, `sb-search__value` (`--none`), `sb-search__ranged`, `sb-search__handle`, `sb-search__tick` (`--out`), `sb-search__results`, `sb-search__group`, `sb-search__heading`, `sb-search__items` (`--list`, `--grid`), `sb-search__item` (`--selected`, `--highlighted`), `sb-search__title`, `sb-search__subtitle`, `sb-search__details`, `sb-search__found`, `sb-search__table`, `sb-search__match`, `sb-search__more`, `sb-search__pane`, `sb-search__pane-body`, `sb-search__empty`. Items carry `data-tone`, and `data-ref` with their `id`, so a sandbox can find them and go to them (see the [locating practice](../../practices/locating.md)); items the search or filters hide aren't drawn, so aren't found.

The search draws `<p>`, `<ul>`, `<dl>` and `<table>` elements; keep the sandbox's rules for those scoped to its own content, or they reach inside.

Give the element a height (for example `max-height: 600px`) so the results scroll under the criteria; without one it grows with its results.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Text is never markup:** every value is shown as text, through `format` too.
- **Accessibility:** every control is a native button, select, input or range, labelled; items are focusable and chosen with Enter or Space; the count is announced as it changes; Escape closes the detail, then full screen.
- **Size:** made for the tens to thousands of items a sandbox holds. Values are worked out once when items are set; at most `limit` results are drawn at a time.
- **Renaming:** if another component on the page is already called `sb-search`, the console says so. Replace every `sb-search` in `sb-search.js` (tag, classes and style id all use it) to give this copy a new name.
