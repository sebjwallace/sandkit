# Catalog

Everything Sandkit offers, one line each. Read a practice before the components that support it, and a component's `manifest.md` for its full contract. Use components through their manifests; you don't need to read their source.

## Find by need

The same catalog from the subject's side: find the need, then read the manifest of what serves it. A component can serve several needs, and a need several components.

### How the subject works

- Something accumulates, and can overflow or run out → `sb-store`
- A supply that's met only in full, or refused → `sb-store`
- How long a supply lasts at the current rate → `sb-store`

### Running and trying things

- Let people play, pause, step and change speed → `sb-controls`
- Let people turn the model's knobs and see the effect → `sb-parameters`
- Scrub back and forth through a run, with named moments → `sb-scrubber`
- Code or an algorithm stepped through, line by line → `sb-code`

### Change and time

- Values change over time and the trend matters → `sb-chart`
- Things that happened, in order → `sb-log`, `sb-timeline`
- Moments and spans laid out in time, with now marked → `sb-timeline`
- Headline figures, their change and whether it's good news → `sb-stat`

### Rules and decisions

- Show which rule applies next and which just applied → `sb-rules`
- One rule read closely: its branch in force, held or broken → `sb-rule`
- A choice that branches on answers down to outcomes → `sb-decision-tree`
- Expected behaviour as Given / When / Then, checked as it plays → `sb-scenario`
- A decision made: the options weighed, the one chosen and why → `sb-choice`
- A status earned or lost: approved, verified, superseded → `sb-stamp`

### Structure and relationships

- Modes and transitions, with what's active now → `sb-statechart`, `sb-graph`
- A network of nodes and links, with things moving along them → `sb-graph`
- Nested things, like folders or an outline → `sb-tree`
- Kinds of things, what they inherit and how they relate → `sb-ontology`
- Entities, their fields and what refers to what → `sb-erd`
- Where things come from and what they lead to → `sb-lineage`
- Software systems, explored level by level → `sb-c4`
- Which sets things belong to, and the overlaps → `sb-venn`
- Everywhere a thing appears on the page, and what it links to → `sb-xref`

### Flow and process

- Steps of a process with branches and lanes, the current one marked → `sb-flowchart`
- Things moving through stages, with limits → `sb-kanban`
- Who sends what to whom, in order → `sb-sequence`
- A workflow lit up as it runs → `sb-graph`, `sb-flowchart`

### Space and maths

- A space of cells coloured by state, which people can paint → `sb-grid`
- Vectors, points and shapes on a plane, moved by matrices → `sb-plane`
- A matrix or vector to read or edit → `sb-matrix`
- An equation whose parts light up what they stand for → `sb-math`
- A picture, map or plan to zoom into, with places marked → `sb-image`

### Comparing and summarising

- Things compared on one measure → `sb-bars`
- Rows and columns to sort, search and filter → `sb-table`
- A large collection to search, filter, sort and group → `sb-search`
- Headline figures against their targets → `sb-stat`

### Data

- A data set's shape: fields, types, gaps and odd values → `sb-profile`
- Which fields determine others or go together → `sb-dependencies`
- JSON with the parts that matter picked out → `sb-json`

### Explaining and guiding

- Text with the parts that matter marked and explained → `sb-annotate`
- A definition, tip, warning or question set apart → `sb-callout`
- A guided tour of the page, one part at a time → `sb-tour`
- A story told across several views, step by step → `sb-walkthrough`
- A code people can point at to light up every mention → `sb-id`
- Everything on the page that can be pointed at, as an outline → `sb-outliner`
- What something is, when people point at it → `sb-inspect-mode`
- Why something is there, traced back on a click → `sb-trace-mode`
- What parts are about, and topics kept lit across the page → `sb-tags-mode`
- Searching by tags, scored, for people in Tags mode and for the agent, and pulling results onto the page → `sb-tags-mode`, `tags`
- A screen or clickable flow of an interface → `sb-wireframe`

### Laying out the page

- Chapters or views, one at a time → `sb-tabs`
- Sections that open and close, saying what changed inside → `sb-accordion`
- A view people can pop out, move and dock back → `sb-panel`
- The one thing that needs attention now, over the page → `sb-modal`
- Gathering what bears on one question side by side, laid out from rough places, with no coordinates or screenshots → `sb-board`

