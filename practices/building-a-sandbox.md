# Building a sandbox

The guide for an agent asked to build a domain sandbox with Sandkit. Read this first, then the [catalog](../CATALOG.md), then only the practices and manifests you need.

A domain sandbox is a small, self-contained application that houses an interactive, executable model of a subject, along with everything needed to explore it. It is plain HTML, CSS and JavaScript that opens in any browser, with nothing to install and no build step.

## Work in iterations

A sandbox grows in small iterations, steered by the person exploring it. **Never build the whole sandbox at once.** Until the person has tried something, you don't know what they want from it, and everything built beyond their first look is a guess that may be thrown away.

- **Iteration 1 is the model plus chapter 1, rough.** Working and honest, not polished. Plan the chapters after it, one line each, but don't build them.
- **Hand over after every iteration,** and build the next one only after the person has seen it and said where to go.
- **Polish only what has survived feedback.** Effort goes where the person's attention is.

What each iteration needs to reach:

| | The bar |
|---|---|
| **Iteration 1** | The model behaves correctly. Chapter 1's "Try" works. The layout doesn't break at phone width. Visual roughness is fine: a simple layout beats a hand-tuned one. |
| **Later iterations** | The new chapter or change works to the same bar. Polish the parts the person has engaged with and said matter. |
| **Always** | Cosmetic issues in parts nobody has looked at yet are noted as known rough edges in the handover, not fixed. |

## 1. Understand the request

Before building anything, be clear on:

- **The subject.** What domain is being explored?
- **The goal.** What should someone understand, decide or discover by the end? If the request doesn't say, ask. The goal shapes everything else.
- **The kind of sandbox.** For intuition (a believable feel for how something works), for decisions (grounded in sources people can check), or for exploring possibilities (pushing beyond what is known, clearly marked as such).
- **The sources.** What material is the model to be built from? Documents, data, articles, or the person's own knowledge. A sandbox is only as good as what is behind it.

  When the sources include data (JSON or JSON Lines), profile it first, where Node is available: `node <sandkit>/tools/analyse.mjs profile <files or folder> --md`. Read the findings (fields that never change, keys, gaps, mixed types, rare values) before designing the model, rather than reading the samples themselves. Then find what goes with what: `node <sandkit>/tools/analyse.mjs dependencies <files or folder> --md`. Treat its rules as candidate rules for the model, inferences until the person confirms them, and its exceptions as questions to ask. The same analyses can go in the sandbox as [`sb-profile`](../components/sb-profile/manifest.md) and [`sb-dependencies`](../components/sb-dependencies/manifest.md), so the person sees what you saw.

Then sketch the chapters: one line each, starting with the most fundamental idea. You'll present this plan with iteration 1, so the person can reorder, cut or redirect it before anything more is built.

## 2. Set up the folder

The sandbox lives in its own folder. Fetch Sandkit (for example `git clone --depth 1 https://github.com/sebjwallace/sandkit` into a temporary location).

**If Node is available,** one command does all of the setup below, and running it again adds components or updates the copies:

```sh
node <sandkit>/tools/setup.mjs <sandbox-folder> sb-log sb-id
```

**Otherwise, copy by hand:**

1. **Copy the template.** Copy the contents of `templates/sandbox/` into the sandbox folder.
2. **Copy what the sandbox uses into `lib/sandkit/`, keeping Sandkit's own paths.** Links between manifests and practices then still work.
   - Always: `CATALOG.md`, `CHANGELOG.md`, `practices/building-a-sandbox.md` (this guide), `practices/journal.md`, `shell/sb-theme-settings.js`, `shell/sb-shell.js`, `shell/manifest.md`, `shell/CHANGELOG.md`.
   - For each component used: `components/<name>/<name>.js`, `components/<name>/manifest.md` and `components/<name>/CHANGELOG.md`.
   - Every practice the sandbox follows, from `practices/`.
   - Not tests or demos. They stay in Sandkit.
