# Journal

What changed in this sandbox, and why: one entry per change, newest first, only ever added to. Each entry is a version. See the [journal practice](../../practices/journal.md).

## 0.2.1 · 2026-10-27 · Changed

**Changed:** Why it's there is drawn in `sb-lineage`, built by `traceLineage` in the page: sources on paper, then parameters, rules, assumptions, requirements and screen parts in columns, fitted when it opens. Choosing an item traces it; choosing a source opens it.
**Why:** Sandkit retired `sb-source-trace` for `sb-lineage`.

## 0.2.0 · 2026-10-25 · Breaking

**Changed:** The agent's analysis of the interview and the fault log is no longer a source. ASM-1, falls twice as fast on windy nights, now cites the fault log (SRC-3) and the interview (SRC-1) directly, with the reading in its note.
**Why:** Source material comes from outside the sandbox; what the agent writes inside it cites sources rather than being one (Sandkit's sources practice).
**Retired:** SRC-5 → removed.

## 0.1.1 · 2026-10-19 · Changed

**Changed:** Comment and Trace are modes in the header's mode picker, one at a time, trace mode now `sb-trace-mode` in place of the page's own wiring. Picking Trace works unserved; tracing a part says it needs serving.
**Why:** To try Sandkit's modes end to end, switching between commenting and tracing.

## 0.1.0 · 2026-10-19 · Added

**Changed:** The model (`model.js`): the grid's frequency after its largest unit trips, slowed by inertia and caught by fast response, primary response and demand relief, with a calm day and a windy night and extra response that can be booked; and `ITEMS`, every parameter, rule, assumption, requirement and screen part, citing the sources it rests on. Chapter 1, the first seconds after a trip. Six sources catalogued as SRC-1 to SRC-6, one email left in the inbox. Sources and Trace in the header.
**Why:** To try Sandkit's sources and traceability end to end: from a button on a screen, back through the reasoning to the words of the people and documents behind it.
**Open:** PAR-2's second citation is broken on purpose. QST-1 cites nothing, on purpose.
