# Domain discovery

How a sandbox discovers a domain on purpose, one iteration at a time, keeping a record of what was learnt as cards and growing a working model alongside it. Read this when a sandbox is for finding out how something works, rather than showing what's already known, and before using [`sb-discovery-card`](../components/sb-discovery-card/manifest.md) or [`sb-discovery-board`](../components/sb-discovery-board/manifest.md).

## Why it matters

Discovery is a loop. People gather material from the world, interpret it into claims, definitions and observations, notice what they're assuming and what's still open, decide where to go, and act. Then the world answers, and the loop goes round again.

Alongside the loop, a model of the domain is written as real code, founded on what's been learnt and tested against scenarios and rules that come from the same material. The sandbox is where the model runs, so experiments on it are instant and free of risk, and a prediction can be put in doubt before the world has to answer it.

The record makes it trustworthy. Every card says what it rests on, nothing is overwritten, and anyone can step back to an earlier iteration and see what was known and decided then.

## Cards

Everything discovery records is a card with a code, whose prefix names its kind (see [identifiers](identifiers.md)).

- **Cards are never edited.** A later card supersedes or tests an earlier one. Whatever follows from the cards (a claim's standing, a decision under review, a test met) is worked out by the sandbox for each iteration, never written by hand, so the iterations stay an audit trail.
- **Source material versus cards: outside and inside.** Source material comes from outside the sandbox, brought in by people or the agent: documents, articles, web pages, data, images, even the part of a chat where someone says how things work. It's kept and screened as the [sources practice](sources.md) describes. Cards are written inside the sandbox, by the agent or a person, from that material: an observation or a claim resting on a source's passages, never a source itself.
- **Screen before deriving.** Never write a card from material that hasn't been screened, and never quote into a card what screening cleared out.
- **Every card records its own making** (in its record; see Records): `created` (when), `by` (`Agent` or the person) and `iteration` (the one it was raised in). Add whatever else is worth keeping as `meta`: the rows an observation was read from, the model a run tried, the version a piece of feedback was made on. Source material carries its own details in the catalogue; cards carry theirs.
- **A card rests on passages,** not whole sources: the words it cites, with whether they say yes, no or ask.
- **A new kind earns its place** only with parts or connections the others lack. Prefer a variant of an existing kind.

## Setting up

A discovery sandbox uses the card, the board and the engine, beside whatever else its subject needs. With Node:

```sh
node <sandkit>/tools/setup.mjs <sandbox-folder> sb-discovery-card sb-discovery-board discovery
```

## Records

What the agent or a person writes is kept as records, in the sandbox's `records/` folder, beside `sources/`:

```
sources/   what came in from outside: documents, data, chats; screened and catalogued
records/   what was written inside, from it: one script per kind
  claims.js, questions.js, decisions.js, …
```

- **A record holds only what someone wrote:** the claim and the passages for and against it, the options a decision weighed and what it rests on, a scenario's steps and code. Never a standing, a status or anything else that follows: those are worked out (see "Weighing claims" and the statuses in "The kinds").
- **Every record carries its making:** `created` (`yyyy-mm-ddThh:mm`), `by` (`Agent` or the person) and `iteration`, and anything else worth keeping in `meta`. These names are reserved: a kind's own fields use others (a prediction's deadline is `due`, an investigation's investigator `who`).
- **One script per kind,** each setting its list, as the [pages practice](pages.md) keeps data, so a page opened from disk reads them; a page includes the kinds it shows.
- **Records are never edited.** A record that's wrong or out of date is superseded by a new one, which names it.

## The kinds

**What we know**

Every status below is worked out by the [discovery engine](../engines/discovery/manifest.md) (`discovery.status`), never written in a record.

| Prefix | Kind | What it is | Status, worked out |
|---|---|---|---|
| SRC | Source | Material gathered from the world, catalogued as a source. | – |
| INV | Investigation | Learning on purpose by finding what's already there; prompted by a question, assumption or prediction, it gathers sources. | under way, done |
| OBS | Observation | A reading taken straight from a source, often data: a metric's reading, an experiment's result, a test of an assumption (+ or −). | – |
| MET | Metric | A quantity tracked over time. Goals set targets on it; observations are its readings. | its latest reading |
| CLM | Claim | A statement about how things are, with passages for and against. | standing (see below) |
| DEF | Definition | What a word in the domain means, set in a source. | – |
| OPN | Opinion | A view someone holds, said in a source. | – |
| INF | Inference | A conclusion reasoned from premises. | sound, shaken when a premise changes |
| ASM | Assumption | Taken as true without evidence, so it can be tested. | untested, confirmed, refuted |
| QST | Question | Something open, raised in a source, answered by sources. | unresolved, answered |
| FB | Feedback | What someone who knows the domain said of the model, on one version (see below). | open, answered, declined |
| NEXT | Awaited | Material asked for and not yet arrived: what it's for. | – |

**Where we're going**

| Prefix | Kind | What it is | Status, worked out |
|---|---|---|---|
| OUT | Outcome | What actually happened, measured against a goal or prediction. | worked, partly, failed |
| GOL | Goal | Where we're trying to get to, as a target on a metric. | on track, off track |
| PRD | Prediction | A decision's bet on what it will bring about, by when. | pending, supported or in doubt, borne out, partly, not borne out |
| AGR | Agreement | Terms between parties: a standard, protocol or contract, changed only with them. | in force |
| CON | Constraint | Something that rules options out: how firm, what it rules out, where it comes from, what it protects. | holds |
| DEC | Decision | A question, the options weighed, the one chosen, the reason, who decided, what it rests on. | accepted, review when something it rests on changed after it was decided |
| EXP | Experiment | A test run on purpose, on the world or on the model, with what would bear it out written first. | planned, done |
| ACT | Action | Something to do, brought about by a decision. | to do, done |
| RSK | Risk | Something that might go wrong, brought about by a decision. | open |

**What we're building**

| Prefix | Kind | What it is | Status, worked out |
|---|---|---|---|
| ENT | Entity | A thing in the domain with identity, state and behaviour, proposed with a name, a purpose and what it's founded on. | proposed, trying, integrated, rejected |
| PRM | Domain primitive | A small value with constraints and no behaviour. | as an entity |
| SCN | Scenario | Given, When, Then, founded on cards, with code that plays it on the model. | met, not met |
| RUL | Rule | A mandate or a condition, founded on cards, with code that checks it on the model. | met, not met |
| RUN | Run | Every scenario and rule against one version of the model, or one candidate. Worked out, never written. | for a trial: earns its place, not yet |

## Iterations

- **An iteration lists the sources that arrived and the cards raised in it.** The first holds whatever no later one claims.
- **A card that changes appears again** in the iteration that brought new material for it, as its updated self: "updated: new material arrived".
- **Cards an iteration's cards rest on are carried in** as they last stood: "carried from iteration 1".
- **Every card is shown as of the iteration on screen.** A claim is weighed only on the sources that had arrived by then.
- **End each iteration with a handover** offering a few directions, as [building a sandbox](building-a-sandbox.md) describes.

## Weighing claims

A claim never gets a verdict by hand. The [discovery engine](../engines/discovery/manifest.md) weighs it from its passages (`discovery.weigh`), by these rules:

- **Grades.** Each source carries an authored grade in the catalogue: a value from 1 to 5 and the reason for it, with any aspects that matter in this subject (see the [sources practice](sources.md)). Grade it when you catalogue it, and say why. A source not graded yet weighs 3, and its passages say so.
- **In scope:** only sources that speak to how things are count. One that says what should be, such as a plan, shows but doesn't count.
- **Copies count once:** a source repeating another counts as the one it repeats.
- **Standing:** corroborated (two or more independent yeses), single source, contested (yeses and noes), refuted (only noes), unbacked.
- **Score:** the grade of each independent yes, less each no.
- **Basis:** observed (data or an image), reported (first-hand), inferred (only an analysis), conjecture, or assumption once something rests on it.

## Building the model

- **The model speaks the domain's words.** Every entity and domain primitive is founded on a definition of its name; one without is flagged. Borrow from domain-driven design where it fits, never by reflex.
- **A proposal is tried as a candidate model,** and its run compares it with the model as it stands: tests newly met, tests broken. It earns its place if it meets something new and breaks nothing.
- **Integration is a decision for people.** The run recommends; a decision card brings about the next version of the model, or rejects the proposal with the run's reasons. Every version is kept, so every run can be repeated.
- **What a test exercises comes from running it,** watching which parts it made, called and read, never from a list.
- **Count the model's real choices** (each `if`, `case`, `&&`, `||`, `??` and `?:`) and tests met per choice, as evidence for people, never a target. A model that meets new tests on arrival, with no change, predicts; one tuned to its tests doesn't.

## Feedback

People who know the domain try the prototype or a run and say what they think. Their comments arrive as a feedback file, saved as source material (see the [feedback practice](feedback.md)). Each comment you act on becomes a feedback card: its `FB-` code, who said it, what it's about (a part of the model or the prototype), the model version and state it was made on, whether it says the model works or is wrong, and the passage. Answer it with what came of it, most often a scenario or rule founded on it, so their expectation becomes a test. A comment not acted on is declined, with the reason.

## Showing cards

[`sb-discovery-card`](../components/sb-discovery-card/manifest.md) draws one card, compact on a board, normal, or expanded in a modal. It works nothing out: the sandbox prepares each card as of the iteration shown (status, badges, strips, folds, notes) and sets it again when the iteration changes.

- **Lead with the main strip,** so a card reads in one line; supporting facts after; what it rests on in folds.
- **Sources are only ever compact cards.** Opened, a source is the material itself: answer `sb-open` on a source by showing it in [`sb-source`](../components/sb-source/manifest.md), and on a passage by going to the passage it quotes.
- **Open other cards expanded,** in [`sb-modal`](../components/sb-modal/manifest.md).
- **Route pointing both ways.** Cards announce `sb-highlight` for what's pointed at; route it to every card's `highlight`, so a source lights up wherever it's cited (see [highlighting](highlighting.md)).

## Boards

Each iteration is laid out on three boards in [`sb-discovery-board`](../components/sb-discovery-board/manifest.md), with the cards on them drawn compact. People switch between the boards and step between iterations.

| Board | Columns, in order |
|---|---|
| What we know | Gathered (sources, and finished investigations beside them), Captured (observations), Interpreted (metrics, claims, definitions, opinions, feedback), Reasoned (inferences), Assumed, Open (questions), Under way (investigations still looking), Awaited |
| Where we're going | Rests on (what a decision rests on from What we know, folded), In force (outcomes, goals, predictions, agreements, constraints standing), Decided, Brought about (experiments, actions, risks, and what a decision brought about in this iteration), Awaited |
| What we're building | Founded on (folded), Proposed, Trying, Integrated, Runs, Met, Not met yet, Rejected |

- **Columns hold a card's role in the iteration, not its kind.** An investigation is under way until a source it gathered arrives, then gathered; a prediction is brought about in the iteration its decision made it, and in force after.
- **Links are signal, not noise.** Every link answers a question: what supports or disputes a claim, what shaped a decision or what it brought about, what a part is founded on. Label each with what it means ("supports", "rests on", "brought about"). What brought a card about is linked only in the iteration where it did; afterwards it stands in force, and that history stays on the card.
- **Tone links by what they mean,** so a chain reads before its labels do: what supports, answers or bears out in `good`; what disputes, refutes or puts in doubt in `bad`; what rests on an assumption or constrains in `warn`; bookkeeping, such as gathered, captures or informs, `muted`; the rest the default accent.
- **A grounding column holds only cards linked to the board's own,** folded, and links between two grounding cards are left out.
- **Set the board again for each iteration:** its cards (compact, `openable`, as of that iteration), its columns and its links. Carried cards keep the `carried` mark.
- **Fold cards with their column,** so a folded column shows each card's icon and code:
  ```css
  .sb-discovery-board__column--folded .sb-discovery-card__compact > :not(.sb-discovery-card__compact-head),
  .sb-discovery-board__column--folded .sb-discovery-card__compact-head > :not(.sb-discovery-card__icon, .sb-discovery-card__id) { display: none; }
  ```
- **Opening and pointing are the cards'.** Answer their `sb-open` as above. Route `sb-highlight` to the board's `highlight` as well as every card's, and call the board's `reveal` from `goTo` (see [locating](locating.md)).
