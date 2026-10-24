# Sandkit changelog

Sandkit's own version covers the practices, the sandbox template and the tools. Each component, and the shell, has its own version and changelog in its folder.

Versions follow [semantic versioning](https://semver.org). Until 1.0, a breaking change raises the minor version (0.1 to 0.2) and anything else raises the patch version (0.1.0 to 0.1.1). Breaking entries say how to migrate.

## 0.2.53 · 2026-10-24
- `sb-board` renamed `sb-kanban` (0.2.0), while no sandbox uses it.

## 0.2.52 · 2026-10-24
- A style guide, `STYLE.md`: the materials that make things recognisable (paper, the record card, the mode frame, the agent's dashed circle, ink) and which components wear each, the theme tokens and their fallbacks, tones, lighting, shapes and type, and where components differ today. Copied into every sandbox, linked from the domain components practice and the template's `AGENTS.md`, and from the readme and contributing guide.
- Using Sandkit saves tokens, and the guides now say why: the building guide, the template's `AGENTS.md` and the readme explain that a manifest is the part a sandbox needs, about a third of a script's size. Copying by hand uses a copy command, never reading files and writing them out, and a component's source is read only as a last resort. The building guide also says Sandkit's own examples and demos load its files directly because they live inside it, which a sandbox shouldn't copy.

## 0.2.51 · 2026-10-24
- A new practice, `practices/domain-components.md`: a sandbox's own components, for things in its subject that appear in more than one place. When to make one, composing them from Sandkit components, a function in `parts.js` before a custom element, and listing them in `AGENTS.md`. Linked from the building guide, the highlighting practice and the catalog; the template's `AGENTS.md` has a section for them.

## 0.2.50 · 2026-10-24
- Fifty-six components: added `sb-stamp`, a status pressed onto the page like a rubber stamp, set from the model and marked stale, with the reason, when the model has moved past it.

## 0.2.49 · 2026-10-22
- Fifty-five components: added `sb-outliner`, everything on a page that can be pointed at, in a floating panel: pointing lights a whole trace across the page, and pins keep traces lit while people work, following the model, with a gentle glow.
- The highlighting practice: `sb-highlight` can carry a trace in `refs`, and a new section, "Keeping things lit", covers `sb-pins`, the pinned classes, glow and a `pinnable` helper beside `pointable`. The locating practice's `announce` takes a trace.
- The shell has panels, opened from header buttons (shell 0.1.8). The building guide suggests an outliner once the model has traces, and inspect mode once it has labels people could misread.

## 0.2.48 · 2026-10-22
- Keys for modes: each mode's first letter turns it on, and again goes back to Explore (shell 0.1.7). The modes practice says so.

## 0.2.47 · 2026-10-22
- Fifty-four components: added `sb-inspect-mode`, Inspect in the shell's mode picker: point at any part to be told exactly what it is, in a card the sandbox fills, and click to hold it. The modes practice lists it.

## 0.2.46 · 2026-10-21
- Fifty-three components: added `sb-accordion`, sections that open and close and still say what's going on while closed: a note from the model, a dot when what's inside changed, and a tint when something highlighted is inside. The locating practice lists it.
- The shell's themes have a drop, `--sb-drop`, lift's opposite, for layers nested past where lifts still stand apart (shell 0.1.6).

## 0.2.45 · 2026-10-20
- A new practice, `practices/workshops.md`: working through a sandbox's model with the people who know the subject, until they understand it, have corrected it and own it. Principles, roles, preparing, the workshop page, the activities and the components for each, the round trip with the agent, driving attention, and closing. Linked from the README, the building guide, the catalog and the template's `AGENTS.md`.

## 0.2.44 · 2026-10-20
- Fifty-two components: added `sb-handoff`, handing something to the agent as one precise prompt, shown on the page, with whether it's been sent and the agent's reply once it's in.

## 0.2.43 · 2026-10-20
- Fifty-one components: added `sb-poll`, a question put to a group with every answer hidden until all are in, then revealed together; with an outcome, a prediction. Options and people can be any content, through slots.

## 0.2.42 · 2026-10-20
- Fifty components: added `sb-person`, a person as a badge: name and role, an agent marked with a dashed circle, and every badge for a person lit up when one is pointed at.

## 0.2.41 · 2026-10-20
- Sandkit names no particular AI: the sources practice has an agent sign its own analyses as `Agent`, and the examples, demos and tests say "the agent".

## 0.2.40 · 2026-10-20
- The locating practice lists `sb-notebook`: its sections' bars are marked when given a `ref`, and `reveal` opens the section holding a ref.

## 0.2.39 · 2026-10-20
- Forty-nine components: added `sb-notebook`, a workshop's sections in one page: each with its kind, who and when, and the codes it cites counted from `data-ref`; key sections open, asides collapsed, an outline and up and down to move around, and filters by code, kind and person that open what matches.

## 0.2.38 · 2026-10-20
- Forty-eight components: added `sb-choice`, a decision as a card: the options weighed with their pros and cons, the one chosen and why, who decided and when, what it replaces, and what the record is missing. With `editable`, a group records decisions in a workshop, and the sandbox saves each one.

## 0.2.37 · 2026-10-19
- Modes: commenting and tracing are modes, offered one at a time in the shell's new mode picker (shell 0.1.4), and sharing one amber look. A new practice, `practices/modes.md`, and a Modes section in the catalog, apart from the components that show a subject.
- Forty-seven components: added `sb-trace-mode`, Trace in the mode picker: click any part to see why it's there. `sb-comments` 0.2.0 is now a mode too (breaking: move it to `slot="modes"`).
- Every new sandbox has comment mode: the template puts `sb-comments` in the shell, wired once in `sandbox.js`, and `tools/setup.mjs` always copies it. The sources practice's "Tracing" uses `sb-trace-mode`; the building guide and feedback practice say where modes come from.
- The control-room and checkout examples use the mode picker.

## 0.2.36 · 2026-10-19
- Serving is documented where people and agents start: the README's Getting started says to ask the assistant to serve a sandbox that shows its source material, and "Showing the working" describes the sources practice and tracing, now they exist. The building guide says to serve such a sandbox, in step 1 and in the handover's Open.

## 0.2.35 · 2026-10-19
- Forty-six components: added `sb-source-trace`, why something in the model is there as one graph flowing left to right, from the sources to what rests on it. `tools/analyse.mjs trace` runs it from Node. The sources practice gains "Tracing", with trace mode; the locating practice lists it.
- A fourth example, `examples/control-room/`: a power grid control room's frequency screen, every part traceable to invented but realistic sources, with Sources and Trace in the header. Served from Sandkit's root.

## 0.2.34 · 2026-10-19
- Forty-five components: added `sb-sources`, a sandbox's source material as cards of paper to search, filter and sort, with how many sources each filter value would show, a slider for the dates written, replaced sources marked and files not yet catalogued listed apart. The sources and locating practices list it.

## 0.2.33 · 2026-10-19
- Forty-four components: added `sb-source`, one source as a sheet of paper with the passages the model cites marked where they are and quotes it can't find listed. The sources practice shows sources with it; the locating practice lists it.

## 0.2.32 · 2026-10-19
- Added the sources practice: source material kept in `sources/`, described in one `catalogue.json`, arrivals processed from `sources/inbox/`, never edited but superseded, and cited from the model's `ITEMS` by quote, page, region or annotation, never by line. Added `tools/sources.mjs check`, copied into sandboxes. Files that can't be read as they are get a readable copy, catalogued as derived from the original. The template has an empty catalogue, an inbox and `ITEMS` in `model.js`; the identifiers, journal, building and pages practices point to it.

## 0.2.31 · 2026-10-19
- Added `tools/serve.mjs`, which serves a sandbox on this computer only, so pages can list its files and save into `sources/inbox/`. Opt-in: pages still open by double-clicking, and only features that need files ask for it. `tools/setup.mjs` copies it into sandboxes.

## 0.2.30 · 2026-10-18
- Highlighting practice: "Your own parts", so hand-built parts point, light up and are found like components: `data-ref` on each, one `pointable` helper per container, lit with the sandbox's own `is-lit` class in theme colours, SVG notes, and `reveal` on parts that hide things. "Wiring the rest" announces for components that don't, such as `sb-c4`, from their `data-ref`. The template's `style.css` has the `is-lit` rules; the locating and building practices point to the section. `test/own-parts` checks the snippets.

## 0.2.29 · 2026-10-18
- Forty-three components: added `sb-rule`, one rule as a card, a mandate or a conditional, with the branch in force and whether it holds shown as the model changes. The locating practice lists it.

## 0.2.28 · 2026-10-18
- Forty-two components: added `sb-scenario`, a Given / When / Then scenario as a card, its steps lit up by their refs and the step happening now marked. The locating practice lists it.

## 0.2.27 · 2026-10-18
- Pages: added the pages practice, for sandboxes that grow or need sharing in parts, with one model shared by every page, `sandbox.js` listing the name, goal and pages once, and data loaded as scripts. Added `tools/export.mjs`, which exports one page as a single HTML file that still runs, listing every file it put in; the shell's new Export button (shell 0.1.3) gives people the prompt asking their agent to run it.
- The template has `sandbox.js`, and its `index.html` includes it and the Export button rather than writing out the goal; `templates/page.html` starts new pages. `tools/setup.mjs` copies the page template and the export tool into sandboxes, and adds tags only for the components named, with `--page` for a page other than `index.html`. The building practice links the pages practice.

## 0.2.26 · 2026-10-18
- Forty-one components: added `sb-ontology`, kinds of things and how they relate, shown a few at a time with what each kind inherits and the model's problems marked. Two new principles: readability over completeness, and components render while models compute, any exception approved by the author first. The building practice suggests an ontology as a model's data when the subject is kinds and relations; the locating practice lists `sb-ontology`.

## 0.2.25 · 2026-10-18
- Forty components: added `sb-dependencies`, what goes with what in a data set, near-misses first with the samples that break them; its core also runs from Node. `tools/analyse.mjs` takes an analysis's flags without a value (`--pairs`). The building practice finds dependencies after profiling, treating rules as candidates and exceptions as questions. `sb-profile` 0.1.1 points to it.

## 0.2.24 · 2026-10-18
- Thirty-nine components: added `sb-profile`, a data set's shape and value domain, with what's surprising marked. It is the first component with a core, an analysis that also runs from Node. Added `tools/analyse.mjs`, which runs any component's core on JSON or JSON Lines files. The building practice profiles data sources first.

## 0.2.23 · 2026-10-18
- The template and every component demo cap their main area at `--sb-page-width`, so a viewer's Page width setting (shell 0.1.2) takes effect; without one, each keeps its own width (the template's is the whole window).

## 0.2.22 · 2026-10-18
- Thirty-eight components: added `sb-comments`, comments from the people exploring a sandbox, each citing what it's about. Added the feedback practice: collecting comments, and what the agent does on receiving them. The journal, identifiers and building practices cite feedback (`FB-`), and the locating practice gains `refsAt`.

## 0.2.21 · 2026-10-18
- Thirty-seven components: added `sb-tour`, a guided tour of the page as it stands. The locating practice's `goTo` returns the place it went to (still truthy, so nothing that checked it changes), finding it again if revealing redrew what holds it, and the practice gains "Touring the page". `sb-panel` 0.1.3 respects `hidden`.

## 0.2.20 · 2026-10-18
- Thirty-six components: added `sb-xref`, where a thing appears and what it's linked to.

## 0.2.19 · 2026-10-18
- The locating practice says why a walkthrough's hidden steps aren't gone to: its steps are what reveal.

## 0.2.18 · 2026-10-18
- `sb-timeline` and `sb-board` 0.1.1 carry `data-ref` for the locating practice, beside their documented `data-id`.

## 0.2.17 · 2026-10-18
- For the locating practice: `sb-wireframe` 0.1.1's `reveal` takes a place and says whether it found the part; `sb-panel` 0.1.2 gains `reveal`, expanding a collapsed panel; `sb-image` 0.1.1 marks its marks with `data-ref` and gains `reveal`.

## 0.2.16 · 2026-10-18
- More components mark their parts for the locating practice: `sb-log`, `sb-flowchart`, `sb-statechart` and `sb-decision-tree` 0.1.1 carry `data-ref`.

## 0.2.15 · 2026-10-18
- The checkout architecture example gains chapter 5, when payment fails, completing its first plan.

## 0.2.14 · 2026-10-18
- `sb-table` 0.1.2 is framed, so a table has a clear edge against the page, and 0.1.3 shades its heading row.

## 0.2.13 · 2026-10-18
- The checkout architecture example gains chapter 4, where it's kept: the database's tables and rows, each write replayed. `sb-erd` 0.1.1 marks entities and fields with `data-ref`.

## 0.2.12 · 2026-10-18
- The checkout architecture example gains chapter 3, what's sent: each message's JSON, with the fields that matter spotlit.

## 0.2.11 · 2026-10-18
- The template's page takes the whole window, so diagrams have room, while paragraphs keep their own readable width. Existing sandboxes keep their width until they choose to change it.

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
