# Domain Discovery Engine

A demo of how a sandbox might be used to discover a domain on purpose, one iteration at a time, and to grow a working model of it alongside what's been learnt. It's a single page, `index.html`. Open it from the disk or through a local server.

The domain comes from `../departure-board`: **how Ashford International's departure board decides what to show.** That covers which trains it lists, what it shows in the Expected and Platform columns, and the message line under each train. The domain is deliberately small and concrete, so every idea in the engine can be shown working on real material: an operator manual, board stills, a dispatcher's interview, a forum post, a passenger survey and so on.

This README is the full account of the ideas. The other documents beside it:

| File | What it holds |
|---|---|
| `README.md` | Every concept and principle: what the engine is and why it's shaped this way. |
| `NEXT-STEPS.md` | The plan, each item explained in enough detail to pick up cold. |
| `ENGINE.md` | How `index.html` is organised, and how to add a card, an iteration, a model part or a test. |
| `NOTES.md` | The short running log: principles in one line each, the numbered plan, and what was done when. |

Keep these consistent: a principle settled in conversation goes into `NOTES.md` in one line and here in full.

---

## 1. The idea in one paragraph

Discovery is a loop. People gather material from the world, interpret it into claims, definitions and observations, notice what they're assuming and what's still open, decide where to go, and act. Then the world answers, and the loop goes round again. Alongside the loop, a **model of the domain** is written as real code, founded on what's been learnt, and **tested against scenarios and rules** that come from the same material. The sandbox is where the model runs, so experiments on it are instant and free of risk, and a prediction can be put in doubt before the world has to answer it. **That is the principal idea behind the whole toolkit.** The engine shows the loop on three boards per iteration, keeps every card as an audit trail, and derives every status, link and view from the cards and the model, never by hand.

## 2. Iterations

The page shows one iteration at a time, stepped with ← and →. There are two so far:

- **Iteration 1 · how the board decides, early October.** Sources include the operator manual (SRC-1), board stills (SRC-2), a dispatcher's interview (SRC-3), a newsletter (SRC-4), a forum post (SRC-5), the agent's analysis (SRC-6), and the meeting minutes where DEC-1 was taken (SRC-8). The model is the first version: Delay, Platform, Clock time, Train, Board.
- **Iteration 2 · feedback from October, early November.** New material arrives (SRC-9 to SRC-15): the outcome of DEC-1, a passenger survey showing that under four in ten passengers read the message line, the station's agreement with signalling, and the PA decision. DEC-2 adds PA announcements. ACT-1 changes the Board to `BoardWithPlatformChanges`. Announcement (ENT-4) is proposed and tried in a candidate model.

How iterations are recorded:

- An iteration lists the **sources** that arrived from the world in that turn and the **cards** raised in it. Nothing points back.
- **Every source and record says the iteration it arrived in or was raised in,** in its own metadata; nothing else lists them.
- **A card that changes later appears again**, as its updated self, in the iteration that brought new material for it: a claim when a new source speaks to it, a decision when its grounds change, a test when what it says against the model changes, and so on. On the board it carries the note "updated: new material arrived".
- **Cards from earlier iterations that this one's cards rest on are carried in** as they last stood, marked "carried from iteration N". A constraint still in force is the usual example.
- **Every card is shown as of the iteration being viewed (`k`).** A claim is weighed only on the sources that had arrived by then; a prediction is pending until an outcome by then measures it. Step back to iteration 1 and DEC-1 shows as it stood then.

## 3. The boards

Each iteration has three boards following the whole loop, and a fourth following scenarios, chosen with a toggle. A board runs **left to right** by default, with a toggle to run **top to bottom**. Each column **folds down to a chip**, and the links follow it. Links have arrows. Hovering or focusing a card lights its chain, and the label says what the relation is (for example "rests on", "founded on", "brought about").

**Columns hold a card's role in the iteration, not its kind.** The same kind can sit in different columns depending on what it's doing. An investigation is Under way until a source it gathered arrives, then Gathered. A prediction brought about by a decision sits in Brought about in the iteration that made it, and In force afterwards.

### What we know

