# Mechanisms

How to build a sandbox's domain model from mechanisms, and how mechanisms grow. Read this before building or changing a domain model.

## What a mechanism is

A sandbox has two models. The **domain model**, in `model.js`, is the subject captured as code that runs: pure, knowing nothing outside itself. The **view model** prepares what the pages show, using the domain model and never the reverse.

Each has its own kind of reusable part:

| | Reusable part | Composed into |
|---|---|---|
| View | Component | The page, through the view model |
| Domain | Mechanism | The domain model |
| Method | Engine | Used by a sandbox following a method, such as discovery |

A mechanism is a small, pure piece of how something works, general enough to recur across many subjects: a store that fills, spills and runs dry; an input from outside that varies over time; a limited supply shared out by rules; one thing converted into another, with losses. A rainwater tank, a home battery, a pantry and a bank account are all stores. The subject gives them their meaning; the mechanism gives them their behaviour.

A mechanism is a part of a domain model, never a model of its own. The domain model composes them.

**Mechanism or engine?** Both compute and draw nothing. An engine holds the rules of a method of working, such as how discovery weighs claims: it's about the sandboxing. A mechanism is part of the subject's behaviour: it's about the world being modelled.

## Why use one

- **The edge cases are already right.** Hand-written models fail at the edges: more coming in than there's room for within a step, part of a demand met when a store runs dry, whether things go in before they come out. A mechanism has met them and been fixed, once.
- **It costs less.** Reading a short manifest is far cheaper than writing and checking the behaviour again.
- **What people learn carries over.** A store behaves the same in every sandbox, so understanding one is understanding them all.

## When to use one, and when not

**Use one** when a part of the model is one of the mechanisms in the catalog's **Find by need**, whatever the subject calls it.

**Write it by hand in `model.js`** when:
- It's the subject's own rule, true of this domain and nowhere else, such as a timetable's rules for which platform a train gets.
- It's a line or two of arithmetic. A mechanism earns its place by holding behaviour that's easy to get wrong, not by wrapping a sum.
- No mechanism fits without bending it.

Not everything in a domain model needs a mechanism. The model is the subject; mechanisms are the parts of it that recur.

**Plan the model's parts first.** Before building or extending the model, list what it needs, and against each write the mechanism that serves it, or **by hand**, naming the mechanisms considered and why none fits. Mark a part built by hand **candidate** if it seems general beyond this subject. One short line per part, in the journal entry's **Parts** line beside the page's parts (see the [journal practice](journal.md#the-entry)).

## Composing in `model.js`

Composition is ordinary code in the domain model, read top to bottom in the order things happen:

```js
const rain = SbDriver.at(state.rain, ctx);
const caught = SbConversion.apply(state.roof, rain.value);
const filled = SbStore.fill(state.tank, caught.out);
state.tank = filled.store;
```

- **Name things for what they are in the subject** (`tank`, `roof`); mechanisms are named for what they generically are (`SbStore`). That's what makes a composed model read as a description of its domain, and the `Sb` says where the subject ends and Sandkit's parts begin: a store is the subject's, `SbStore` is the mechanism.
- **Each operation returns what happened,** not only the new state: what was added, spilled, supplied or short. Keep it: it's what the model logs, traces and the page shows.
- **Mechanisms never call each other.** The model passes one's results to the next.

### Ways things interact

Start from one question: **is there an interface between these two things, or direct contact?** Contact is continuous; an interface carries discrete signals.

- **Reading.** The model passes one mechanism's state or output into another. Always allowed. When many similar things update in a loop, such as households reading their neighbours, they read last step's values, so the order they run in doesn't matter.
- **Writing to a shared place.** One thing leaves something for another to find later: a note on a board, a deposit into a shared store. The model makes that write; mechanisms never write to each other.
- **Moving something that's conserved.** Water, energy, money, food. It moves only through operations such as `take` that never give more than there is, so nothing is created or lost. When several things want the same limited supply in one step, they ask for it and an allocation mechanism decides who gets what, rather than whoever asks first.
- **Commands and events.** Actors signalling across an interface. These go through a mailbox mechanism, so a message sent now arrives next step: real signals take time, and cause and effect stay visible.