### Working with people

- Comments from people exploring, gathered for the agent → `sb-comments`
- A question put to a group, answers hidden until all are in → `sb-poll`
- A prediction made before the reveal → `sb-poll`
- Who someone is, and everywhere they appear → `sb-person`
- A workshop's record, in sections to filter and move through → `sb-notebook`
- Handing something to the agent, and showing its reply → `sb-handoff`
- A decision a group records together → `sb-choice`

### Sources and evidence

- The sandbox's source material, to search and filter → `sb-sources`
- One source, with the passages the model cites marked → `sb-source`
- What something rests on, back to its sources → `sb-lineage`
- Discovering a domain on purpose: cards of claims, questions and decisions → `sb-discovery-card`, `discovery`
- Weighing claims, and what stands as of each iteration → `discovery`
- What the people involved agree shapes a domain, on one sheet, to sign, test against and share as a PDF → `sb-discovery-card`, `discovery`

## Tools

Run from a Sandkit clone with Node. Not copied into sandboxes.

| Tool | What it does |
|---|---|
| `tools/setup.mjs` | Sets up a sandbox with Sandkit's files, or updates them. |
| `tools/export.mjs` | Exports one page of a sandbox as a single HTML file that still runs, listing every file that went in. Copied into sandboxes, for the agent to run when someone presses Export. |
| `tools/serve.mjs` | Serves a sandbox on this computer, so the features that read and write its files work: lists a folder's files and saves into `sources/inbox/`. Copied into sandboxes; opening pages by double-clicking still works for everything else. |
| `tools/sources.mjs` | Checks a sandbox's sources against its catalogue, its model and its excerpts: missing and uncatalogued files, unknown sources, quotes that aren't there. Copied into sandboxes. |
| `tools/tags.mjs` | `report` says how well a sandbox's tags work as a map: how far they reach and how well they narrow, then gaps, tags too broad or too narrow, crowded places, overlaps and items to spot-check. `search` lists what carries some tags, or what's like some items, one scored line each, a page at a time, with ways to narrow or widen, so the agent reads only what's worth reading. Runs on the tags engine; both are copied into every sandbox. |
| `tools/analyse.mjs` | Runs a component's analysis on data files, without a page: `profile` and `dependencies`. `list` shows them all. |

## Practices

How to do something well in a sandbox. Plain instructions, for people and agents alike.

