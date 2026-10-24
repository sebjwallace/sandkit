# Fulfilment: notes

## Step 1: the first versions

1. **V1 One order:** one part, one order, allocated if the stock is there.
2. **V2 Many orders:** three parts, eight orders with lines. Each hour, waiting lines take stock oldest first, whole or not at all.
   - **V2b Priority first:** a rival policy, kept beside V2 rather than set aside.
3. **V3 Deliveries:** stock known to be on its way, landing at 12:00 and 15:00; back-orders take from it first.

**Did the view need changing?** Yes. A version no longer maps facts to outputs, it runs a day, so the page gained a second axis: the clock. The lineage picks the model and the scrubber picks the hour. The board's "differs from the parent" marking carried over unchanged, now per order at the same hour, but only between versions that ran the same day: V1 → V2 changes the world, not only the rules, so they can't be compared line by line.

**Did the hypotheses hold?**

- **The allocation policy is the deep structure, and it's a single ordering.** V2 and V2b differ by one comparison function, yet 5 of 8 orders end differently. One small principle with a big effect, which is the compression signal, but seen in outcomes rather than in the shape of a map.
- **"Oldest first" isn't one policy.** Lines are allocated whole, so in V2 a later, smaller line jumps an earlier, bigger one when stock is short: O7's single oil filter goes while O5's four wait. Strict first-come-first-served would block instead. That choice (block or skip) is a second dimension of the policy that nobody stated.
- **Priority strands stock.** In V2b one coupler sits free all morning while O2, wanting two, waits. A policy can be fair by its own rule and still waste stock; that only shows when the model runs.
- **The ledger holds so far,** trivially: free plus reserved equals what was there plus what landed. Nothing ships yet, so it's untested.

**Where did the principled model stop being enough?** Already at V2. Whether an order is allocated can't be read from its own facts: it depends on which orders came before it and how much they took. The per-line decision (enough free stock or not) is still a tiny function, but its input, how much is free, is produced by every other order. Layer two arrived one version earlier than expected.

Rough edges: the left column is mostly empty; scrubbing between versions keeps the hour, but there's no way to see a whole day at once.

## Step 2: the map of one order line

The map shows what one order line's decision can see when its turn comes (free stock, then priority or stock on its way) and what happens to the line. `runDay` now makes every allocation through the version's own `decide`, so the map and the warehouse can't disagree, and every decision is kept: pointing at a tile lists the day's decisions that landed there, and regions decided at the clock's hour are marked ●.

**Did the view need changing?**

- **Quantities as bands worked,** as the brief suggested: free stock and stock on its way become none, short or enough, measured against the line's own quantity. The landmark is relative: "enough" means enough *for this line*.
- **Merging had to go finer.** The lineage page only left a whole fact as "any". Here neighbouring values that always lead to the same outcome share a tile (none · short), which is how landmarks get tested: **zero isn't a landmark** for any version yet. Only "enough or not" matters. A band earns its place only when a rule tells it apart, such as part-allocating a short line, which no version does.
- **One outcome column, not several.** A line's result is a single status, so the right-hand side is one column coloured by outcome.

**Did the hypotheses hold?**

- **The map is tiny and stays tiny:** 3 scenarios in 2 regions for V1 and V2, 9 in 3 for V3. The single-line decision is almost trivial, as the brief expected for layer one.
- **The map can't see the allocation policy.** V1 and V2 have identical maps, and V2b's shows priority as "any priority": priority never changes what happens to a line once its turn comes. It changes *when* the turn comes and how much stock is left by then. That's where the deep structure lives, and the single-line map is blind to it. The policy is the ordering that feeds the decisions, not one of them.
- **A line is decided again and again.** A waiting line is re-decided every hour until it's allocated: O3's coupler lands in "awaiting delivery" six times before 15:00. The line has a lifecycle (waiting, awaiting delivery, allocated) that the map flattens into repeated, identical decisions. That's the case for the brief's lifecycle column.
- **"Awaiting delivery" is a promise the map can't check.** The decision sees that enough is on its way for *this* line, not that other lines ahead will want the same delivery. Today every promise is kept; with more contention some would be broken, and only running the day would show it.

**Where did the principled model stop being enough?** The map holds for what it claims, a single decision, and says honestly how little that is. What decides an order's fate here is the queue (who goes first) and the stock left by everyone before, so the next views have to show the run, not the decision: the ledger for what must balance, and something showing the queue at a moment, or the outcomes map, for the policy's effect.

## Step 3: a stress test

Eight more versions on the trunk and one more rival, taking in what the brief listed: cut-offs, shipping, splits, part lines, substitutes, collection, put-away, damage and write-offs. The busy day gained four orders (two of them collected at the counter), alternative oil filters, and two brake pads found damaged at 13:00.

- **V4 Cut-off:** the 16:00 van takes orders complete by 14:00; later ones ship tomorrow. Stock is shipped. Rival **V4b Strict queue**: an earlier waiting line blocks later lines for the same part.
- **V5 Split:** priority orders ship what's ready by the cut-off.
- **V6 Part lines:** a short line takes what's there.
- **V7 Substitutes:** a line can take alternative oil filters.
- **V8 Collection:** ready when complete, gone at the time the engineer gave.
- **V9 Put-away:** delivered stock takes an hour to reach the shelf.
- **V10 Damaged stock:** two brake pads lost, recorded nowhere.
- **V11 Write-offs:** the ledger gains a term.

New views: a **second map, for the order**, and the **ledger**, with each version stating its own equation.

**Did the views need changing?**

