# sb-search changelog

## 0.1.1 · 2026-10-27
- Optionally draws items the sandbox's own way: `drawItem(item, view)` returns an element for the list or grid, or `null` to keep the search's look. The search places it without a frame of its own (a ring when chosen or pointed at, tone as a bar down its edge) and keeps choosing, highlighting, tone, grouping and the limit; the item says every field a search was found in.

## 0.1.0 · 2026-10-27
- First release. A collection to search (words or a regular expression, with matches marked and where they were found), filter by values with counts, narrow by ranges, sort and group, shown as a list, grid or table, in the page or full screen. Works from a bare array; fields, functions of the sandbox's own, presets and a detail slot say more.
