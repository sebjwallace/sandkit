# sb-store changelog

## 0.1.1 · 2026-11-05
- Amounts are exactly zero when nothing happened. Rounding could report a spill of about 5e-15 when nothing should spill, misleading a model testing `spilled > 0`, and could make a reject policy refuse an amount that fit. Amounts that happen are accurate to rounding (relative 1e-9), and a level that reaches a bound sits exactly on it.
- The manifest says what to expect of amounts, warns that a store starts empty unless given a `level`, and adds examples of a store that starts full and of running across a range.

## 0.1.0 · 2026-11-04
- First release: a level between a floor and a ceiling, with `create`, `fill`, `take`, `step` and `lasts`, the `POLICIES` it recognises, and `invariants` for a sandbox's model tests.
- What each subject pulled: a household stockpile and a rainwater tank shaped `step`, in before out, and `lasts`; a bank account the negative floor and `shortfall: reject`; a venue `overflow: reject`; a home battery spill as a meaningful output, not just loss.
