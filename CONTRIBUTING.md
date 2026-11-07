# Contributing

Sandkit grows from real sandboxes. If you build one, we'd love to hear how it went: what worked, what didn't, what you discovered, and which parts you found yourself building again. Open an issue or a discussion and tell us.

## Proposing a component

Open an issue describing:

- **What it reveals.** Which kind of understanding it helps people reach, not just what it displays.
- **Where it would be used.** At least two quite different sandboxes, to show it is general rather than tied to one domain.
- **Its interface.** The data it takes, the events it fires, and any methods.

## Proposing a mechanism

Open an issue describing:

- **What it does,** generically: the piece of how things work it captures.
- **Three unrelated subjects it serves,** with what it stands for in each, such as a store as a rainwater tank, a home battery and a bank account.
- **Its settings, and why each is needed:** which subjects need it, and what it opens up.
- **Its invariants:** what holds for any settings, such as nothing created or lost.

## Principles

Every component, and every change to one, should hold to these. [DECISIONS.md](DECISIONS.md) records the reasoning behind each.

- **Reveal, don't merely display.** A table that lists rules displays; one that highlights the rule that just fired, and why, reveals.
- **Domain-agnostic.** A component gives a domain its tooling, and never names domain concepts.
- **Driven by the model.** A component shows state derived from the sandbox's model, set through its properties. What viewers do comes out as events for the sandbox to act on, so the model stays the one source of truth.
- **Independent.** Components never reference one another, not even optionally. Sandboxes combine them, using slots where a component accepts the sandbox's content, as the practices describe; a manifest never names another component.
- **Extend before adding.** Before proposing a new component, check whether an existing one could do the job by growing its own capabilities, and say which you chose. A new component is for a job with its own needs, however similar it looks.
- **Contained.** A custom element without Shadow DOM, prefixed `sb-`, with no globals beyond its tag, prefixed and documented CSS classes, and colours from the theme tokens.
- **Cheap for agents.** Look for what could cost an agent less to read, write and check: no wiring where none is needed, short data, a short manifest, and problems reported in words. Worthwhile only where nothing gets worse for people or for clarity.
- **Small and clear.** Plain JavaScript, no build step, no installs. Code that reads almost like an explanation of itself, without growing bigger for the sake of it.
- **Safe to package.** A classic script with no fetches or external assets, so it survives single-file export.

## Principles of a mechanism

A mechanism is a reusable part of a domain model; the [mechanisms practice](practices/mechanisms.md) says how they're used and how they grow. Every mechanism, and every change to one, should hold to these.

- **Pure, plain JavaScript.** Pure functions over plain data, no framework or library. It knows nothing of Sandkit: no components, engines, other mechanisms, shell, DOM, storage or network, so it could be lifted into any project and still work.
- **Values in, values out.** Operations return new values, never changing what they're given, and each returns what happened (added, spilled, supplied, short), not only the new state.
- **One shape.** `create(settings)` returns the state, a plain object holding its settings too, and every operation takes it first.
- **A stock or a flow, and it says which.** A stock owns a level: its operations return `{ state, ...what happened }`, and its `step` applies everything that happens to it in one model step. A flow computes a change for someone else's level: its `create` holds only its settings, and its operations return only what happened.
- **Order within a step is part of the contract.** When an operation does several things in one step, its manifest states the order, such as in before out.
- **Exact stepping by default.** Anything advanced over time is stepped exactly, not by simple (Euler) steps, unless a setting asks otherwise.
- **Invalid input throws,** with a message that says what to do instead. A silent zero hides bugs in the model.
- **Time and randomness passed in.** The step length, the time and a random function are arguments; it never reads a clock or calls `Math.random`.
- **Domain-free.** No name, setting or output names a domain concept. Rename every domain noun to a generic one: if it still makes sense, it belongs.
- **Configured, never specialised.** A setting is earned when two unrelated subjects need it. Compose before adding options; a flag that changes what it fundamentally does means another mechanism. What varies between steps is an argument to the operation, as an optional last argument where it's optional. Behavioural choices are named strings, listed in an exported `POLICIES` object and checked in `create`, each tested; an unknown one throws. No hooks taking custom functions: rules particular to a subject live in the model's composition, on purpose.
- **Units declared.** Plain numbers, with every setting, input and output's unit in the script and the manifest, and checked in tests.
- **Single values, not ranges.** A model working in ranges runs it once per value.
- **Contained.** One global, its name with the `sb-` prefix in capitals (`SbStore` for `sb-store`), so it's unlikely to clash wherever it's used and always reads as Sandkit's. Names are unique across components and mechanisms.
- **Independent.** Mechanisms never call each other; the domain model composes them.
- **One equation, one home.** If two mechanisms would contain the same equation, one owns it and the other uses it or leaves it out.
- **Small, with a smaller manifest.** Using one must be clearly cheaper than writing one.
- **Proven general by its tests.** Regression tests from at least three unrelated subjects, and invariance tests over seeded random settings. A change must pass them all, or show that a test was itself too narrow.
- **Honest tests.** Regression tests take their expected numbers from outside the mechanism: a published figure, a theory, or arithmetic stated in the test. Statistical invariance tests record their tolerance and why. A law about capacity says that it holds for one mechanism, not for networks of them.

