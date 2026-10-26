# sb-person

A person as a badge: an icon in a circle, their name and their role. Use it wherever a sandbox shows people: who owns a part, wrote a source or is on call; the roles in a process; who answered, decided or changed something. An AI agent taking part has a dashed circle, so people and agents are told apart at a glance.

Given a `ref`, a badge takes part in highlighting: pointing at it lights up every badge for the same person on the page, so one person's contributions can be followed through a long page.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-person/sb-person.js"></script>

<sb-person ref="priya" name="Priya Shah" role="Environment agency engineer"></sb-person>
<sb-person ref="agent" name="Agent" role="AI assistant" agent></sb-person>
```

Keep the sandbox's people in one list, and draw every badge from it, so each person has one `ref` everywhere:

```js
const PEOPLE = [{ id: 'priya', name: 'Priya Shah', role: 'Environment agency engineer' }];
const badge = (p) => Object.assign(document.createElement('sb-person'), { ref: p.id, name: p.name, role: p.role });
```

## Attributes and properties

Each attribute has a property of the same name.

| Member | Meaning |
|---|---|
| `name` | The person's name. |
| `role` | What they are in this sandbox, such as "Insurer" or "Farmer upstream". Optional. |
| `ref` | Identifies the person across the page, for highlighting. Carried as `data-ref`. |
| `agent` | Marks an AI agent rather than a person: a dashed circle. |

Long names and roles are cut short with an ellipsis; the full text shows on hover.

## Highlighting

Follows the [highlighting practice](../../practices/highlighting.md):

| Announces | Lights up |
|---|---|
| its `ref`, while pointed at, and `null` on leaving | itself, when its `ref` is announced |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-font`.

Classes: `sb-person__badge`, `sb-person__icon`, `sb-person__text`, `sb-person__name`, `sb-person__role`. The element carries `sb-person--agent` and `sb-person--highlighted` when they apply, and `data-ref` with its `ref`, so a sandbox can find every badge for a person (see the [locating practice](../../practices/locating.md)).

## Notes

- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** the badge's text is its name and role; it isn't focusable, as it does nothing when clicked.
- **Renaming:** if another component on the page is already called `sb-person`, the console says so. Replace every `sb-person` in `sb-person.js` (tag, classes and style id all use it) to give this copy a new name.
