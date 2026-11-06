# Domain discovery

How a sandbox discovers a domain on purpose, one iteration at a time, keeping a record of what was learnt as cards and growing a working model alongside it. Read this when a sandbox is for finding out how something works, rather than showing what's already known, and before using [`sb-discovery-card`](../components/sb-discovery-card/manifest.md) or laying cards out in [`sb-lineage`](../components/sb-lineage/manifest.md).

## Why it matters

Discovery is a loop. People gather material from the world, interpret it into claims, definitions and observations, notice what they're assuming and what's still open, decide where to go, and act. Then the world answers, and the loop goes round again.

Alongside the loop, a model of the domain is written as real code, founded on what's been learnt and tested against scenarios and rules that come from the same material. The sandbox is where the model runs, so experiments on it are instant and free of risk, and a prediction can be put in doubt before the world has to answer it.

The record makes it trustworthy. Every card says what it rests on, nothing is overwritten, and anyone can step back to an earlier iteration and see what was known and decided then.

## What's fixed and what's yours

The kinds of card, the records and the rules that work things out from them are the method, and the [discovery engine](../engines/discovery/manifest.md) holds those rules. How the cards are laid out is yours. The boards below are a recommended way to follow the whole loop, and a good place to start, but a sandbox following something narrower, such as its scenarios, or showing things another way, lays out its own: other boards, columns, lists or timelines. The engine, the card and the board work the same whichever you choose.

## Cards

Everything discovery records is a card with a code, whose prefix names its kind (see [identifiers](identifiers.md)).

