# Sources

How a sandbox keeps the material it was built from, and how everything in it traces back to that material. Read this when a sandbox is built from sources (documents, interviews, data, images), whenever files arrive in its inbox, before citing a source from the model, and before the sandbox is shared.

## Why it matters

A sandbox is only as good as what's behind it, and people can only trust what they can check. When every rule and figure in the model cites the passages it rests on, anyone can follow it back and judge for themselves: this rule comes from what the warehouse manager said on 2 October, that figure from page 3 of the policy. When a source turns out to be wrong, everything it shaped can be found.

## What counts as source material

Source material comes from outside the sandbox: whatever people, organisations or agents elsewhere wrote, said or made. Documents, white papers, articles, web pages, PDFs, data, images and recordings, brought in by a person or by you. A conversation can count too: what someone tells you in a chat about how things work, what they think of the model or what they've decided can be saved as a source (`format: "transcript"`, the person as its author), so it can be quoted like anything else.

**Nothing becomes a source without the person's say-so.** What a person puts in `sources/` or its inbox themselves is theirs to add. Anything you'd bring in, from the chat, the web or anywhere else, you propose first: what you'd save, from where, why it matters to the sandbox, and what its terms allow (see "Licences"). Add it only once they agree, and as they shape it. Take particular care with the chat: most of it is working talk, not material, and some of it may be irrelevant or not meant to be kept. Never save it as you go.

What you write inside the sandbox isn't source material. Your analyses, summaries and findings cite sources; they aren't sources themselves. In a discovery sandbox they're cards (see [domain discovery](domain-discovery.md)); otherwise they live in the model's items and the journal. A readable copy of a file (below) is the same words in another form, not your writing. A digest is the one exception: your account of material that can't be kept, standing in for it as a source (see "Digests").

## Screening

Nothing is kept in a sandbox, or used from it, until it has been screened. A sandbox is read by other people, shared and exported, so material that could harm someone goes wherever the sandbox goes.

- **Ask first what counts as sensitive here, and who the sandbox is for.** Before the first source, ask the person what they treat as confidential or classified in this subject (names, customers, figures, sites, anything else), and who will see the sandbox: just them, their team or organisation, or the public. Who it's for says how careful sharing needs to be. Record both, never the material itself, in the sandbox's `AGENTS.md` under **Sensitive material**, so every later session screens the same way.
- **Screen everything, wherever it came from:** what arrives in the inbox, what a person copied straight into `sources/`, what's already catalogued when you first read it, and chat excerpts the person has agreed to save, before you save them.
- **Look for** personal data about people who could be identified (as data protection law such as the GDPR defines it), the person's own included: their name, contact details, address or anything else about them, which people rarely think of as sensitive; anything confidential to an organisation, or covered by the person's rules; anything dangerous to keep, such as credentials, security details or instructions for harm; and anything offensive or hurtful to the people who will read the sandbox, stakeholders included.
- **Check the rights too:** who owns the material and what its terms allow (see "Licences").
- **Raise it, never fix it silently.** Tell the person what you found, where, and what you propose: redact, paraphrase, cut, or leave it as it is. Something can look sensitive and not be, or be sensitive in ways you can't know, so they decide. Don't use the source until they have.
- **Act on what they decide.** A redacted or paraphrased copy replaces the original, which is removed from the sandbox once they agree: keeping it would keep the problem. Mark each change in the text, such as `[name removed]`, say in the catalogue's `summary` that the source was redacted, record it in the journal, and never write what was removed anywhere.
- **What you derive is screened too.** A quote carries its words into the model, cards and pages, so never quote what was cleared out, and hold what you write to the same standard as what you read: the model, records, journal, pages and saved comments, which carry viewers' names, can hold personal data as easily as a source.
- **Register what's kept.** Whenever personal data stays in the sandbox, anywhere, add a line to **Personal information in this sandbox** in the sandbox's `AGENTS.md`: what kind it is, whose, and where, never the data itself, such as "SRC-4: drivers' names and phone numbers" or "`model.js`, `DRIVERS`: drivers' names". Remove the line when it's cleared. Every session reads that file first, so the next one knows what's there without finding it again.

