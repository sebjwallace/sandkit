# Lineage: seeing a domain evolve

An experiment across two mock-up pages, asking whether a domain is best understood by following it from its beginnings and watching it grow, one idea at a time, while a map shows the space the model covers and how much of it has been seen.

- **`demos/lineage/`** (this page) tries it on a simple, stateless domain: the station departure board from `demos/departure-board/`, kept apart from it.
- **`demos/fulfilment/`** stress-tests it on a hard, stateful one: a spare-parts warehouse supplying rail depots. Its `README.md` covers what's particular to it.

This file explains the idea and holds what's needed to pick the work up again. Each page's `NOTES.md` records what each step taught us.

## Opening the pages

Double-click either `index.html`, or serve the repository and open them in a browser:

```
node tools/serve.mjs . --port 8123
```

Then go to `http://127.0.0.1:8123/demos/lineage/` or `http://127.0.0.1:8123/demos/fulfilment/`. They're plain HTML around Sandkit's shell and `sb-scrubber`, with no build.

## The idea

**A lineage, not a model.** Everything that evolves starts small and simple, and grows step by step (Kenneth Stanley and Jeff Clune's work on open-ended evolution). So the model is kept as a series of small, runnable versions, each one idea richer than its parent, each with a note on what caused it. Rivals that were tried and set aside stay visible as dead ends, the stepping stones not taken. Stepping along the lineage shows what each idea changed.

**A map of the principled space, drawn as a box.** Beside the lineage, a morphological box: a column per fact the version knows, each value once as a tile, then a column of what comes out. A scenario is a pathway threading one tile per column. Scenarios the rules treat alike form a bundle, gathering at knots and fanning out over the facts the rule ignores. So:

- **Compression shows as wide fans.** "Cancelled, whatever else" is one fan across every delay and platform. Few principles covering many cases look calm; special cases look like many thin strands.
- **The box grows with the facts, not the scenarios.** The departure board's last version has 480 scenarios: over 10,000px as rows, about 870px as a box.
- **Tracing goes both ways.** Point at a fact for what it affects, at an outcome for why it happens, or at a train or order for its whole route.

**Fog: how much is known.** A pathway is solid where something real has gone that way (a train on the board, a decision made during the warehouse's day), and faint and dashed where only the rules say so. Tiles are shaded by traffic. Like footpaths worn across a landscape, it shows which routes are walked and where to look next.

**Journeys, for things with a lifecycle.** A warehouse order isn't decided once: it's re-decided every hour until something commits it. So fulfilment adds a box whose first column is a lifecycle's stages in order and whose other columns are the hours of the day. Each order or line threads its stage hour by hour, flat while it holds and slanting when it moves.

## Words used

| Word | Meaning |
|---|---|
| version | One runnable model: its facts, its rules (or decisions), its parent and its cause. |
| trunk, set aside, rival | The main line of versions; versions tried and abandoned; versions kept beside the trunk until it's clear which is deeper. |
| fact | Something a rule can see, with a few values. Quantities become **bands** (none, short, enough) at **landmarks**, which earn their place only when a rule tells them apart. |
| region, bundle | Scenarios that come out the same, found by `regionsOf`; drawn as a bundle of pathways. |
| knot, fan | Where a bundle gathers, and spreads across values it doesn't care about. |
| fog, trodden | Pathways only inferred, and pathways something real took. |
| journey | One order's or line's stage, hour by hour. |
| ledger | The equation a fulfilment version believes must balance (`received = free + reserved + shipped + …`), checked every hour. |

## How the code is shaped

- **A version is plain data, written out in full,** sharing fact readers and rule tables by name.
  - Lineage (`lineage.js`): `facts` (each with its `values` and an `of(train)` reader) and `rules`, a first-match table per part of the board.
  - Fulfilment (`model.js`): a `day`, a `queue` ordering, a `ledger`, and two decisions, `line` and `order`, each `{ facts, decide }` where `decide` is a small function from fact values to an outcome.
- **What a version adds is worked out, not written:** new facts and values compared with its parent (`growthOf`).
- **The map comes from the same rules that run:** `regionsOf` walks every combination of a decision's facts and groups those with identical outcomes. In fulfilment, `runDay` makes every allocation through the version's own `decide` and keeps each decision, so the box's fog and the warehouse can't disagree.
- **Adding a version** is adding an entry to `VERSIONS` with a `parent` and a `cause`; the tree, map and comparisons follow. Set `setAside: true` (lineage) or `rival: true` (fulfilment) to put it off the trunk.
- **Drawing:** the lineage page draws its box in `index.html`; fulfilment's boxes and journeys are in `box.js` (`drawDecisionBox`, `drawJourneys`).

## Where it stands

**Lineage:** 12 versions on the trunk and 5 off it, run against an afternoon's 12 trains. The box has knots and fans, the board's parts as one column, fog from the trains, and a view per part of the board.

**Fulfilment:** 11 versions on the trunk and 2 rivals, through a busy day of 12 orders, two deliveries and damaged stock. There's a warehouse at any hour, a ledger, the journeys of orders or lines, and boxes for the line's and the order's decisions, with fog from the day's decisions.

The main findings so far (details in each `NOTES.md`):

- **The readability failure was the drawing, not the domain.** Rows broke at 480 scenarios; the box didn't.
- **Message priority is the departure board's real complexity.** Each new idea is mostly a question of where it ranks, and the box shows the result, not the ranking.
- **In fulfilment, the principled model stops being enough at the second version.** A line's fate depends on which orders went before it. The allocation policy is the deep structure, and the decision box is blind to it: the policy decides *when* a line's turn comes, not what happens then. The policy has at least three parts: ordering, blocking and granularity.
- **Running the day finds what no view shows:** broken promises (a line awaiting a delivery that an older line takes), a new state silently breaking an old fact (stock being put away is invisible to lines), and the ledger catching lost stock at the hour it goes.
- **Lifecycles carry most of the behaviour.** Journeys show commitments holding over time and the day's rhythm. They also showed that a line's status is its latest decision, not a stage: O12's oil filter line slants *back* up its lifecycle in V8.
- **Fog is thin with one set of trains or one day.** The afternoon reaches 12 of 72 bundles at V12.

## Next

Open directions, roughly in order of what the last step pointed to:

1. **Separate state from decision in fulfilment.** Give a line a real lifecycle, with its decisions moving it between states, so it can't move backwards by accident.
2. **Show every stage a lifecycle allows, and its transitions,** with the ones not reached in fog, instead of only the stages that occur.
3. **Link the order and line journeys,** rather than switching between them.
4. **More photographs:** a second set of trains (rush hour, last trains) or more days, so the fog has range.
5. **Invariants as barred paths,** which the rival V10b needs (a running train can't have a replacement bus).
6. **A version as its parent plus a change,** since writing each out in full grows heavy and hides what each step did.

Further off, once the box settles: tests per claim (how many claims each version explains, fails or can't express), causes linked to real evidence (so the lineage records discovery rather than telling a story afterwards), and surveying first (a crude version covering the whole domain, then raising the resolution, beside adding one part at a time).

## What's here

| File | What it is |
|---|---|
| `index.html` | The lineage as a tree, a stepper along its trunk, the box, and the selected version's board, cause, growth and facts. |
| `lineage.js` | The trains, every version, running one against the trains, and grouping its scenarios into regions. |
| `style.css` | The page's look, the board's, and the box's. |
| `NOTES.md` | Findings, step by step. |

The work is on the branch `principled-domain-model-experiment`.
