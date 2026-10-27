# sb-search changelog

## 0.2.0 · 2026-10-27
- **Breaking:** the closed filters no longer list what's chosen beside the toggle (`sb-search__chosen` is gone), since the row of what's applied names it all. The toggle says how many are chosen instead, "Filters (2)". Nothing to migrate unless a sandbox styled `sb-search__chosen`.
- One container: the frame's border is the only one; the criteria are a band across its top, lifted, and the results dropped below it.
- Calmer type: labels, the Filters toggle, group headings and "Found in" in sentence case, not small capitals.
- The views and full screen are icons, labelled, with full screen beside the count; icon buttons are a text button's height.
- Fields sit in the drop (the search box and menus), things to press on the lift (filter values and the chips of what's applied, their lift stacked on the band's, with its shadow, and the table's header): `--sb-search-drop` added.
- A chosen filter value is filled with the accent; values that would leave nothing are quiet, without a border.
- A magnifier in the search box, and a clear button while there's text, in place of the browser's own.

## 0.1.5 · 2026-10-27
- What's applied, as a row of chips under the search box: the preset, then the search, each filter value, each range, the grouping and the sort, each taking its part away. Clear all moved there from the count, which now says only how many are shown.
- Criteria a viewer brings round to a preset's show as that preset.
- When nothing matches, up to three ways back: the parts that, taken away on their own, would show something, with how many.
- The count is lit for a moment when how many are shown changes.

## 0.1.4 · 2026-10-27
- Groups within groups: `group` takes a list of keys, outermost first, and the bar offers "then by" once something is grouped. The list and grid nest sections; the table runs them as one list of groups, headed by every level's words. Presets and `sb-change` carry `group` as a key or a list.
- `heading` gives a group's heading the sandbox's own words, keeping the count, or its own element.

## 0.1.3 · 2026-10-27
- A preset's `about` says what it shows, under the bar while it's chosen.
- A field's `category` puts its filter under a heading, such as the subject's own dimensions apart from those of the work on it.
- A field with `show: false` is searched, filtered, sorted and grouped by, but left off the default card and out of the table; the list and grid still say when a search found it there.
- `choose="none"` for items that carry their own controls: never chosen by click or key, not stops for Tab, and not lit when pointed at.

## 0.1.2 · 2026-10-27
- Fixed: a button inside an item drawn by `drawItem` could be taken for one of the search's own controls, and clicking it chose the item. Links, buttons and fields inside it are now its own.
- Changing a preset, the sort, the grouping or the items redraws only the bar's choices, the filters and the results, rather than the whole search: the search box keeps what's typed and its focus, and the results keep their scroll. Nothing the search focuses scrolls the page.

## 0.1.1 · 2026-10-27
- Optionally draws items the sandbox's own way: `drawItem(item, view)` returns an element for the list or grid, or `null` to keep the search's look. The search places it without a frame of its own (a ring when chosen or pointed at, tone as a bar down its edge) and keeps choosing, highlighting, tone, grouping and the limit; the item says every field a search was found in.

## 0.1.0 · 2026-10-27
- First release. A collection to search (words or a regular expression, with matches marked and where they were found), filter by values with counts, narrow by ranges, sort and group, shown as a list, grid or table, in the page or full screen. Works from a bare array; fields, functions of the sandbox's own, presets and a detail slot say more.