| Column | Holds |
|---|---|
| **Gathered** | Sources, and finished investigations beside the sources they gathered. Folded to codes, since the excerpts carry what matters. |
| **Excerpted** | The excerpts cited: the pieces of sources the records rest on, each picked out once. |
| **Captured** | Observations: readings taken straight from material. |
| **Interpreted** | Metrics, claims, definitions, opinions. |
| **Reasoned** | Inferences. |
| **Assumed** | Assumptions. |
| **Open** | Questions. |
| **Under way** | Investigations that haven't gathered anything yet. |
| **Awaited** | Material asked for and not yet arrived (NEXT cards). |

### Where we're going

| Column | Holds |
|---|---|
| **Rests on** | The cards from What we know that something here rests on (grounds, shown at the edge). |
| **In force** | Outcomes, goals, predictions, agreements and constraints standing in this iteration. |
| **Decided** | Decisions. |
| **Brought about** | Experiments, actions and risks; and predictions, agreements and constraints in the iteration a decision brought them about. |
| **Awaited** | Material awaited for these cards. |

**Links are signal, not noise.** On this board every link answers either *what shaped a decision* or *what it brought about*. Where something came from in an earlier iteration goes on the card, not on the board. **What brought a card about is linked only in the iteration where it did;** afterwards the card stands in force and that history stays on the card.

### What we're building (the foundry)

| Column | Holds |
|---|---|
| **Founded on** | The cards the model's parts and tests are founded on (grounds). |
| **Proposed** | Entities and domain primitives proposed and not yet tried. |
| **Trying** | Parts being tried in a candidate model this iteration. |
| **Integrated** | Parts in the model as it stands. |
| **Runs** | One run per model version and per candidate. |
| **Met** | Scenarios and rules the model meets. |
| **Not met yet** | Scenarios and rules it doesn't meet yet. |
| **Rejected** | Proposals turned down, with why, kept on record. |

Above this board a **summary line** says, for the iteration, how many tests the model meets, how many decisions its code holds, tests met per decision, the busiest method, what the last change did and what kind of change it was, what each trial did, and how many new tests were met on arrival.

"Foundry" was chosen because it's where the model's parts are cast from what's been learnt, tried, and either kept or melted down. The parts aren't cards in the usual sense. Cards are their precursors, traced back by "founded on".

### Scenarios

Unlike the other three, it shows everything standing by the iteration, not only what the iteration changed: cards it didn't raise or bring back are carried, so what changed stands out.

| Column | Holds |
|---|---|
| **Founded on** | What the scenarios, rules and feedback rest on (grounds). |
| **Superseded** | Scenarios and rules replaced by a later one, linked to what replaced them. |
| **Scenarios** | Every scenario standing. |
| **Rules** | Every rule standing. |
| **Feedback** | Feedback on a scenario or rule, linked to what it's about and what answered it. |

## 4. Kinds of card

Every card has an id whose prefix names its kind. Each kind has its own icon and tone. A kind of card earns its place only by having **parts or connections the others don't**.

### What we know

| Prefix | Kind | What it is | Derived status |
|---|---|---|---|
| SRC | Source | Material gathered from the world: a document, notes, data, an image, a web page, an analysis. It has a format, a file path, grades (distance, trust, clarity) and a role (record, opinion, plan, decision). It may copy another source, or be derived from one. | – |
| INV | Investigation | Learning on purpose by finding what's already there. Prompted by a question, an assumption or a prediction, it gathers sources. | under way → done (once a source it gathered arrives) |
| OBS | Observation | A reading taken straight from a source, often from data: a value, of what, when. It can be a metric's reading, an experiment's result, or a test of an assumption or prediction (+ or −). | – |
| MET | Metric | A quantity tracked over time. Goals set targets on it, predictions forecast it, observations are its readings. "Metric" rather than "measure": a metric is the thing tracked; measuring is what observations do. | shows its latest reading |
| CLM | Claim | A statement about how things are, with assertions from sources (+ or −, each with a quote). | standing, score and basis (see §5) |
| DEF | Definition | What a word in the domain means, set in a source. Parts of the model are founded on the definition of their name. | – |
| OPN | Opinion | A view someone holds, said in a source. | – |
| INF | Inference | A conclusion reasoned from premises (other cards). | sound, or shaken when a premise changes |
| ASM | Assumption | Something taken as true without evidence, so it can be tested. | untested, confirmed or refuted (by observations) |
| QST | Question | Something open, raised in a source, answered by sources and informed by claims. | unresolved or answered |
| NEXT | Awaited | Material asked for and not arrived yet: what it's for, and why. | – |

