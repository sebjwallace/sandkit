# Decisions

Settled decisions for Sandkit, newest last. One line each, with the reason.

## Principles

- **AI agents are the primary authors of sandbox code.** When choosing between approaches, prefer whatever agents work with most reliably.
- **Keep it as simple as possible.** No build tools, no installs, no framework machinery.
- **Code reads clearly.** Minimal, elegant and close to self-explanatory, echoing the clarity sandboxes aim for, without growing bigger for the sake of it. Modern plain JavaScript (template literals, `const`/`let`), no build step.
- **Not production.** Size, duplication and bundled dependencies are acceptable; sandboxes are shared among a handful of people, not served at scale.

## Components

- **A component is a custom element (custom tag), without Shadow DOM.** It's the browser's native "element with an interface" protocol, easy for agents to write, and the tag is the boundary. Shadow DOM's isolation costs simple styling and debugging for a problem sandboxes don't have.
- **Outside follows the protocol; inside can be anything.** Vanilla JS, jQuery, Preact, etc. are all allowed internally.
- **Protocol:** one root element it owns; inputs in (attributes and properties); `CustomEvent`s out, bubbling from the root; a few documented methods; prefixed, documented CSS classes; no globals beyond the tag name; a manifest describing it all.
- **Several instances can share a page.** Each instance keeps its own state; anything that must be unique in the document (ids, radio group names) is generated per instance. Every component has a test with two instances side by side.
- **Names: prefixes are namespaces.** `sb-` is reserved for the Sandkit catalog, which keeps names unique within it. Other authors use their own prefix.
- **Collisions fail loudly.** Each component carries an origin marker. The same script loaded twice is skipped quietly; a different component already using the tag gets a console error explaining how to rename. Renaming is a find-and-replace of the tag in one file, because the tag, classes and style id all start with it.
- **Styling via prefixed classes** (e.g. `sb-id__code`). Sandboxes override them with their own stylesheet.
- **Components never reference each other,** not even as an optional enhancement. A component doesn't know any other component's tag, events or protocol, and its demo loads only itself (plus the shell, which is the environment around demos, not a dependency). Coupling stops things scaling and removes flexibility. Only components explicitly packaged together may know each other, and that should be rare.
- **Composition happens in the sandbox, through slots.** A component that should accept the sandbox's content offers slots (children marked `slot="..."`), and shows that content without inspecting it. The shell knows no section by name either: the sandbox declares `<sb-theme-settings slot="settings">`.
- **Manifests suggest pairings in a "Works well with" section.** Text only: which components combine well, and how to wire them. Agents read the suggestion and do the wiring; nothing is hard-coded.
- **Components are domain-agnostic.** They give a domain the tooling and never name domain concepts. The sandbox maps its domain onto the component's generic shape (e.g. a stock-out becomes a log entry with `tone: 'bad'`).
- **Each component folder has:** the script, `manifest.md` (the agent-facing contract: purpose, usage, data shape, attributes, properties and methods, events, styling, works well with, notes), `test.html`, and `demo.html`. `sb-log` sets the template.
- **Demos are for people.** Two headed parts: **About**, a short guide, then **Examples**, the component live and configured for contrasting sandboxes. The guide covers what it's for, where it helps, where something else fits better, getting started, and how to make it reveal rather than merely display. It links to the manifest for the full contract. Written warmly and plainly, to help people build sandboxes that help them understand the world.
- **`CATALOG.md`** lists every practice and component in one line, linking to each. Agents read the catalog, then only the practices and manifests they need.
- **Practices are plain instructions** in `practices/`: how and why to do something well (e.g. identifiers). Not formal skills, just markdown read before using the components that support them. They live apart from components because a practice usually spans several. A manifest names the practice its component supports. Reading path for an agent: catalog → practice → manifest → build.
- **Libraries:** bundle a small library only when needed, scoped privately (no globals), and list it in the manifest. Duplicate copies across components are fine.

## Component designs