## What a component needs

```
components/sb-example/
  sb-example.js   the component; its first line names it, with its version and licence
  manifest.md     the contract agents read: purpose, usage, data, members, events, styling, notes
  CHANGELOG.md    one entry per release, newest first
  test.html       tests of the public contract, including two instances side by side
  demo.html       About, then Examples in contrasting sandboxes
```

`sb-log` is a good model to follow. Before styling a component, or changing how one looks, read [STYLE.md](STYLE.md): it says which tokens, tones and materials to use, and which other components share a look. Components stay isolated, and the guide is what keeps them consistent: change only the component you're working on, and ask before changing any other to match. Add the component to [CATALOG.md](CATALOG.md), and its tag to the lists in `test/collisions/test.html` and `test/isolation/test.html`.

**Passing tags through.** A part a component draws for a thing with [tags](practices/tagging.md) carries `data-tags="platforms passengers"` on its outermost element, beside its `data-ref`, so the page can [light what's related](practices/highlighting.md) with no wiring. Only when it's given tags; with none, nothing changes.

- **Take them as a `tags` field on the part's data,** where the component reads only the fields it names, so a new one can't collide: a card, a C4 element, a graph node.
- **Otherwise, take a property beside `highlight`,** where every field is shown or a part has no data of its own, such as `sb-table`'s `tagsOf`, `(row) => [tag, …]`. Never reserve a field that existing data may already show.
- **Ignore anything that isn't a list, and never read `working`.**
- **A component that announces for itself** (`data-sb-announces`) includes the tags of the part it announces: `{ ref, tags }`, and exactly `{ ref }` when it has none.

## What a mechanism needs

```
mechanisms/sb-example/
  sb-example.js   one classic script, one global (SbExample); its first line names it, with its version and licence
  manifest.md     short: purpose, stock or flow, settings, inputs, outputs with units, operations and their order, invariants, an example
  CHANGELOG.md    one entry per release, newest first
  test.mjs        regression tests from three unrelated subjects, and invariance tests
  demo.html       the mechanism at work, through views written by hand
```

Add the mechanism to [CATALOG.md](CATALOG.md), under Mechanisms and in Find by need.

## Versions and changelogs

Every change to a component, the shell or Sandkit itself gets a changelog entry, and a new version:

```md
## 0.2.0 · 2026-11-01
- **Breaking:** `sb-step` removed. Listen for `sb-tick` and take `detail.steps` steps.
- Added a `height` attribute.
```

- **Choose the version by semantic versioning.** Until 1.0, a breaking change raises the minor version (0.1.0 to 0.2.0) and anything else the patch (0.1.0 to 0.1.1). From 1.0, breaking changes raise the major version.
- **Breaking entries start `**Breaking:**` and say how to migrate,** so an agent updating a sandbox can apply them without reading the source.
- **Update the version in the script's first line too.** `test/versions` checks they agree.
- **Add an entry to the root `CHANGELOG.md`** for changes to practices, the template or tools, and when releasing Sandkit as a whole.

## Running the tests

Open any `test.html` in a browser to see its results; run any `test.mjs` with Node. While working on a component, its own `test.html` is all you need: components share nothing, so a change to one can't break another. To run every test at once (the pages in headless Chrome, the rest in Node):

```sh
node test/run.mjs
```

It needs only Node and Chrome; set `CHROME=/path/to/chrome` if Chrome isn't found. It takes a while, so run it once, before opening a pull request, and make sure everything passes.
