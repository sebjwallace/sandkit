# sb-comments

Comments from the people exploring a sandbox, each citing exactly what it's about, sent back as one markdown text. Press Comment, click anything, and write what you think: a question, a correction, an idea, or something unclear. Saved comments gather in a tray, to copy as a prompt for the agent building the sandbox or download as a file to send to whoever asked. Use it wherever a sandbox should collect understanding as well as give it: feedback mid-exploration, or views gathered from the people who know the subject.

The component never searches the page. In comment mode it says where the viewer clicked, and the sandbox answers with the refs there (`refsAt` in the [locating practice](../../practices/locating.md)). What an agent does with the comments it receives is in the [feedback practice](../../practices/feedback.md).

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-comments/sb-comments.js"></script>

<sb-shell heading="Checkout architecture">
  <sb-comments id="feedback" slot="actions"></sb-comments>
</sb-shell>

<script>
  const comments = document.querySelector('sb-comments');
  comments.context = { title: 'Checkout architecture', version: '0.4.0', goal: 'Understand how a shop\'s checkout is built.' };
  comments.snapshot = () => ({ chapter: tabs.selected + 1, step: model.state.time });
  comments.addEventListener('sb-pick', (e) => comments.pick(refsAt(e.detail.x, e.detail.y)));
</script>
```

## The flow

Commenting is a session, with a clear start and a clear end.

1. **Comment** starts it: the page dims a little inside an amber frame, and a banner says "Commenting: click anything to comment on it", with a count, **Cancel** and **Done**. Clicks now pick instead of acting.
2. **A click** fires `sb-pick`; the sandbox answers with `pick`, and the part picked is outlined. Shift-click adds more parts to the same comment.
3. **A box** beside it takes the comment and its kind. Save keeps it, and the session carries on. Escape closes the box, and never ends the session.
4. **Cancel** ends the session and forgets its comments, as if nothing had happened.
5. **Done** ends commenting and opens **Your comments**: edit or delete them, add a general comment, then **Copy as prompt** or **Download**. **Keep commenting** goes back to the session. Its own **Done** clears everything, back to a clean page.

Comments live only in the page: closing or reloading it clears them, so nothing is left behind in the viewer's browser. Keeping them across reloads waits until a sandbox needs it.

## A comment

| Field | Meaning |
|---|---|
| `n` | Its number, shown as `#3`. Numbers only go up, so one is never reused. Numbers are each viewer's own, not codes: the agent receiving comments issues codes (see the feedback practice). |
| `kind` | One of `kinds`. |
| `text` | What the viewer wrote. |
| `refs` | The refs picked, innermost first for each part: what was clicked, then what holds it. Empty for a general comment. |
| `view` | The view of the first part picked, as the sandbox named it. |
| `state` | What `snapshot` returned when the comment was saved, kept as a copy. |
| `author` | The viewer's name, if they gave one in the tray. |
| `time` | When it was saved, as an ISO date and time. |

## What it produces

**Copy as prompt** and **Download** give the same markdown:

```md
# Feedback on Checkout architecture (version 0.4.0)

From Priya, 2026-10-18. Goal: Understand how a shop's checkout is built.

Please read this sandbox's journal practice, address each comment below, and cite the comments you address in the journal entry's **Why**.

## #1 · Correction · CMP-4, CNT-2 · Containers
Payment retries happen here, not in the gateway.
State: chapter 3, step 12.
```

A comment's text stays text: a line that would start a heading or a list is escaped. Where the clipboard is refused or doesn't answer (some `file://` pages and previews), the tray shows the text selected, to copy by hand. Download is a data link, named `feedback-<title>-<date>.md`, so it works offline and in a single-file sandbox.

## Properties and methods

| Member | Meaning |
|---|---|
| `context` | `{ title, version, goal }`, written at the top of the output. Take the version from the journal. |
| `snapshot` | A function returning plain data about the model's state, called when a comment is saved. Optional. |
| `kinds` | The kinds on offer. Default `['question', 'correction', 'idea', 'unclear']`. |
| `active` | Whether a session is on. Setting it fires no `sb-mode`. |
| `pick(picked)` | Answer an `sb-pick` with `{ refs, view, element }`, or `null` when there's nothing to cite; a comment can still be made. |
| `comments` | Get or set every comment. |
| `toMarkdown()` | The output text, for sandboxes that send it elsewhere. |
| `clear()` | Remove every comment, as Cancel and the final Done do; numbering starts again at #1. |

## Attributes

| Attribute | Meaning |
|---|---|
| `slot` | `actions`, to sit in the shell's header. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-pick` | `{ x, y, add }` | The viewer clicked in comment mode, at that point in the window. `add` is true for shift-click. Answer with `pick`. Bubbles. |
| `sb-comment` | `{ comment }` | A comment was saved or edited. Bubbles. |
| `sb-mode` | `{ active }` | The viewer started or ended a session (Comment, Cancel, Done, Keep commenting). Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-font`, `--sb-radius`.

Everything about commenting wears the theme's warning amber (`--sb-warn`), like a reviewer's notes, so it never blends with the sandbox it comments on. Its own custom properties, to set on the element: `--sb-comments-tone` (that colour) and `--sb-comments-dim` (the dimming in comment mode; default a faint translucent black).

Classes: `sb-comments__button` (`--primary`), `sb-comments__count` (in the banner), `sb-comments__dim`, `sb-comments__banner`, `sb-comments__outlines`, `sb-comments__outline`, `sb-comments__box`, `sb-comments__tray`, `sb-comments__head`, `sb-comments__title`, `sb-comments__about`, `sb-comments__kinds`, `sb-comments__text`, `sb-comments__author`, `sb-comments__actions` (`--end`), `sb-comments__list`, `sb-comments__item`, `sb-comments__item-head`, `sb-comments__item-text`, `sb-comments__link`, `sb-comments__note`, `sb-comments__copy-text`, `sb-comments__empty`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **The shell's header,** in `slot="actions"`, so commenting is always a click away.
- **[The locating practice](../../practices/locating.md)** for `refsAt`, and **[the feedback practice](../../practices/feedback.md)** for what the agent does with what's sent.
- **[`sb-xref`](../sb-xref/manifest.md) and [`sb-tour`](../sb-tour/manifest.md):** turn comment mode off when either starts, so clicks act as people expect.

## Notes

- **Picking:** in comment mode the component stops the page's clicks and presses before the page hears them (except on its own parts), so nothing acts by accident. The dimming lets the pointer through, so what's under it can still be found.
- **Top layer:** the dimming, outlines, box and tray use the browser's popover API, above everything, floating panels included.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-comments`, the console says so. Replace every `sb-comments` in `sb-comments.js` to give this copy a new name.
