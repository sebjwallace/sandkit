# Journal

How to keep a record of what changed in a sandbox, and why. Read this before changing a sandbox, and keep to it after every iteration.

## Why keep a journal

A sandbox changes a little at a time, steered by the people exploring it. Without a record, the reasons behind each change are lost the moment the conversation ends.

- **Auditability.** Anyone can see how the sandbox reached its current state, and follow the history of any code (`RUL-014`) with the reason for each change.
- **Handover.** Someone arriving fresh, person or agent, can see where things stand without reading everything that came before.

## Two records, two jobs

- **`JOURNAL.md`,** in the sandbox's folder, is the history: one entry per meaningful change, newest first. It is only ever added to, never edited.
- **Where it stands,** in `AGENTS.md`, is the present: the version, the chapters built and planned, the chosen direction and the open questions. It is rewritten at the end of every iteration.

## When to write an entry

After every meaningful change, which in practice means every iteration (see [building a sandbox](building-a-sandbox.md)). Not for exploratory edits that were thrown away: the journal records what the sandbox became, not how you got there.

## Every entry is a version

Each entry raises the sandbox's version, by semantic versioning, as Sandkit's own versions do. A new sandbox starts at `0.1.0`.

| Kind | When | Until 1.0 | From 1.0 |
|---|---|---|---|
| **Breaking** | Something someone may have cited no longer holds: a code was retired, renamed, split or merged, or the model now behaves in a way that changes what people would conclude. | `0.2.4` → `0.3.0` | `1.2.4` → `2.0.0` |
| **Added** | New codes, chapters, components, sources or behaviour, with nothing existing broken. | `0.2.4` → `0.2.5` | `1.2.4` → `1.3.0` |
| **Fixed** | Wording, styling or corrections that change no meaning. | `0.2.4` → `0.2.5` | `1.2.4` → `1.2.5` |

**Is it breaking?** Ask: could anything someone has cited, shared or concluded now be wrong or missing? If so, it's breaking.

The version identifies the entry, so cite it like a code: "the reorder rule was split in 0.3.0".

## The entry

```md
## 0.3.0 · 2026-10-18 · Breaking

**Changed:** Split the reorder rule (RUL-014) into two: below the reorder point (RUL-020) and after a stock-out (RUL-021). Added QST-009.
**Why:** The person saw stores reorder twice after a stock-out and pointed out these are two different behaviours. Source: their comment in this session.
**Retired:** RUL-014 → RUL-020, RUL-021.
**Open:** QST-009, whether the stock-out reorder skips the usual lead time.
```

- **Heading:** version · date · kind (`Breaking`, `Added` or `Fixed`).
- **Changed** (required): what changed, citing every code touched.
- **Why** (required): the reason, and what prompted it: the person, a source (`SRC-`), comments they sent (`FB-`, see the [feedback practice](feedback.md)), a contradiction, or your own finding.
- **Retired** (only if any): each retired code and what replaced it, or "removed" if nothing did.
- **Open** (optional): questions or doubts the change leaves.

Keep entries short. They record reasons, not a narration of the work; Git, where there is one, holds the line-by-line changes.

## Retiring a code

Codes are stable and never reused ([identifiers](identifiers.md)), so a code that goes away is retired, never silently deleted. Someone may still have it in their notes, or a pill may still show it.

1. **Record it in the model,** beside the things the codes name:
   ```js
   retired: [
     { id: 'RUL-014', in: '0.3.0', replacedBy: ['RUL-020', 'RUL-021'] },
   ],
   ```
2. **Answer for it in `sb-resolve`,** so its pill explains itself instead of showing as unresolved:
   ```js
   document.addEventListener('sb-resolve', (e) => {
     const thing = model.find(e.detail.code);
     if (thing) { e.detail.definition = { kind: thing.kind, title: thing.name, description: thing.summary }; return; }
     const gone = model.retired.find((r) => r.id === e.detail.code);
     if (gone) e.detail.definition = {
       kind: 'Retired',
       title: `Retired in ${gone.in}`,
       description: gone.replacedBy.length ? `Replaced by ${gone.replacedBy.join(', ')}.` : 'Removed.',
     };
   });
   ```
3. **Name it in the entry's Retired line.** That makes the entry breaking.

## Git

If the sandbox's folder is a Git repository, commit after writing each entry: one entry, one commit, holding both the change and its entry. Start the subject with the version (`0.3.0: Split RUL-014 into RUL-020 and RUL-021`), and tag breaking versions (`v0.3.0`).

Without Git, everything else still works. Don't set it up unless the person asks.

## Reading it as a newcomer

1. **The goal,** at the top of `index.html`.
2. **Where it stands,** in `AGENTS.md`.
3. **The journal,** newest first, only as far back as you need.

To trace a code's history, search the journal for it.

## Adding a journal to an existing sandbox

Create `JOURNAL.md` with the header from Sandkit's template and a first entry recording the sandbox as it stands: its version (`0.1.0` if it has none), what's built, and what's open. Add the Where it stands section to `AGENTS.md`, then carry on as above.