- **`sb-controls` keeps the clock.** While playing it fires `sb-tick` with how many steps to take; fast speeds batch several steps per tick. Step fires the same event with one step, so a sandbox handles a single event and never writes its own timer. Halting is the model's business: the sandbox sets `running = false`. Setting properties never fires the viewer-action events.
- **`sb-graph` replaces `sb-network`,** covering state machines as well as flow networks: circle or given layouts, loops pointing away from the middle, two-way edges bowed apart, multi-line labels whose lines can be highlighted individually, terminal rings, tones, meters and tokens, framed to fit and never scaled up. Automatic layout waits until a sandbox needs it.
- **`sb-rules` shows which rule applies,** in words as well as colour ("next", "just applied"). Grouping and per-column formatting; a slot per rule lets a sandbox put a richer code in its cell.
- **`sb-chart` never cuts off its data.** `yMin` and `yMax` set the least range to show; data beyond them widens it, and the zero axis stays inside the drawing. Negative values are supported. Reference lines and series take explicit tones rather than colours by position. The latest value of each line is marked, several lines get a legend with their latest values, and the chart draws at its real width so text keeps its size.
- **`sb-panel` lets viewers rearrange a sandbox,** as an opt-in wrapper around any content, so no component knows about docking. Docked is where the sandbox placed it; popping out floats it at the same spot and size, leaving a same-sized placeholder so the page never moves. Floating panels can be dragged, resized, collapsed, made full screen and brought to the front, and stay within reach. With an `id`, each viewer's arrangement is remembered. Desktop and tablet only: phones are out of scope.
- **`sb-plane` draws vectors as data, not as components.** A vector component would need to know the plane's scale and transformation, which is coupling. The plane takes a matrix and a `progress`, blending evenly from the identity, so viewers watch space move (points travel in straight lines, as in 3Blue1Brown's tools; rotations along arcs could be an option later). 2D only: 3D is several times the complexity and will be its own component when a sandbox needs it. Dragging moves objects by the pointer's movement, in their own space.
- **Tabs are generic, and chapters are one use of them.** `sb-tabs` makes a tab for each direct child, titled by its `heading`, and only ever looks at its own children, so tab sets nest without knowing about each other. Hidden panels stay in the page, keeping their state. Remembered per viewer with an `id`. Linking to a tab from the address bar is left for later, as an opt-in, since it touches the page's URL.
- **One `sb-matrix` covers vectors too:** a vector is a matrix with one column. Its value over MathML's static matrices is editing, tones and highlighting, so numbers can point at what they mean. Symbolic expressions stay a separate, later component; the two can light each other up through a page-wide event without knowing about each other.
- **Interaction outranks tone.** A selected or active element shows as such even when it also carries a warning tone.

## Sandbox shell and theming

- **The sandbox shell** is the environment around the components: header and settings (later navigation). It's `<sb-shell>` in `shell/`, following the same protocol as components.
- **Theming is its own module,** `shell/sb-theme-settings.js`: tokens, theme state and the Theme settings section. It applies the theme as soon as it loads. The shell and theming talk through a protocol and DOM events, not shared globals.
- **Settings are made of sections.** Any element can be a section (titled by its `heading`); sandboxes add their own with `slot="settings"`. A section with `settingsKey`, `exportSettings()` and `importSettings(data)` is included in the settings file.
- **The header is the shell's top bar, filled through slots.** Children marked `slot="actions"` sit beside the controls; other children are header content (e.g. the goal), shown on one line with More / Less.
- **Header controls: full screen, settings, collapse.** Collapse hides the header behind a small restore button and is remembered per viewer. A sandbox chooses which controls appear with the `controls` attribute.
- **Components are configurable.** Generic but not always applicable features are opt-in or opt-out through attributes or properties at setup.
- **Theming uses CSS custom properties (`--sb-*` tokens).** A theme is a set of token values under `[data-theme="..."]`; switching is one attribute on `<html>`, and everything updates with no re-rendering. Plain CSS, no JavaScript per component.
- **Components always use tokens with a fallback** (`var(--sb-text, #1f2933)`), so they still work without the shell.
- **Standard themes: light and dark,** plus "match system". Sandboxes add their own by defining tokens in their stylesheet and adding them to the `themes` property of `<sb-theme-settings>`.
- **Viewers can customise tokens and save presets** in settings. A preset is a base theme plus only the tokens that differ, stored per viewer in browser storage.
- **Settings export and import as a JSON file** (`{ format: "sandkit-settings", version, sections: { [settingsKey]: data } }`), so viewers can keep a copy or share them. Importing theme presets merges them by id.
- **Canvas-drawn components** listen for the `sb-theme` event on `document` and re-read the tokens.

## Building and distributing sandboxes