- **Cards are never edited,** except for their tags (see Tags). A later card supersedes or tests an earlier one. Whatever follows from the cards (a claim's standing, a decision under review, a test met) is worked out by the sandbox for each iteration, never written by hand, so the iterations stay an audit trail.
- **Source material versus cards: outside and inside.** Source material comes from outside the sandbox, brought in by people or the agent: documents, articles, web pages, data, images, even the part of a chat where someone says how things work. Nothing goes in without the person's say-so: propose what you'd bring in, above all from the chat, and add it only once they agree. It's kept and screened as the [sources practice](sources.md) describes. Cards are written inside the sandbox, by the agent or a person, from that material: an observation or a claim resting on a source's passages, never a source itself.
- **Screen before deriving.** Never write a card from material that hasn't been screened, and never quote into a card what screening cleared out.
- **Every card records its own making** (in its record; see Records): `created` (when), `by` (`Agent` or the person) and `iteration` (the one it was raised in). Add whatever else is worth keeping as `meta`: the rows an observation was read from, the model a run tried, the version a piece of feedback was made on. Source material carries its own details in the catalogue; cards carry theirs.
- **A card rests on excerpts,** not whole sources: the pieces of a source it cites, with whether they say yes, no or ask. An excerpt is picked out once and cited by its code wherever it's used (see Records).
- **A new kind earns its place** when people would name it so and it isn't an existing kind under another name: a problem and its solution are kinds, since people set them out that way, but evidence is an excerpt or observation cited, and a concern a risk or an opinion. Prefer a variant of an existing kind for anything else.

## Setting up

A discovery sandbox uses the card, a lineage for its boards and the engine, and opens cards in [`sb-modal`](../components/sb-modal/manifest.md) and sources in [`sb-source`](../components/sb-source/manifest.md), beside whatever else its subject needs.

**Discovery has a page of its own, by default.** The sandbox's other pages stay as they are, and discovery sits beside them, linked from the header like any page (see the [pages practice](pages.md)). Call it `discovery.html` unless the person prefers another name, such as `workbench.html` or `foundry.html`, or wants it somewhere else entirely; it's theirs to choose. To add it:

1. Copy `lib/sandkit/templates/page.html` to `discovery.html`.
2. List it in `sandbox.js`'s `pages`, so the header links to it: `{ href: 'discovery.html', title: 'Discovery' }`.
3. Add the components and the engine to that page. With Node:

   ```sh
   node <sandkit>/tools/setup.mjs <sandbox-folder> sb-discovery-card sb-lineage sb-modal sb-source discovery --page discovery.html
   ```
4. Add a script tag for each of `records/`'s files to the page, after `model.js`.
5. Record it under **Practices followed** in the sandbox's `AGENTS.md`, with the page's name, so the next agent knows.

- **Where things live:** sources in `sources/`, records in `records/` (below), and the model in `model.js`: its classes, every version and candidate as `MODEL = { versions, candidates }` for the engine, and any helpers its scenarios and rules use to build things. It needs no `createModel` or `ITEMS`: the engine runs it, and the records cite the sources.
- **Serve it.** The engine weighs claims on the grades in `sources/catalogue.json`, which a page can read only when served (`node lib/sandkit/tools/serve.mjs .`). Say so whenever you tell someone how to open it.

## Records

What the agent or a person writes is kept as records, in the sandbox's `records/` folder, beside `sources/`:

```
sources/   what came in from outside: documents, data, chats; screened and catalogued
records/   what was written inside, from it: one script per kind
  tags.js, excerpts.js, claims.js, questions.js, decisions.js, contracts.js, …
```

- **Excerpts are the pieces of sources that records cite,** each picked out once as a record of its own, so a passage can be pointed at, traced and carried on its own, whatever its format. Its code is its source's and a number (`SRC-2.3`), and it says where it is in the source, as the [sources practice](sources.md) anchors a citation: the words (`quote`), a page (`page`), a region of an image (`region`) or rows of data (`rows`). They're listed in `records/excerpts.js` as `const EXCERPTS = [...]`, which `tools/sources.mjs check` reads to make sure each is where it says. Every citation names an excerpt: a claim's assertions are `{ 'SRC-2.3': '+' }`, and `raisedBy`, `answers`, `setIn`, `at`, `said` and `sources` hold excerpt codes. The [discovery engine](../engines/discovery/manifest.md) gives every excerpt a record rests on, all the way back (`discovery.excerptsOf`).

- **A record holds only what someone wrote:** the claim and the passages for and against it, the options a decision weighed and what it rests on, a scenario's steps and code. Never a standing, a status or anything else that follows: those are worked out (see "Weighing claims" and the statuses in "The kinds").
- **Every record carries its making:** `created` (`yyyy-mm-ddThh:mm`), `by` (`Agent` or the person) and `iteration`, and anything else worth keeping in `meta`. These names are reserved: a kind's own fields use others (a prediction's deadline is `due`, an investigation's investigator `who`).
- **One script per kind,** each setting its list, as the [pages practice](pages.md) keeps data, so a page opened from disk reads them; a page includes the kinds it shows.
- **Records are never edited,** except for their tags (see Tags). A record that's wrong or out of date is superseded by a new one, which names it (`supersedes: 'SCN-3'`). The engine marks the old one superseded from then on and links the two, so a scenario can be followed through every version of itself. An excerpt that's wrong, such as one quoting the wrong source, is corrected the same way: a new excerpt superseding it. Leave the records citing it as they are; the engine weighs them on the correction from then on.

## Tags

Sources, excerpts and records can carry tags, so people can find them. Tagging is opt-in here as everywhere, so ask as you set up. Discovery often gains from it, since it soon holds many cards across many kinds, but the person decides. The [tagging practice](tagging.md) says how to ask, how to choose, declare and change tags, and when to tag. If the sandbox tags:

- **Declare them in `records/tags.js`,** as `const TAGS = [{ tag, means }]`, and check `discovery.tags()` before adding one: it lists every tag, what it means and what carries it, and names any in use but never declared.
- **Tags are the one part of a record that can change later.** Nothing is worked out from them: no status or weighing ever rests on a tag, so changing them keeps the audit trail whole. The same goes for working tags, which the engine ignores.

## The kinds

**What we know**

Every status below is worked out by the [discovery engine](../engines/discovery/manifest.md) (`discovery.status`), never written in a record, except where it's a judgement someone makes rather than something that follows: goals, optimizations, strategies, agreements, constraints, capabilities, principles, patterns, anti-patterns, trade-offs and risks keep the `status` their record states, and a decision, an action or a solution states one until something overrides it.

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
| HYP | Hypothesis | A possible explanation, put up to be tested: what prompted it, and what would bear it out. | untested, supported, refuted |
| PRB | Problem | Something wrong now that people feel: who feels it, and what shows it (incidents, observations, claims). | open, solved |
| INC | Incident | Something that went wrong once, at a time: what happened, its effect, what resolved it. | open, resolved |
| QST | Question | Something open, raised in a source, answered by sources. | unresolved, answered |
| FB | Feedback | What someone who knows the domain said of the model, on one version (see below). | open, answered, declined |
| NEXT | Awaited | Material asked for and not yet arrived: what it's for. | – |

**Where we're going**

| Prefix | Kind | What it is | Status, worked out |
|---|---|---|---|
| OUT | Outcome | What actually happened, measured against a goal or prediction. | worked, partly, failed |
| GOL | Goal | Where we're trying to get to, as a target on a metric: met once reached, then done. | on track, off track |
| OPZ | Optimization | A measure always pushed one way, never done: its metric, which way, and what else is weighed against it. | improving, steady, worsening |
| STR | Strategy | How we mean to get there across many choices: what it aims at, the principles and patterns it follows, what it rules out. | in force, set aside |
| PRD | Prediction | A decision's bet on what it will bring about, by when. | pending, supported or in doubt, borne out, partly, not borne out |
| AGR | Agreement | Terms between parties: a standard, protocol or contract, changed only with them. | in force |
| DSP | Dispute | A point parties haven't settled: the parties, each one's position, what it's about. Often settled by an agreement. | open, settled |
| REQ | Requirement | Something that must be so: how firm, and where it comes from. Observations test it. | untested, met, not met |
| CON | Constraint | Something that rules options out: how firm, what it rules out, where it comes from, what it protects. | holds |
| CAP | Capability | What lets us move towards a goal, a constraint's opposite: what it lets us do, and how far it goes. | available |
| PRN | Principle | A rule of thumb someone chooses by: why, and what it gives way to. | followed, set aside |
| PAT | Pattern | A known way of solving a recurring problem: what it solves, what it costs. | applied |
| APT | Anti-pattern | A known way that looks right but goes wrong: how it goes wrong, what to do instead. | present, removed |
| SOL | Solution | What answers a problem: the problem it solves, what it's built from, what it leaves. | proposed, applied |
| OPT | Option | One way a choice could go, with what's for and against it. A decision weighs it and may take it. | open, chosen, set aside |
| TRD | Trade-off | What one thing costs in another: what it gives, what it costs, what it's weighed between. | accepted |
| REC | Recommendation | Advice on which way to go, and why: the option or solution it recommends, who it's for, and when it wouldn't hold. | proposed, followed, declined |
| DEC | Decision | A question, the options weighed (inline, or option records it rests on), the one chosen (`chose`), the reason, who decided, what it rests on, and any dispute it `settles`. | accepted, review when something it rests on changed after it was decided |
| EXP | Experiment | A test run on purpose, on the world or on the model, with what would bear it out written first. | planned, done |
| ACT | Action | Something to do, brought about by a decision. | to do, done |
| RSK | Risk | Something that might go wrong: raised by someone (a concern), or brought about by a decision. | open |
| CTR | Contract | What the parties agree shapes the domain: its scope, definitions, goals, optimizations, constraints, capabilities and principles (see below). | proposed, in force, review |

**What we're building**

| Prefix | Kind | What it is | Status, worked out |
|---|---|---|---|
| ENT | Entity | A thing in the domain with identity, state and behaviour, proposed with a name, a purpose and what it's founded on. | proposed, trying, integrated, rejected |
| PRM | Domain primitive | A small value with constraints and no behaviour. | as an entity |
| SCN | Scenario | Given, When, Then, founded on cards, with code that plays it on the model. | met, not met |
| RUL | Rule | A mandate or a condition, founded on cards, with code that checks it on the model. | met, not met |
| RUN | Run | Every scenario and rule against one version of the model, or one candidate. Worked out, never written. | for a trial: earns its place, not yet |

## The domain contract

A contract is what the people involved agree shapes a domain, written down so that all of them can hold to it. It's the domain compressed to its principled parts: where it's going, what stands in the way, what lets it move, and what it holds to. Most of what's been discovered exists to find and test these.

- **It's the bigger picture.** Requirements, acceptance criteria and specifications are specifics: details of how a particular goal is reached or something optimized. A contract is general enough that any specific is just one of many ways to fulfil it (below).
- **What it holds:** its `scope` (what's in and what's out), `definitions` (so someone reading it cold can follow it), `goals` (reached, then done), `optimizations` (directions, never done), `constraints` (what stands in the way), `capabilities` (what lets us move) and `principles` (what we choose by), each named by its code, and its `parties`. `const CONTRACTS = [...]` in `records/contracts.js`.
- **Order is priority.** Goals, optimizations and constraints each run in order of priority, which belongs to the contract, not the card, since priorities change and cards don't. A hard constraint just holds, so priority mostly matters among the soft ones.
- **It's discovered, then it frames.** People usually tell stories first, and the contract is compressed from them; from then on it frames what comes in. It frames without being beyond question: evidence has to be able to challenge it too, or a wrong goal goes unnoticed. Don't write one too early.
- **People read it, then sign it.** A contract is an aggregate, and that's why it can be signed: only here does each goal, constraint and capability sit in context with the rest, so only here can someone say yes to all of it. Signing is what makes it an agreement. So a party signs the whole contract, never a clause or a passage: `parties: [{ name, signed: { when, iteration } }]`, added to the record when they sign, since signing changes nothing it says. A signature isn't source material and cites none. The agent drafts and never signs; a contract is `proposed` until every party has signed.
- **An amendment is a new contract** naming the one it `supersedes`, as the world changes, or new constraints and capabilities are found. The old one binds until the new one is signed. A contract comes up for `review` when something it names is replaced, as when a capability turns into a constraint: a `CON` superseding a `CAP`.
- **Say what answers to it.** A scenario or rule names the clauses it serves: `serves: ['GOL-1', 'CON-2']`. It isn't what the test rests on, so it makes no link, and it can be added to an earlier test, as a tag can, since tests often come first. `discovery.answers` then gives each clause and what serves it, the clauses nothing tests, and the tests serving nothing in it. Those two edges are what's worth showing: something's untested, or a test is scope creep, or the contract is missing a clause.
- **Keep it to a sheet.** If the clauses don't fit one screen, it hasn't compressed the domain, so merge or drop until they do.
- **Not every domain needs one.** It suits what's engineered, where people decide how things should be. A natural phenomenon has no goals, and what it can and can't do is settled by evidence rather than signatures, so claims serve it better.

### How it differs from the others

Requirements, acceptance criteria and specifications are all specifics. Each is one detail of one way to reach a goal, and another could do as well. A contract is the principled artifact above them: general enough that any of them is only one variation among many that would fulfil it.

| | Settles | Covers | Its role |
|---|---|---|---|
| **Requirement** (`REQ`) | That something must be so | One item, on its own | Loose: it can be stated without saying how it weighs against anything else |
| **Acceptance criteria** (scenarios and rules) | How to tell a piece of work is done | One piece of behaviour | Checks: they serve the contract, downstream of it |
| **Specification** (a model version or candidate) | How one solution works | One way of doing it | One variation of many, so people can agree the contract while the system stays free to take many forms |
| **Contract** (`CTR`) | What the people involved agree shapes the domain, and why it's there | The whole, in context, by priority | Frames all of the above, and is the one that's signed |

The others can each be right on their own and still add up to nothing anyone agreed. A contract is where they have to fit together.

### Showing and sharing it

Give the contract a section of its own, as the first thing on the discovery page, rather than a place on the boards: it names so much that its links would drown them. Its clauses stay on the boards as the cards they are. Beside it, show what answers to it in an [`sb-lineage`](../components/sb-lineage/manifest.md), columns for the clauses nothing tests, the clauses tested, the tests serving them, and the tests serving nothing.

A contract may be what a sandbox is for, read by people who've never seen it, so it can leave as a PDF, with nothing to install and no server. [`sb-discovery-card`](../components/sb-discovery-card/manifest.md)'s `document` variant writes it out in full: pass each clause's `details` and `cited` words, `notes`, and `schedules` of what answers to it and its sources, so that nothing depends on opening anything. To save it:

```js
function saveContract() {
  printRoot.replaceChildren(documentCard);   // a child of <body>, hidden until printing
  document.body.classList.add('is-printing');
  addEventListener('afterprint', () => document.body.classList.remove('is-printing'), { once: true });
  print();                                   // the browser's own dialog saves the PDF
}
```

```css
@page { size: A4; margin: 20mm; @bottom-center { content: counter(page) " of " counter(pages); } }
@media print {
  body.is-printing > :not(#print-root) { display: none !important; }
  body.is-printing > #print-root { display: block; }
}
```

To show its pages on screen, put the document in a box the size of a page with its overflow hidden, flow it through columns the size of the page's text with a gap of twice the margin, and move by a page's width to turn the page. The browser breaks it as it does for print, so the pages match the PDF. Take the document's frame off there, as printing does: `max-width: none; padding: 0; border: 0`. `demos/discovery` shows it working.

## Iterations

- **Every source and record says the iteration it arrived in or was raised in.** The [discovery engine](../engines/discovery/manifest.md) works out what each iteration shows (`discovery.iteration(k)`): what was raised in it, what came back, and what was carried in, with the links among them.
- **A card that changes appears again** in the iteration that brought new material for it, as its updated self: "updated: new material arrived".
- **Cards an iteration's cards rest on are carried in** as they last stood: "carried from iteration 1".
- **Every card is shown as of the iteration on screen.** A claim is weighed only on the sources that had arrived by then.
- **If the sandbox tags, tidy them at the end of each iteration,** as the [tagging practice](tagging.md) describes.
- **End each iteration with a handover** offering a few directions, as [building a sandbox](building-a-sandbox.md) describes.

## Weighing claims

A claim never gets a verdict by hand. The [discovery engine](../engines/discovery/manifest.md) weighs it from its passages (`discovery.weigh`), by these rules:

- **Grades.** Each source carries an authored grade in the catalogue: a value from 1 to 5 and the reason for it, with any aspects that matter in this subject (see the [sources practice](sources.md)). Grade it when you catalogue it, and say why. A source not graded yet weighs 3, and its passages say so.
- **In scope:** only sources that speak to how things are count. One that says what should be, such as a plan, shows but doesn't count.
- **Copies count once:** a source repeating another counts as the one it repeats. So does a source quoted twice: it counts once for each stance, however many excerpts a claim cites.
- **Standing:** corroborated (two or more independent yeses), single source, contested (yeses and noes), refuted (only noes), unbacked.
- **Score:** the grade of each independent yes, less each no.
- **Basis:** observed (data or an image), reported (first-hand), inferred (only an analysis), conjecture, or assumption once something rests on it.

## Building the model

Write the model's classes, keep every version, and hand them to the [discovery engine](../engines/discovery/manifest.md) (`model: { versions, candidates }`): it runs every version and candidate against every scenario and rule (`discovery.run`), and works out each part's stage and each test's status.

- **The model speaks the domain's words.** Every entity and domain primitive is founded on a definition of its name; one without is flagged. Borrow from domain-driven design where it fits, never by reflex.
- **Scenarios and rules can come before the code.** Written as words alone, they're followed like any record (where they came from, the feedback on them, what replaced them) and the model answers to them once they have code.
- **A proposal is tried as a candidate model,** and its run compares it with the model as it stands: tests newly met, tests broken. It earns its place if it meets something new and breaks nothing.
- **Integration is a decision for people.** The run recommends; a decision card brings about the next version of the model, or rejects the proposal with the run's reasons. Every version is kept, so every run can be repeated.
- **What a test exercises comes from running it,** watching which parts it made, called and read, never from a list.
- **Count the model's real choices** (each `if`, `case`, `&&`, `||`, `??` and `?:`) and tests met per choice, as evidence for people, never a target. A model that meets new tests on arrival, with no change, predicts; one tuned to its tests doesn't.

## Feedback

People who know the domain try the prototype or a run and say what they think. Their comments arrive as a feedback file, saved as source material (see the [feedback practice](feedback.md)). Each comment becomes a feedback record: its `FB-` code, the passage (`said: [sourceId, 'the words']`), `who` said it, what it's `about` (a part of the model, a scenario or rule, several of them, or `prototype`), the `version` of the model it was made on (an iteration) and any state worth keeping in `meta`, and its `verdict`, `works` or `wrong`. Answer it with what came of it, most often a scenario or rule founded on it (`foundedOn: ['FB-1']`), so their expectation becomes a test. A comment not acted on is written `declined`, with the reason. The [discovery engine](../engines/discovery/manifest.md) works out whether it's open, answered or declined.

## Showing cards

[`sb-discovery-card`](../components/sb-discovery-card/manifest.md) draws one card, compact on a board, normal, or expanded in a modal. It works nothing out: the sandbox prepares each card as of the iteration shown (status, badges, strips, folds, notes) and sets it again when the iteration changes.

- **Lead with the main strip,** so a card reads in one line; supporting facts after; what it rests on in folds.
- **Sources and excerpts are only ever compact cards.** Opened, a source is the material itself: answer `sb-open` on a source by showing it in [`sb-source`](../components/sb-source/manifest.md) or a view of your own, with only its excerpts that aren't superseded as passages, and on an excerpt, or a passage naming one, by showing its source there. An excerpt carried on a board in place of its whole source shows its words, its region of an image or its rows.
- **Open other cards expanded,** in [`sb-modal`](../components/sb-modal/manifest.md).
- **Let pointing work both ways.** Cards announce `sb-highlight` for what's pointed at, and the highlighting script lights every part with that ref. Route it to a card's `highlight` where a card should mark more than that, so a source, and its excerpts, light up wherever they're cited (see [highlighting](highlighting.md)).

## Boards

A recommended layout, not a required one (see "What's fixed and what's yours"). A contract has its own section rather than a place on them (see "The domain contract"). Each iteration is laid out on boards, each an [`sb-lineage`](../components/sb-lineage/manifest.md) holding the cards drawn compact, in columns by the part they play, with every link between them drawn and labelled. People switch between the boards and step between iterations. The first three follow the whole loop; Scenarios follows each scenario and rule from what it's founded on to the feedback on it and what replaced it.

| Board | Columns, in order |
|---|---|
| What we know | Gathered (sources, and finished investigations beside them, folded), Excerpted (the excerpts cited, in place of whole sources), Captured (observations), Interpreted (metrics, claims, definitions, opinions, feedback), Reasoned (inferences), Assumed (assumptions, hypotheses), Open (questions, problems and incidents still open), Under way (investigations still looking), Awaited |
| Where we're going | Rests on (what a decision rests on from What we know, folded), In force (outcomes, goals, optimizations, strategies, predictions, agreements, requirements, constraints, capabilities, principles, patterns and anti-patterns standing), Weighing (options, trade-offs, recommendations, solutions proposed and disputes still open), Decided, Brought about (experiments, actions, risks, solutions applied, and what a decision brought about in this iteration), Awaited |
| What we're building | Founded on (folded), Proposed, Trying, Integrated, Runs, Met, Not met yet, Rejected |
| Scenarios (everything standing, from `discovery.standing(k)`) | Founded on (folded), Superseded (scenarios and rules replaced in this iteration), Scenarios, Rules, Feedback (on them) |

- **Columns hold a card's role in the iteration, not its kind.** An investigation is under way until a source it gathered arrives, then gathered; a prediction is brought about in the iteration its decision made it, and in force after.
- **Links are signal, not noise.** Every link answers a question: what supports or disputes a claim, what shaped a decision or what it brought about, what a part is founded on. Label each with what it means: the [discovery engine](../engines/discovery/manifest.md) gives every link its meaning (`means`: "supports", "founds", "brings about"), to use as it is or say your own way. What brought a card about is linked only in the iteration where it did; afterwards it stands in force, and that history stays on the card.
- **Tone links by what they mean,** so a chain reads before its labels do: what supports, answers, bears out, meets, solves or enables in `good`; what disputes, refutes, fails or puts in doubt in `bad`; what rests on an assumption or hypothesis, constrains, requires or warns against in `warn`; bookkeeping, such as gathered, captures, informs or clause of, and what a plan says should be, `muted`, since it shows but doesn't count; the rest the default accent.
- **A grounding column holds only cards linked to the board's own,** folded, and links between two grounding cards are left out.
- **Set the board again for each iteration:** its cards (compact, `openable`, as of that iteration), its columns and its links. Carried cards keep the `carried` mark.
- **Fold cards with their column,** so a folded column shows each card's icon and code:
  ```css
  .sb-lineage__column--folded .sb-discovery-card__compact > :not(.sb-discovery-card__compact-head),
  .sb-lineage__column--folded .sb-discovery-card__compact-head > :not(.sb-discovery-card__icon, .sb-discovery-card__id) { display: none; }
  ```
- **Opening and pointing are the cards'.** Openable cards are buttons, so the lineage leaves clicking them to the cards, and viewers pan from between them. Answer their `sb-open` as above. Route `sb-highlight` to the board's `highlight` as well as every card's, and call the board's `reveal` from `goTo` (see [locating](locating.md)).
