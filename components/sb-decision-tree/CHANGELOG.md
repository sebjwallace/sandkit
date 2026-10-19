# sb-decision-tree changelog

## 0.1.2 · 2026-10-19
- An outcome can have a `key`, so outcomes worded alike can stay distinct (or differently worded ones count as one) when marking the answers that would have changed the outcome. Without one, the text is still the identity. Each wording is listed once in "→ …".
- The manifest says how to bring a node into view: scroll to its `data-ref`, as `goTo` does.

## 0.1.1 · 2026-10-18
- Nodes carry `data-ref` with their id, beside `data-node-id`, so a sandbox can find them on the page.

## 0.1.0 · 2026-10-17
- First release. A decision tree laid out down or across, with one case traced through it: its value at each question, the rest faded, and the answers not taken that would have changed its outcome marked with where they lead. Counts thicken the busier branches.