### Where we're going

| Prefix | Kind | What it is | Derived status |
|---|---|---|---|
| OUT | Outcome | What actually happened, measured against a goal or prediction. A success or a failure, fed back into the loop. | worked, partly, failed |
| GOL | Goal | Where we're trying to get to, as a target on a metric. | on track, off track |
| PRD | Prediction | A decision's bet on what it will bring about, by when, measured by a later outcome. Replaced decisions' "Expects". | pending → supported or in doubt (from experiment results) → borne out, partly, not borne out (from outcomes) |
| AGR | Agreement | Terms between parties: a standard, a protocol, a convention or a contract. Decided between parties, it stands in force and is a common cause of constraints. It can only be changed with the parties to it. | in force |
| CON | Constraint | Something that rules options out. It has a firmness (hard or soft), what it rules out, where it comes from (a cause: a past decision, values, an agreement, physics…), and what or whose interest it protects. | holds |
| DEC | Decision | A question, options with pros and cons, the one chosen, what it rests on, the reason, the deciders, and the sources. | accepted, or **review**: only when something it rests on has changed *after* it was decided (a claim turned against it, or a prediction not borne out) |
| EXP | Experiment | A test run on purpose: on the world (a survey, a trial) or **on the model** (a simulation). What would bear it out is written before it runs. Results arrive as observations. | planned → done |
| ACT | Action | Something to do, brought about by a decision. | to do → done |
| RSK | Risk | Something that might go wrong, brought about by a decision. | open, as written (see the plan: risks that come true) |

### What we're building

| Prefix | Kind | What it is | Derived status |
|---|---|---|---|
| ENT | Entity | A thing in the domain with identity, state and behaviour. Proposed with a name, a purpose and what it's founded on. Once integrated, its properties and behaviour are drawn from its class. | proposed → trying → integrated, or rejected |
| PRM | Domain primitive | A small value with constraints and no behaviour (Delay, Platform, Clock time). We say "domain primitive", not "value object". | same as entity |
| SCN | Scenario | Given / When / Then steps, founded on cards, with code that plays them against the model. | met, not met |
| RUL | Rule | In `sb-rule`'s grammar: a MANDATE, or a CONDITIONAL with If / Then. Founded on cards, with code that checks it across the afternoon's trains. | met, not met |
| RUN | Run | Every scenario and rule run against one version of the model, or one candidate. Worked out, never written. | for a trial: earns its place, or not yet |

Records: everything the sandbox writes is kept in `records/`, one script per kind (`records/claims.js`), beside the sources, which are all that came from the world. Each record says when, by whom and in which iteration it was made, and a card shows it.

## 5. Weighing claims

A claim is never given a verdict by hand. It's weighed from its assertions:

- **Grades:** each source carries an authored grade: a value from 1 to 5 and the reason for it, with any aspects that matter (here, the old distance, trust and clarity). A source not graded yet counts as 3, and says so.
- **In scope:** only sources that speak to *how things are* count. One that says *what should be*, a plan or a decision, shows on the card but isn't counted. The manual (a plan) saying "delays under five minutes show On time" doesn't outweigh the stills.
- **Copies count once:** a source that copies another (the newsletter repeating the forum post) is counted as the one it copies. Repeats sit under the source they repeat.
- **Standing:** *corroborated* (two or more independent yeses), *single source*, *contested* (yeses and noes), *refuted* (only noes), *unbacked*.
- **Score:** the grade of each independent yes, less each no.
- **Basis,** what holds it up: *observed* (data or an image backs it), *reported* (someone says so first-hand), *inferred* (only an analysis does), and with nothing behind it *conjecture*, or *assumption* once something rests on it.

## 6. Principles

These are settled. Don't re-litigate them; propose changes openly.