- **An AI assistant builds sandboxes; people need no technical knowledge.** The README's Getting started tells them to open an assistant in a new folder and ask for the sandbox they want, pointing it to Sandkit.
- **The assistant's entry point is `practices/building-a-sandbox.md`,** the end-to-end method. `CATALOG.md` lists it first.
- **Sandboxes grow in iterations, never all at once.** Iteration 1 is the model plus chapter 1, rough, with the remaining chapters only planned. Every iteration ends with a handover offering 2–4 named directions, and the next is built only once the person has chosen. Polish goes only to what has survived feedback. (Learned from the first real build, a Turing machine sandbox, which built five polished chapters unseen.)
- **Sandboxes stay lean on testing for as long as they can.** A young model needs no tests. Model tests come once the model has grown enough that a change could quietly break it, a bug returns, or the person asks: plain assertions in `model.test.js`, no library, the cheapest tests there are. The starter lives in the guide rather than the template, so it isn't filled in by default. The interface gets no automated tests unless the person asks or it's truly justified, and checks by hand only when really needed. Sandkit tests its components because it's a shared library; a sandbox's interface is not. The guide assumes nothing about the agent's environment: there may be no browser automation or Node at all, so the model tests run in either Node or a page.
- **Each sandbox's `AGENTS.md` keeps a Roadmap:** chapters built, chapters planned, and the direction chosen, so the next session can pick it up.
- **Components are copied into each sandbox, not installed.** No package manager. The sandbox starts from `templates/sandbox/`, and Sandkit's files go into `lib/sandkit/`, keeping Sandkit's own paths so links between manifests and practices still work. Only scripts, manifests, practices and the catalog are copied; tests and demos stay in Sandkit.
- **`tools/setup.mjs` does the copying in one command, where Node is available.** It is idempotent: it starts a folder from the template if needed (never overwriting the sandbox's own files), copies the shell, catalog, practices and the named components plus any already present, adds their script tags, and writes `SOURCE.md`. Setting up, adding and updating are the same command. It refuses unknown and in-progress components. Copying by hand remains the documented path for agents without Node.
- **No check tool for sandboxes.** A headless-browser checker was considered and dropped: it is interface testing, which sandboxes avoid, and assumes tools the agent may not have.
- **Sandkit, the shell and each component are versioned separately,** by semantic versioning, starting at 0.1.0. Until 1.0, breaking changes raise the minor version. Each has a short changelog, newest first, whose top entry is its version; the version is repeated in its scripts' first lines so a copied file always says what it is (`test/versions` keeps them in agreement). The shell's two scripts share one version. Breaking entries say how to migrate, so an agent can update a sandbox from the changelogs alone. Changelogs are copied into sandboxes with what they describe.
- **Updating a sandbox reads the changelogs between versions.** `SOURCE.md` records every installed version; `setup.mjs` compares installed and new versions and lists every change in between, breaking changes first.
- **`lib/sandkit/SOURCE.md` records where the copies came from** (repo, commit, date, files). Updating means re-copying them. Each sandbox keeps working as it is until someone chooses to update.
- **Agents use components through manifests, never their source.** Every manifest says so; the sandbox's `AGENTS.md` repeats it, and forbids editing `lib/`. To change a component, eject it into the sandbox's own `components/` under a new name.
- **Other libraries work the same way:** a `CATALOG.md`, a manifest per component, their own tag prefix, copied into `lib/<library-name>/`.
- **The shell has a manifest too** (`shell/manifest.md`), since agents don't read its source either.

## Testing

- **Automated regression tests with no dependencies.** Each module has a `test.html` beside it that tests its public contract; open it in a browser to see results.
- **One shared harness,** `test/harness.js` (`test`, `assert`, `assertEqual`, `assertThrows`, `mount`, `nextFrame`, `recordEvents`). Tests never ship inside sandboxes, so sharing it doesn't break component isolation.
- **Each example sandbox has a smoke test** that loads its real page and checks every part rendered, so integration mistakes fail the suite.
- **One command runs everything:** `node test/run.mjs` drives headless Chrome over every `test.html`, with a fresh browser profile per page, runs every `test.mjs` (tests of Node tools) with Node, and exits non-zero on failure. Node is only needed for the runner. A page that reports no results (the browser didn't finish) is retried once; failing tests never are. Each test times out on its own after 3 seconds, so one that hangs fails by name instead of silencing its page.
- **Automated tests never depend on the browser rendering frames.** Headless Chrome under virtual time, like a background tab, can stop rendering, so resize observers and animation frames may never fire. Tests check what each render does; behaviour driven by rendering (such as redrawing on resize) is checked by hand in a real browser. `waitFor` polls for a condition instead of sleeping a fixed time.

## Examples

- **Build example sandboxes first, and develop components around them.** Several examples, deliberately different, so each component is seen from multiple perspectives.
- **Sandbox page scripts declare everything first, then start** in one marked section at the end, so nothing runs before it exists.
- **First example: supply chain** (intuition kind). End-to-end understanding of sourcing, distribution, fulfilment, transport, delivery, click and collect, stock levels, and the problems and solutions involved. Designed as a baseline that others can branch and adapt to their own organisation, potentially towards decision modelling.
