# sb-tags-mode changelog

## 0.3.0 · 2026-11-07
- Added a Search tab, when the page sets `search`: type a tag's name to find it (its letters in order), see what the page finds for the chosen tags with scores, or with none what's most like the page, in the card or full screen. With `pull-in`, results offer Pull in, firing `sb-pull`.
- **Breaking:** no amber. The frame round the page is gone, and the card and banner are plain panels; the outline round what's pointed at, the chosen tab and focus use `--sb-tags-mode-tone`, now the accent. `--sb-warn` is no longer read.

## 0.2.0 · 2026-11-07
- **Breaking:** the quiet bar that listed chosen tags outside the mode is gone, as a weaker copy of the card. Chosen tags still stay lit after the mode ends; open it again to see, change or clear them. Nothing to migrate.
- The card's bar matches a panel's: its name in bold, and a ✕ that ends the mode.
- Manifest cut to what an agent needs.
- Added presets, named selections from `TAG_PRESETS` or the `presets` property.
- Each line has a + and a −. A tag comes on adding; − takes away whatever carries it. Added `without`, and `sb-tag-focus` carries it.
- Nothing in the card's list moves while it's in use: the list comes first, the controls are always there, off until they're of use, and what's pointed at comes last.
- The switch now says **Intersection** and **Union**. `match` is still `all` or `any`.
- The card lists tags as lines with a pin each, like an outline, and leaves out tags with nothing to see unless they're pinned.
- Each tag has its own colour: its chip wears it, and `sb-tag-focus` carries `colors`, so what's lit shows which tag it's for. A tag's colour is the `color` in its declaration; without one it gets a temporary fallback, usually the same each time and never one another chosen tag is wearing, until tags are given colours where they're managed.

## 0.1.0 · 2026-11-06
- First version. Point at a tagged part to see its tags and what they mean, see the page's tags with counts, and click a tag to keep it lit, by all or any, after the mode ends too, with a quiet bar to clear it. The arrow keys step through what's lit. Remembered for the tab.
