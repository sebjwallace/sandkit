# tags changelog

## 0.1.1 · 2026-11-09
- `createTags` takes `lists`, the lists of records by name, and gives each item the kind its list names: `{ CLAIMS }` holds claims. `items` still works.
- Every result carries a `label`, by one rule, so pages and tools say the same.
- `find` gives `exact`: how many carry exactly the chosen tags, which all score 1 and come in code order.

## 0.1.0 · 2026-11-07
- First version. `createTags({ items, tags })` applies tagging's rules (nothing superseded, the last of each id, working tags ignored, retired tags followed) and works out `find`, `like`, `ways`, `list` and `items`. Every result has a score from 0 to 1, with rarer tags weighing more.
