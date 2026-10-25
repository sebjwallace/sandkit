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
- **The sandbox is where experiments run.** Experiments on the model are instant and free of risk, so a prediction can be put in doubt before the world has to answer. That is the principal idea behind the whole toolkit.
- **What brought a card about is linked only in the iteration where it did.** Later, the card stands in force and that history stays on the card.

## Plan

### Next

1. **What we're building, next steps.** The Trying stage (integrating a proposal against the scenarios and rules); the fuller compression signal (special cases, one change passing many, explained on arrival; see the author's notes), so a proposal earns its place if the model explains more with less, and is rejected if it only adds a special case; the Announcement entity, which would let SCN-6 run; RUL-2's finding, that a delayed train whose platform changed only tells its delay (the board has one message line); and whether the board shows the whole model each iteration or only what changed, as it does now.
2. **Events,** a third kind of model part beside entities and domain primitives: things that happen in the domain, the "When" of a scenario. Not every model has them. The board on its own has none (it works purely from state), but iteration 2's PA announcement depends on *when* a platform change is confirmed, so "platform change confirmed" is the domain's first event. Founded on a definition of its name, like the other parts.

### To pick up

3. **Trace.** Click any card, or any part of the prototype, to trace it back to its sources: `sb-trace-mode` with `sb-source-trace` in a modal. Every card's links (founded on, cites, rests on) already exist. Overlaps with the connections view (a trace is the connections running back to the sources).

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

### Tidying

16. **The sections below the boards** repeat what the boards and their modals now show; decide what the page keeps.

### Sandkit, beyond this demo

17. **`sb-scenario` splits times:** "14:15" is marked as two numbers, 14 and 15. A component change, for the author to schedule.
18. **A faster test runner:** a path filter and pages run in parallel, so one component's tests run alone. The author's to schedule.

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