3. **Record the source and versions** in `lib/sandkit/SOURCE.md`. Each version is the top entry of its changelog, and also appears in its script's first line.
   ```md
   # Source
   Copied from Sandkit 0.1.0 (https://github.com/sebjwallace/sandkit) at commit <hash>, on <date>.

   ## Versions
   - Sandkit 0.1.0
   - shell 0.1.0
   - sb-log 0.1.0

   ## Files
   - CATALOG.md, CHANGELOG.md, practices/building-a-sandbox.md, practices/journal.md, practices/identifiers.md
   - shell/sb-theme-settings.js, shell/sb-shell.js, shell/manifest.md, shell/CHANGELOG.md
   - components/sb-log/sb-log.js, components/sb-log/manifest.md, components/sb-log/CHANGELOG.md
   ```
4. **Add a script tag** to `index.html` for each component, after the shell's.

```
my-sandbox/
  index.html  model.js  style.css  AGENTS.md  JOURNAL.md
  lib/sandkit/
    SOURCE.md  CATALOG.md  CHANGELOG.md
    shell/        sb-theme-settings.js  sb-shell.js  manifest.md  CHANGELOG.md
    components/   sb-log/  sb-log.js  manifest.md  CHANGELOG.md
    practices/    building-a-sandbox.md  journal.md  identifiers.md
```

**Use components through their manifests. You don't need to read their source,** and doing so only spends effort. Never edit files in `lib/`. To change a component, eject it into the sandbox's own `components/` folder, as `AGENTS.md` describes.

Components from other libraries work the same way: copy them into `lib/<library-name>/`, keeping that library's paths, and record them in its own `SOURCE.md`. Each library uses its own tag prefix, so names don't clash. If two ever do, the console says so, and renaming one is a find-and-replace of its tag in one file.

## 3. Write the goal

Put the goal in the header of `index.html`, where everyone sees it, people and agents alike. One or two sentences: what this sandbox helps people understand or discover.

## 4. Build the model

The model in `model.js` is the heart of the sandbox: the subject captured as code that runs. Build it before any interface, and keep it free of UI.

- **Start small.** The fewest moving parts that show chapter 1's idea. Add more as later chapters need them.
- **Give it a small, clear interface,** like the template's: `state`, `step()`, `reset()`, `setOption()`. The page reads state and calls these; it never reaches inside.
- **Make it a factory when the sandbox needs several.** One machine, market or organism per chapter is common. Keep the specifications (data) apart from the engine (code), so a new instance is just a new specification.
- **Issue codes** for the rules and entities people will discuss, following the [identifiers practice](identifiers.md), and keep them in the model as data.
- **Make runs reproducible.** If the model uses randomness, seed it, so a reset replays the same run.

**Add model tests when they become worth it, not before.** A young model doesn't need them: it is small, and the person exploring it will notice when it's wrong. Add tests once the model has grown enough that a change could quietly break earlier behaviour, when a bug has come back, or when the person asks. Then anchor the settled rules and known results (a machine halts after 107 steps; a store reorders below its reorder point) with plain assertions, no library, in `model.test.js`:

```js
// Model tests: plain assertions that keep the model anchored. No libraries.
// Run with `node model.test.js`, or load this after model.js in a page and read the console.
const { createModel } = typeof require === 'function' ? require('./model.js') : window;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (err) { console.log(`✗ ${name}: ${err.message}`); if (typeof process !== 'undefined') process.exitCode = 1; }
}

const assert = (condition, message) => { if (!condition) throw new Error(message); };

test('each step moves time on by one', () => {
  const model = createModel();
  model.step();
  assert(model.state.time === 1, 'one step later');
});
```

Run them after changing the model. They are the cheapest tests there are; keep them that simple.

## 5. Build chapter 1's surface

Each chapter introduces one idea, much as a well-designed game introduces one mechanic before the next. It has a short explanation, something to try, and the interactive model.

