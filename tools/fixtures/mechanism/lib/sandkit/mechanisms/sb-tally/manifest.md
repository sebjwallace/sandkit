# sb-tally

Use this mechanism through the interface below; see the mechanisms practice. A fixture for Sandkit's own tests: a count that rises by what's added, up to a limit.

- **Settings:** `limit` (items).
- **Operations:** `SbTally.create(limit)`; `SbTally.add(tally, amount)` returns `{ tally, added, turnedAway }` (items).
- **Invariants:** `added + turnedAway === amount`; `0 <= count <= limit`.
