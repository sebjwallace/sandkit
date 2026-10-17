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
- **Independent.** Components never reference one another, not even optionally. Sandboxes combine them, using slots where a component accepts the sandbox's content, and "Works well with" suggestions in manifests.
- **Contained.** A custom element without Shadow DOM, prefixed `sb-`, with no globals beyond its tag, prefixed and documented CSS classes, and colours from the theme tokens.
- **Small and clear.** Plain JavaScript, no build step, no installs. Code that reads almost like an explanation of itself, without growing bigger for the sake of it.
- **Safe to package.** A classic script with no fetches or external assets, so it survives single-file export.

## What a component needs

```
components/sb-example/
  sb-example.js   the component, with the one-line licence header
  manifest.md     the contract agents read: purpose, usage, data, members, events, styling, works well with, notes
  test.html       tests of the public contract, including two instances side by side
  demo.html       About, then Examples in contrasting sandboxes
```

`sb-log` is a good model to follow. Add the component to [CATALOG.md](CATALOG.md), and its tag to the lists in `test/collisions/test.html` and `test/isolation/test.html`.

## Running the tests

Open any `test.html` in a browser to see its results; run any `test.mjs` with Node. To run every test at once (the pages in headless Chrome, the rest in Node):

```sh
node test/run.mjs
```

It needs only Node and Chrome; set `CHROME=/path/to/chrome` if Chrome isn't found. Please make sure everything passes before opening a pull request.
