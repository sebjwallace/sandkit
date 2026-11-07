# tags changelog

## 0.1.0 · 2026-11-07
- First version. `createTags({ items, tags })` applies tagging's rules (nothing superseded, the last of each id, working tags ignored, retired tags followed) and works out `find`, `like`, `ways`, `list` and `items`. Every result has a score from 0 to 1, with rarer tags weighing more.
