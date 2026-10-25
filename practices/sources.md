# Sources

How a sandbox keeps the material it was built from, and how everything in it traces back to that material. Read this when a sandbox is built from sources (documents, interviews, data, images), whenever files arrive in its inbox, and before citing a source from the model.

## Why it matters

A sandbox is only as good as what's behind it, and people can only trust what they can check. When every rule and figure in the model cites the passages it rests on, anyone can follow it back and judge for themselves: this rule comes from what the warehouse manager said on 2 October, that figure from page 3 of the policy. When a source turns out to be wrong, everything it shaped can be found.

## What counts as source material

Source material comes from outside the sandbox: whatever people, organisations or agents elsewhere wrote, said or made. Documents, white papers, articles, web pages, PDFs, data, images and recordings, brought in by a person or by you. A conversation counts too: when someone tells you in a chat how things work, what they think of the model or what they've decided, save the part that matters as a source (`format: "transcript"`, the person as its author), so it can be quoted like anything else.

What you write inside the sandbox isn't source material. Your analyses, summaries and findings cite sources; they aren't sources themselves. In a discovery sandbox they're cards (see [domain discovery](domain-discovery.md)); otherwise they live in the model's items and the journal. A readable copy of a file (below) is the same words in another form, not your writing.

## Screening

Nothing is kept in a sandbox, or used from it, until it has been screened. A sandbox is read by other people, shared and exported, so material that could harm someone goes wherever the sandbox goes.

- **Ask first what counts as sensitive here.** Before the first source, ask the person what they treat as confidential or classified in this subject: names, customers, figures, sites, anything else. Record their rules, never the material itself, in the sandbox's `AGENTS.md` under **Sensitive material**, so every later session screens the same way.
- **Screen everything, wherever it came from:** what arrives in the inbox, what a person copied straight into `sources/`, what's already catalogued when you first read it, and chat excerpts before you save them.
- **Look for** personal data about people who could be identified (as data protection law such as the GDPR defines it); anything confidential to an organisation, or covered by the person's rules; anything dangerous to keep, such as credentials, security details or instructions for harm; and anything offensive or hurtful to the people who will read the sandbox, stakeholders included.
- **Raise it, never fix it silently.** Tell the person what you found, where, and what you propose: redact, paraphrase, cut, or leave it as it is. Something can look sensitive and not be, or be sensitive in ways you can't know, so they decide. Don't use the source until they have.
- **Act on what they decide.** A redacted or paraphrased copy replaces the original, which is removed from the sandbox once they agree: keeping it would keep the problem. Mark each change in the text, such as `[name removed]`, say in the catalogue's `summary` that the source was redacted, record it in the journal, and never write what was removed anywhere.
- **What you derive is screened too.** A quote carries its words into the model, cards and pages, so never quote what was cleared out, and hold what you write to the same standard as what you read.

## The folder

```
sources/
  catalogue.json     every source's details, one entry each
  inbox/             anything dropped in, waiting to be catalogued
  …                  folders arranged however suits the sandbox
```

- **Sources are never edited,** except to clear sensitive material when screening. A correction or a newer version comes in as a new source that supersedes the old one, so whatever cited the old one can still be checked against what it said.
- **Anything can be dropped into the inbox:** by a person, by you, or by the sandbox itself when it saves comments. Nothing waits there for long; see "Processing the inbox".

## The catalogue

`sources/catalogue.json` describes every source:

```json
{
  "format": "sandkit-sources",
  "version": 1,
  "sources": [
    {
      "id": "SRC-3",
      "title": "Interview with the warehouse manager",
      "path": "sources/interviews/2026-10-02-warehouse.txt",
      "format": "transcript",
      "author": "Priya Shah",
      "authored": "2026-10-02",
      "captured": "2026-10-03",
      "origin": "",
      "status": "reviewed",
      "stance": "assertive",
      "role": "answer",
      "respondsTo": "SRC-2",
      "sensitivity": "internal",
      "summary": "How picking and reordering really work on the floor.",
      "tags": ["picking", "reorder"],
      "derivedFrom": [],
      "supersedes": null
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `id` | A code with the prefix `SRC`, never reused (see [identifiers](identifiers.md)). |
| `title`, `path`, `summary`, `tags` | What it is and where it lives. `path` is from the sandbox's folder. |
| `format` | What kind of material, which says how to read it: `document`, `transcript`, `notes`, `data`, `image`, `pdf`, `code`, `web`, `annotations` and so on. |
| `author` | Who wrote or said it: a person, an organisation, or an agent outside the sandbox. |
| `authored`, `captured` | When it was written, and when it was added. They often differ. |
| `origin` | Where it came from, such as a web address, when there is one. |
| `status` | `inbox`, `catalogued` (you've processed it), `reviewed` (a person has checked its details) or `superseded`. |
| `stance` | How certain it is: `assertive`, `speculative`, `assumption` or `idea`. Optional. |
| `role` | What it does: `question`, `answer`, `confirmation`, `correction`, `contradiction` or `decision`. Optional. With `respondsTo`, the source it answers or corrects. |
| `sensitivity` | `public`, `internal` or `confidential`. `internal` when not given. |
| `derivedFrom` | For a readable copy: the source it was made from. Empty otherwise. |
| `supersedes` | The source this one replaces. Set the old one's `status` to `superseded`. |
| `copies` | The source this one repeats, such as a newsletter passing on a forum post. It adds nothing of its own, so it's counted as that one. |
| `grade` | How far this source can be trusted, as whoever catalogued it judges: `{ "value": 4, "why": "First-hand, from the dispatcher on shift, though recalled a week later.", "aspects": { "distance": "first-hand" } }`. `value` from 1 (weak) to 5 (strong), 3 ordinary; `why` is required, since a grade without a reason is a conclusion nobody can check; `aspects`, optional, any dimensions that matter in this subject. Leave it out until it's been judged. |
| `speaksTo` | `how things are` (the default) or `what should be`, for a plan, manual or policy: what should happen isn't evidence of what does. |

Keep to these fields. Write dates as `yyyy-mm-dd`.

## Processing the inbox

When asked to process the inbox, or at the start of a session when `sources/inbox/` isn't empty:

1. **Read each file.** For a large one, map its structure and read what matters, rather than all of it.
2. **Screen it** (see "Screening"): raise anything sensitive with the person, and go on with that file only once they've decided.
3. **Catalogue it:** give it the next `SRC-` code and write its entry, with `status: "catalogued"`. Fill in only what you know; leave the rest out rather than guess.
4. **Move it** into the folder that suits it, and set `path`.
5. **Record the batch** in a journal entry: "Catalogued SRC-14 to SRC-17" (see the [journal practice](journal.md)).

A file of comments saved from the sandbox (`format: "sandkit-annotations"`) is catalogued the same way, with `format: "annotations"` and the session's participants as its authors.

### Files that can't be read as they are

Plain text, Markdown, data, code, PDFs and images can be shown and quoted as they are. For anything else, such as a Word document, a spreadsheet, a slide deck, a saved web page or a recording, keep the original and add a readable copy beside it: the text, in Markdown where it has structure, or a transcript of a recording. Catalogue the copy as a source of its own, with the original's author and `derivedFrom` naming the original, and cite the copy. Quotes are then checked against words anyone can read, and the original is a click away.

```json
{ "id": "SRC-9", "title": "Depot handbook (text)", "path": "sources/handbook/depot-handbook.md",
  "format": "document", "author": "Depot operations team", "derivedFrom": ["SRC-8"], "summary": "The text of SRC-8, converted from Word." }