## Configuring

Each mechanism has a few fixed settings, listed with their units in its manifest. From the using side:

- **Settings are set once;** things that change over time, such as this step's rainfall, are passed to each step.
- **Behaviour is chosen from named policies,** such as overflow as `spill` or `reject`. Pick one; each is tested.
- **There are no hooks for custom functions.** If a mechanism seems to need one, you're probably missing an argument, or it's the wrong mechanism.
- **Time and randomness are passed in:** the step length, the time, and a seeded random function. So a reset replays the same run.
- **Units are declared,** not converted. Values are plain numbers in the units the manifest gives; convert at the edge, in the model's composition.
- **Domain terms stay in the model.** A store has a `capacity`, not a roof area: working out the capacity from the roof is the model's job, or a conversion's.

## Ranges

A mechanism works in single values. Where the model works in ranges, such as a low and a high estimate, run the mechanism once for each and show both.

## Loading

A mechanism is one classic script declaring one global named after it (`SbStore` in `sb-store.js`), so it works in a page opened by double-clicking, where modules don't load. It ends by exporting itself for Node.

- **In the page,** its script tag goes before `model.js`'s, since the model needs it when it loads. `tools/setup.mjs` puts it there.
- **In Node,** the model loads it for itself, only when it's running under Node, since in the page it's already there and declaring it again would fail:
  ```js
  if (typeof module !== 'undefined') globalThis.SbStore = require('./lib/sandkit/mechanisms/sb-store/sb-store.js');
  ```

The template's `model.js` shows where these lines go.

## Changing one

Use mechanisms through their manifests; don't read their source, and never edit `lib/`. To change one, **eject it**: copy its folder into the sandbox's own `mechanisms/`, rename it with the sandbox's own prefix, never `sb-` (its folder, file and global: `sb-store` and `SbStore` become `wh-store` and `WhStore`), note at the top where it came from, and point the model and pages at the copy. From then on it belongs to the sandbox. If the change would be useful beyond this subject, say so in the handover: it may belong in Sandkit's.

## How mechanisms grow

- **Seeded, then harvested.** The first few, the most general, are built on purpose, because an empty catalog never gets consulted. After that, the catalog grows from what real sandboxes turn up. Looking for abstractions on purpose only goes so far; past that, they're found by noticing them.
- **Noticing costs one word.** A part of the model built by hand that feels general beyond this subject is marked **candidate** in the journal's Parts line. Nobody hunts for them.
- **Candidates leave a sandbox as handoffs, never links.** A sandbox stays self-contained: a candidate becomes a proposal to Sandkit, and the sandbox picks up the promoted mechanism when it next updates.
- **Seen two or three times, it's ready to propose.** If it overlaps a mechanism that exists, generalise that one instead, such as with a new policy, rather than add a near-copy.
- **Promoted when it's proven general.** A part becomes a mechanism when it passes regression tests from at least three unrelated subjects without changes, plus its invariance tests (below). If it needs a tweak for each new subject, it isn't general yet.

## What the tests are for

A mechanism's worth is its breadth: how much of the world it covers. Its tests say what that breadth is, in code that runs.

- **Regression tests** are realistic cases from at least three unrelated subjects, each named for its subject and with a known outcome: a store as a rainwater tank, a home battery and a bank account. They show the mechanism isn't secretly shaped around one subject, and they're the best explanation of what it does.
- **Invariance tests** check what holds for any settings, across many seeded random runs: nothing is created or lost; a level never goes below zero or above capacity; the same seed gives the same run; the result doesn't depend on the unit. Cases show where a mechanism has been; invariances show it holds everywhere in between. Each mechanism exports its invariants, so a sandbox's model tests can run them too.

When a new subject needs a mechanism adapted, every existing test must still pass, so it stays as broad as it was. Or the new subject may show that a test was itself too narrow, fitted to one subject, and the test is what changes. Either way, the tests guard against a mechanism being bent to fit one subject at the cost of the rest.
