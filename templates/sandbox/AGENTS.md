# Working on this sandbox

This folder is a domain sandbox: a small, self-contained application that houses an interactive model of a subject, so people can understand it by working with it. It was built with [Sandkit](https://github.com/sebjwallace/sandkit).

## Read first

1. **The goal,** at the top of `index.html`. It says what this sandbox is for, and should guide every change.
2. **`lib/sandkit/practices/building-a-sandbox.md`,** the method this sandbox follows.
3. **`lib/sandkit/CATALOG.md`,** for everything Sandkit offers. Links to anything not in `lib/` point to parts this sandbox doesn't use yet; fetch them from the source recorded in `lib/sandkit/SOURCE.md` if you need them.

## Roadmap

How this sandbox is meant to grow. Update it at the end of every iteration, when the person chooses where to go next.

- **Chapters built:** {{one line each}}
- **Chapters planned:** {{one line each, in order}}
- **Chosen direction:** {{what the person asked for next, and why}}

## Files

| File | What it is |
|---|---|
| `index.html` | The sandbox: goal, chapters, and the interactive surface. |
| `model.js` | The domain model. Code that runs, with no UI. |
| `style.css` | The sandbox's own styles, using the theme tokens (`--sb-*`). |
| `lib/sandkit/` | Sandkit components, shell and practices, copied in. See `SOURCE.md` for where they came from. |
| `components/` | Components this sandbox owns (ejected or written here), if any. |

## Sandkit components

- **Use them through their manifests** (`lib/sandkit/components/<name>/manifest.md`, `lib/sandkit/shell/manifest.md`). You don't need to read their source.
- **Don't edit anything in `lib/`.** It is a copy, and may be replaced when Sandkit is updated.
- **To change a component, eject it:** copy its folder into `components/`, rename it (replace every occurrence of its tag name, e.g. `sb-log`, with a new one), note where it came from at the top of the file, and point `index.html` at the new copy. From then on it belongs to this sandbox.
- **Combine components in the page,** never inside each other. Each manifest's "Works well with" section suggests pairings and how to wire them.

## Conventions

- **Work in iterations.** One chapter or change at a time, handed over before the next. See `lib/sandkit/practices/building-a-sandbox.md`.
- **Declare everything, then start.** Page scripts declare their state and functions first, and start the sandbox in one marked section at the end.
- **Codes for what people discuss.** Rules, entities, claims and sources get stable codes (see `lib/sandkit/practices/identifiers.md`), issued in the model and cited everywhere.
- **Reveal, don't merely display.** Show why things happen, not only that they did.
- **Keep it small and clear.** This is a sandbox, not production software.
- **Test as little as possible, for as long as possible.** Add model tests (plain assertions, no library) only once the model has grown enough to need them; see the guide, step 4. No automated tests of the interface unless the person asks; check it by hand only when really needed, and never assume what tools are available.

## Updating Sandkit

Re-copy the files listed in `lib/sandkit/SOURCE.md` from the Sandkit repository, keeping their paths, and update `SOURCE.md`. If Node is available, Sandkit's `node tools/setup.mjs <this-folder>` does both, and `node tools/setup.mjs <this-folder> sb-name` adds a component. Then open the sandbox to see it still works.
