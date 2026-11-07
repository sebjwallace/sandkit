# Working on this sandbox

This folder is a domain sandbox: a small, self-contained application that houses an interactive model of a subject, so people can understand it by working with it. It was built with [Sandkit](https://github.com/sebjwallace/sandkit).

## Read first

1. **The goal,** in `sandbox.js`. It says what this sandbox is for, and should guide every change.
2. **Where it stands,** below.
3. **`JOURNAL.md`,** what changed and why, newest first. Read only as far back as you need.
4. **`lib/sandkit/practices/building-a-sandbox.md`,** the method this sandbox follows.
5. **Any other practice the sandbox follows,** such as `lib/sandkit/practices/domain-discovery.md` when it discovers a domain, on a page of its own (`discovery.html` by default) linked from the header.
6. **`lib/sandkit/practices/workshops.md`,** when asked to workshop the sandbox: to review, correct or hand over its model with the people who know the subject.
7. **`lib/sandkit/practices/tagging.md`,** before tagging anything. Semantic tagging is opt-in: it costs tokens, so ask the person first, and suggest starting or stopping if the sandbox's needs change. On a yes, add `sb-tags-mode` to the sandbox's pages, so people can see and follow the tags.
8. **`lib/sandkit/CATALOG.md`,** for everything Sandkit offers in detail; the index under Sandkit components below covers most needs. Links to anything not in `lib/` point to parts this sandbox doesn't use yet; fetch them from the source recorded in `lib/sandkit/SOURCE.md` if you need them.

## Where it stands

Where this sandbox is now, and how it is meant to grow. Rewrite it at the end of every iteration, when the person chooses where to go next; the journal holds the history.

- **Version:** {{the latest entry in JOURNAL.md}}
- **Chapters built:** {{one line each}}
- **Chapters planned:** {{one line each, in order}}
- **Practices followed:** {{beyond building a sandbox, each with where it lives, such as domain discovery on `discovery.html`; none yet}}
- **Tagging:** {{yes or no, and why; not asked yet}}
- **Chosen direction:** {{what the person asked for next, and why}}
- **Open questions:** {{codes, one line each}}

## Sensitive material

What the people behind this sandbox treat as confidential, personal or otherwise sensitive, and who the sandbox is for, so every session screens sources, and checks before sharing, the same way. Ask before the first source arrives, and keep only the rules here, never the material. See "Screening", "Licences" and "Before the sandbox is shared" in `lib/sandkit/practices/sources.md`.

- **For:** {{just the person, their team or organisation, or the public; not asked yet}}

{{the person's rules, one line each; not asked yet}}

### Personal information in this sandbox

Every place personal data is kept, so nothing is shared by accident: what kind, whose, and where, never the data itself. Add a line whenever some is kept, remove it when it's cleared, and go through this list before anything is shared. See "Screening" and "Before the sandbox is shared" in `lib/sandkit/practices/sources.md`.

{{one line each, such as "SRC-4: drivers' names and phone numbers"; none yet}}

## Files

| File | What it is |
|---|---|
| `index.html` | The first page: chapters and the interactive surface. |
| `sandbox.js` | The sandbox's name, goal and pages, set on the shell. Every page includes it. |
| `model.js` | The domain model: pure domain code that knows nothing of pages, components or saving. Shared by every page. See the guide, step 4. |
| `view.js` | The view model: functions that turn the model's state into what the pages show, if several pages share them. |
| `sources/` | The material this sandbox was built from, described in `catalogue.json`, with new arrivals in `inbox/` and digests of material that couldn't be kept in `digests/`. See `lib/sandkit/practices/sources.md`. |
| `records/` | In a discovery sandbox, what was written from the sources: claims, questions, decisions and the rest, one script per kind. See `lib/sandkit/practices/domain-discovery.md`. |
| `data/` | Data the pages use, as scripts that set it on the model (never fetched), if any. |
| `JOURNAL.md` | What changed and why, one entry per version, newest first. |
| `CLAUDE.md` | One line pointing to this file, for agents that read only `CLAUDE.md`. |
| `style.css` | The sandbox's own styles, using the theme tokens (`--sb-*`) as `lib/sandkit/STYLE.md` describes. |
| `lib/sandkit/` | Sandkit components, shell and practices, copied in. See `SOURCE.md` for where they came from. |
| `parts.js` | Functions returning HTML for parts used on more than one page or chapter, if any. |
| `components/` | Components this sandbox owns (ejected or written here), if any. |
| `mechanisms/` | Mechanisms this sandbox owns (ejected), if any. |

<!-- sandkit:components -->
## Sandkit components

*Kept current by Sandkit's setup, along with Sandkit mechanisms. Anything added between these markers is replaced, so keep the sandbox's own notes outside them.*

**Before building any part of a page, find it in the index below and in This sandbox's components.** Build by hand only when nothing fits, and record why in the journal's Parts line (see the building guide, step 5).

- **Use them through their manifests** (`lib/sandkit/components/<name>/manifest.md`, `lib/sandkit/shell/manifest.md`, and for any engine `lib/sandkit/engines/<name>/manifest.md`). Don't read their source: it costs about three times as much as the manifest, which says all you need to use them.
- **Don't edit anything in `lib/`.** It is a copy, and may be replaced when Sandkit is updated.
- **To change a component, eject it:** copy its folder into `components/`, rename it (replace every occurrence of its tag name, e.g. `sb-log`, with a new one), note where it came from at the top of the file, and point the pages that use it at the new copy. From then on it belongs to this sandbox.
- **Combine components in the page,** never inside each other. The practices say which components go together and how to wire them.

What serves each need, kept current from `lib/sandkit/CATALOG.md` by Sandkit's setup. Copying by hand, paste the catalog's Find by need section between these markers.

<!-- sandkit:find-by-need -->
<!-- /sandkit:find-by-need -->
<!-- /sandkit:components -->

<!-- sandkit:mechanisms -->
## Sandkit mechanisms

**Before writing any part of the domain model, find it among the mechanisms in the index above.** Write it by hand only when nothing fits, and record why in the journal's Parts line (see the building guide, step 4). Read `lib/sandkit/practices/mechanisms.md` before building or changing the model.

- **Use them through their manifests** (`lib/sandkit/mechanisms/<name>/manifest.md`), never their source.
- **Don't edit anything in `lib/`.**
- **To change a mechanism, eject it:** copy its folder into `mechanisms/`, rename it with this sandbox's own prefix (its folder, file and global: `sb-store` and `SbStore` become, say, `wh-store` and `WhStore`), note where it came from at the top of the file, and point the model and pages at the new copy. From then on it belongs to this sandbox.
- **Compose them in `model.js`,** never inside each other, naming things for what they are in the subject.
<!-- /sandkit:mechanisms -->

## This sandbox's components

Parts of the surface this sandbox made its own, once they were needed in more than one place. Use them through these lines, not their code. See `lib/sandkit/practices/domain-components.md`.

{{one line each: its name, where it is, and what it takes; none yet}}

## Conventions

- **Be economical with tokens, unless the person asks otherwise.** Read only what you need, trust components to do their work, and let the person's feedback do the checking rather than screenshots and repeated looking. Never at the cost of what they asked for.
- **Work in iterations.** One chapter or change at a time, handed over before the next. See `lib/sandkit/practices/building-a-sandbox.md`.
- **Journal every change.** After any meaningful change, add an entry to `JOURNAL.md`, update Where it stands, and commit if the folder uses Git (tagging a breaking version). See `lib/sandkit/practices/journal.md`.
- **A page per part worth sharing on its own,** once the sandbox grows: each listed in `sandbox.js`, sharing `model.js`, and including only what it uses, so it can be exported alone. See `lib/sandkit/practices/pages.md`.
- **Exporting a page:** when asked, run `node lib/sandkit/tools/export.mjs <page>.html` from this folder (the page's Export button gives people the prompt), then report where it saved, every file that went in with its size, and any warnings.
- **Sources are added only with the person's say-so, then screened, catalogued and cited.** Never save part of the chat, or anything else you'd bring in, as a source without asking first. Screen every source before using it, wherever it came from, and raise anything sensitive with the person. Process `sources/inbox/` when it isn't empty, cite passages from the model's `ITEMS` (or, in a discovery sandbox, from its records), and run `node lib/sandkit/tools/sources.mjs check .` after. See `lib/sandkit/practices/sources.md`.
- **Serving:** features that read or write the sandbox's files need `node lib/sandkit/tools/serve.mjs .` (then open the address it prints). Everything else works by double-clicking.
- **Declare everything, then start.** Page scripts declare their state and functions first, and start the sandbox in one marked section at the end.
- **Pointing is free.** Name what a part stands for with `data-ref`, and the highlighting script in every page lights it everywhere it appears, pins included. Name several things with `data-points-at`. Don't write highlight wiring unless `lib/sandkit/practices/highlighting.md` says you need it.
- **Codes for what people discuss.** Rules, entities, claims and sources get stable codes (see `lib/sandkit/practices/identifiers.md`), issued in the model and cited everywhere.
- **Reveal, don't merely display.** Show why things happen, not only that they did.
- **Keep it small and clear.** This is a sandbox, not production software.
- **Test as little as possible, for as long as possible.** Add model tests (plain assertions, no library) only once the model has grown enough to need them; see the guide, step 4. No automated tests of the interface unless the person asks; check it by hand only when really needed, and never assume what tools are available.

## Updating Sandkit

Follow "Updating Sandkit in a sandbox" in `lib/sandkit/practices/building-a-sandbox.md`. In short: note the versions in `lib/sandkit/SOURCE.md`, re-copy the files from a newer Sandkit, and apply any **Breaking** changelog entries since those versions. If Node is available, Sandkit's `node tools/setup.mjs <this-folder>` does the copying and lists the changes; `node tools/setup.mjs <this-folder> sb-name` adds a component, with `--page <page>.html` for a page other than `index.html`.