1. **Cards are never edited, only superseded or tested by later cards.** What follows from them (standing, refuted, done, review) is worked out for each iteration, so the iterations stay an audit trail. You can always step back and see what was known and decided then.
2. **Columns hold a card's role in the iteration, not its kind.**
3. **Links are signal, not noise.** Every link on a board answers a question. Where something came from in an earlier iteration goes on the card.
4. **What brought a card about is linked only in the iteration where it did.**
5. **A new kind of card earns its place** with parts or connections the others lack. Prefer a variant of an existing kind (fact and cause, for example, are proposed as claim variants, not kinds).
6. **Loosely inspired by domain-driven design.** Borrow pieces where they fit (entities, primitives, events, rules, a shared language) and never think in its terms. No aggregates, bounded contexts or repositories by reflex.
7. **The model speaks the domain's words.** Every entity and domain primitive (and later event) is founded on a definition of its name. A part without one is flagged, as ENT-4 Announcement is.
8. **The sandbox is where experiments run.** Experiments on the model are instant and free of risk, so a prediction can be put in doubt before the world has to answer it.
9. **The prototype draws; the model decides.** In this domain, what the board shows is domain behaviour, so it lives in the model. The prototype's layout and colours don't, and nothing like a view model is modelled. Ported to production, the model goes and the prototype stays behind.
10. **Every view of a domain object is derived:** from its class, its instance, the model, the feed and the cards' links. Change the entity and every view follows. Nothing in a view is written by hand.
11. **Integration is a decision for people.** A run's report is the evidence and can recommend. A decision brings about the next version of the model, or rejects the proposal with the report's reasons.
12. **The compression signal is evidence for people, never a target** (see §9).
13. **Parties aren't cards.** Who wants what and who is bound by what is part of the engine, with its own look, composed where needed (see the plan).
14. **Source material versus cards.** What people gather is source material. Whatever the agent writes is a card, never a source. Two old exceptions remain to fix: SRC-6 and SRC-15.
15. **Components render; models compute.** The engine prepares every view; Sandkit components only draw. This is why the card component, `sb-discovery-card`, takes a plain description of a card and never works anything out.

## 7. The model

The model is **real JavaScript classes** in the page. The foundry's cards draw what an integrated part is from these classes, never from prose.

**Domain primitives** check their constraints in their constructor, are frozen, and have no behaviour. Each declares `static title` and `static constraints` (its constraints in words).

- `Delay(minutes)`: whole minutes from 0 up, or `null` when there's no estimate. Minor from 1 to 4, major from 5 (DEF-1).
- `Platform(number)`: 1 to 12.
- `ClockTime(text)`: `HH:MM`, 24-hour, by the station's clock.

**Entities** declare `static properties` (name → a primitive class, `[Class]` for a list, or a word like `'text'` or `'yes or no'`) and `static behaviour` (method → what it does, in words).

- `Train`: time, destination, delay, platform, planned, confirmed, cancelled, departed, reason. Behaviour: `expected()` (scheduled time plus delay, or null) and `platformChanged()`.
- `Board(trains, clock)`: `shows(train)` (until it departs), `expectedFor(train)` (On time, Exp HH:MM, Delayed, Cancelled), `platformFor(train)` (the number once confirmed, a dash until then, nothing once cancelled), and `messageFor(train)` (cancellation, or a long or unknown delay, with the reason).
- `BoardWithPlatformChanges extends Board`: `messageFor` also says "Platform changed to N". This is iteration 2's version of ENT-2, changed by ACT-1.
- `Announcement` (candidate only): train, confirmedAt. `announcedAt()` (confirmation plus two minutes) and `inTime()` (at least five minutes before the train leaves, CON-2).

**Versions.** `MODEL` lists one version per iteration: which class each part id is, and `changedBy` (which card changed a part). `CANDIDATES` lists proposals tried in an iteration, a full set of parts with the proposal added. **Every version is kept**, so every run is reproducible.

**Proposals.** `ENTITIES` and `PRIMITIVES` hold only what anyone writes: a name, a purpose, who proposed it, what it's founded on, and, if rejected, when and why. ENT-3 Platform-as-entity was rejected in iteration 1 because it has no state or behaviour of its own; the Platform primitive does the job with one less moving part.

