# Building a sandbox

The end-to-end guide for an agent asked to build a domain sandbox with Sandkit. Read this first, then the [catalog](../CATALOG.md), then only the practices and manifests you need.

A domain sandbox is a small, self-contained application that houses an interactive, executable model of a subject, along with everything needed to explore it. It is plain HTML, CSS and JavaScript that opens in any browser, with nothing to install and no build step.

## 1. Understand the request

Before building anything, be clear on:

- **The subject.** What domain is being explored?
- **The goal.** What should someone understand, decide or discover by the end? If the request doesn't say, ask. The goal shapes everything else.
- **The kind of sandbox.** For intuition (a believable feel for how something works), for decisions (grounded in sources people can check), or for exploring possibilities (pushing beyond what is known, clearly marked as such).
- **The sources.** What material is the model to be built from? Documents, data, articles, or the person's own knowledge. A sandbox is only as good as what is behind it.

## 2. Set up the folder

The sandbox lives in its own folder. Fetch Sandkit (for example `git clone --depth 1 https://github.com/sebjwallace/sandkit` into a temporary location) and:

1. **Copy the template.** Copy the contents of `templates/sandbox/` into the sandbox folder.
2. **Copy what the sandbox uses into `lib/sandkit/`, keeping Sandkit's own paths.** Links between manifests and practices then still work.
   - Always: `CATALOG.md`, `practices/building-a-sandbox.md` (this guide), `shell/sb-theme-settings.js`, `shell/sb-shell.js`, `shell/manifest.md`.
   - For each component used: `components/<name>/<name>.js` and `components/<name>/manifest.md`.
   - Every practice the sandbox follows, from `practices/`.
   - Not tests or demos. They stay in Sandkit.
3. **Record the source** in `lib/sandkit/SOURCE.md`:
   ```md
   # Source
   Copied from https://github.com/sebjwallace/sandkit at commit <hash>, on <date>.
   - CATALOG.md, practices/building-a-sandbox.md
   - shell/sb-theme-settings.js, shell/sb-shell.js, shell/manifest.md
   - components/sb-log/sb-log.js, components/sb-log/manifest.md
   - practices/identifiers.md
   ```
4. **Add a script tag** to `index.html` for each component, after the shell's.

```
my-sandbox/
  index.html  model.js  style.css  AGENTS.md
  lib/sandkit/
    SOURCE.md  CATALOG.md
    shell/        sb-theme-settings.js  sb-shell.js  manifest.md
    components/   sb-log/  sb-log.js  manifest.md
    practices/    building-a-sandbox.md  identifiers.md
```

**Use components through their manifests. You don't need to read their source,** and doing so only spends effort. Never edit files in `lib/`. To change a component, eject it into the sandbox's own `components/` folder, as `AGENTS.md` describes.

Components from other libraries work the same way: copy them into `lib/<library-name>/`, keeping that library's paths, and record them in its own `SOURCE.md`. Each library uses its own tag prefix, so names don't clash. If two ever do, the console says so, and renaming one is a find-and-replace of its tag in one file.

## 3. Write the goal

Put the goal in the header of `index.html`, where everyone sees it, people and agents alike. One or two sentences: what this sandbox helps people understand or discover.

## 4. Build the model first

The model in `model.js` is the heart of the sandbox: the subject captured as code that runs. Build it before the interface, and keep it free of UI.

- **Start small.** The fewest moving parts that show the first idea. Add more as chapters need them.
- **Give it a small, clear interface,** like the template's: `state`, `step()`, `reset()`, `setOption()`. The page reads state and calls these; it never reaches inside.
- **Issue codes** for the rules and entities people will discuss, following the [identifiers practice](identifiers.md), and keep them in the model as data.
- **Make runs reproducible.** If the model uses randomness, seed it, so a reset replays the same run.

## 5. Build the surface, a chapter at a time

Organise the sandbox into chapters, each introducing one idea, much as a well-designed game introduces one mechanic before the next. Each chapter has a short explanation, something to try, and the interactive model.

- **Reveal, don't merely display.** Show why things happen: highlight the rule that fired, the stock that ran out, the cause behind the effect.
- **Choose components from the catalog,** and combine them in the page. Each manifest's "Works well with" section suggests pairings and how to wire them. Components never go inside one another unless a component offers a slot for exactly that.
- **Write what the sandbox needs itself** in the page or in `model.js`. Not everything needs a component.
- **Make it two-way.** Let people change things (parameters, scenarios, controls) and see the model respond.

## 6. Keep the page script in order

Declare everything first (state, functions, wiring), then start the sandbox in one marked section at the end. Nothing runs before it exists. The template is laid out this way.

## 7. Check it works

Open `index.html` in a browser, or a headless one, and check:

- Every part renders, and the console shows no errors.
- Every code resolves (no dashed `sb-id` pills, if you use them).
- The first chapter's "Try" actually shows what it promises.

## 8. Hand it over

Tell the person how to open it, what to try first, and what is still uncertain or assumed. Then keep going: they will explore, question and correct it, and you refine it. That loop is the point.

## Updating Sandkit in a sandbox

Re-copy the files listed in `lib/sandkit/SOURCE.md` from the latest Sandkit, keeping their paths, update `SOURCE.md`, and check the sandbox still works. Each sandbox carries its own copy, so nothing changes under it until someone chooses to update.
