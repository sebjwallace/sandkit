# Next steps

The plan for the Domain Discovery Engine, each item in enough detail to pick up without the conversation it came from. Numbers match `NOTES.md`. Keep both up to date: when an item is done, move it to Done in `NOTES.md` and delete it here.

The working rule: **one small step at a time, the author decides.** Propose an item briefly with a recommendation, build it once agreed, show it in the browser, and commit only when asked.

---

## Next

### 1. What we're building, next steps

The foundry can try a proposal, but nothing yet takes the result into the model. Several pieces, roughly in this order:

1. **Define Announcement first.** ENT-4 is flagged "no definition of its name". Add a definition card (say DEF-6, "Announcement: a PA message telling passengers of a change…"), set in a source from iteration 2 (SRC-13's minutes or the agreement SRC-14). Found ENT-4 on it. The flag disappears, which is principle 7 working.
2. **Integration as a decision.** A decision card on Where we're going, "Integrate Announcement":
   - its options are integrate, reject, or modify and retry;
   - it rests on RUN-3, whose report recommends it;
   - deciders are people (the station team or the modelling team);
   - it brings about iteration 3's model: a new `MODEL` entry with `'ENT-4': Announcement` and `changedBy: { 'ENT-4': 'DEC-n' }`.

   ENT-4 then moves from Trying to Integrated, and RUN-4 appears as the model's run for iteration 3. Never automatic: the run recommends, people decide (principle 11). A rejection keeps the report's reasons on the part, as ENT-3's is kept.
3. **Proposed scenarios and rules as their own stage.** (The engine now follows a scenario or rule written without code, keeping the status its record says, so a written `status: 'proposed'` already works; what's open is whether acceptance should be worked out, and from what.) Tests are currently written and immediately run. Perhaps they too are proposed (from cards), then accepted as specification. That would make a test that's wrong visible before it's met or not. Decide whether this earns its place (principle 5) before building.
4. **Rethink messages so RUL-2 is met without a patch.** The board has one message line, so the Ely train (late *and* moved) tells only its delay. The mock-up imagines "messages by priority, several per train" as v4, a structural change. Doing it for real is **the compression signal's real test**: a patch (another `||` in `messageFor`) should read as a patch, and a restructure should meet RUL-2 with no more decisions, or fewer. Ground it in the domain first: does the real board cycle messages? That's a question card, and maybe an investigation.
5. **The whole model, or only what changed?** (The engine's `standing(k)` gives everything standing, as the Scenarios board uses; What we're building could use it too.) Does What we're building show every part each iteration, or only parts whose version or stage changed, carrying the rest in like other boards do? Today parts reappear only when changed. Decide what reads best as the model grows.

### 2. Events

A third kind of model part beside entities and domain primitives: **things that happen in the domain**, the When of a scenario.

- Not every model has them. The board alone has none, since it works purely from state.
- But iteration 2's PA announcement depends on *when* a platform change is confirmed. So **"platform change confirmed"** is the domain's first event: SCN-6's When, and Announcement's `confirmedAt`.
- An event is founded on a definition of its name, like the other parts.
- It needs its own prefix (EVT), a card (name, what it carries, when it happens, what reacts to it), a class (`static carries`, perhaps), and a place on the foundry board.
- The prototype's `FEED` is already a stream of what happened. Events might be how the feed and the model meet: each feed update becomes an event the model reacts to, instead of fields set directly.
- Keep it loose: borrow, don't import a whole event-driven design.

---

## To pick up

### 3. Trace

Click any card, or any part of the prototype, to trace it back to its sources: `sb-trace-mode` with an `sb-lineage` in a modal.

- The object view's Provenance tab already lays every card the engine links out in `sb-lineage`, drawn as the boards draw them, with the part as its subject (`provenanceView()`), so this is mostly wiring.
- It overlaps with the connections view (item 5): a trace is one direction of it.
- **The trace flags a gap:** an investigation rests on nothing cited, since gathering a source isn't citing it. Decide whether "gathered" should count as a link in a trace or stay distinct.

### 4. Supersedes

The engine has it (`engines/discovery` 0.2.4): a record names what it `supersedes`, the old one reads `superseded` from then on, links to its successor ("replaced by") and comes back in that iteration. SCN-7 supersedes SCN-5. What's left is the page's:

- **On the superseded card,** a strip saying by what and when. Today it only carries the status, and its board note still reads "updated: new material arrived", which is wrong for a replacement: it should say "replaced by SCN-7".
- **On the boards,** perhaps struck through, as `sb-sources` strikes a superseded source.
- **Modify and retry:** a modified proposal for the model returns as a new proposal superseding the old one (ENT-5 supersedes ENT-4, say). That's how "modify and retry" in item 1 works; the engine already handles it.

### 5. A connections view

Clicking a card opens another kind of modal showing how it connects to **every** other card, not just along one board: a knowledge graph around it. Neighbours at one or two steps, across all three boards and every iteration, labelled with the relation (rests on, founded on, brought about, supersedes, tests, measures…). It could use `sb-graph` or a radial layout. Keep it readable: about 20 nodes, filter or step out rather than dump.

### 6. Passages as objects with ids

Done (2026-10-26) as **excerpts**: see `NOTES.md`. What's left:

- **What a scenario rests on directly.** `excerptsOf(id)` walks all the way back, so SCN-7 gets 14 excerpts through DEC-1. A view showing the excerpts behind a scenario might want only those it's founded on, one or two steps back, with the rest on request.
- **Clicking the prototype to its excerpts.** The prototype's objects know their parts; a part knows what it's founded on; `excerptsOf` gives the rest.
- **Excerpts as images and rows in the demo.** Every excerpt here is words, even those of the board stills (SRC-2) and the data sources; the stills' regions still live in the page (`STILL_PASSAGES`). Giving those excerpts their `region` or `rows` would show them as the card can.

### 7. Source material versus cards

What people gather is source material; whatever the agent writes is a card, never a source. Investigations now gather sources, but two of the agent's own products still pose as sources:

- **SRC-6, the agent's analysis of the stills:** it becomes inference and observation cards, resting on SRC-2's passages.
- **SRC-15, the model run:** it becomes an experiment on the model, with its results as observations, or simply a RUN.

Claims citing SRC-6 then rest on those cards instead. Check that standing and basis still read right afterwards; "inferred" basis exists for exactly this.

### 8. A basis pill on claims on the board

The full claim card shows basis (observed, reported, inferred, assumption, conjecture); the board face doesn't. Add a small pill to the board face. Also consider **fact** and **cause** as claim variants: "the board shows a dash" is a fact, while "people miss trains because they don't read the message line" is a cause. A variant, not a new kind.

### 9. Constraints carry standing like claims

"Fixed in firmware" (CON-1) could be wrong. A constraint might rest on assertions and be weighed like a claim: corroborated, contested, refuted. A refuted constraint would put the decisions resting on it under review, as a turned claim does.

### 10. Risks that come true

RSK-1 (passengers don't read the message line) happened when the survey arrived in iteration 2 (OBS-3: under four in ten read it), and nothing says so. A risk could gain a status derived from observations or outcomes linked to it: *came true*, perhaps *averted*. It then reappears in that iteration and links to what made it come true, and on to DEC-2, which answers it.

### 11. Awaited material arriving

An awaited card (NEXT) should link to the source it arrives as in the next iteration (NEXT-3 → SRC-11, say), with a status: awaited → arrived. Today awaited cards just sit there. The link closes the loop visibly.

### 12. A force field view of a decision

After Kurt Lewin: what drives the change on one side, what restrains it on the other. For DEC-1: driving forces are GOL-1, the missed trains and CLM-5; restraining forces are CON-1, the cost and ASM-1's doubt. The forces would be derived from what the decision rests on, with direction from each card's role. Perhaps a tab or panel inside the decision's modal.

### 13. Parties

Not a card, but part of the engine with its own look, composed wherever needed: who wants what, who holds which views, who is bound by which agreements, and whose interests a constraint protects. Today parties are plain strings (`deciders`, `parties`, `raisedBy`, "protects"). Making `sb-person` represent a party (a person, a team or an organisation) is a **component change for the author to schedule**. Don't change it unasked.

### 14. Scenarios without a When

Most of the board's scenarios are Given … Then. Perhaps the scenario card shows an empty When, saying none is needed ("nothing happens: the board works from state"). It may also be fine as it is. Events (item 2) may settle it: a When is an event.

### 16. Classes written to be described

- **What raw JavaScript gives:** the code, the values, the class it extends and its method names.
- **What it doesn't keep:** types. So types, behaviour descriptions and constraints are declared as statics.
- **The risk of drift:** a primitive's constraints exist twice, in words (`static constraints`) and in the constructor's check, and the two could drift apart.
- **The proposal:** declare each constraint once, with its words and its check, as `static constraints = [{ says: 'A whole number from 1 to 12', holds: n => Number.isInteger(n) && n >= 1 && n <= 12 }]`. The constructor enforces exactly those, so the Constraints tab shows the checks that really run, and a Values seen view can mark which constraint a bad value broke.
- **Later:** types might be read from JSDoc or TypeScript instead of declared.

### 17. Runtime traces of the model

Inspired by OpenTelemetry: instrument the classes so every run records **spans**, each method's inputs, outputs and the mutations it makes, as pathways through the objects.

- Watched runs already wrap classes in a `Proxy`; this extends them from "what was touched" to "what happened, in order".
- Stepped through like a debugger (`sb-code` already steps a trace), it shows how the model really works, not just what the prototype shows.
- In the object view, a "Trace" tab for the call that gave a cell: `Board.messageFor(Ely)` → `super.messageFor` → `train.delay.minutes` (6) → "Delayed due to an earlier fault".
- Builds on item 16.

---

### 21. A trace further than one step

`inputsOf(id)` gives what a record rests on one step back. A trace back to the sources, or forward to everything resting on a record, is walked by the page. A `traceOf(id)` in the engine would serve item 3 and the connections view (item 5).

### 22. What one scenario exercised

`exercisedBy(part)` gives the tests that used a part. The other way round, the parts one scenario or rule made, called and read, isn't offered, though the engine has it from its watched runs. Useful on a scenario's card and on the Scenarios board.

### 23. Prototype snippets per iteration

Feedback is made on one version of the model (`version`), from what someone saw in the prototype. Showing the prototype, or a snippet of it, as it stood in each iteration, beside the scenarios and the feedback on them, would let people see how things change over time. The engine doesn't use `version` yet; the page could, to open the prototype at that iteration.

## Sandkit, beyond this demo

These are component or toolkit changes. **The author schedules them.**

### 19. `sb-scenario` splits times

"14:15" is marked as two numbers, 14 and 15. The number-marking pattern should treat `HH:MM` as one value.

### 24. The engine's built-in view of an iteration

`iteration(k)` builds in which kinds come back when what they rest on changes, and that what brought a card about links to it only once. Those rules suit the three boards. If a sandbox needs other rules for "what changed", they'd have to become options. Leave it until one does; `standing(k)` covers following everything.

### 25. Checking quotes in records

`tools/sources.mjs check` checks the quotes in a model's `ITEMS`, not those in `records/` (claims' assertions, a question's `raisedBy`, `setIn`, `at`, `said`). Decided against for now (2026-10-26): agents are trusted to quote faithfully. Revisit if wrong quotes turn up.

### 20. A faster test runner

`node test/run.mjs` ignores paths and runs every page in a fresh, sequential Chrome. A path filter and pages run in parallel would let one component's tests run alone.

---

## Ideas raised but not planned

These were raised in conversation and are recorded so they aren't lost:

- **Automating integration:** rejected in favour of a decision for people (principle 11), but a run may *recommend*.
- **A compression score as a target:** rejected. The single number exists only in the mock-up, and never drives anything.
- **View models:** rejected for this domain (principle 9).
- **Observations from data** were discussed early on: observations are readings, often from data rows, and passages (item 6) settle how they relate to claims.
- **Foreshadowing:** rules and scenarios were foreshadowed by claims and constraints, and entities and primitives by definitions. The foundry's Founded on column is that foreshadowing made visible.
