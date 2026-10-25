# Discovery demo: notes

The Domain Discovery Engine demo models discovering how Ashford International's departure board decides what to show (the domain from `../departure-board`), as iterations of a loop, each on three boards: What we know, Where we're going, and What we're building (the foundry).

## Principles settled so far

- **Cards are never edited, only superseded or tested by later cards.** What follows from them (standing, refuted, done, review) is worked out for each iteration, so the iterations stay an audit trail.
- **Columns hold a card's role in the iteration, not its kind.** Where we're going: in force, decided, brought about.
- **Links are signal, not noise.** On Where we're going, every link answers what shaped a decision or what it brought about. Where something came from in an earlier iteration goes on the card, not on the board.
- **A new kind of card earns its place** by having parts or connections the others don't.
- **Loosely inspired by domain-driven design:** borrow pieces where they fit, never think in its terms. Parts of the model (entities, domain primitives, events, scenarios, rules) aren't cards; cards are their precursors, traced back by "founded on".
- **The model speaks the domain's words.** Every entity, domain primitive (and later event) is founded on a definition of its name; a part without one is flagged.
- **The prototype draws; the model decides.** In this domain what the board shows is domain behaviour, so it's in the model; the prototype's layout and colours aren't, and nothing like a view model is modelled. Ported to production, the model goes and the prototype stays behind.
- **Every view of a domain object is derived.** From its class, its instance, the model, the feed, the cards' links: change the entity and every view follows. Nothing in a view is written by hand.
- **The sandbox is where experiments run.** Experiments on the model are instant and free of risk, so a prediction can be put in doubt before the world has to answer. That is the principal idea behind the whole toolkit.
- **What brought a card about is linked only in the iteration where it did.** Later, the card stands in force and that history stays on the card.

## Plan

### Next

