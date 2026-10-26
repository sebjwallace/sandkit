# sb-source

One source, with the passages the model cites marked where they are. Use it wherever a sandbox rests on source material: an interview behind a rule, the page of a policy behind a figure, the part of a plan behind an entity. People see the very words a claim rests on, and a citation that has drifted from its source shows up as not found.

The source is shown as a sheet of paper, apart from the card of what's known about it, so ground truth never blends into the sandbox around it. Text, Markdown, data, code, images and PDFs are shown; anything else gets a link. It follows the [sources practice](../../practices/sources.md), which says how sources are catalogued and cited.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-source/sb-source.js"></script>

<sb-source></sb-source>

<script>
  const view = document.querySelector('sb-source');
  const entry = catalogue.sources.find((s) => s.id === 'SRC-3');
  view.source = entry;
  view.content = await (await fetch(entry.path)).text();   // text; for images and PDFs: view.url = entry.path
  view.passages = model.items.flatMap((item) => item.sources
    .filter((c) => c.source === entry.id).map((c) => ({ id: item.id, ...c })));
  view.current = 'RUL-014';
  view.addEventListener('sb-passage', (e) => console.log('Named', e.detail));
</script>
```

The page loads the file and hands it over; the component never fetches. Reading the sandbox's files needs it served (see the practice).

## Data

**`source`** is the source's catalogue entry. Every field is optional apart from `id`; only those given are shown.

| Field | Shown as |
|---|---|
| `id`, `title` | The code and title. |
| `format`, `path` | The format badge (`transcript · txt`), and the path at the top of the paper. The path's extension also says how text is set: data and code in fixed-width type, Markdown lightly styled, anything else as a document. |
| `summary` | A line under the title. |
| `author`, `authored`, `captured`, `status`, `stance`, `role`, `respondsTo`, `sensitivity` | Labelled details. The status has a coloured dot (`inbox`, `catalogued`, `reviewed`, `superseded`); a `confidential` sensitivity is shown in red. |
| `supersedes`, `derivedFrom` | "Supersedes SRC-1 · Derived from SRC-2, SRC-3". |

**`passages`** are what to mark, each named by the `id` of what cites it, with the citation's own fields:

| Passage | For |
|---|---|
| `{ id, quote }` | Text: marked wherever the words appear, whitespace and capitals aside. |
| `{ id, region }` | An image: `[x, y, width, height]` as fractions of the image, drawn as a box. |
| `{ id, page, quote }` | A PDF: listed with its page, and opened there. |

`label` names a passage on the page in place of its `id`. Several passages can share an `id`; overlapping ones share the words they overlap.

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `expanded` | off | Shows all the text, with the passages still marked. Otherwise only the cited lines show, each with the written line before it and every less indented line above it (so a field in JSON or YAML keeps the structure it sits in), and other runs of lines fold into gaps (`⋯ 12 lines`) a viewer can open. Viewers switch it with Show all in the paper's top line. |

## Properties and methods

| Member | Meaning |
|---|---|
| `source` | The catalogue entry. Without one, the component says "Choose a source to see it here." |
| `content` | The source's text, shown exactly as the file is: never as markup, never re-laid out, so a quote copied from it is in the file. Setting it folds any gaps a viewer opened. |
| `url` | Where an image, PDF or other file opens, when there is no `content`. |
| `passages` | The passages to mark. Setting them folds any opened gaps again. |
| `current` | The id of the passage to go to: scrolled to and outlined, or the PDF opened at its page. `null` for none. |
| `highlight` | Passage ids to light up: `['RUL-014']`. |
| `expanded` | Whether all the text shows. Mirrors the attribute. |
| `found`, `missing` | The passages shown, and those that can't be: a quote not in the text, or an image's passage without a region. Read-only. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-passage` | `{ source, quote }`, `{ source, region }` or `{ source, page, quote }` | A viewer names a passage: by selecting words, dragging across an image, or typing a quote and page for a PDF. Naming never changes anything itself. Bubbles. |
| `sb-point` | `{ id }`, `id` `null` when pointing stops | A viewer points at another passage (hover or focus). Bubbles. |
| `sb-toggle` | `{ expanded }` | A viewer shows all the text, or folds it back. Bubbles. |

## What it shows

- **Not found, never hidden.** Quotes not in the text are listed in red on the card, with their words, as citations to fix; an image's passages without a region likewise. The card counts what was found.
- **PDFs** open in the browser's own viewer. Text inside it can't be searched or selected from the page, so the card lists each passage with its page as not checked; clicking one opens the viewer there, and a small form names a passage by hand.
- **Markdown** has its headings, lists, quotes, code and emphasis styled, with the marks themselves dimmed but kept, so what shows is still exactly the file and a selection still quotes it.
- **Full screen.** The button in the paper's top line shows the paper alone; Escape brings it back. Setting `source`, `content`, `url` or `passages` redraws the paper, which ends full screen; `highlight`, `current` and `expanded` don't.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-bg`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`, `--sb-font`. Its own: `--sb-source-paper` (the paper's colour, warm by default), `--sb-source-font` (the typeface for documents, a serif by default) and `--sb-source-fold` (the folded corner's size, `20px`).

Classes: `sb-source__head` (the card), `sb-source__id`, `sb-source__name`, `sb-source__format`, `sb-source__summary`, `sb-source__fields`, `sb-source__status` (`--inbox`, `--catalogued`, `--reviewed`, `--superseded`), `sb-source__sensitivity`, `sb-source__links`, `sb-source__count`, `sb-source__missing`, `sb-source__cited`, `sb-source__pick`, `sb-source__desk`, `sb-source__sheet`, `sb-source__page` (the paper), `sb-source__running` (its top line), `sb-source__path`, `sb-source__toggle`, `sb-source__full`, `sb-source__body`, `sb-source__text` (`--code`), `sb-source__md-*`, `sb-source__passage` (`--lit`, `--current`), `sb-source__label` (`--lit`), `sb-source__region`, `sb-source__gap`, `sb-source__fold`, `sb-source__figure`, `sb-source__image`, `sb-source__pdf`, `sb-source__note`, `sb-source__empty`.

The root carries `data-ref` with the source's id, and each mark and box carries `data-ref` with its passage's id (the shorter one, where passages overlap), so a sandbox can find them (see the [locating practice](../../practices/locating.md)).

Give the element a height (for example `height: 600px`) so the paper scrolls within it, or leave it to grow with its content.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets. The source's files are the sandbox's, loaded by the page.
- **Trust:** sources aren't trusted, so their text, titles and every other field are only ever shown as text.
- **Accessibility:** labels can be reached with Tab and announce their passage; gaps, the toggle and full screen are buttons.
- **Renaming:** if another component on the page is already called `sb-source`, the console says so. Replace every `sb-source` in `sb-source.js` (tag, classes, tokens and style id all use it) to give this copy a new name.
