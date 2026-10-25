# Contributing

Sandkit grows from real sandboxes. If you build one, we'd love to hear how it went: what worked, what didn't, what you discovered, and which parts you found yourself building again. Open an issue or a discussion and tell us.

## Proposing a component

Open an issue describing:

- **What it reveals.** Which kind of understanding it helps people reach, not just what it displays.
- **Where it would be used.** At least two quite different sandboxes, to show it is general rather than tied to one domain.
- **Its interface.** The data it takes, the events it fires, and any methods.

## Principles

Every component, and every change to one, should hold to these. [DECISIONS.md](DECISIONS.md) records the reasoning behind each.

- **Reveal, don't merely display.** A table that lists rules displays; one that highlights the rule that just fired, and why, reveals.
- **Domain-agnostic.** A component gives a domain its tooling, and never names domain concepts.
- **Driven by the model.** A component shows state derived from the sandbox's model, set through its properties. What viewers do comes out as events for the sandbox to act on, so the model stays the one source of truth.
- **Independent.** Components never reference one another, not even optionally. Sandboxes combine them, using slots where a component accepts the sandbox's content, and "Works well with" suggestions in manifests.
- **Extend before adding.** Before proposing a new component, check whether an existing one could do the job by growing its own capabilities, and say which you chose. A new component is for a job with its own needs, however similar it looks.
- **Contained.** A custom element without Shadow DOM, prefixed `sb-`, with no globals beyond its tag, prefixed and documented CSS classes, and colours from the theme tokens.
- **Small and clear.** Plain JavaScript, no build step, no installs. Code that reads almost like an explanation of itself, without growing bigger for the sake of it.
- **Safe to package.** A classic script with no fetches or external assets, so it survives single-file export.

## What a component needs

```
components/sb-example/
  sb-example.js   the component; its first line names it, with its version and licence
  manifest.md     the contract agents read: purpose, usage, data, members, events, styling, works well with, notes
  CHANGELOG.md    one entry per release, newest first
  test.html       tests of the public contract, including two instances side by side
  demo.html       About, then Examples in contrasting sandboxes
```

`sb-log` is a good model to follow. Before styling a component, or changing how one looks, read [STYLE.md](STYLE.md): it says which tokens, tones and materials to use, and which other components share a look. Components stay isolated, and the guide is what keeps them consistent: change only the component you're working on, and ask before changing any other to match. Add the component to [CATALOG.md](CATALOG.md), and its tag to the lists in `test/collisions/test.html` and `test/isolation/test.html`.

## Versions and changelogs

Every change to a component, the shell or Sandkit itself gets a changelog entry, and a new version:

```md
## 0.2.0 · 2026-11-01
- **Breaking:** `sb-step` removed. Listen for `sb-tick` and take `detail.steps` steps.
- Added a `height` attribute.
```

- **Choose the version by semantic versioning.** Until 1.0, a breaking change raises the minor version (0.1.0 to 0.2.0) and anything else the patch (0.1.0 to 0.1.1). From 1.0, breaking changes raise the major version.
- **Breaking entries say how to migrate,** so an agent updating a sandbox can apply them without reading the source.
- **Update the version in the script's first line too.** `test/versions` checks they agree.
- **Add an entry to the root `CHANGELOG.md`** for changes to practices, the template or tools, and when releasing Sandkit as a whole.

## Running the tests

Open any `test.html` in a browser to see its results; run any `test.mjs` with Node. While working on a component, its own `test.html` is all you need: components share nothing, so a change to one can't break another. To run every test at once (the pages in headless Chrome, the rest in Node):

```sh
node test/run.mjs
```

It needs only Node and Chrome; set `CHROME=/path/to/chrome` if Chrome isn't found. It takes a while, so run it once, before opening a pull request, and make sure everything passes.
