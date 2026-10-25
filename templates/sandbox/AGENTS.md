# Working on this sandbox

This folder is a domain sandbox: a small, self-contained application that houses an interactive model of a subject, so people can understand it by working with it. It was built with [Sandkit](https://github.com/sebjwallace/sandkit).

## Read first

1. **The goal,** in `sandbox.js`. It says what this sandbox is for, and should guide every change.
2. **Where it stands,** below.
3. **`JOURNAL.md`,** what changed and why, newest first. Read only as far back as you need.
4. **`lib/sandkit/practices/building-a-sandbox.md`,** the method this sandbox follows.
5. **`lib/sandkit/practices/workshops.md`,** when asked to workshop the sandbox: to review, correct or hand over its model with the people who know the subject.
6. **`lib/sandkit/CATALOG.md`,** for everything Sandkit offers. Links to anything not in `lib/` point to parts this sandbox doesn't use yet; fetch them from the source recorded in `lib/sandkit/SOURCE.md` if you need them.

## Where it stands

Where this sandbox is now, and how it is meant to grow. Rewrite it at the end of every iteration, when the person chooses where to go next; the journal holds the history.

- **Version:** {{the latest entry in JOURNAL.md}}
- **Chapters built:** {{one line each}}
- **Chapters planned:** {{one line each, in order}}
- **Chosen direction:** {{what the person asked for next, and why}}
- **Open questions:** {{codes, one line each}}

## Sensitive material

What the people behind this sandbox treat as confidential, personal or otherwise sensitive, so every session screens sources the same way. Ask before the first source arrives, and keep only the rules here, never the material. See "Screening" in `lib/sandkit/practices/sources.md`.

{{the person's rules, one line each; not asked yet}}

## Files

| File | What it is |
|---|---|
| `index.html` | The first page: chapters and the interactive surface. |
| `sandbox.js` | The sandbox's name, goal and pages, set on the shell. Every page includes it. |
| `model.js` | The domain model. Code that runs, with no UI. Shared by every page. |
| `sources/` | The material this sandbox was built from, described in `catalogue.json`, with new arrivals in `inbox/`. See `lib/sandkit/practices/sources.md`. |
| `data/` | Data the pages use, as scripts that set it on the model (never fetched), if any. |
| `JOURNAL.md` | What changed and why, one entry per version, newest first. |
| `style.css` | The sandbox's own styles, using the theme tokens (`--sb-*`) as `lib/sandkit/STYLE.md` describes. |
| `lib/sandkit/` | Sandkit components, shell and practices, copied in. See `SOURCE.md` for where they came from. |
| `parts.js` | Functions returning HTML for parts used on more than one page or chapter, if any. |
| `components/` | Components this sandbox owns (ejected or written here), if any. |

## Sandkit components

- **Use them through their manifests** (`lib/sandkit/components/<name>/manifest.md`, `lib/sandkit/shell/manifest.md`, and for any engine `lib/sandkit/engines/<name>/manifest.md`). Don't read their source: it costs about three times as much as the manifest, which says all you need to use them.
- **Don't edit anything in `lib/`.** It is a copy, and may be replaced when Sandkit is updated.
- **To change a component, eject it:** copy its folder into `components/`, rename it (replace every occurrence of its tag name, e.g. `sb-log`, with a new one), note where it came from at the top of the file, and point the pages that use it at the new copy. From then on it belongs to this sandbox.
- **Combine components in the page,** never inside each other. The practices say which components go together and how to wire them.

## This sandbox's components

Parts of the surface this sandbox made its own, once they were needed in more than one place. Use them through these lines, not their code. See `lib/sandkit/practices/domain-components.md`.

{{one line each: its name, where it is, and what it takes; none yet}}

## Conventions

- **Work in iterations.** One chapter or change at a time, handed over before the next. See `lib/sandkit/practices/building-a-sandbox.md`.
- **Journal every change.** After any meaningful change, add an entry to `JOURNAL.md`, update Where it stands, and commit if the folder uses Git (tagging a breaking version). See `lib/sandkit/practices/journal.md`.
- **A page per part worth sharing on its own,** once the sandbox grows: each listed in `sandbox.js`, sharing `model.js`, and including only what it uses, so it can be exported alone. See `lib/sandkit/practices/pages.md`.
- **Exporting a page:** when asked, run `node lib/sandkit/tools/export.mjs <page>.html` from this folder (the page's Export button gives people the prompt), then report where it saved, every file that went in with its size, and any warnings.
- **Sources are screened, catalogued and cited.** Screen every source before using it, wherever it came from, and raise anything sensitive with the person. Process `sources/inbox/` when it isn't empty, cite passages from the model's `ITEMS`, and run `node lib/sandkit/tools/sources.mjs check .` after. See `lib/sandkit/practices/sources.md`.
- **Serving:** features that read or write the sandbox's files need `node lib/sandkit/tools/serve.mjs .` (then open the address it prints). Everything else works by double-clicking.
- **Declare everything, then start.** Page scripts declare their state and functions first, and start the sandbox in one marked section at the end.
- **Codes for what people discuss.** Rules, entities, claims and sources get stable codes (see `lib/sandkit/practices/identifiers.md`), issued in the model and cited everywhere.
- **Reveal, don't merely display.** Show why things happen, not only that they did.
- **Keep it small and clear.** This is a sandbox, not production software.
- **Test as little as possible, for as long as possible.** Add model tests (plain assertions, no library) only once the model has grown enough to need them; see the guide, step 4. No automated tests of the interface unless the person asks; check it by hand only when really needed, and never assume what tools are available.

## Updating Sandkit

Follow "Updating Sandkit in a sandbox" in `lib/sandkit/practices/building-a-sandbox.md`. In short: note the versions in `lib/sandkit/SOURCE.md`, re-copy the files from a newer Sandkit, and apply any **Breaking** changelog entries since those versions. If Node is available, Sandkit's `node tools/setup.mjs <this-folder>` does the copying and lists the changes; `node tools/setup.mjs <this-folder> sb-name` adds a component, with `--page <page>.html` for a page other than `index.html`.