## Licences

Almost all material belongs to someone, and its licence or terms of use say what others may do with it. Keeping a copy to study privately is usually fine, and it's the person's call. Licences matter most when the sandbox is shared: zipped, exported or published, it takes its sources and quotes with it. You're not giving legal advice, so say so when the terms are unclear, and that the person may want to check.

- **Find the terms when you propose material.** Look for a licence or terms of use on the material or its site, and say what you found, or that you found none. Roughly:
  - **Openly licensed,** such as Creative Commons, open data or open government licences: free to keep and share on their terms, which often ask for credit.
  - **Public but all rights reserved,** which covers most web pages, papers, books and images: fine to read, and to quote briefly with credit, but not to republish. Material with no licence stated counts as this.
  - **Paid for or behind a login:** often for the subscriber alone.
  - **Under a confidentiality agreement:** not to be shared beyond it at all.
- **Never get round a block.** If a page needs a login you don't have or sits behind a paywall, or its site forbids automated reading or use by AI (in its terms or its `robots.txt`), don't work round it. Say what's in the way, and suggest the person get it themselves if their own access allows. What they then put in is theirs to add.
- **Record the terms** in the catalogue's `licence`, and keep `author` and `origin` filled in, since they're the credit a licence asks for.
- **Raise it, and let the person decide.** Say what the terms allow, what keeping or sharing the material would mean, and what you propose: keep it, keep a digest instead, or leave it out. If they choose to keep something that can't be shared, that's theirs to choose. It's your job to make sure they know what it would mean, then and again before sharing.
- **Quotes and copies carry the licence.** Quote a phrase or a sentence, as citing asks, never whole passages. A readable copy of a file is the same work in another form, under the same terms.

### Digests

When a copy shouldn't be kept, keep a digest: your account of the material in your own words, in `sources/digests/`, with no copy of the original. Facts and ideas belong to no one; the wording does.

- **Write it in your own words,** not the original's reworded closely, and never so fully that it could replace the original. A few short quotes, marked as quotes, are fine.
- **Open it with what it is:** whose work it summarises, where from, when you read it, and what it covers and leaves out.
- **Catalogue it** with `format: "digest"`, the original's `author`, `origin` its address, `licence` the original's terms, and a `summary` that says it's a digest. Cite it like any source: quotes are checked against the digest, and anyone can follow `origin` to the original.
- **Screen it like any source.** Personal or confidential details stay out, however they're worded.
- **Prefer the original when its terms allow keeping it,** since quotes are then checked against its own words.

## Before the sandbox is shared

When the person is about to share the sandbox (zipped, exported, put on a website), go through what's going with it, against who it's for in `AGENTS.md` and who they're sharing it with now. Start from the personal information register in `AGENTS.md`, then look over what's going anyway, since people edit files themselves and a register can fall behind; add anything it missed. Look for sources whose terms don't allow sharing, material marked `internal` or `confidential` going beyond its circle, personal data, and quotes or images taken from any of them. A zipped folder takes everything in `sources/`; an exported page takes only what it points to and shows.

Tell them what you found and what sharing it would mean, and offer what would make it safe to share: leave it out, keep a digest instead of a copy, cut a quote. Then do as they decide. Digests, and short quotes with credit, can usually be shared.

**Personal data needs a plain warning and a clear yes.** Say exactly what would go, whose it is, and who would then see it, the person's own details included, and that it can't be taken back once shared. Go ahead with it only once they've said yes to those items by name; until then, offer to share without them.

## The folder

```
sources/
  catalogue.json     every source's details, one entry each
  inbox/             anything dropped in, waiting to be catalogued
  …                  folders arranged however suits the sandbox
```

