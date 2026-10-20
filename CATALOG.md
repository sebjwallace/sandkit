# Catalog

Everything Sandkit offers, one line each. Read a practice before the components that support it, and a component's `manifest.md` for its full contract. Use components through their manifests; you don't need to read their source.

## Tools

Run from a Sandkit clone with Node. Not copied into sandboxes.

| Tool | What it does |
|---|---|
| `tools/setup.mjs` | Sets up a sandbox with Sandkit's files, or updates them. |
| `tools/export.mjs` | Exports one page of a sandbox as a single HTML file that still runs, listing every file that went in. Copied into sandboxes, for the agent to run when someone presses Export. |
| `tools/serve.mjs` | Serves a sandbox on this computer, so the features that read and write its files work: lists a folder's files and saves into `sources/inbox/`. Copied into sandboxes; opening pages by double-clicking still works for everything else. |
| `tools/sources.mjs` | Checks a sandbox's sources against its catalogue and its model: missing and uncatalogued files, unknown sources, quotes that aren't there. Copied into sandboxes. |
| `tools/analyse.mjs` | Runs a component's analysis on data files, without a page: `profile`, `dependencies` and `trace`. `list` shows them all. |

## Practices

How to do something well in a sandbox. Plain instructions, for people and agents alike.

| Practice | What it covers |
|---|---|
| [Building a sandbox](practices/building-a-sandbox.md) | Start here. The end-to-end method: setting up the folder, copying components in, the model, chapters, checking. |
| [Highlighting](practices/highlighting.md) | Point at one thing and see it light up everywhere: the page-wide `sb-highlight` event, wiring components in, and making the sandbox's own parts point, light up and be found like them. Supported by `sb-math` and `sb-id`. |
| [Locating](practices/locating.md) | Find everywhere a ref appears and go to it, through closed tabs and folded branches: `data-ref` on parts, `reveal(ref)`, and the sandbox's `goTo`. Supported by `sb-tabs`, `sb-tree`, `sb-id`, `sb-table`, `sb-rules` and `sb-graph`. |
| [Journal](practices/journal.md) | What changed in a sandbox and why, one entry per version, and where it stands now: for audit and handover. Retired codes recorded in the model. |
| [Identifiers](practices/identifiers.md) | Short, stable codes for the things in a sandbox, and citing them everywhere. Supported by `sb-id`. |
| [Pages](practices/pages.md) | Splitting a sandbox into pages that share one model, `sandbox.js` listing them once, data as scripts, and exporting any page as one file that runs anywhere. Supported by the shell and `tools/export.mjs`. |
| [Sources](practices/sources.md) | The material a sandbox was built from: `sources/` with one catalogue, an inbox to process, citations of passages from the model's `ITEMS`, and checking them. Supported by `tools/sources.mjs` and `tools/serve.mjs`. |
| [Modes](practices/modes.md) | Other ways of using a sandbox for a while, such as commenting or tracing: one shape for every mode, and one at a time through the page-wide `sb-mode` event. Supported by the modes below. |
| [Workshops](practices/workshops.md) | Working through a sandbox's model with the people who know the subject, until they understand it, have corrected it and own it: principles, roles, preparing, the workshop page, activities (predict and reveal, confidence checks, forks, checking sources, questions, decisions), the round trip with the agent, and closing. Supported by `sb-notebook`, `sb-person`, `sb-poll`, `sb-handoff` and `sb-choice`. |
| [Feedback](practices/feedback.md) | Collecting comments with `sb-comments`, and what the agent does on receiving them: saved as sources, `FB-` codes, answered in the journal. Supported by `sb-comments`. |

## Shell

| Part | What it does |
|---|---|
| [Sandbox shell](shell/manifest.md) | The environment around a sandbox: header, goal, pages, full screen, settings and theming, and an Export button giving the prompt to export the page. |

## Modes

Part of the environment around a sandbox, like the shell, rather than views of its subject. Each is offered in the shell's mode picker and changes what a click does until the viewer leaves it, one at a time; see the [modes practice](practices/modes.md).

| Mode | What it does |
|---|---|
| [`sb-comments`](components/sb-comments/manifest.md) | Comments from the people exploring a sandbox: choose Comment, click any part and say what you think; each comment cites its refs, view, version and state, and all are copied as one prompt or downloaded. |
| [`sb-trace-mode`](components/sb-trace-mode/manifest.md) | Why something is there: choose Trace, and pointing outlines every part the model can trace; a click asks the sandbox to show its trace instead of acting. |

