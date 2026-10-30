# sb-notebook

A workshop's sections in one page, in order: a source looked at, a question raised, a quick simulation, a correction, a decision. Each section shows its kind, who it came from and when, and how many codes of each kind it cites. Use it wherever a sandbox keeps a record of people working through a model together: a fire crew's planning session, a site meeting on a building project, a review of a model's rules with the people who know them.

The notebook knows nothing about the domain. The sandbox puts the sections in and describes each with attributes; the notebook shows them, opens the ones that matter and tucks away the asides, and helps people move around and filter a long page. Inspired by the shape of Jupyter notebooks, but nothing runs and nothing is edited in place.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-notebook/sb-notebook.js"></script>

<sb-notebook id="ridge-fire" heading="Ridge fire · afternoon planning">
  <section heading="Will the wind turn before 16:00?" kind="question"
           by="Ana Lima" time="2026-08-14T13:20" relevance="key">
    <p>The crews felt it backing to the south (QST-2).</p>
  </section>
  <section heading="Hold the ridge road" kind="decision"
           by="Ana Lima, Joe Tanaka" time="2026-08-14T13:55" relevance="key">
    <p>We hold the ridge road and pull the crews back from the saddle.</p>
  </section>
  <section heading="Radio channels" kind="discussion" relevance="aside">…</section>
