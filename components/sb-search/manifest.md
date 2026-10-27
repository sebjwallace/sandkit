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
| `category` | | A heading the field's filter goes under, such as `The domain` beside `Our work`. Headings come in the order their first field does; fields without one go under none. |
| `show` | `true` | `false` keeps it off the default card and out of the table, while it's still searched, and filtered, sorted and grouped by as its options say. The list and grid say when a search found it there; the table doesn't. |
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

### The sandbox's own look

Optionally, `drawItem` draws items the sandbox's own way in the list or grid, so results look like the rest of the sandbox:

```js
search.view = 'grid';
search.drawItem = (item, view) => (view === 'grid' ? drawServiceCard(item) : null);
```

It's `(item, view) => element or null`, with `view` `list` or `grid`; the table always shows fields. `null` keeps the search's look for that item. The search places what comes back in the item, without a frame of its own, showing only a ring when the item is chosen or pointed at and its tone as a bar down the left edge, and keeps everything else: choosing, highlighting, tone, `data-ref`, grouping and the limit. It can't mark matches inside the sandbox's element, so the item says every field a search was found in. Links, buttons and fields inside it are its own: using them never chooses the item or reaches the search's controls, and a click anywhere else chooses it. Setting it redraws the results.

## Groups

`group` takes the key of a field to group by, or a list of keys for groups within groups, outermost first: `search.group = ['operator', 'status']`. Read back, one key reads as a key and several as a list. Once something is grouped, the bar offers **then by** beside Group, for a second level. In the list and grid, groups nest as sections, each heading counting its own items; the table runs groups within groups as one list of groups, each headed by every level's words joined ("LNER · Late"), so its columns line up throughout. The limit is shared by every group.

Optionally, `heading` gives a group's heading the sandbox's own words or look:

```js
search.heading = ({ key, value, label, level, items }) =>
  key === 'operator' ? `${operatorName(value)} · ${items.filter(isLate).length} late` : null;
```

`level` is 1 for the outermost, and `items` are the group's. Text replaces the heading's words, and the count stays; an element replaces the whole heading, placed as `drawItem` places an item; `null` keeps the field's label. The table takes only text, using the label where an element was given. Setting it redraws the results.

## Presets

`presets` lists named sets of criteria for viewers to choose from, in a Preset menu:

```js
search.presets = [
  { id: 'trouble', label: 'Trouble first', filters: { status: ['Delayed', 'Cancelled'] }, sort: { key: 'delay', direction: 'descending' } },
  { label: 'Morning peak', ranges: { departs: [420, 570] }, group: 'operator', view: 'table' }
];
search.preset = 'trouble';   // by id, or by label when there's no id
```

A preset may set `query`, `regex`, `filters`, `ranges`, `sort`, `group` and `view`. An `about` says in a sentence what it shows, under the bar while it's chosen. Choosing one sets what it names and resets the rest of the criteria, so it shows the same however it's reached; the view changes only when it names one. Once a viewer changes the criteria, the menu shows None and `preset` is `null`, until the viewer brings them round to a preset's again, such as by clearing them back to it: then that preset shows as chosen. A preset naming a view matches only in that view.

## What's applied

A row under the search box names the preset chosen and shows every part applied as a chip: the search text, each filter value, each range, the grouping and the sort. Pressing a chip takes that part away, and Clear all clears the search, filters and ranges, as `clear()` does. The count above says only how many are shown, and is lit for a moment when that changes, so a change is seen even when the results are out of sight (not under reduced motion).

When nothing matches, the search tries taking away each part on its own and offers up to three that would show something, most first: "Remove Status: Late to see 4".

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
| `choose` | `item` | `none`: items are never chosen, by click or key, aren't stops for Tab, and don't light when pointed at. For items that carry their own controls and need no detail. |

## Properties and methods