**Stages,** derived: integrated once a version holds it, rejected once turned down, trying once a candidate tries it, proposed until then.

**Tests read naturally:** a test gets the model's classes by name (`M.Train`, `M.Board`), as they stood in the iteration, so the same test runs against any version or candidate.

## 8. Scenarios, rules, runs and integration

- **Scenarios** (SCN-1 to SCN-6) have steps and a `play(M)` that returns a result per step (`null` where a step isn't checked, otherwise `{ ok, actual }`). SCN-6 is the first with a real When ("signalling confirms the change at 14:07") and needs Announcement. A scenario the model can't even play fails every step it checks, saying why.
- **Rules** (RUL-1 MANDATE: a departed train must not be shown; RUL-2 CONDITIONAL: if a running train's platform has changed, then its message line must say so) have a `check(M)` that returns the trains they fail for, across `AFTERNOON`.
- **Findings so far:**
  - SCN-5 is not met in iteration 1 and met in iteration 2.
  - **RUL-2 found a real gap:** the Ely train, six minutes late *and* moved platform, only tells its delay, because the board has one message line.
  - SCN-6 is met only in the candidate with ENT-4, so the trial "earns its place".
- **Watched runs.** Every test runs with the model's classes wrapped in a `Proxy` that records objects made, methods called and fields read, per part. So **what a test exercises comes from running it, never from a list.** An entity is exercised if a test made it or called it; a primitive only if a test read its value (every train is built from primitives, so being made says nothing).
- **Runs.** A run card exists for every version of the model and every candidate. It shows the model (parts, decisions, met per decision, the busiest method), each test met or not, the comparison with what it's set against (newly met, broken, parts and decisions added, the kind of change), tests met on arrival, and, for a trial, a recommendation. Parts link to the run that tested them, and runs to the tests.
- **Integration, trial by trial.** A proposal is tried as a candidate model. Its verdict is the difference, in tests met and broken, against the model as it stands. It "earns its place" if it meets something new and breaks nothing. **Integrating it is still a decision for people:** the next step is a decision card, "Integrate Announcement", grounded in RUN-3, bringing about iteration 3's model.

## 9. The compression signal

Inspired by the idea that understanding is compression: a better model explains more with fewer real choices.

- **Decisions:** `decisionsIn(source)` counts every point where code chooses: `if`, `case`, `&&`, `||`, `??` and the ternary `?` (not `?.`). Strings and comments are taken out first. Counted over every class in the model, including the classes they extend.
- **Why decisions, not size:** **writing dense code gains nothing**, since only fewer real choices count. This answers the code-golf worry.
- **The busiest method** is shown beside it, the method holding the most decisions, so crowding shows if anyone chases the number.
- **Tests met per decision** is the headline ratio.
- **Each change is named** by `changeKind`:
  - *it breaks what was met*;
  - *more met for no more decisions: structure*;
  - *met by a new part, the rest untouched: new capability*;
  - *a patch, adding to existing code to meet one test*;
  - *one change, many met: structure*;
  - *met by adding decisions*;
  - *nothing more met*.

  `inPlace` (decisions added to parts that were already there) separates new capability from a patch.
- **Met on arrival:** new tests written in an iteration that the previous model already met, with no change. A model that predicts is worth more than one tuned to the tests. This is the guard against overfitting.
- **One number, in the mock-up only:** `score = 100 × (met ÷ decisions) × arrival × spread`, where arrival = 0.5 + 0.5 × (met on arrival ÷ arrived), and spread = 1 − (busiest method's decisions ÷ all decisions). Every other figure stays beside it.
- **The mock-up section, "Versions of the model,"** is clearly marked as made up (a warning callout). It shows versions v1 to v6 over five iterations, so people can see how the signal might read over time: a compression chart, a met-per-decision chart, decisions against tests met, and a table. Its storyline: a patch in v2 for platform messages, new capability in v3 with Announcement, structure in v4 (messages by priority, several per train, which would meet RUL-2 for Ely), structure in v5 (a notice period as a domain primitive), then a patch in v6 (a special case for Dover Priory), which the signal flags.
- **Principle:** evidence for people, never a target.

## 10. The prototype

Below the boards, the departure board itself is run by each iteration's model:

- **The afternoon:** `TIMETABLE` (nine trains as they stood at 13:55) and `FEED` (the updates as they arrived, from 13:58 to 14:31, the notable ones marked). An `sb-scrubber` runs from 13:55 to 14:35. At any minute the trains are rebuilt from the timetable plus the feed so far, and the model of the iteration being viewed decides every cell.
- **The prototype draws; the model decides.** The board's rows, Expected and Platform columns and message lines all come from `Board` methods.
- **`sb-outliner`,** set into the page, lists the board's objects (the board, each train and its primitives) and lights the prototype both ways.
- **Double-click** any line, cell or entry for the **object view**: a full-size `sb-modal` titled "Train at 14:09, in iteration 2", holding `sb-tabs`.

### The object view

Every tab is derived.

- **Entity:**
  - **Now:** `sb-json` of the instance, the feed's changes spotlit, with the behaviour that needs nothing more (`expected()`, `platformChanged()`) and the call that gave what the board shows.
  - **Code:** `sb-code`, the class source, with decisions per method.
  - **Relations:** `sb-erd` drawn from the model's properties.
  - **Over time:** `sb-timeline` from the feed.
  - **Tested by:** from watched runs.
  - **Definition:** `sb-callout`, the definition of its name, or a flag.
  - **Provenance:** `sb-lineage`, the part's own lineage among every card the engine links, drawn with the boards' own cards in columns in the order knowledge flows.
- **Primitive:**
  - **Now**.
  - **Constraints:** `sb-rule`, from `static constraints`.
  - **Values seen:** `sb-bars` of the live instances.
  - **Code**.
  - **Tested by**.
  - **Definition**.
  - **Provenance**.

These are the first steps towards an `sb-entity` and an `sb-primitive` that take these views through slots (whether they earn components of their own is decided when they're built).

## 11. Opening things

- **A card on a board** opens in `sb-modal`, laid out with its main strips on the left and its folds (sources, options, founded on) opened on the right.
- **A source** opens in `sb-source` inside `sb-modal`, with every passage cited by a card marked and named by that card. Opened from a passage, it goes to that passage. The source texts live inline in `SOURCE_TEXT`, because a page opened from disk can't read files. The board stills are drawn as SVG.
- **Modals stack:** card, then source, then object. The ones behind dim, and a click in an inner modal is ignored by the outer one (`sb-modal` 0.1.2).

## 12. Sandkit components this demo uses or changed

It uses `sb-discovery-card` for every card, `sb-lineage` for the boards, `sb-modal`, `sb-source`, `sb-rule`, `sb-scenario`, `sb-outliner`, `sb-scrubber`, `sb-tabs`, `sb-json`, `sb-code`, `sb-erd`, `sb-timeline`, `sb-bars`, `sb-callout`, `sb-chart` and `sb-table`, and the shell.

Changed for it:

- **`sb-modal` 0.1.1–0.1.2:**
  - sizes, including `size="full"`;
  - `--sb-modal-height`;
  - `expandable` (a button and an `sb-size` event);
  - stacking documented, with clicks in an inner modal ignored by the outer.
- **`sb-source-trace` 0.1.2:**
  - `drawNode(node)` returns an element or null, so the sandbox draws the trace's nodes in its own look;
  - `nodeSize` sets their size;
  - frames get `--own`, and the layout and lines read the instance's size.

Known component issue: `sb-scenario` marks "14:15" as two numbers.

## 13. How we work on it

- One small step at a time; the author decides. Propose, recommend, then build.
- A demo first for every change; check it in Chrome via `python3 -m http.server 8765 --bind 127.0.0.1`, cache-busting with `?v=N`.
- No tests for demo-only commits. A component change runs only that component's `test.html`.
- Plain words. "The agent" in prose; never name a particular AI.
- No retail examples (transport, logistics, power grids…).
- Commit only when asked.
- Branch: `domain-discovery-engine-experiment-2`. There's another discovery-engine branch; the author asked that it **not be read**, so this work isn't biased by it.