1. **What we're building, next steps.** Integrating a trial's winner (ENT-4 into iteration 3's model, once defined); proposed scenarios and rules as their own stage; the rest of the compression signal (special cases, explained on arrival); RUL-2's finding, that a delayed train whose platform changed only tells its delay (the board has one message line); and whether the board shows the whole model each iteration or only what changed.
2. **Events,** a third kind of model part beside entities and domain primitives: things that happen in the domain, the "When" of a scenario. Not every model has them. The board on its own has none (it works purely from state), but iteration 2's PA announcement depends on *when* a platform change is confirmed, so "platform change confirmed" is the domain's first event. Founded on a definition of its name, like the other parts.

### To pick up

3. **Trace.** Click any card, or any part of the prototype, to trace it back to its sources: `sb-trace-mode` with `sb-source-trace` in a modal. The object view's Provenance tab already builds the items from the cards' links and citations, and draws every node as the boards draw their cards (`sb-source-trace` 0.1.2's `drawNode`), so this is mostly wiring. Overlaps with the connections view. The trace flags one gap: an investigation rests on nothing cited, since gathering a source isn't citing it.

4. **Supersedes.** How a card is superseded, and how that shows on the boards and on the superseded card (struck through, as `sb-sources` does). A modified proposal for the model returns as a new one superseding it.
5. **A connections view.** Clicking a card opens another kind of modal showing how it connects to every other card, not just along the board: a knowledge graph around it. Supersedes is one of its connections.
6. **Passages as objects with their own ids.** Claims, observations and the rest rest on passages, not on whole sources. A source card could list its passages. Settles the overlap between a claim citing a data row and an observation of the same row.
7. **Source material versus cards.** Source material is what people gather while investigating; whatever the agent writes is a card, never a source. Investigations now gather sources, but the agent's analysis (SRC-6) and the model run (SRC-15) still pose as sources; they'd become cards (inferences, observations, an experiment's results).
8. **A basis pill on claims on the board** (observed, reported, inferred), and fact or cause as claim variants.
9. **Constraints carry standing like claims.** "Fixed in firmware" could be wrong, so a constraint might rest on evidence and be tested.
10. **Risks that come true.** RSK-1 (passengers don't read the message line) happened when the survey arrived; nothing on the board says so yet.
11. **Awaited material arriving.** Link each awaited card to the source it arrives as in the next iteration.
12. **Force field view of a decision** (after Kurt Lewin): what drives the change on one side, what restrains it on the other. Perhaps inside the decision's modal.
13. **Parties.** Not a card, but part of the engine with its own look, composed wherever needed: who wants what, who holds which views, who is bound by which agreements, whose interests a constraint protects. Making `sb-person` represent a party (a person, a team, an organisation) is a component change for the author to schedule.
14. **Scenarios without a When.** Most of the board's scenarios are Given … Then. Perhaps the scenario card could show an empty When, saying none is needed; or it may be fine as it is.
15. **One card component,** once the kinds settle: the page prepares a plain view of each card (kind, id, byline, badges, strips, folds), and the component only draws it.

16. **Classes written to be described.** Raw JavaScript gives the code, the values, the class it extends and its method names; types, behaviour descriptions and constraints are declared as statics, since JavaScript keeps no types. Primitives' constraints exist twice (their words, and the constructor's check), which could drift: declare each with its words and its check (`{ says, holds }`), and have the constructor enforce exactly those, so the Constraints tab shows the checks that run. Types might later be read from JSDoc or TypeScript instead of declared.

17. **Runtime traces of the model,** inspired by OpenTelemetry: instrument the classes so every run records spans (each method's inputs, outputs and the mutations it makes) as pathways through the objects. Stepped through like a debugger (`sb-code` already steps a trace), it shows how the model really works, not just what the prototype shows. Builds on item 16.

### Tidying

18. **The sections below the boards** repeat what the boards and their modals now show; decide what the page keeps.

### Sandkit, beyond this demo

19. **`sb-scenario` splits times:** "14:15" is marked as two numbers, 14 and 15. A component change, for the author to schedule.
20. **A faster test runner:** a path filter and pages run in parallel, so one component's tests run alone. The author's to schedule.

## Done

- **Prediction card** (2026-10-25): a decision's bet on what it will bring about, by when, measured by a later outcome. Replaced decisions' Expects.
- **Experiment card** (2026-10-25): a test run on purpose, on the world (survey, trial) or on the model (simulation), with what would bear it out written before it runs. Results arrive as observations; predictions can be supported or in doubt before an outcome measures them.
- **Metric card** (2026-10-25): a quantity tracked over time. Goals set targets on it, predictions forecast it, observations are its readings. Replaced the repeated "Measured by" text.
- **Investigation card** (2026-10-25): learning on purpose by finding what's already there. Prompted by a question, an assumption or a prediction; gathers source material. What we know now starts with Gathered (finished investigations beside their sources) and ends with Under way.
- **What we're building, first draft** (2026-10-25): the model as real code in the page (domain primitives Delay, Platform, ClockTime; entities Train and Board, Board changed in iteration 2 by ACT-1), entity and domain primitive cards drawn from the classes once integrated, and a third board: Founded on, Proposed, Integrated, Rejected. Platform proposed as an entity and rejected in favour of the primitive.
- **Definitions tied to the model** (2026-10-25): definitions of Delay, Train, Board, Platform and Clock time; each part founded on the definition of its name, and flagged when there's none (ENT-4, Announcement).
- **Scenarios and rules** (2026-10-25): written beside the model and run against it each iteration, passing or failing; opened in `sb-scenario` and `sb-rule`. What we're building gained Passing and Failing columns and a summary line. SCN-5 fails against iteration 1's model and passes against iteration 2's; RUL-2 found a real gap (Ely); SCN-6 fails until there's an Announcement.
- **What we know by role** (2026-10-25): Gathered, Captured, Interpreted, Reasoned, Assumed, Open, Under way, Awaited.
- **Tidying** (2026-10-25): claim headers no longer cramped (what rests on a claim moved into its body); the key below the boards lists every kind of card by board; links within a column run down its right-hand gap, labels in view.
- **The prototype** (2026-10-26): the departure board run by each iteration's model on the afternoon's trains, scrubbed through the feed's updates (`sb-scrubber`); the board's objects in `sb-outliner`, set into the page, lighting the prototype both ways; double-click any line, cell or entry for the object view: its instance now and its class, with the code that ran. Board gained expectedFor and platformFor.
- **Views of a domain object** (2026-10-26): the object view in tabs, every one derived. Entity: Now (`sb-json`, the feed's changes spotlit, behaviour now), Code (`sb-code`, coloured), Relations (`sb-erd` from the model), Over time (`sb-timeline` from the feed). Primitive: Now, Constraints (`sb-rule` from its class), Values seen (`sb-bars` of live instances), Code. Both: Definition (`sb-callout`) and Provenance (`sb-source-trace`). The steps towards an `sb-entity` and `sb-primitive` that take these views through slots.
- **`sb-source-trace` 0.1.2** (2026-10-26): `drawNode` and `nodeSize`, so a sandbox draws the trace's nodes in its own look while the trace does the tracing. The Provenance tab now shows the boards' own cards.
- **Tested by, from watched runs** (2026-10-26): every test runs with the model's classes watched (objects made, methods called, fields read), so a part's Tested by tab lists the scenarios and rules that really exercised it, and what they used. Integration steps 3 to 5 (tests linked to the parts they drive, trials of candidate versions, the compression signal) are next in item 1.
- **Integration, trial by trial** (2026-10-26): tests linked to the parts they drive, from watched runs; a proposal tried as a candidate model (ENT-4, Announcement, real code), its verdict the difference in tests met and broken against the model as it stands; a Trying column; Met and Not met yet; the summary line saying what the last change and each trial did.