## Components

| Component | What it does |
|---|---|
| [`sb-annotate`](components/sb-annotate/manifest.md) | Text with the parts that matter marked: pointing shows each mark's note just above it, clicking pins it, and kinds are counted in a legend. |
| [`sb-bars`](components/sb-bars/manifest.md) | Things compared on one measure: bars on one scale, sorted or not, with reference lines and each bar's change since the last update. |
| [`sb-board`](components/sb-board/manifest.md) | Things moving through stages, as cards in columns: each column counted against its limit, cards that just moved marked with where they came from, drags asked of the model. |
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
| [`sb-log`](components/sb-log/manifest.md) | A stream of things that happened, in order: tones, columns, expandable detail, selection. |
| [`sb-math`](components/sb-math/manifest.md) | Equations in native MathML whose marked parts light up, and are lit by, what they stand for. |
| [`sb-matrix`](components/sb-matrix/manifest.md) | A matrix or vector in brackets, inline or on its own: editable, with coloured and highlighted rows, columns and cells. |
| [`sb-modal`](components/sb-modal/manifest.md) | A window over the page for the one thing that deserves attention now: a heading, content and actions, reporting how the viewer closed it. |
| [`sb-notebook`](components/sb-notebook/manifest.md) | A workshop's sections in one page: each with its kind, who and when, and the codes it cites counted; key sections open and asides tucked away, an outline and up and down to move around, and filters by code, kind and person that open what matches. |
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
| [`sb-sequence`](components/sb-sequence/manifest.md) | Who says what to whom, in order: lifelines, calls, replies and notes, played a message at a time. |
| [`sb-source`](components/sb-source/manifest.md) | One source as a sheet of paper beside a card of what's known about it, with the passages the model cites marked where they are, quotes it can't find listed, and the rest of the text folded away: text, Markdown, data, images and PDFs. |
| [`sb-source-trace`](components/sb-source-trace/manifest.md) | Why something in the model is there, as one graph flowing left to right: the sources, what was derived from them and the items resting on them, up to the thing traced, and what rests on it; sources open, items retrace, and unknown ids, loops and items resting on nothing cited are drawn. Also runs from Node: `tools/analyse.mjs trace`. |
| [`sb-sources`](components/sb-sources/manifest.md) | A sandbox's source material as cards of paper: search, filters with how many sources each value would show, a slider for the dates written, primary only and sorting; replaced sources marked with what replaced them, and files not yet catalogued listed apart. |
| [`sb-stat`](components/sb-stat/manifest.md) | Headline figures: each change since the last update, coloured as good or bad news, with targets and bars. |
| [`sb-statechart`](components/sb-statechart/manifest.md) | States inside states, parallel regions and history: every active state marked, what can happen now and what a guard holds back, and the last step's exits, transitions and entries numbered in order. |
| [`sb-table`](components/sb-table/manifest.md) | Rows and columns to sort, search and filter, with the cells that just changed marked. |
| [`sb-tabs`](components/sb-tabs/manifest.md) | Tabs over panels, for chapters or views: one part at a time, remembered per viewer, nestable. |
| [`sb-timeline`](components/sb-timeline/manifest.md) | Events laid out in time: moments and spans in lanes, a line for now fading what's still to come, zoomed and panned by viewers or glided to a stretch by the sandbox. |
| [`sb-tour`](components/sb-tour/manifest.md) | A guided tour of the page as it stands: a tooltip beside one part at a time, the rest dimmed, opening what hides each part; steps can wait for the viewer to act. |
| [`sb-tree`](components/sb-tree/manifest.md) | Nested things, as in a file system or an outline: branches that open and close, joined by lines, driven by viewers and the sandbox alike. |
| [`sb-venn`](components/sb-venn/manifest.md) | Two or three sets as overlapping circles: every region named, counted and marked when empty, read out in words when pointed at, with what changed region since the last update marked. |
| [`sb-walkthrough`](components/sb-walkthrough/manifest.md) | A story told across several views, a step at a time: each step outlines the views to look at and names what to highlight in them. |
| [`sb-wireframe`](components/sb-wireframe/manifest.md) | A wireframe prototype written in plain HTML: one screen or a clickable flow, its parts pointed at and highlighted, themed by a few colours. |
| [`sb-xref`](components/sb-xref/manifest.md) | Where a thing appears and what it's linked to: every place on the page a ref shows up, grouped by view, with hidden ones marked; the model's links to walk along, with a trail and Back. |