| Practice | What it covers |
|---|---|
| [Building a sandbox](practices/building-a-sandbox.md) | Start here. The end-to-end method: setting up the folder, copying components in, the model, chapters, checking. |
| [Highlighting](practices/highlighting.md) | Point at one thing and see it light up everywhere, with one script and no wiring: the page-wide `sb-highlight` event, pointing at several things on purpose, lighting what's related by tag, wiring what the script can't reach, the sandbox's own parts, and keeping things lit with pins. Supported by `sb-highlighting`, `sb-math`, `sb-id` and `sb-outliner`. |
| [Locating](practices/locating.md) | Find everywhere a ref appears and go to it, through closed tabs and folded branches: `data-ref` on parts, `reveal(ref)`, and the sandbox's `goTo`. Supported by `sb-tabs`, `sb-tree`, `sb-id`, `sb-table`, `sb-rules` and `sb-graph`. |
| [Journal](practices/journal.md) | What changed in a sandbox and why, one entry per version, and where it stands now: for audit and handover. Retired codes recorded in the model. |
| [Identifiers](practices/identifiers.md) | Short, stable codes for the things in a sandbox, and citing them everywhere. Supported by `sb-id`. |
| [Pages](practices/pages.md) | Splitting a sandbox into pages that share one model, `sandbox.js` listing them once, data as scripts, and exporting any page as one file that runs anywhere. Supported by the shell and `tools/export.mjs`. |
| [Domain components](practices/domain-components.md) | A sandbox's own components, for things in its subject that appear in more than one place: when to make one, composing them from Sandkit components, a function in `parts.js` before a custom element, driven by the model, and listed in `AGENTS.md`. |
| [Sources](practices/sources.md) | The material a sandbox was built from: `sources/` with one catalogue, an inbox to process, citations of passages from the model's `ITEMS`, and checking them. Supported by `tools/sources.mjs` and `tools/serve.mjs`. |
| [Tagging](practices/tagging.md) | Labelling sources, excerpts, cards and items so they can be found, grouped and moved around, for a sandbox that opts in: semantic tags as a map of the domain and short-lived working tags, asking the person, with benefits, costs and a recommendation, tags as pointers never reasoned from, what and when to tag, balancing specific and general, keeping the set small, declaring what each means, retiring one, and what they're for. Checking the map with a report, and tag search for people and the agent. Supported by `tools/tags.mjs`, the `tags` engine, `sb-tags-mode`, `sb-search` and `sb-sources`. |
| [Modes](practices/modes.md) | Other ways of using a sandbox for a while, such as commenting or tracing: one shape for every mode, and one at a time through the page-wide `sb-mode` event. Supported by the modes below. |
| [Workshops](practices/workshops.md) | Working through a sandbox's model with the people who know the subject, until they understand it, have corrected it and own it: principles, roles, preparing, the workshop page, activities (predict and reveal, confidence checks, forks, checking sources, questions, decisions), the round trip with the agent, and closing. Supported by `sb-notebook`, `sb-person`, `sb-poll`, `sb-handoff` and `sb-choice`. |
| [Domain discovery](practices/domain-discovery.md) | Discovering a domain on purpose, an iteration at a time: a record of cards that are never edited, each kind and what it's for, weighing claims, growing and trying the model, feedback from people who know the domain, the domain contract the parties agree and how to save it as a PDF, and showing the cards on three boards per iteration. Supported by `sb-discovery-card` and `sb-lineage`. |
| [Mechanisms](practices/mechanisms.md) | Building a domain model from mechanisms, the reusable parts of domain models: when to use one, composing them in `model.js` and how things interact, configuring, ranges, loading in a page and in Node, ejecting one to change it, and how candidates become mechanisms. |
| [Feedback](practices/feedback.md) | Collecting comments with `sb-comments`, and what the agent does on receiving them: saved as sources, `FB-` codes, answered in the journal. Supported by `sb-comments`. |

## Shell

| Part | What it does |
|---|---|
| [Sandbox shell](shell/manifest.md) | The environment around a sandbox: header, goal, pages, full screen, settings and theming, modes with a key each, panels opened from the header, an Export button giving the prompt to export the page, and `sb-highlighting`, one script for page-wide pointing and lighting with no wiring, by ref and faintly by tag. |

## Modes

Part of the environment around a sandbox, like the shell, rather than views of its subject. Each is offered in the shell's mode picker and changes what a click does until the viewer leaves it, one at a time; see the [modes practice](practices/modes.md).

| Mode | What it does |
|---|---|
| [`sb-comments`](components/sb-comments/manifest.md) | Comments from the people exploring a sandbox: choose Comment, click any part and say what you think; each comment cites its refs, view, version and state, and all are copied as one prompt or downloaded. |
| [`sb-inspect-mode`](components/sb-inspect-mode/manifest.md) | What something is: choose Inspect, point at any part and a card at the side says what it is and how it stands now, in whatever way the sandbox explains it best; a click holds it. |
| [`sb-trace-mode`](components/sb-trace-mode/manifest.md) | Why something is there: choose Trace, and pointing outlines every part the model can trace; a click asks the sandbox to show its trace instead of acting. |
| [`sb-tags-mode`](components/sb-tags-mode/manifest.md) | What parts are about: choose Tags, point at any tagged part to see its tags and what they mean, and pin tags to keep everything carrying them lit, combined by intersection or union, with + and − and presets, until cleared, with no wiring. Given a way to search, a Search tab finds tags by name and what carries them, scored, in the card or full screen, and can pull results onto the page. For sandboxes that have opted in to tagging. |

## Tagging

The engine of tagging, for any sandbox that opts in, discovery or not. The [tag search practice](practices/tagging-search.md) says how a page and the agent use it.

| Engine | What it works out |
|---|---|
| [`tags`](engines/tags/manifest.md) | Finding your way around the tag map, with tagging's rules written once (nothing superseded, working tags ignored, retired tags followed): what carries a selection of tags, what's like some items, each with a score from 0 to 1 where rarer tags weigh more, the ways to narrow or widen, and every tag with what carries it. The same results for a page and for the agent. |