- **Two kinds of thing, two maps.** The line and the order each have a decision, so each gets a map. They're joined by the order's *lines* fact (all, some or none of its unshipped lines covered), which is the line map's outcomes counted up. The link is stated in words; the entity boxes the brief describes would draw it.
- **The ledger needed to belong to the version.** Each version states the equation it believes (`received = free + reserved + shipped + …`), and the ledger checks it every hour. That made the conservation hypothesis something the lineage grows, like a fact: shipped arrives in V4, receiving in V9, written off in V11.
- **The maps column outgrew the screen,** so it scrolls on its own. The line map reaches 27 scenarios in 7 regions, the order map 24 in 9. Both still readable, unlike the departure board's 480, because each decision only sees a handful of facts.
- **Comparing with the parent got harder.** Whole-object comparison flagged differences that were only in what a version knows (priority, method), so it now compares only what shows. And end-of-day status hides what happened during the day: V5 splits O3 and O5, yet they end exactly as in V4, so the summary also counts units shipped (17 in V4, 27 in V5).
- **The clock's marks crowd** at 13:00 to 16:00 (damage, cut-off, D2, van) on a half-width slider.

**Did the hypotheses hold?**

- **The ledger, yes, and it found what it was built to find.** V10 breaks at 13:00 with 2 brake pads unaccounted for, the moment it happens; V11 balances. The hours strip shows the break at a glance.
- **Lifecycles, yes, and they're doing most of the work.** An order's stage (open, for the van, split, ships tomorrow, ready to collect, dispatched, collected) and a unit's state (on its way, being put away, free, reserved, shipped, written off) carry more of the behaviour than any decision does. Decisions are re-taken every hour until a stage commits, so the order map is visited 26 to 39 times a day. Neither map draws a lifecycle; the brief's lifecycle column is now clearly needed.
- **Landmarks appear only when a rule needs them,** as predicted. "none" and "short" stayed one tile until V6, when a short line started taking what's there. Then they split, in both the stock and substitute columns.
- **One allocation policy? Not quite.** It has at least three independent parts: the ordering (oldest or priority first), blocking (V4b: strict or skip), and granularity (V6: whole lines or part). They combine, and only the first is a single function. The policy is a small space of its own.

**Where did the principled model stop being enough?**

- **Promises the map can't check.** "Awaiting delivery" means enough is on its way *for this line*. In V3, O12 waited for D2's six oil filters, but O5, older, took four of them first: a broken promise, found only by running the day.
- **A new state can silently break an old fact.** In V9, stock being put away is neither on its way nor free, so lines can't see it: 5 lines flip to back-ordered for an hour, then allocated. No view flagged it; a count of broken promises over the day did. Each fact's definition depends on every state that exists, and adding a state should mean revisiting the facts.
- **Commitments carry time.** An order committed to the van at 09:00 stays committed after the cut-off, though re-deciding it at 15:00 would say "ships tomorrow". The order map shows the decision, not that it's taken once and then held. That's lifecycle again.
- **Order of facts shapes the maps here too.** With method last, "ready to collect" appears under both clock values; method first would merge them.

**What took its place:** running the day and counting across it: units shipped, stock reserved at close, decisions taken, promises broken. That's the outcomes map's job, over many days instead of one.

## Step 4: the box, and journeys for the lifecycle

From `demos/lineage/`'s step 5, the row maps become boxes: a column per fact, each value once, then a column of outcomes, with each region as a bundle of pathways that gathers at a knot and fans out. The fog comes from the day's decisions instead of trains: a line is solid where some decision went that way, dashed where only the rules say so, and lines taken at the clock's hour are in the accent colour. The page is now full width and stacked. The drawing lives in `box.js`.

New: **the journeys**, for the lifecycle. The first column lists a lifecycle's stages in order (an order's, or a line's, with a switch). Then comes a column per hour, each tile counting who is at that stage then. Each order or line threads its stage hour by hour, flat while it stays and slanting when it moves; journeys that run together share a thicker line. Pointing at a tile, or at an order card, follows the journeys through it.

What the journeys show that the maps couldn't:

- **Commitments that carry time.** The orders' journeys in V8 run flat along "for the van" from 09:00 and drop to "dispatched" together at 16:00; ones arriving after the cut-off slant straight to "ships tomorrow" and stay. The repeated decisions the maps counted (26 to 39 a day) are a handful of lines that simply hold.
- **The day's rhythm.** Deliveries and the van show as moments when many journeys slant at once (15:00 and 16:00 in V8), without being drawn anywhere.
- **A line's status isn't its stage.** In V8, O12's oil filter line is part allocated at 15:00, holding 2 filters, then becomes back-ordered at 16:00 while still holding them, because its status is its latest decision rather than where it is in a lifecycle. The journey slants back up the column, against the lifecycle's order, and that's how it showed. The model mixes "what was just decided" with "what state it's in"; a lifecycle needs its own states, and the decision should move between them.

How the boxes fared here:

- **They stay small.** The line and order boxes are three to four fact columns of two or three tiles each; a single decision here sees little, as before.
- **Fog tells which rules have been exercised.** In V8 the line box's "inbound: short" is in fog, as are most of the order box's priority and collection fans. The day tests only 6 of 7 line bundles and 6 of 9 order bundles.
- **The decisions taken now, in the accent colour, tie the boxes to the clock.** Scrub to 15:00 and D2's landing lights a burst of "allocated" and "substituted" pathways.

Where it struggles:

- **The journeys' stages are only those that occur,** so a stage nobody reached today (like "queued" outside V4b) disappears rather than showing as fog. Allowed transitions aren't drawn either; only the ones taken.
- **Lines run thick but anonymous.** Eleven lines shipped together are one thick stroke; pointing names them, but the picture doesn't.
- **Two lifecycles, one at a time.** Orders and lines are joined (an order moves when its lines do), but the switch shows one or the other, not the link between them.
