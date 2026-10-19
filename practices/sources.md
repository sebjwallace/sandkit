# Sources

How a sandbox keeps the material it was built from, and how everything in it traces back to that material. Read this when a sandbox is built from sources (documents, interviews, data, images), whenever files arrive in its inbox, and before citing a source from the model.

## Why it matters

A sandbox is only as good as what's behind it, and people can only trust what they can check. When every rule and figure in the model cites the passages it rests on, anyone can follow it back and judge for themselves: this rule comes from what the warehouse manager said on 2 October, that figure from page 3 of the policy. When a source turns out to be wrong, everything it shaped can be found.

This holds for the sandbox's own findings too. Your analyses, digests and summaries are sources like any other, authored by you, citing what they came from.

## The folder

```
sources/
  catalogue.json     every source's details, one entry each
  inbox/             anything dropped in, waiting to be catalogued
  …                  folders arranged however suits the sandbox
```

- **Sources are never edited.** A correction or a newer version comes in as a new source that supersedes the old one, so whatever cited the old one can still be checked against what it said.
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
| `author` | Who wrote or said it: a person, an organisation, or `Claude` for your own analyses. |
| `authored`, `captured` | When it was written, and when it was added. They often differ. |
| `origin` | Where it came from, such as a web address, when there is one. |
| `status` | `inbox`, `catalogued` (you've processed it), `reviewed` (a person has checked its details) or `superseded`. |
| `stance` | How certain it is: `assertive`, `speculative`, `assumption` or `idea`. Optional. |
| `role` | What it does: `question`, `answer`, `confirmation`, `correction`, `contradiction` or `decision`. Optional. With `respondsTo`, the source it answers or corrects. |
| `sensitivity` | `public`, `internal` or `confidential`. `internal` when not given. |
| `derivedFrom` | For your own analyses and digests: the sources they came from. Empty for first-hand material. |
| `supersedes` | The source this one replaces. Set the old one's `status` to `superseded`. |

Keep to these fields. Write dates as `yyyy-mm-dd`.

## Processing the inbox

When asked to process the inbox, or at the start of a session when `sources/inbox/` isn't empty:

1. **Read each file.** For a large one, map its structure and read what matters, rather than all of it.
2. **Catalogue it:** give it the next `SRC-` code and write its entry, with `status: "catalogued"`. Fill in only what you know; leave the rest out rather than guess.
3. **Move it** into the folder that suits it, and set `path`.
4. **Record the batch** in a journal entry: "Catalogued SRC-14 to SRC-17" (see the [journal practice](journal.md)).

A file of comments saved from the sandbox (`format: "sandkit-annotations"`) is catalogued the same way, with `format: "annotations"` and the session's participants as its authors.

### Files that can't be read as they are

Plain text, Markdown, data, code, PDFs and images can be shown and quoted as they are. For anything else, such as a Word document, a spreadsheet, a slide deck, a saved web page or a recording, keep the original and add a readable copy beside it: the text, in Markdown where it has structure, or a transcript of a recording. Catalogue the copy as a source of its own, authored by you, with `derivedFrom` naming the original, and cite the copy. Quotes are then checked against words anyone can read, and the original is a click away.

```json
{ "id": "SRC-9", "title": "Depot handbook (text)", "path": "sources/handbook/depot-handbook.md",
  "format": "document", "author": "Claude", "derivedFrom": ["SRC-8"], "summary": "The text of SRC-8, converted from Word." }
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