## Discovery

Components and the engine for domain discovery, which never know each other: the [domain discovery practice](practices/domain-discovery.md) says how they go together, so read it first. The card knows the method's kinds, which belong to discovery rather than to any subject.

| Component | What it does |
|---|---|
| [`sb-discovery-card`](components/sb-discovery-card/manifest.md) | One card of discovery, in 43 kinds each with its icon and tone, and an optional title after its code: compact on a board, normal, expanded in a modal, or, for a contract, written out as a document to print; what it means in strips, what it rests on in folds of passages, cards, options and slots; sources and excerpts always compact, on paper, an excerpt showing its words, a region of an image or rows of data; when, by whom and in which iteration it was made. Carries tags, to light what's related. |

| Engine | What it works out |
|---|---|
| [`discovery`](engines/discovery/manifest.md) | The method's rules, from the sandbox's records: weighing claims on the excerpts they cite, every status as of any iteration, what rests on what and what each link means, what each iteration shows or has standing, what replaces what, every excerpt a record rests on, what answers to a domain contract and whether it's signed, and the model's runs and compression signal. |

## Mechanisms

Reusable parts of domain models: small, pure pieces of how something works, composed in a sandbox's `model.js`. They know nothing of components, engines or each other. Read the [mechanisms practice](practices/mechanisms.md) first.

| Mechanism | What it does |
|---|---|
| [`sb-store`](mechanisms/sb-store/manifest.md) | A level between a floor and a ceiling, filled and taken from: what was added, spilled, refused, supplied or short, in before out within a step, and how long it lasts. A stock. |

Next come a driver and encounter, then allocation and conversion.

## Components

