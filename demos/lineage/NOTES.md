# Lineage: notes

## Step 1: the lineage, by hand

Six versions on the trunk and one set aside, all in `lineage.js`, run against the quiet afternoon's eleven trains:

1. **Trains:** a time and a destination, nothing else.
2. **Cancelled:** + state (running, cancelled).
3. **Late:** + delay (none, late), with an expected time. Its rival **V3b** shows only "Delayed", and is set aside.
4. **Platforms:** + platform (confirmed, unconfirmed): a dash until it's settled.
5. **How late:** late splits into minor, major and unknown.
6. **Departed:** state gains departed, and departed trains leave the board.

- **Each version is written out in full,** sharing rules and fact readers by name. Explicit and runnable on its own, at the cost of a little repetition.
- **What a version adds is worked out, not written:** new facts, and values new or gone, compared with its parent. That's already the start of the map: columns appearing, tiles splitting.
- **The board shows only the parts a version has rules for,** so columns appear as the model grows.
- **Each line marked if it differs from the parent's,** with what it showed then, so a step's effect is visible at once.
- **A coarse model can be wrong, not just vague.** V4 shows Dover Priory, which has no estimate, as "Exp 14:12", its scheduled time. That error is what motivates V5. Low resolution has real costs, and the lineage shows where.
- Not modelled: `due`, since no rule uses it yet, and changed platforms, which the rules treat as confirmed. Both are candidates for later versions.

Rough edges (step 1): the scrubber's marks don't line up with the tree's nodes above them; the tree stays small on wide screens.

## Step 2: the map

The map draws every combination of the facts a version knows, as columns of tiles on the left and what the board shows on the right, a row per scenario. It follows the selected version, since the same code serves them all.

- **Regions, not scenarios.** Facts split one at a time, in order (`regionsOf` in `lineage.js`). Wherever nothing shown depends on a fact, its tile is left whole. V6: 24 scenarios in 10 regions.
- **The compression signal is visible.** Cancelled and departed are each one big tile spanning 8 scenarios: once a train is cancelled or gone, delay and platform don't matter. Running is a patchwork of 8, one per scenario.
- **The patchwork hides structure the map can't show yet.** Under running, delay decides the expected time and message while platform decides only the platform column: two independent strands, not 8 special cases. A map split per part of the board, rather than per whole line, would show that.
- **The order of facts shapes the map.** State first gives the big merges; another order would give different, smaller ones.
- **Hidden lines are one outcome,** whatever rules would have filled them. That's what lets departed merge.
- **No impossible combinations yet.** Every combination of V6's facts can occur, since the facts are read independently. That's a finding: the model has no invariants, so nothing is hatched out.
- **Watching the map grow already works:** V2 has 2 scenarios, V4 8, V5 16 as late splits into three, V6 24 as departed adds a third state.

## Step 3: a stress test

To see where the lineage and the map break, six more versions on the trunk and four set aside, one of them a dead branch two versions long. A twelfth train was added (Canterbury West, 35 minutes late), and two details given only where true: `bus` and `short`.

- **V7 Boarding:** + due (now, soon, later). Boarding must come before the delay rules, or late trains never board. Rival **V7b** puts it in the message line instead.
- **V8 Changed platform:** platform gains changed. Ely is moved and late with one message line, so the change wins. Rival branch **V8b → V9b**: a countdown in minutes, then for late trains too, set aside together.
- **V9 Very late:** major splits into major and severe (30 min or more).
- **V10 Buses:** state gains replaced. Rival **V10b** makes the bus a fact of its own instead of a state.
- **V11 Short trains:** + length (full, short), a message whose urgency depends on due.
- **V12 Doors closing:** due gains closing.

What broke, or showed something:

- **The map grows faster than understanding.** 24 scenarios at V6, 480 at V12; 10 regions, then 72. At a row per scenario the map is over 10,000px tall. Past about V8 it can't be taken in, which is the readability rule (a view of about 20 things) broken by the domain itself. It needs collapsing, zooming, or a split per part of the board.
- **The tree shrinks to fit half the page,** so at 13 generations its labels are too small to read. Its structure holds up: each branch has a row, and V8b → V9b shares one.
- **Message priority is the real complexity.** One message line, many reasons to use it: cancelled, bus, severe, closing, changed platform, short train due now, unknown, major, short. Each new idea is mostly a question of where it ranks. The map shows the result, not the ranking, so it can't yet say *why* a short, late train says nothing about its length.
- **Merges thin out as rules interact.** Only cancelled, replaced and departed stay as big tiles. Length and due cut across almost everything running, because one message rule mentions them.
- **The afternoon covers less and less.** Twelve trains can land in at most twelve regions: they reach every region up to V4, 7 of 10 at V6, 12 of 72 at V12. The fog step will show most of the late map as unseen, which is the point of it.
- **A version can change nothing you can see.** V12 differs from V11 on no visible train; it rests on its rule alone. Only the map shows what it added.
- **The rival V10b brings impossible combinations,** such as a running train with a replacement bus. The map draws them as ordinary regions, since nothing in the model says they can't happen. That's where invariants and hatching would earn their place.
- **Hidden trains still run every rule:** Hastings, departed, works out "Doors closing". That's harmless, but the map merging hidden lines is what keeps departed as one tile.
- **Writing each version out in full grows heavy.** V9 to V12 repeat long rule lists with one line changed. A version stored as its parent plus a change would read better, and would say exactly what each step did.

## Step 4: the map as a box of pathways

A correction from the author: the map was meant to be a morphological box, not rows. Now each fact is a column with every value once as a tile, then each part of the board (Shown, Expected, Plat, Message) with each thing it can show. A bundle (a region from `regionsOf`) draws a straight line from every tile it covers in one column to every tile it covers in the next. A hidden line stops at Shown. Pointing at a tile lights the bundles through it; pointing at a train on the board lights its own. Clicking a part's heading redraws the bundles for that part alone.

What the box shows that the rows didn't:

- **It doesn't grow with the scenarios.** V12 is about 250px tall, against over 10,000px as rows. The readability failure was the drawing, not the domain.
- **Compression is visible as a fan.** Pointing at *cancelled* in V6 lights one bundle that fans from that tile across every delay and both platforms into one *show* and one *Cancelled*. "Whatever else" can be seen.
- **Per-part strands appear as the brief predicted.** V6's platform column alone needs 5 bundles, not 10, and the delay column stops mattering to it.
- **Tracing goes both ways from the same picture.** Point at a fact for what it affects, at an output for why it's shown, or at a train for its whole route.

Where it struggles:

- **Unlit, the lines are a lattice.** Between columns whose values all combine (delay to platform, due to length) every tile joins every tile, so the resting picture is a uniform mesh that says little. The box is read by pointing, not at rest. That's the case for the knots-and-fans drawing deferred in favour of straight lines: a bundle gathered at a knot would show as one strand.
- **Output columns are put in a sequence they don't have.** Lines run Shown to Expected to Plat to Message as though each led to the next, but the parts are decided side by side. The links between output columns are an artefact.
- **Width, not height, is the new limit.** At V12 the box is about 1,465px wide, so the board's columns scroll out of sight in half the page. Long messages ("Delayed by ‹n› min due to ‹reason›. Consider other routes") make the widest columns.
- **The same text can be two tiles.** "Delayed" in amber and in red are different outputs, which is true to the rules but reads as a duplicate.
- **Flashing signs had to stop flashing** in the map, or their tiles vanished half the time; they're marked with a dotted underline instead.