- **Reveal, don't merely display.** Show why things happen: highlight the rule that fired, the stock that ran out, the cause behind the effect.
- **Choose components from the catalog,** and combine them in the page. Each manifest's "Works well with" section suggests pairings and how to wire them. Components never go inside one another unless a component offers a slot for exactly that.
- **Write what the sandbox needs itself** in the page or in `model.js`. Not everything needs a component.
- **Move reused parts out of the page.** When a piece of the surface is used by more than one chapter, make it the sandbox's own component in `components/`, with a short manifest like Sandkit's.
- **Make it two-way.** Let people change things (parameters, scenarios, controls) and see the model respond.

## 6. Keep the page script in order

Declare everything first (state, functions, wiring), then start the sandbox in one marked section at the end. Nothing runs before it exists. The template is laid out this way.

## 7. Check only what needs checking

A sandbox aims to be built with as little testing as possible. Testing is overhead, and the person exploring the sandbox is the best check there is: they will find what is wrong, and that is part of the loop.

- **If the model has tests** (step 4), run them after changing it.
- **Don't write automated tests for the interface.** Driving the page in a browser is expensive, and depends on tools the agent may not have. Add such tests only if the person asks, or if something truly can't be trusted without them, and say why.
- **Check the interface by hand only when it's really needed,** for example after a risky change. Many iterations need no checking at all.
- **Make no assumptions about the environment.** You may have no browser, no automation and no Node, or different ones from what Sandkit uses. If you can't check something, say so in the handover, and ask the person to try it.
- **Screenshots are expensive.** If you take any, take few, and only of what you need to see.

## 8. Record it in the journal

Add an entry to `JOURNAL.md` saying what changed and why, which raises the sandbox's version, and update **Where it stands** in `AGENTS.md`. If the folder uses Git, commit the change with its entry, and tag a breaking version. See the [journal practice](journal.md).

## 9. Hand it over

End every iteration with a short handover:

```
Open:           how to open the sandbox
Version:        the new version, and whether it was breaking
Try first:      the one thing to do first
What it shows:  one line per chapter built
Checked:        what was checked, if anything, or what the person should look at
Assumed:        what is simplified or rests on assumptions
Rough edges:    known issues left for later
Feedback:       if comments came in, which ones this iteration answered (FB- codes)
Next:           2–4 named directions, each with what it adds and what it costs
```

For example, for a Turing machine sandbox:

> **A. Universality.** One machine runs another machine's rules from its tape. Big conceptual payoff; needs a tape encoding and a larger machine.
> **B. Programming.** More challenges to solve by writing rules. Cheap; deepens chapter 2.
> **C. Halting.** More machines whose halting people predict, and a step budget. Cheap.

Then wait for the person to try it and choose.

## Next iterations

When the person responds, record the direction they chose, and the chapter plan as it now stands, in **Where it stands** in the sandbox's `AGENTS.md`, so the next session, person or agent, can pick it up. Then build that one iteration, to the bar above, record it in the journal, and hand over again.

That loop, explore, question, correct, extend, is the point of a sandbox.

## Updating Sandkit in a sandbox

Sandkit, the shell and each component have their own version, recorded in `lib/sandkit/SOURCE.md`, and their own changelog. Versions follow semantic versioning: until 1.0, a breaking change raises the minor version (0.1 to 0.2).

1. **Note the installed versions** in `SOURCE.md`.
2. **Re-copy the files** listed there from the latest Sandkit, keeping their paths, and update `SOURCE.md`. With Node, `node <sandkit>/tools/setup.mjs <sandbox-folder>` does this and lists everything that changed since the installed versions, breaking changes first.
3. **Read each changelog** for the entries newer than the installed version. Entries marked **Breaking** say how to migrate: apply them to the sandbox's own code.
4. **Open the sandbox** to see it still works.

Each sandbox carries its own copy, so nothing changes under it until someone chooses to update.