| Component | What it does |
|---|---|
| [`sb-accordion`](components/sb-accordion/manifest.md) | Sections that open and close, one or a group: a closed section shows a note from the model, a dot when what's inside changed since last seen, and a tint when something highlighted is inside; Expand all and Collapse all, or one open at a time; nests. |
| [`sb-annotate`](components/sb-annotate/manifest.md) | Text with the parts that matter marked: pointing shows each mark's note just above it, clicking pins it, and kinds are counted in a legend. |
| [`sb-bars`](components/sb-bars/manifest.md) | Things compared on one measure: bars on one scale, sorted or not, with reference lines and each bar's change since the last update. |
| [`sb-board`](components/sb-board/manifest.md) | A board that lays itself out, gathering the sandbox's own excerpts, pictures, cards, tables and diagrams around one question: the agent gives rough places and groups, and the board measures, aligns, frames and links them, saying any problem in words. While tags are chosen, what doesn't carry them goes dark. |
| [`sb-c4`](components/sb-c4/manifest.md) | A C4 software architecture walked into level by level, with a path back out; relationships deep inside roll up to every view. |
| [`sb-callout`](components/sb-callout/manifest.md) | A stand-out block for definitions, notes, tips, questions, answers and warnings; optionally collapsible. |
| [`sb-chart`](components/sb-chart/manifest.md) | Values over time as lines, with reference lines, the latest values marked, and a legend. |
| [`sb-choice`](components/sb-choice/manifest.md) | A decision as a card: the question, the options weighed with pros and cons, the one chosen and why, who decided and when, what it replaces, and what the record is missing; a group can record one in a workshop. |
| [`sb-code`](components/sb-code/manifest.md) | Code or pseudocode stepped through a trace the model records: the running line marked, variables beside it with changes shown. |
| [`sb-controls`](components/sb-controls/manifest.md) | Play, pause, step, reset and speed. Keeps the clock and tells the sandbox how many steps to take. |
| [`sb-decision-tree`](components/sb-decision-tree/manifest.md) | Questions branching on their answers down to outcomes: one case traced with its value at each question, the answers that would have changed its outcome marked, branches thickened by how many cases took them. |
| [`sb-dependencies`](components/sb-dependencies/manifest.md) | What goes with what in a data set: fields that determine others, change together or are present together, near-misses listed first with the samples that break them, and what changed when the samples did. Also runs from Node: `tools/analyse.mjs dependencies`. |
| [`sb-erd`](components/sb-erd/manifest.md) | Entities and their fields, with each reference drawn from the exact field to the exact field it refers to. |
| [`sb-flowchart`](components/sb-flowchart/manifest.md) | A process laid out from its structure, optionally in swim lanes running down or across; the current step and the way it came marked. |
| [`sb-graph`](components/sb-graph/manifest.md) | State machines, workflows and networks: active nodes, edges and rule lines lit up; things moving along edges. |
| [`sb-grid`](components/sb-grid/manifest.md) | Cells across space coloured by state or value: a legend counting each state, painting reported to the model, changes marked. |
| [`sb-handoff`](components/sb-handoff/manifest.md) | Handing something to the agent: one precise prompt to copy, shown on the page, whether it's been sent, and the agent's reply once the sandbox has it. The same round trip for polls, questions and checks. |
| [`sb-id`](components/sb-id/manifest.md) | An identifying code as a pill: hover explains it, click highlights every mention. |
| [`sb-image`](components/sb-image/manifest.md) | An image to zoom and pan, starting on the part that matters, with boxes and pins that prose can glide to and light up. |
| [`sb-json`](components/sb-json/manifest.md) | JSON shown cleanly, with the paths that matter spotlit and the rest folded away; a clicked line shows its path and the note written for it. |
| [`sb-kanban`](components/sb-kanban/manifest.md) | Things moving through stages, as cards in columns: each column counted against its limit, cards that just moved marked with where they came from, drags asked of the model. |
| [`sb-lineage`](components/sb-lineage/manifest.md) | Where things come from and what they lead to: the sandbox's own items in columns, in the order things flow, with every link drawn and labelled; pointing at one fades everything not linked to it, or links show only along the chain pointed at. Given a subject, only its lineage shows, back and on as far as asked, and viewers follow items with a trail back. Viewers pan and zoom, in the page or full screen; columns fold to make room. |
| [`sb-log`](components/sb-log/manifest.md) | A stream of things that happened, in order: tones, columns, expandable detail, selection. |
| [`sb-math`](components/sb-math/manifest.md) | Equations in native MathML whose marked parts light up, and are lit by, what they stand for. |
| [`sb-matrix`](components/sb-matrix/manifest.md) | A matrix or vector in brackets, inline or on its own: editable, with coloured and highlighted rows, columns and cells. |
| [`sb-modal`](components/sb-modal/manifest.md) | A window over the page for the one thing that deserves attention now: a heading, content and actions, reporting how the viewer closed it. |
| [`sb-notebook`](components/sb-notebook/manifest.md) | A workshop's sections in one page: each with its kind, who and when, and the codes it cites counted; key sections open and asides tucked away, an outline and up and down to move around, filters by code, kind and person that open what matches, a focus mode that fills the window with the sections, and an address that keeps your place for a reload or a shared link. |
| [`sb-outliner`](components/sb-outliner/manifest.md) | Everything on the page that can be pointed at, as an outline in a floating panel opened from the header: pointing at an entry lights its whole trace across the page, and pins, a fill and an outline, keep traces lit while people work, follow the model and can glow. |
| [`sb-panel`](components/sb-panel/manifest.md) | A frame viewers can pop out into a floating window, drag, resize, collapse, make full screen and dock back. |
| [`sb-ontology`](components/sb-ontology/manifest.md) | Kinds of things and how they relate, a few at a time: classes, individuals and their links, what each kind inherits and from where, kinds to light up, and the model's problems marked where they are. |
| [`sb-parameters`](components/sb-parameters/manifest.md) | The knobs people turn: labelled sliders with live values, changes from defaults marked, reset. |
| [`sb-person`](components/sb-person/manifest.md) | A person as a badge: an icon in a circle, name and role, an agent's circle dashed; pointing at one lights up every badge for that person. |
| [`sb-plane`](components/sb-plane/manifest.md) | A 2D coordinate plane: draggable vectors, points and shapes, and matrices that visibly move space. |
| [`sb-poll`](components/sb-poll/manifest.md) | A question put to a group: who has answered shows, never what, until everyone has and all are revealed, grouped by option with who chose each and why; with an outcome, a prediction marking what happened and who expected it. Options and people are slots for any content. |
| [`sb-profile`](components/sb-profile/manifest.md) | A data set's shape: every field across all samples with its types, presence and values, constants, keys, gaps, mixed types and rare values marked, and what changed when the samples did. Also runs from Node: `tools/analyse.mjs profile`. |
| [`sb-rule`](components/sb-rule/manifest.md) | One rule as a card, a mandate or a conditional or the sandbox's own shape: its modal words and values marked, the branch in force marked and the rest faded, and whether it holds or is broken, as the model changes. For many rules in a table, `sb-rules`. |
| [`sb-rules`](components/sb-rules/manifest.md) | The rules a model follows, with the one about to apply and the one just applied marked. |
| [`sb-scenario`](components/sb-scenario/manifest.md) | A behaviour scenario as a card: its code, title and Given / When / Then steps laid out to read at a glance, values marked, each step lit up by its ref, the step happening now marked as the model plays it, and which steps played out as expected when the model plays it, with what actually happened. |
| [`sb-scrubber`](components/sb-scrubber/manifest.md) | A bounded stretch of progress to scrub or play, with named moments: transformations, cycles, stages. |
| [`sb-search`](components/sb-search/manifest.md) | A collection to explore: search by words or a regular expression, filters with counts, ranges over numbers and dates, sort and group (groups within groups), what's applied as chips to take away, ways back when nothing matches, as a list, grid or table, in the page or full screen, with presets and a slot for the chosen item's detail. Works from a bare array. |
| [`sb-sequence`](components/sb-sequence/manifest.md) | Who says what to whom, in order: lifelines, calls, replies and notes, played a message at a time. |
| [`sb-source`](components/sb-source/manifest.md) | One source as a sheet of paper beside a card of what's known about it, with the passages the model cites marked where they are, quotes it can't find listed, and the rest of the text folded away: text, Markdown, data, images and PDFs. |
| [`sb-sources`](components/sb-sources/manifest.md) | A sandbox's source material as cards of paper: search, filters with how many sources each value would show, a slider for the dates written, primary only and sorting; replaced sources marked with what replaced them, and files not yet catalogued listed apart. |
| [`sb-stamp`](components/sb-stamp/manifest.md) | A status pressed onto the page like a rubber stamp: verified, approved, received, superseded, with an icon, when, a detail and who; set from the model and marked stale, with the reason, when the model has moved past it. |
| [`sb-stat`](components/sb-stat/manifest.md) | Headline figures: each change since the last update, coloured as good or bad news, with targets and bars. |
| [`sb-statechart`](components/sb-statechart/manifest.md) | States inside states, parallel regions and history: every active state marked, what can happen now and what a guard holds back, and the last step's exits, transitions and entries numbered in order. |
| [`sb-table`](components/sb-table/manifest.md) | Rows and columns to sort, search and filter, with the cells that just changed marked, and tags on rows and headings to light what's related. |
| [`sb-tabs`](components/sb-tabs/manifest.md) | Tabs over panels, for chapters or views: one part at a time, remembered per viewer, nestable. |
| [`sb-timeline`](components/sb-timeline/manifest.md) | Events laid out in time: moments and spans in lanes, a line for now fading what's still to come, zoomed and panned by viewers or glided to a stretch by the sandbox. |
| [`sb-tour`](components/sb-tour/manifest.md) | A guided tour of the page as it stands: a tooltip beside one part at a time, the rest dimmed, opening what hides each part; steps can wait for the viewer to act. |
| [`sb-tree`](components/sb-tree/manifest.md) | Nested things, as in a file system or an outline: branches that open and close, joined by lines, driven by viewers and the sandbox alike. |
| [`sb-venn`](components/sb-venn/manifest.md) | Two or three sets as overlapping circles: every region named, counted and marked when empty, read out in words when pointed at, with what changed region since the last update marked. |
| [`sb-walkthrough`](components/sb-walkthrough/manifest.md) | A story told across several views, a step at a time: each step outlines the views to look at and names what to highlight in them. |
| [`sb-wireframe`](components/sb-wireframe/manifest.md) | A wireframe prototype written in plain HTML: one screen or a clickable flow, its parts pointed at and highlighted, themed by a few colours. |
| [`sb-xref`](components/sb-xref/manifest.md) | Where a thing appears and what it's linked to: every place on the page a ref shows up, grouped by view, with hidden ones marked; the model's links to walk along, with a trail and Back. |