| Member | Meaning |
|---|---|
| `items` | The items, in their own order. Setting them again keeps the criteria, what's typed and the results' scroll, and the chosen item when one with the same `id` remains. |
| `fields` | The fields (see Fields). Reading it gives each field's options as used. |
| `card` | What the list and grid show (see Card). |
| `presets`, `preset` | See Presets. |
| `query` | The search text. |
| `regex` | Whether the search text is a regular expression. Case is ignored either way. An unreadable one says so and searches nothing out. |
| `filters` | `{ key: [value, …] }`: the filter values chosen. Within a field any value fits; across fields, all must. |
| `ranges` | `{ key: [from, to] }`: the ranges chosen, only those narrower than the field's span. |
| `sort` | `{ key, direction }`, with `direction` `ascending` (the default) or `descending`, or `null` for the items' own order. Empty values go last. |
| `group` | The key of the field to group by, a list of keys for groups within groups, or `null` (see Groups). |
| `heading` | `({ key, value, label, level, items }) => text, element or null`: the sandbox's own heading for a group (see Groups). |
| `view` | Reflects the attribute. |
| `fullscreen` | Lays the search over the whole page, with the criteria pinned at the top while the results scroll. Escape leaves it. |
| `filtersOpen` | Whether the filters are shown (default `true`). The toggle says how many filter values and ranges are chosen, as "Filters (2)", open or closed; the row of what's applied names them. |
| `drawItem` | `(item, view) => element or null`: the sandbox's own look for an item in the list or grid (see The sandbox's own look). |
| `match` | `(item, { text, regex }) => boolean`, replacing the built-in search. Matches are then not marked, nor said where they were found. |
| `filter` | `(item) => boolean`, a filter the model or the sandbox's own controls decide, applied with the viewer's. |
| `highlight` | Ids of the items to point at: one, a list, or `null`. |
| `selected` | The chosen item, or `null`. Setting it opens the detail pane. |
| `results` | The items the search and filters let through, in the order shown. |
| `detail` | Reflects the attribute. |
| `choose` | Reflects the attribute. |
| `reveal(ref)` | Scrolls to the item with this `id`, drawing past `limit` if needed. Returns `false` if the search or filters hide it, and leaves them as they are. |
| `clear()` | Clears the search, filters and ranges. Sort, group and view stay. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ item }` | An item is chosen (clicked, or Enter or Space), or `{ item: null }` when the detail pane is closed. Bubbles. |
| `sb-change` | `{ preset, query, regex, filters, ranges, sort, group, view, fullscreen, results }` | A viewer changes the criteria, the view or full screen. Not fired when the sandbox sets them. Bubbles. |

## Styling

Theme tokens: `--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`, `--sb-radius`, `--sb-lift`, `--sb-lift-shadow`, `--sb-drop`. Its own: `--sb-search-lift` (the criteria, the pane, filter values, chips and the table's header), `--sb-search-drop` (the search box, menus and results), `--sb-search-shadow` (the pane, the items, filter values and chips), `--sb-search-inset` (the results' padding).

The search sits in one border: the criteria are a band across its top, lifted and set off by a divider, and the results are dropped below it. Fields to type in or choose from sit in the drop; things to press sit on the lift, a filter value's lift stacking on the band's. A chosen filter value is filled with the accent, so it's never taken for one pointed at. The views and full screen are icons, each with a label and a tooltip.

Classes: `sb-search__frame` (`--full`), `sb-search__criteria`, `sb-search__bar`, `sb-search__input`, `sb-search__erase` (the search box's clear button), `sb-search__regex`, `sb-search__count` (`--changed`), `sb-search__applied`, `sb-search__chip`, `sb-search__clear`, `sb-search__problem`, `sb-search__about`, `sb-search__select` (`sb-search__preset`, `sb-search__sort`, `sb-search__group`, `sb-search__then`), `sb-search__views`, `sb-search__full`, `sb-search__toggle`, `sb-search__filters`, `sb-search__category`, `sb-search__value` (`--none`), `sb-search__ranged`, `sb-search__handle`, `sb-search__tick` (`--out`), `sb-search__results`, `section.sb-search__group` (`--1`, `--2`, … by level), `sb-search__heading` (`--1`, `--2`, … by level, `--own` for an element of the sandbox's), `sb-search__items` (`--list`, `--grid`), `sb-search__item` (`--selected`, `--highlighted`), `sb-search__item--own` (an item drawn by `drawItem`), `sb-search__title`, `sb-search__subtitle`, `sb-search__details`, `sb-search__found`, `sb-search__table`, `sb-search__match`, `sb-search__more`, `sb-search__pane`, `sb-search__pane-body`, `sb-search__empty`, `sb-search__ways`, `sb-search__way`. Items carry `data-tone`, and `data-ref` with their `id`, so a sandbox can find them and go to them (see the [locating practice](../../practices/locating.md)); items the search or filters hide aren't drawn, so aren't found.

`sb-search__group` is both the Group menu and a group of results, so scope rules for results to `section.sb-search__group`.

The search draws `<p>`, `<ul>`, `<dl>` and `<table>` elements; keep the sandbox's rules for those scoped to its own content, or they reach inside.

Give the element a height (for example `max-height: 600px`) so the results scroll under the criteria; without one it grows with its results.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Text is never markup:** every value is shown as text, through `format` too.
- **Accessibility:** every control is a native button, select, input or range, labelled; items are focusable and chosen with Enter or Space; the count is announced as it changes; Escape closes the detail, then full screen.
- **Size:** made for the tens to thousands of items a sandbox holds. Values are worked out once when items are set; at most `limit` results are drawn at a time.
- **Renaming:** if another component on the page is already called `sb-search`, the console says so. Replace every `sb-search` in `sb-search.js` (tag, classes and style id all use it) to give this copy a new name.
