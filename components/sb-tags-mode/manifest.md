# sb-tags-mode

Tags mode: see what any part of a sandbox is about, and choose topics to keep lit while working. Use it in any sandbox that has opted in to [tagging](../../practices/tagging.md). It lives in the shell's `modes` slot and only chooses; the highlighting script does the lighting.

Use this component through the interface below. You don't need to read its source, or the highlighting practice.

## Usage

```html
<script src="lib/sandkit/shell/sb-highlighting.js"></script>
<script src="lib/sandkit/components/sb-tags-mode/sb-tags-mode.js"></script>
<script src="tags.js"></script>

<sb-shell>
  <sb-tags-mode slot="modes"></sb-tags-mode>
</sb-shell>
```

That's all the wiring there is. It reads `data-tags` from the page, which components put there when given tags, and from `tags.js` what each tag means (`TAGS`) and any presets (`TAG_PRESETS`), as the [tagging practice](../../practices/tagging.md) declares them. Most sandboxes need nothing below.

## What people can do

Started from the shell's mode picker or with **G**, it shows a banner and a card. The card's ✕, Stop or Escape ends it. Clicks don't act on the page while it's on, except on what's marked `data-modes`, in open dialogs and in the card.

- **Point** at a part to see its tags and what they mean. **Click** a part to hold them there.
- **Click a line** in the card to pin a tag: whatever carries it stays lit, after the mode ends too. Open the mode again to see what's pinned, change it or clear it.
- **+ and −** on a line: a tag always comes on as +. − takes away whatever carries it, and with no + tags, takes away from everything tagged.
- **Intersection or Union** combines the + tags: parts carrying every one, the default, or at least one.
- **Presets** set the lines, signs and switch in one click, and show as chosen only while the selection is exactly theirs.
- **Arrow keys** step through what's lit, or everything tagged when nothing is.

**Search**, a second tab, appears when the page gives the mode a way to search (see below):

- **Type a tag's name** to find it: its letters only need to come in order, so `plch` finds `platform-changes`. Enter chooses the best fit. The choice is shared with the first tab, Display, so the page lights it either way.
- **Results** show what the page found for the chosen tags, best first, each with its score, kind and a label. With nothing chosen, they're what's most like what's on the page.
- **Full screen** lists every tag beside every result. Smaller, or Escape, goes back.
- **Pull in** on a result asks the page to bring it here, where the page allows it. A result already on the page says so instead.

The list shows tags people can see here, with counts, most used first. A tag with nothing to see isn't listed unless it's pinned, retired tags are never offered, and undeclared ones are marked. Nothing in the list moves while it's in use. Working tags never appear: they aren't carried on `data-tags`.

## Properties

| Member | Meaning |
|---|---|
| `active` | Whether the mode is on, set by the shell's mode picker. Setting it fires no `sb-mode`. |
| `chosen` | The tags on, as a list. Setting it lights them. |
| `without` | The chosen tags taking away. Only a tag in `chosen` can be one. Setting it lights the result. |
| `match` | `all` (intersection, the default) or `any` (union). |
| `presets` | `[{ name, asks, tags, without, match }]`. Leave it unset to use the page's `TAG_PRESETS`. |
| `declarations` | `[{ tag, means, replacedBy, color }]`. Leave it unset to use the page's `TAGS`. |
| `search` | The page's way to search, which brings the Search tab: `(selection, onPage) → [{ ref, score, kind?, label? }]`, best first. `selection` is `{ tags, match, without }`, or `null` when nothing is chosen; `onPage` lists the refs people can see. Called as the choice changes, while Search is open. Leave it unset for no tab. |
| `pull-in` | Attribute: results offer Pull in, firing `sb-pull`. Leave it off where the page can't take them. |
| `heading`, `key` | Its name in the picker (default `Tags`), and its key (`g`). Set as attributes too, along with `slot`. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-tag-focus` | `{ tags, match, colors, without }`: `tags` the ones adding, `without` the ones taking away, `colors` each one's colour by name | The choice changed, and on load when there's one to restore. Bubbles to `document`. |
| `sb-mode` | `{ mode, active: false }` | The viewer ended the mode, with Stop or Escape. Bubbles, so the shell's picker follows. |
| `sb-pull` | `{ ref }` | The viewer asked for a result to be brought onto the page. Bubbles. The page brings it, or doesn't; once it carries `data-ref` and can be seen, the result says it's here. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-font`, `--sb-radius`. A tag's colour is the `color` in its declaration; without one it gets a fallback for now, usually the same each time, and never one another chosen tag is wearing until the seven run out. Its own custom properties: `--sb-tags-mode-tone` (the outline round what's pointed at, the chosen tab and focus; default `--sb-accent`) and `--sb-tags-mode-chosen`. Classes start `sb-tags-mode__`, such as `card`, `banner`, `list`, `entry`, `sign`, `pin`, `preset`, `tab`, `filter`, `result`, `pull`. Full screen adds `sb-tags-mode--full`.

## Notes

- **Reads one attribute across the page:** `data-tags`, never content (see the [modes practice](../../practices/modes.md)).
- **Remembers the choice for the tab,** in `sessionStorage`. Where storage refuses, it works until the page closes.
- **Open dialogs:** a modal blocks the card while it's open. Chosen tags still light inside it.
- **Top layer:** its outline, card and banner use the browser's popover API.
- **Search** shows eight results in the card and all of them full screen. The tag search practice shows the wiring.
- **Not yet:** touch, remembering where each viewer put the card.
- **Dependencies:** none, though it needs the highlighting script on the page, loaded first, to light anything.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-tags-mode`, the console says so. Replace every `sb-tags-mode` in `sb-tags-mode.js` to give this copy a new name.
