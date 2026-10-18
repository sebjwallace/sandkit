# Sandkit changelog

Sandkit's own version covers the practices, the sandbox template and the tools. Each component, and the shell, has its own version and changelog in its folder.

Versions follow [semantic versioning](https://semver.org). Until 1.0, a breaking change raises the minor version (0.1 to 0.2) and anything else raises the patch version (0.1.0 to 0.1.1). Breaking entries say how to migrate.

## 0.2.10 · 2026-10-18
- The checkout architecture example gains chapter 2, placing an order. `sb-sequence` 0.1.1 marks participants, and messages and notes given an id, with `data-ref`. `sb-walkthrough` 0.1.1 frames each view.

## 0.2.9 · 2026-10-18
- The locating practice says when to skip `goTo`: when you know which view you mean, call its `reveal`. Words that go somewhere keep their target in an attribute of their own, not `data-ref`.

## 0.2.8 · 2026-10-18
- Added a third example sandbox, checkout architecture: chapter 1, the parts, with names in the prose that go to their part. `sb-c4` 0.1.1 marks its boxes and lines with `data-ref`, and `reveal` says whether it holds the element.

## 0.2.7 · 2026-10-18
- More components mark their parts for the locating practice: `sb-id` 0.1.2, `sb-table` 0.1.1, `sb-rules` 0.1.1 and `sb-graph` 0.1.1 carry `data-ref`.

## 0.2.6 · 2026-10-18
- Added the locating practice: finding everywhere a ref appears on the page and going to it, through closed tabs and folded branches. `sb-tabs` 0.1.3 gains `reveal(ref)`; `sb-tree` 0.1.1 marks its nodes with `data-ref`.

## 0.2.5 · 2026-10-18
- Added the journal practice: a sandbox records what changed and why in `JOURNAL.md`, each entry a version, and retired codes in its model.
- The template has a `JOURNAL.md`, and `AGENTS.md`'s Roadmap is now **Where it stands**, with the version and open questions. Setting up only copies the template into new sandboxes: to add a journal to an existing one, follow "Adding a journal to an existing sandbox" in the practice.
- The guide records each iteration in the journal before handing over, and its handover gives the new version.

## 0.2.4 · 2026-10-17
- Thirty-five components: added `sb-venn`, two or three overlapping sets with every region named and counted.

## 0.2.3 · 2026-10-17
- Thirty-four components: added `sb-statechart`, a statechart with nested states, parallel regions and history.

## 0.2.2 · 2026-10-17
- Thirty-three components: added `sb-decision-tree`, a decision tree that shows the way a case went.

## 0.2.1 · 2026-10-17
- Thirty-two components: added `sb-timeline`, a timeline of events.

## 0.2.0 · 2026-10-17
- **Breaking:** `sb-timeline` is renamed `sb-scrubber`, freeing the name for a timeline of events. See `components/sb-scrubber/CHANGELOG.md` to migrate.

## 0.1.6 · 2026-10-17
- Thirty-one components: added `sb-board`.

## 0.1.5 · 2026-10-17
- Thirty components: added `sb-annotate`.

## 0.1.4 · 2026-10-17
- Twenty-nine components: added `sb-image`.

## 0.1.3 · 2026-10-17
- Twenty-eight components: added `sb-json`.

## 0.1.2 · 2026-10-17
- Twenty-seven components: added `sb-modal`.

## 0.1.1 · 2026-10-17
- Highlighting practice: pointing shows, clicking acts, with dashed and solid underlines telling prose words apart.

## 0.1.0 · 2026-10-17
- First release: the building-a-sandbox, highlighting and identifiers practices, the sandbox template, `tools/setup.mjs`, the shell, and twenty-six components (`sb-bars`, `sb-c4`, `sb-callout`, `sb-chart`, `sb-code`, `sb-controls`, `sb-erd`, `sb-flowchart`, `sb-graph`, `sb-grid`, `sb-id`, `sb-log`, `sb-math`, `sb-matrix`, `sb-panel`, `sb-parameters`, `sb-plane`, `sb-rules`, `sb-sequence`, `sb-stat`, `sb-table`, `sb-tabs`, `sb-timeline`, `sb-tree`, `sb-walkthrough`, `sb-wireframe`).
