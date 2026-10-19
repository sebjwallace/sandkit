# Feedback

How a sandbox collects comments from the people exploring it, and what the agent does with them. Read this before adding [`sb-comments`](../components/sb-comments/manifest.md) to a sandbox, and whenever a feedback file arrives.

## Why it matters

Everything else in a sandbox carries understanding one way: from the model to the people exploring it. Feedback carries it back. Someone points at a part, says what they think, and the comment arrives citing exactly what it's about, the version it was made on and the state of the model at the time. Nothing needs guessing, and people who know the subject can correct the model without describing "the third row of the second table".

## Setting up comments

Every sandbox starts with comment mode: the template puts `sb-comments` in the shell's mode picker and wires it once, in `sandbox.js`. It gives the sandbox's title, version and goal, and answers picks with `refsAt` from the [locating practice](locating.md), which the template's `sandbox.js` has without views. To set it up by hand:

```html
<sb-shell heading="Checkout architecture">
  <sb-comments slot="modes"></sb-comments>
</sb-shell>
```

```js
const comments = document.querySelector('sb-comments');
comments.context = { title: 'Checkout architecture', version: '0.4.0', goal: 'Understand how a shop’s checkout is built.' };
comments.snapshot = () => ({ chapter: tabs.selected + 1, step: model.state.time });
comments.addEventListener('sb-pick', (e) => comments.pick(refsAt(e.detail.x, e.detail.y)));
```

- **The version** is the latest entry in the sandbox's `JOURNAL.md`. Keep it in step: a comment is only as useful as knowing what it was made on.
- **The snapshot** holds whatever a comment can't be understood without: the chapter, the step, the scenario. Plain data, kept small.
- **Give the parts people will talk about a ref.** A comment on a part with a ref cites it exactly; one on a part without cites only its view.

Comments live only in the page. A viewer sends them, by copying a prompt or downloading a file, before closing it.

## Receiving feedback

A feedback file, or a pasted prompt, is a source like any other.

1. **Save it unchanged** in the sandbox's `sources/feedback/` folder, named as it arrived (`feedback-checkout-architecture-2026-10-18.md`). A pasted prompt is saved the same way.
2. **Issue a code for each comment you act on,** with the prefix `FB`, from a counter that only goes up, as the [identifiers practice](identifiers.md) describes. Comments arrive numbered `#1`, `#2` by each person's browser; those numbers are theirs, not codes, and two people will both have a `#1`. Record the codes in `sources/feedback/CODES.md`, one line each: `FB-12 = Priya #1, 2026-10-18`. Never reuse a code.
3. **Read each comment against its version.** If the sandbox has moved on since, read the journal entries in between before acting: the comment may already be answered, or be about something that has changed. With Git, the tag for that version shows exactly what the person saw.

## Answering it

- **Each change cites the comments it answers** in the journal entry's **Why**: "FB-12 and FB-13: Priya pointed out that payment retries happen in Payments, not the gateway." See the [journal practice](journal.md).
- **A comment not acted on is still answered.** Record it in the journal entry's **Open**, or in `CODES.md` beside its code, with the reason, so no one wonders whether it was read.
- **Questions that stay open become the sandbox's own,** as `QST-` codes, cited from the comment that raised them.
- **Say which comments an iteration answered** in its handover (see [building a sandbox](building-a-sandbox.md)), so the people who commented see what came of it.

## Confidentiality

Feedback may say things people wouldn't want shared further. Keep it with the sandbox's other sources, and share it as those are shared.
