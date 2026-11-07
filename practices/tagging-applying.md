# Applying tags

How to choose, declare and apply tags, once a sandbox has opted in. Read [tagging.md](tagging.md) first if you haven't: it says whether to tag at all, and what always applies, above all never to reason from a tag.

## What to tag

Anything people will want to find across kinds: sources, excerpts, cards and the sandbox's own items. A tag can name a feature, a topic, a place or a party.

- **Tag what the fields don't say.** Kind, iteration, status, author and what something rests on can already be filtered on.
- **Tag an excerpt for itself.** It doesn't inherit its source's tags, because one source can cover many topics.

## When to tag

- **When a source comes in,** as you catalogue it. It's a first pass, and the person can correct it.
- **When an excerpt is picked out or a card is raised,** as part of writing it.
- **When a new tag is declared,** on earlier things it fits, so finding it finds them all.
- **At the end of each iteration or chapter,** in a short [tidy-up](tagging-tidying.md).

## Choosing tags

- **Balance gathering and separating.** Too general and a tag separates nothing, as on nearly everything. Too specific and it gathers nothing, as on one thing, which finds nothing its code wouldn't.
- **Would it last?** If it wouldn't still be a meaningful place on the map once the current work is over, it's a working tag.
- **Landmarks are found, not designed.** Early tags are provisional, and a tag can wait a while for a second use.
- **Cover different directions,** such as a feature, a party and a place, so combining tags really does narrow things down.

## Keeping the set small

Aim for the smallest set that still represents the domain. When tags are few and chosen with care, each says more, and combining them does the work extra tags would. Too few loses important distinctions, so the aim is balance, not the lowest number.

- **Treat a new tag as a cost.** Declare one only if it lets people find something an existing tag or combination can't.
- **Keep each item sparse too.** Give it the tags that place it, not every tag it touches.
- **Keep what earns its place.** If people rely on a distinction to find things, keep its tag.

## Declaring tags

Declare every tag once, in a script of its own: `tags.js` beside the model, or `records/tags.js` in a discovery sandbox. Load it on any page that shows tags.

```js
const TAGS = [
  { tag: 'platform-changes', means: 'A train moved to another platform, and how passengers come to know.' }
];
```

Whatever carries a tag lists it in a `tags` field: `tags: ['platform-changes', 'passengers']`.

- **Reuse before you add.** Read the list first, and declare a new tag before using it.
- **Say what it covers in `means`,** clearly enough that two people would tag the same things with it.
- **Lowercase words joined by hyphens,** plural for a thing (`platforms`), as it reads for a topic (`platform-changes`).
- **A tag can say its colour,** `color: '#0d9488'`, so it looks the same wherever it's lit. Without one, it gets a temporary colour, usually the same each time.
