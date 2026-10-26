# sb-log

A stream of things that happened, in the order they happened. Use it wherever a sandbox produces occurrences over time: orders and deliveries, events in and out of a processor, turns in a game, steps in a reaction, an agent's reasoning.

The log knows nothing about the domain. The sandbox decides what each entry says; the log shows the stream, keeps it bounded, and lets people look into individual entries.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-log/sb-log.js"></script>

<sb-log limit="200" order="oldest-first"></sb-log>

<script>
  const log = document.querySelector('sb-log');
  log.columns = [{ key: 'direction', label: 'Dir' }, { key: 'topic', label: 'Topic' }];
  log.append({ time: '12:00:01', text: 'OrderPlaced', fields: { direction: 'in', topic: 'orders' }, detail: { id: 42 } });
  log.addEventListener('sb-select', (e) => highlight(e.detail.entry.id));
</script>
```

## Entry

| Field | Required | Meaning |
|---|---|---|
| `text` | yes | The one-line summary. |
| `time` | no | When it happened, already formatted by the sandbox. |
| `tone` | no | `good`, `warn` or `bad`. Coloured with the theme's status tokens. |
| `kind` | no | Any sandbox-defined category. Exposed as `data-kind` for styling. |
| `fields` | no | Structured values, shown when named in `columns`. |
| `detail` | no | Opens inline when the entry is clicked. Objects show as formatted JSON. |
| `id` | no | The sandbox's own identifier, useful when handling `sb-select`. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `limit` | `100` | Keep only the latest N entries. |
| `order` | `newest-first` | Or `oldest-first`, which follows new entries like a terminal unless the viewer has scrolled up. |
| `empty-text` | `Nothing yet.` | Shown when there are no entries. |

## Properties and methods

| Member | Meaning |
|---|---|
| `entries` | Get or set all entries, oldest first. Setting copies the list. |
| `columns` | `[{ key, label }]`: which `fields` to show as aligned columns, after the time. |
| `append(entry)` | Add one entry. |
| `clear()` | Remove every entry. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-select` | `{ entry }` | An entry is clicked, or opened from the keyboard. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-radius`.

Classes: `sb-log__list`, `sb-log__head`, `sb-log__entry` (`--selected`), `sb-log__time`, `sb-log__field`, `sb-log__text`, `sb-log__detail`, `sb-log__empty`. Entries carry `data-tone`, `data-kind`, and `data-has-detail` where they apply, and entries given an `id` carry `data-ref` with it, so a sandbox can find them (see the [locating practice](../../practices/locating.md)).

Give the element a height (for example `max-height: 240px`) so it scrolls.

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** entries with detail are focusable and open with Enter or Space.
- **Renaming:** if another component on the page is already called `sb-log`, the console says so. Replace every `sb-log` in `sb-log.js` (tag, classes and style id all use it) to give this copy a new name.
