# Tag search

How the agent gathers what to read on a topic without reading everything, and how people search by tags on a page. Read [tagging.md](tagging.md) first if you haven't: it says what always applies, above all never to reason from a tag.

## Search before you read

When you need what a sandbox holds on a topic, run a tag search rather than opening records one by one, where Node is available:

```sh
node lib/sandkit/tools/tags.mjs search . platform-changes passengers --without announcements
node lib/sandkit/tools/tags.mjs search . --any delays cancellations --limit 10
node lib/sandkit/tools/tags.mjs search . --preset "Platform changes passengers raised"
node lib/sandkit/tools/tags.mjs search . --like CLM-4 DEC-1
```

It prints one line per item, never the item itself, so a topic costs a few hundred tokens rather than whole files. Then read only the items worth reading. Pages that search use the same engine, so a person and an agent asking the same thing get the same results, in the same order.

## Reading what it says

```
21 items carry platform-changes + passengers (showing 1–20).
1.00 GOL-1 goal, off track · No more than two missed trains a month from platform changes, by Janu…
0.64 RSK-1 risk, open · Passengers don’t read the message line, so a changed platform still g…
1 more: --from 21 for the next 1.
Narrow: +message-line 1 · +announcements 1
Widen: drop platform-changes 33 · drop passengers 59 · any 71
```

- **Each line:** score, code, kind and any status the record states, a short label, and with `--any` the tags it lacks, or with `--like` what it shares.
- **The score,** from 0 to 1, is how much of the weight of its tags an item shares with what you asked. Rarer tags weigh more, so a tag on most items counts for little.
- **With all the tags,** those carrying fewest others come first, as they sit closest to the topic. **With `--any`,** those carrying the rarer tags come first. **With `--like`,** those sharing the rarest tags with one of the items given come first, naming which. Ties go by code.
- **Twenty at a time.** When there are more, the first line says which are shown, "(showing 1–20)", and a line after the results gives the option for the next page, such as `--from 21`. If the first line says "showing", you haven't seen them all: page on, or narrow, before concluding anything from the list. `--limit` changes the page size.
- **Narrow and Widen** are the next steps, each with how many it would find. Take one rather than guessing at tags.
- A retired tag is followed to what replaced it, and the output says so. Finding nothing is an answer, not a failure.

## On a page

People search by tags in Tags mode's Search tab, once the page hands it a way to search. Load the tags engine with the records, then give Tags mode one function:

```html
<script src="lib/sandkit/engines/tags/tags.js"></script>

<script>
  const tagSearch = createTags({ items: [...SOURCES, ...CLAIMS, ...DECISIONS], tags: TAGS });   // give each item its kind
  document.querySelector('sb-tags-mode').search = (selection, onPage) =>
    (selection ? tagSearch.find(selection) : tagSearch.like(onPage)).results
      .map(({ id, kind, score, item }) => ({ ref: id, kind, score, label: item.title ?? item.text }));
</script>
```

With nothing chosen, people see what's most like what's on the page. Give each item its `kind` (`{ ...claim, kind: 'claim' }`) so results can say it.

**Pulling results onto the page.** Add `pull-in` to Tags mode where the page can take records, such as a board, and bring one in on `sb-pull`. On a board, place it beside what it shares most with: `tagSearch.like([ref]).results.find(({ id }) => onBoard.has(id))` names it and the tags they share. Say what was pulled in, in words, through `sb-handoff`, such as "Pulled in CON-3, beside CON-2: shares platform-changes, announcements.", so the agent can write it into the layout; until then it lasts only as long as the page. `demos/collation` shows it whole.

## What a result is

A result says where to look, never what's true. A high score means an item sits close to the tags asked, not that it matters more or is right. Read it before concluding anything.