- **Sources are never edited,** except to clear sensitive material when screening. A correction or a newer version comes in as a new source that supersedes the old one, so whatever cited the old one can still be checked against what it said.
- **Anything can be dropped into the inbox:** by a person, by you once they've agreed to it, or by the sandbox itself when someone saves comments. Nothing waits there for long; see "Processing the inbox".

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
| `title`, `path`, `summary`, `tags` | What it is and where it lives. `path` is from the sandbox's folder. In a discovery sandbox, use the declared tags (see [domain discovery](domain-discovery.md)). |
| `format` | What kind of material, which says how to read it: `document`, `transcript`, `notes`, `data`, `image`, `pdf`, `code`, `web`, `annotations`, `digest` and so on. |
| `author` | Who wrote or said it: a person, an organisation, or an agent outside the sandbox. |
| `authored`, `captured` | When it was written, and when it was added. They often differ. |
| `origin` | Where it came from, such as a web address, when there is one. |
| `status` | `inbox`, `catalogued` (you've processed it), `reviewed` (a person has checked its details) or `superseded`. |
| `stance` | How certain it is: `assertive`, `speculative`, `assumption` or `idea`. Optional. |
| `role` | What it does: `question`, `answer`, `confirmation`, `correction`, `contradiction` or `decision`. Optional. With `respondsTo`, the source it answers or corrects. |
| `sensitivity` | `public`, `internal` or `confidential`. `internal` when not given. |
| `licence` | What its owner allows, as found: `"CC BY 4.0"`, `"all rights reserved"`, `"own work"`, `"unknown"`, or the terms in a few words. See "Licences". |
| `derivedFrom` | For a readable copy: the source it was made from. Empty otherwise. |
| `supersedes` | The source this one replaces. Set the old one's `status` to `superseded`. |
| `copies` | The source this one repeats, such as a newsletter passing on a forum post. It adds nothing of its own, so it's counted as that one. |
| `grade` | How far this source can be trusted, as whoever catalogued it judges: `{ "value": 4, "why": "First-hand, from the dispatcher on shift, though recalled a week later.", "aspects": { "distance": "first-hand" } }`. `value` from 1 (weak) to 5 (strong), 3 ordinary; `why` is required, since a grade without a reason is a conclusion nobody can check; `aspects`, optional, any dimensions that matter in this subject. Leave it out until it's been judged. |
| `speaksTo` | `how things are` (the default) or `what should be`, for a plan, manual or policy: what should happen isn't evidence of what does. |
| `iteration` | In a discovery sandbox, the iteration it arrived in (see [domain discovery](domain-discovery.md)). |
| `gatheredBy` | In a discovery sandbox, the investigation that gathered it. |

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

In a discovery sandbox, each cited piece of a source is picked out once as an **excerpt**, a record of its own with a code (`SRC-2.3`) and these same anchors, and records cite excerpts by code (see [domain discovery](domain-discovery.md)).

## Checking

Where Node is available, check the sources after cataloguing or citing:

```sh
node lib/sandkit/tools/sources.mjs check .
```

It fails when the catalogue is broken, a file in `sources/` isn't catalogued, a citation names an unknown source or quotes words that aren't there, an excerpt in a discovery sandbox does the same or sits in an image without a region, `records/excerpts.js` has no `EXCERPTS` list it can read, or a link (`respondsTo`, `derivedFrom`, `supersedes`, `restsOn`) points at nothing. It notes, without failing, quotes in PDFs and images it can't read, superseded excerpts, which it leaves unchecked, items citing nothing, and files waiting in the inbox. Fix the errors before handing over; mention the notes if they matter.

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

Anything in the model can be asked "why is that there?". Answer it with [`sb-lineage`](../components/sb-lineage/manifest.md): the sources on the left, on paper, the items resting on them in columns by kind, and the thing asked about as the subject, so only what it rests on and what rests on it shows. The lineage only draws; turn `model.items` and the catalogue into its cards, columns and links with a function in `parts.js`, giving the kinds in the order things rest on each other:

```js
// The model's items and the catalogue as a lineage: a card for each source, on paper, and each
// item, in columns of sources and then items by kind, in the order given; linked by what's derived
// from what, what cites what and what rests on what.
function traceLineage(lineage, items, catalogue, kinds) {
  const card = (ref, className, code, title, detail) => {
    const element = Object.assign(document.createElement('div'), { className, tabIndex: 0 });
    element.dataset.ref = ref;
    for (const [part, text] of [['code', code], ['title', title], ['detail', detail]]) {
      element.append(Object.assign(document.createElement('span'), { className: `${className}__${part}`, textContent: text }));
    }
    return element;
  };
  const plural = (kind) => kind.endsWith('s') ? kind : `${kind}s`;
  const cited = (item) => [...new Set((item.sources ?? []).map((citation) => citation.source))];
  lineage.replaceChildren(
    ...catalogue.map((s) => card(s.id, 'trace-source', s.id, s.title, s.format)),
    ...items.map((item) => card(item.id, 'trace-item', item.id, item.title, item.kind)));
  lineage.columns = [
    { title: 'Sources', refs: catalogue.map((s) => s.id) },
    ...kinds.map((kind) => ({ title: plural(kind), refs: items.filter((item) => item.kind === kind).map((item) => item.id) })),
  ];
  lineage.links = [
    ...catalogue.flatMap((s) => (s.derivedFrom ?? []).map((from) => ({ from, to: s.id, label: 'derived from', tone: 'muted' }))),
    ...items.flatMap((item) => cited(item).map((from) => ({ from, to: item.id, label: 'cites', tone: 'muted' }))),
    ...items.flatMap((item) => (item.restsOn ?? []).map((from) => ({ from, to: item.id, label: 'rests on' }))),
  ];
}
```

Draw sources as paper, the material Sandkit keeps for source material (see `STYLE.md`), so ground truth looks like ground truth, and items as plain cards:

```css
.trace-source, .trace-item { display: grid; gap: 2px; padding: 7px 9px; border-radius: var(--sb-radius); font-size: 12px; line-height: 1.35; cursor: pointer; }
.trace-item { border: 1px solid var(--sb-border); background: var(--sb-surface); }
.trace-source { position: relative; border: 1px solid color-mix(in srgb, var(--sb-text) 24%, transparent); background: color-mix(in srgb, var(--sb-surface) 94%, #f3e2b8); box-shadow: 0 1px 3px rgb(0 0 0 / 0.12); clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%); }
.trace-source::after { content: ''; position: absolute; top: -1px; right: -1px; width: 12px; height: 12px; background: linear-gradient(225deg, var(--sb-bg) 50%, color-mix(in srgb, var(--sb-text) 18%, var(--sb-surface)) 50%); }
.trace-source__code, .trace-item__code { font: 600 11px ui-monospace, Menlo, Consolas, monospace; color: var(--sb-muted); }
.trace-source__detail, .trace-item__detail { color: var(--sb-muted); font-size: 11px; }
```

Make it reachable from anywhere with [`sb-trace-mode`](../components/sb-trace-mode/manifest.md), Trace in the shell's mode picker (see the [modes practice](modes.md)). While it's on, pointing outlines any part whose `data-ref` is in `model.items`, and a click opens the trace instead of acting:

```html
<sb-shell>
  <sb-comments slot="modes"></sb-comments>
  <sb-trace-mode slot="modes"></sb-trace-mode>
</sb-shell>

<sb-modal id="trace-modal" heading="Why it's there"><sb-lineage id="trace"></sb-lineage></sb-modal>
```

```js
traceLineage(trace, model.items, catalogue, ['Parameter', 'Rule', 'Assumption', 'Requirement']);
const items = new Set(model.items.map((item) => item.id));
traceMode.traceable = (ref) => items.has(ref);
traceMode.addEventListener('sb-pick', (e) => {
  traceModal.show();          // first, so the trace has its room when it lays out
  trace.subject = e.detail.ref;
  trace.clearTrail();
  trace.fit();                // the whole of it, from the sources on
});
// Choosing a source opens it, in sb-source in a second modal; choosing an item traces it instead.
trace.addEventListener('sb-select', (e) => {
  if (catalogue.some((s) => s.id === e.detail.ref)) openSource(e.detail.ref);
  else trace.subject = e.detail.ref;
});
```

Sandkit's `examples/control-room/` has the whole of this wiring.
