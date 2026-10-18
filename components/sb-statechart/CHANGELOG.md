# sb-statechart changelog

## 0.1.1 · 2026-10-18
- States carry `data-ref` with their id, beside `data-state-id`, so a sandbox can find them on the page.

## 0.1.0 · 2026-10-17
- First release. A statechart with nested states, parallel regions, history, guards and actions, laid out automatically. Shows every active state, what can happen now and what a guard holds back, and numbers the last step's exits, transitions and entries in order. `initial()` and `next()` work out SCXML semantics without changing anything; `sendable` lets viewers send events; states fold into one box.
