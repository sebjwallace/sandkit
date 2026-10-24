# Working on Sandkit

Sandkit is a toolkit for domain sandboxing. Read `README.md` for what it is, `DECISIONS.md` for every settled decision and why, `CATALOG.md` for what exists, `CONTRIBUTING.md` for the principles each component holds to, and `STYLE.md` before styling a component or changing how one looks. Don't re-litigate settled decisions; propose changes to them openly.

`.agentics/` holds the author's private reference notes. Read it if useful; never edit it, and never put public material there.

## How we work

- **One small step at a time, with the author deciding.** Propose briefly, recommend, then build. Keep answers short.
- **Simplicity first.** Push back on anything, including the author's own ideas, that adds complexity it doesn't earn.
- **Code that reads clearly:** small named helpers, comments only where intent isn't obvious, no cleverness, no bloat.
- **Components never reference each other.** Composition happens in sandboxes, through slots, the `sb-highlight` event, and "Works well with" suggestions in manifests. `test/isolation` enforces it.

## Adding or changing a component

**Components render; models compute.** If a component would check rules, infer, analyse or compute anything beyond preparing its view, ask the author before building it. It's an exception, never a default (see `DECISIONS.md`).

A component is done when it has all of these:

1. `components/sb-name/sb-name.js`, first line `// Sandkit sb-name 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit`, the collision guard, prefixed classes, theme tokens with fallbacks, styled as `STYLE.md` describes.
2. `manifest.md` in the established layout (see `sb-log` or `sb-scrubber`), opening with "Use this component through the interface below…".
3. `CHANGELOG.md`, newest first, `## x.y.z · yyyy-mm-dd`.
4. `test.html`: the public contract, two instances side by side, text never rendered as markup.
5. `demo.html`: **About** (the guide: where it helps, where something else fits, getting started, making it reveal) then **Examples** in two contrasting domains. It loads only its own component and the shell.
6. A line in `CATALOG.md`, the tag added to `test/collisions/test.html` and `test/isolation/test.html`, and a decision in `DECISIONS.md` if one was made. Bump the component count in the root `CHANGELOG.md`.

**Change only the component you're working on.** If keeping the look consistent would mean changing others (see `STYLE.md`), name each one and ask the author first; never update them unasked.

**Changing a committed component:** add a changelog entry and bump the version (until 1.0: breaking changes raise the minor version, anything else the patch), and update the script's first line to match. `test/versions` checks they agree.

## Checking work

- **Run everything:** `node test/run.mjs` (headless Chrome for `test.html`, Node for `test.mjs`). It must pass before committing.
- **Mutation-check new tests:** break the behaviour on purpose, confirm a test fails, restore.
- **Look at it:** screenshot demos and sandboxes with headless Chrome rather than trusting the code. For example:
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir=<fresh temp dir> --window-size=1100,1000 --virtual-time-budget=800 --screenshot=<file> file://<page>`
  Crop tall pages with `sips -c <h> <w> --cropOffset <y> <x>`. Headless screenshots don't follow scrolling.
- **Tests never depend on rendering frames** (resize observers, animation frames); headless virtual time may not deliver them. Use `waitFor` for things that happen at the browser's pace.

## Example sandboxes

`examples/` holds full sandboxes built with Sandkit (supply chain, linear algebra, checkout architecture). They follow `practices/building-a-sandbox.md`: iterations, one chapter at a time, each ending with a handover offering 2–4 directions. Each has a `test.html` with model tests and a smoke test of its page. Examples and demos live inside Sandkit, so they load its files directly (`../../components/…`); a real sandbox copies them into `lib/sandkit/` instead, as the building guide says.

## Commits

Commit when the author asks, in focused commits with a clear subject and a short body saying what and why, ending with the attribution line the session gives. Check `git status` first: nothing from `.agentics/` or scratch files.