</sb-notebook>
```

```js
notebook.prefixes = { DEC: 'Decisions', QST: 'Questions' };
```

## Sections

Every direct child is a section, in order, and any element can be one. The notebook puts a header bar before each and never changes what's inside. Sections added or removed later are picked up. A section without an `id` is given one, so its bar can point to it.

| Attribute | Meaning |
|---|---|
| `heading` | The section's title. Without one, "Section 3". |
| `kind` | What the section is, as a word: `discussion`, `question`, `decision`, `correction`, `demonstration`, `source`, `summary`, or any word the sandbox uses. Shown as a label, and a filter. |
| `by` | Who it came from, comma-separated. |
| `time` | When, as an ISO date (`2026-08-14`) or date and time (`2026-08-14T13:20`), shown as "14 Aug 2026, 13:20". Anything else is shown as given. |
| `relevance` | `key`: open and marked ★ Key. `aside`: collapsed to begin with. Anything else: open. |
| `ref` | Gives the section's bar `data-ref`, so the section itself can be cited and found. |

**Codes are counted from `data-ref`.** Every element inside a section marked `data-ref` with a code (`PREFIX-…`, as in the [identifiers practice](../../practices/identifiers.md)) counts towards the section's bar ("2 DEC · 1 QST") and the filters. A part of a code (`DEC-5.a`) counts as the code itself; refs that aren't codes are left out. Codes are counted when a section arrives and again on `refresh()`, so call it after a component inside a section draws its parts.

## What it shows

- **A head** with the notebook's title and a summary: "6 sections · 1 collapsed · 4 people", or while filtering "Showing 2 of 6 · Clear". Below it, ▲ and ▼ with the position ("3 of 6"), **Expand all** and **Collapse all**, the filters, and an outline of every section, the current one marked, key ones starred and collapsed ones dimmed. The filters and the outline start closed, and each opens and closes from its heading.
- **Focus mode**, from the icon beside the title, fills the window below the shell's header (`--sb-header-height`) with the sections alone, whatever the page's width. **Exit focus**, floating at the top right, or Esc goes back to the page, the current section still in view.
- **On a notebook at least 760px wide** the head is a boxed column beside the sections, following the page as it scrolls. It sticks below the shell's compact header, if there is one (`--sb-header-height`). Narrower, it's a bar across the top, sticking as the page scrolls.
- **A bar for each section:** its title, ★ Key, kind, who and when, and its code counts. Clicking it collapses or opens the section. A collapsed section shows only its bar, so nothing leaves the order.

## Filters

Choices with a count of the sections each would show alongside the other choices:

- **★ Key only.**
- **Codes,** by prefix, named by `prefixes`.
- **Kinds,** from each section's `kind`.
- **People,** from each section's `by`.

Choosing opens the sections that match and collapses the rest, keeping every bar in place, dimmed when it doesn't match. Within one group, choices widen the match; across groups, they narrow it. Opening or collapsing a section while filtered lasts until the filter changes, and clearing brings back what was open before.

## Attributes

| Attribute | Meaning |
|---|---|
| `heading` | The notebook's title. |
| `focus-mode` | Present while the notebook fills the window. |

## Properties and methods

| Member | Meaning |
|---|---|
| `sections` | The section elements, in order. |
| `current` | `{ index, element }`: the section in view, or last gone to. |
| `goTo(index)`, `next()`, `previous()` | Move as a viewer would: open the section if collapsed, scroll to it, fire `sb-section`. Moving past either end does nothing. |
| `expand(index)`, `collapse(index)`, `expandAll()`, `collapseAll()` | Open or collapse sections, quietly. **Expand all** and **Collapse all** in the head do the same, and fire nothing either. |
| `filter` | `{ codes, kinds, people, key }`: lists of prefixes, kinds and people, and key only. Setting it applies it without firing `sb-filter`; `{}` clears it. |
| `prefixes` | Names for code prefixes in the filters, such as `{ DEC: 'Decisions' }`. Without a name, the prefix is shown. |
| `focusMode` | `true` while the notebook fills the window. Setting it is quiet. |
| `refresh()` | Count the codes in each section again. |
| `reveal(ref, place)` | Open the section holding `place`, an element on the page, or without one the first section holding a part marked `data-ref="ref"` (its bar included). Quiet, and keeps the viewer's filter. Returns `true`, or `false` if no section holds it. |

## Events

All bubble.

| Event | Detail | When |
|---|---|---|
| `sb-section` | `{ index, element }` | A viewer moves to a section: ▲ ▼, the outline, the keyboard, or `goTo`, `next()`, `previous()`. |
| `sb-toggle` | `{ index, element, open }` | A viewer collapses or opens a section by its bar. |
| `sb-filter` | `{ filter }` | A viewer changes the filters, or clears them. |
| `sb-focus-mode` | `{ focusMode }` | A viewer goes into focus mode or out of it, by the button or Esc. |

## Styling

Theme tokens: `--sb-bg` (behind the sections in focus mode), `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-radius`.

Classes: `sb-notebook__head`, `sb-notebook__heading`, `sb-notebook__summary`, `sb-notebook__nav`, `sb-notebook__position`, `sb-notebook__enter` and `sb-notebook__exit` (into and out of focus mode), `sb-notebook__panel-toggle`, `sb-notebook__facets`, `sb-notebook__facet` (`aria-pressed="true"` when chosen), `sb-notebook__outline`, `sb-notebook__entry` (`aria-current="true"` for the current section, `data-collapsed`), `sb-notebook__bar` (`data-open`, `data-key`, `data-relevance`, `data-unmatched`), `sb-notebook__toggle`, `sb-notebook__title`, `sb-notebook__key`, `sb-notebook__kind`, `sb-notebook__who`, `sb-notebook__codes`, and `sb-notebook__section` on each section. A notebook laid out wide has `data-wide`.

## Notes

- **Readability:** a notebook is one workshop. Mark the few sections that matter as `key` and the side talk as `aside`, so someone arriving later sees the decisions first. Split a long series of workshops into a page each (the [pages practice](../../practices/pages.md)).
- **Names and times on every section** turn a page of notes into evidence of who decided what, and when.
- **`data-ref` is the one thing a notebook looks for in its sections.** It never looks at which components are inside; a section's `kind` says what it is.
- **Nothing is remembered between visits.** Opening, collapsing and filtering last until the page reloads.
- **Keyboard:** Alt with ↑ and ↓ moves between sections from anywhere in the notebook; in the outline, ↑ and ↓ alone do.
- **The current section follows scrolling** by hand in a browser; tests don't depend on it.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-notebook`, the console says so. Replace every `sb-notebook` in `sb-notebook.js` (tag, classes and style id all use it) to give this copy a new name.