```

## Citing sources from the model

Codes live in the model first, so citations do too. The model lists everything a person might trace as `ITEMS`, each citing passages and, where it builds on other items, the ids it rests on:

```js
// In model.js: everything a person might trace, with what it rests on.
const ITEMS = [
  { id: 'RUL-014', title: 'Reorder below the reorder point', kind: 'Rule',
    sources: [{ source: 'SRC-3', quote: 'we reorder as soon as we drop under forty' }],
    restsOn: ['PAR-2'] },
  { id: 'PAR-2', title: 'Reorder point: 40 units', kind: 'Parameter',
    sources: [{ source: 'SRC-5', page: 3, quote: 'reorder point is 40' }] },
  { id: 'SCR-1', title: 'Warehouse screen', kind: 'Screen',
    sources: [{ source: 'SRC-8', region: [0.1, 0.2, 0.5, 0.3] }] },
];
```

The model hands them out as `model.items`, and exports `ITEMS` for Node beside `createModel`, as the template does. Anything on the page carrying `data-ref` with one of these ids can then be traced (see the [locating practice](locating.md)).

A citation points at a passage, never a line number, since line numbers break when a file changes:

| Citation | For |
|---|---|
| `{ source, quote }` | Text: the words, copied exactly. Whitespace and capitals don't matter. |
| `{ source, page, quote }` | A PDF: the page, and the words on it. |
| `{ source, region }` | An image: `[x, y, width, height]` as fractions of its width and height. |
| `{ source, annotation }` | One comment in a saved session, by its number. |

Add a `note` to say how a passage was used, when it isn't obvious: `note: 'Taken as the usual case; she mentioned exceptions.'`

Quote enough to be found and no more: a phrase or a sentence. If something rests on nothing yet, leave its `sources` empty rather than cite loosely; an item that cites nothing is a finding, not a gap to paper over.

## Checking

Where Node is available, check the sources after cataloguing or citing:

```sh
node lib/sandkit/tools/sources.mjs check .
```

It fails when the catalogue is broken, a file in `sources/` isn't catalogued, a citation names an unknown source or quotes words that aren't there, or a link (`respondsTo`, `derivedFrom`, `supersedes`, `restsOn`) points at nothing. It notes, without failing, quotes in PDFs and images it can't read, items citing nothing, and files waiting in the inbox. Fix the errors before handing over; mention the notes if they matter.

## Showing sources in the sandbox

A page opened by double-clicking can't read the sandbox's files, so the features that show sources need the sandbox served:

```sh
node lib/sandkit/tools/serve.mjs .
```

A page knows it's served from its address, and says so plainly when it isn't, rather than showing nothing:

```js
const served = location.protocol !== 'file:';
const catalogue = served ? await (await fetch('sources/catalogue.json')).json() : null;
```

Everything else in the sandbox works either way. Components never load files themselves: the page loads them and hands components the data.

Show a source with [`sb-source`](../components/sb-source/manifest.md): the paper, its details, and the passages the model cites marked where they are, with any it can't find listed. Its manifest shows how to turn `model.items` into its passages. Show the whole catalogue with [`sb-sources`](../components/sb-sources/manifest.md): cards to search, filter and sort, with replaced sources marked and files waiting in the folder listed apart. Open a source in `sb-source` when one is chosen.

## Tracing

Anything in the model can be asked "why is that there?". [`sb-source-trace`](../components/sb-source-trace/manifest.md) answers with one graph flowing left to right: the sources and what was derived from them, the items resting on them, the thing asked about, and what rests on it. It reads `model.items` and the catalogue, so tracing needs nothing more than citing well.

Make it reachable from anywhere with [`sb-trace-mode`](../components/sb-trace-mode/manifest.md), Trace in the shell's mode picker (see the [modes practice](modes.md)). While it's on, pointing outlines any part whose `data-ref` is in `model.items`, and a click opens the trace instead of acting:

```html
<sb-shell>
  <sb-comments slot="modes"></sb-comments>
  <sb-trace-mode slot="modes"></sb-trace-mode>
</sb-shell>

<sb-modal id="trace-modal" heading="Why it's there"><sb-source-trace id="trace"></sb-source-trace></sb-modal>
```

```js
const items = new Set(model.items.map((item) => item.id));
traceMode.traceable = (ref) => items.has(ref);
traceMode.addEventListener('sb-pick', (e) => {
  traceModal.show();          // first, so the trace has its room when it lays out
  trace.subject = e.detail.ref;
  trace.clearTrail();
});
trace.addEventListener('sb-open', (e) => openSource(e.detail.id));   // in sb-source, in a second modal
```

Sandkit's `examples/control-room/` has the whole of this wiring.

From Node, trace without a page: write the items to a file and run `node <sandkit>/tools/analyse.mjs trace items.json sources/catalogue.json --ref SCR-3 --md`.
