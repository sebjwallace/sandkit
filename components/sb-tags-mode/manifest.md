# sb-tags-mode

Tags mode: see what any part of a sandbox is about, and choose topics to keep lit while you work. While it's on, pointing at a tagged part shows its tags in a card at the side, with what each one means, and the card lists every tag on the page with how many parts carry it. Clicking a tag keeps everything carrying it lit, across the page and after the mode ends, until it's cleared. Use it in any sandbox that has opted in to [tagging](../../practices/tagging.md).

It's a mode, part of the environment around a sandbox rather than a view of its subject: it lives in the shell's `modes` slot and follows the [modes practice](../../practices/modes.md). It only chooses: the [highlighting script](../../practices/highlighting.md) does the lighting.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="lib/sandkit/shell/sb-highlighting.js"></script>
<script src="lib/sandkit/components/sb-tags-mode/sb-tags-mode.js"></script>
<script src="tags.js"></script>

<sb-shell>
  <sb-tags-mode slot="modes"></sb-tags-mode>
</sb-shell>
```

That's all the wiring there is. It reads `data-tags` from the page, which components put there when given tags, and what each tag means from `TAGS`, the tagging practice's declarations, when that script is on the page.

## The flow

1. **Tags**, chosen in the shell's mode picker or with the key **G**, starts it: an amber frame round the page, a banner at the bottom saying what clicking does, with **Stop**, and the card at the right.
2. **Pointing** at a tagged part, after a short pause, outlines it and shows its tags in the card, with what each means. The innermost tagged part counts; a part with no tags of its own shows those of what holds it, and the outline says which part they belong to. Pointing at anything else keeps what's shown, so the pointer can travel to the card. Pointing lights things as it does in Explore.
3. **A click** on a tagged part holds the card on it. Clicking it again, or anywhere else, lets go. Clicks never act on the page in the mode. Clicks on what every mode lets through (`data-modes`, such as the mode picker), inside open dialogs and in the card act as usual.
4. **Clicking a tag** in the card chooses it, or removes it. Whatever carries it stays lit: a dashed line in a colour of its own, with no fill. Chosen tags show a tick as well as the colour.
5. **With two or more chosen,** a switch offers **All tags**, the default, to find where topics meet, or **Any tag**. The card counts the parts that match.
6. **The arrow keys** step through what's kept lit, or through everything tagged when nothing is, scrolling to each and holding it. So lit parts can be found on a long page, and the keyboard reaches parts that can't take focus.
7. **Stop**, Escape, or choosing another mode ends it. Chosen tags stay lit, and a quiet bar at the bottom left lists them, with the switch and **Clear**. It's there in Explore, and its clicks act as usual.

## On this page

The card lists every current tag, most used first, as found on `data-tags` and declared in `TAGS`.

- **Counts are parts someone can see without opening anything,** so they agree with what lights up. A tag only on hidden parts, or only declared, counts 0.
- **Retired tags are never offered.** A part still carrying one shows it struck through, with what replaced it.
- **Undeclared tags are marked,** once the page has any declarations.
- **Working tags never appear:** they aren't carried on `data-tags`.

## Attributes

| Attribute | Meaning |
|---|---|
| `slot` | `modes`, to be offered in the shell's mode picker. |
| `heading` | The mode's name in the picker. Default `Tags`. |
| `key` | The mode's key in the shell, instead of **G**. |

## Properties

| Member | Meaning |
|---|---|
| `active` | Whether the mode is on, set by the shell's mode picker. Setting it fires no `sb-mode`. |
| `heading` | The mode's name in the picker. |
| `key` | Read-only. The key it asks the shell for, `g`, since T usually belongs to another mode. |
| `chosen` | The tags kept lit, as a list. Setting it lights them. |
| `match` | `all` or `any`: whether a part needs every chosen tag or one of them. Default `all`. |
| `declarations` | What each tag means, as the tagging practice declares it: `[{ tag, means, replacedBy }]`. Leave it unset to use the page's `TAGS`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-tag-focus` | `{ tags, match }` | The chosen tags or the match changed, and on load when there's a choice to restore. Bubbles to `document`, where the highlighting script hears it. |
| `sb-mode` | `{ mode, active: false }` | The viewer ended the mode, with Stop or Escape. `mode` is the heading. Bubbles, so the shell's picker follows. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-font`, `--sb-radius`, and `--sb-warn`, the amber every mode wears. `--sb-tag-focus` sets the chosen colour, here and in the highlighting script; by default it's a mix of the accent and magenta. Its own custom properties, to set on the element: `--sb-tags-mode-tone` (the amber) and `--sb-tags-mode-chosen`.

Classes: `sb-tags-mode__frame`, `sb-tags-mode__banner`, `sb-tags-mode__words`, `sb-tags-mode__button`, `sb-tags-mode__outline`, `sb-tags-mode__card`, `sb-tags-mode__bar`, `sb-tags-mode__grip`, `sb-tags-mode__body`, `sb-tags-mode__part`, `sb-tags-mode__chosen`, `sb-tags-mode__page`, `sb-tags-mode__title`, `sb-tags-mode__hint`, `sb-tags-mode__meaning`, `sb-tags-mode__means`, `sb-tags-mode__mark`, `sb-tags-mode__chips`, `sb-tags-mode__chip`, `sb-tags-mode__chip--retired`, `sb-tags-mode__count`, `sb-tags-mode__lit`, `sb-tags-mode__switch`, `sb-tags-mode__clear`, `sb-tags-mode__quiet`. The element carries `sb-tags-mode--held` while a part is held.

## Notes

- **Reads one attribute across the page:** `data-tags`, never content, to count and step through what's tagged (see the [modes practice](../../practices/modes.md)).
- **Remembers the choice for the tab,** across reloads and pages, in `sessionStorage`. Where storage is missing or refuses, it works just the same until the page closes.
- **Needs the highlighting script** on the page to light anything, loaded before the mode's element, as the page templates do.
- **Open dialogs:** a modal blocks everything outside it, so the card can't be used while one is open, as with every mode. Chosen tags still light inside it.
- **A part redrawn while held** loses its outline, since it's a new element; the card stays.
- **Top layer:** the frame, outline, card, banner and quiet bar use the browser's popover API, above everything, floating panels included.
- **Not yet:** touch (no pointing: a tap could show), remembering where each viewer put the card.
- **Dependencies:** none. It says what's chosen; it knows nothing of what lights it.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-tags-mode`, the console says so. Replace every `sb-tags-mode` in `sb-tags-mode.js` to give this copy a new name.
