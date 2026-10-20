# sb-handoff

Handing something over to the agent and showing what comes back. When people exploring a sandbox want something from the agent, such as an answer the model can't give, a new scenario, a check on a doubtful reading or a look at a poll's results, the hand-off turns it into one precise prompt to copy, shows that prompt on the page, and shows the agent's reply once the sandbox has it. It says where things stand: not yet sent, sent and waiting, or replied.

The same piece serves everything a sandbox sends, so people learn the round trip once.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-handoff/sb-handoff.js"></script>

<sb-handoff heading="Ask the agent" disabled waiting-text="Reveal the answers first."></sb-handoff>

<script>
  const handoff = document.querySelector('sb-handoff');
  handoff.prompt = () => [
    '# Prediction PRD-1 · Evening demand · model 0.1.0',
    poll.describe(),
    'For each miss, say whether the person or the model needs work. Write your reply into replies.js under PRD-1.'
  ].join('\n\n');

  poll.addEventListener('sb-reveal', () => { handoff.disabled = false; });
  if (REPLIES['PRD-1']) handoff.reply = REPLIES['PRD-1'];   // written back by the agent, loaded as a script
</script>
```

## The round trip

1. **Copy as prompt.** People press it; the prompt is shown on the page at once and copied to the clipboard alongside. The hand-off fires `sb-copy`.
2. **The agent replies.** Whoever is driving pastes the prompt to the agent, which writes its reply where the prompt says, as data, never as page code: for example `replies.js`, a script setting `const REPLIES = { 'PRD-1': { time, text } }`.
3. **The reply shows.** The page loads the replies and sets `reply`. The status says when it came.

A sandbox can keep each reply as a source too, following the [sources practice](../../practices/sources.md), so what the agent said is on the record.

## Attributes and properties

| Member | Meaning |
|---|---|
| `prompt` | The prompt: text, or a function returning it. A function is called when people copy, so the prompt is always current. |
| `reply` | The agent's reply, `{ time, text }`, or `null` before one is in. `time` as `yyyy-mm-ddThh:mm` shows as "10:35". |
| `status` | Read only: `ready` (nothing sent yet), `sent` (copied, no reply yet) or `answered`. |
| `reset()` | Back to nothing sent, for a new round. The reply stays until the sandbox clears it. |
| `heading` | What the hand-off is for, such as "Ask the agent". Attribute. |
| `disabled` | Not ready to send, such as before a poll is revealed. Attribute or property. |
| `waiting-text` | What it says while disabled. Attribute. Default "Not ready to send yet." |

## Slots

| Slot | Where it goes |
|---|---|
| `slot="agent"` | At the start of the hand-off, saying who replies. A badge suits it. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-copy` | `{ text }` | People press Copy as prompt. The text is what was copied. Bubbles. |

## What it shows

- **The head:** who replies (the slot), the heading, and the status: "Not yet sent to the agent.", "Sent to the agent. Waiting for its reply." or "Replied at 10:35."
- **Copy as prompt,** then **Copy again** once sent, and **Show the prompt** or **Hide the prompt**. After copying, a note says whether the clipboard took it, or to copy it from the page.
- **The prompt,** on the page once copied, so it can always be copied by hand.
- **The reply,** below, once set.

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-radius`, `--sb-font`.

Classes: `sb-handoff__head`, `sb-handoff__who`, `sb-handoff__heading`, `sb-handoff__status` (carries `data-status`), `sb-handoff__actions`, `sb-handoff__button` (`--quiet`), `sb-handoff__copied`, `sb-handoff__prompt`, `sb-handoff__reply`. Buttons carry `data-action`: `copy` or `show`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-poll`](../sb-poll/manifest.md):** build the prompt from `poll.describe()`, enable the hand-off on `sb-reveal`, and put the agent's reply to each answer in the poll's `notes`.
- **[`sb-person`](../sb-person/manifest.md)** with `agent`, in the `agent` slot.
- **[`sb-choice`](../sb-choice/manifest.md),** for a reply that drafts a decision: show the draft on an editable card, and let the group decide.

## Notes

- **Write prompts that say where the reply goes,** and what shape it takes, so the agent's answer lands as data the page can load.
- **Keep it cheap:** one hand-off per round of questions, rather than one per answer.
- **The clipboard is never waited on.** It can hang when the page isn't focused, and the prompt is on the page anyway.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-handoff`, the console says so. Replace every `sb-handoff` in `sb-handoff.js` (tag, classes and style id all use it) to give this copy a new name.
