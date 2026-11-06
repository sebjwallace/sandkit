# Tagging

How to label the things in a sandbox so people and agents can find them, group them and move around them. Semantic tagging is opt-in. Read this before tagging sources, excerpts, cards or anything else, before building anything that relies on tags, and when deciding whether a sandbox should tag at all.

## Why it matters

A sandbox soon holds more than anyone can keep in mind. Its [codes](identifiers.md) name one thing each, but people also ask about many things at once: everything on platform changes, whichever kind it is and whenever it arrived. A tag gathers those things under one word.

Left alone, tags drift. Each agent invents its own, two words come to mean one thing, and one word comes to mean two. Declaring each tag with what it means keeps them useful as a sandbox grows.

## Two kinds of tag

**Semantic tags are a map of the domain.** Each one marks a landmark found while exploring, and an item's combination of tags says where it sits: `platform-changes` + `passengers` places a card where those two meet. People and agents can then move through the material by adding, dropping or swapping tags. These tags are long-lived, chosen with care, declared with what they mean, and carried in a `tags` field.

**Working tags group things for a situation,** such as `workshop-3` or `recheck-after-survey`. They're quick and useful only for a while, so they aren't part of the map. Keep them apart in a field of their own, `working: ['workshop-3']`, undeclared, and clear them when the work is done. Otherwise they clutter the map and become permanent by accident.

Everywhere else in this practice, "tag" means a semantic tag.

## Opting in

Semantic tagging can be powerful, but it has a cost. Choosing, declaring, applying and tidying tags all use tokens, on every source and card, for as long as the sandbox lasts. So a sandbox tags only if the person says so. Never add semantic tags without a yes. Working tags need no opt-in, since they cost little and go away, but never let them stand in for semantic tags after a no.

- **Ask near the start,** in a few lines: what tagging would give them, what it would cost, and what you recommend for this sandbox. The person decides.
- **Recommend what the sandbox needs.** Tagging tends to pay when traceability or search matters, or when there are many sources, several people or a long life ahead. It's likely overkill for a small, short or simple sandbox, or one nobody needs to search.
- **Record the answer** under **Tagging** in the sandbox's `AGENTS.md`, yes or no, and why, so the next agent doesn't ask again.
- **Suggest starting if things change,** such as people struggling to find things or the material growing. Ask once for each change, not every session. Say how far back you'd tag, since tagging earlier things costs tokens too.
- **Suggest stopping if it isn't paying,** such as when the tags are going unused. Stopping means no more adding or tidying. Leave existing tags where they are: they do no harm, removing them would cost tokens, and tagging can resume later. Update the record either way.

## What a tag is

**A tag is a pointer to content, not content.** It's metadata, a tool for finding things. The content it points to is what gets reasoned about.

- **Never reason from a tag.** No status, weighing, rule, test, decision or model rests on one. Take every tag away, and people should find things less easily while everything known stays the same.
- **The map isn't the model.** It shows where material sits, not how the domain works. All it reveals is which tags occur together. Conclusions about the domain come from reading the content.
- **Read what it points to.** A tag tells you where to look. Before concluding anything, read the source or card itself.
- **A missing tag means nothing.** Something untagged may still be on the topic, so what a tag gathers is a place to start, not everything there is.

## What to tag

Anything people will want to find across kinds: sources, excerpts, cards and the sandbox's own items. A tag can name a feature, a topic, a place or a party.

- **Tag what the fields don't say.** Kind, iteration, status, author and what something rests on can already be filtered on. A tag repeating them is noise.
- **Tag an excerpt for itself.** It doesn't inherit its source's tags, because one source can cover many topics and an excerpt only some of them.

## When to tag

Once a sandbox has opted in:

- **When a source comes in,** as you catalogue it. It's usually your first pass, and the person can correct it.
- **When an excerpt is picked out or a card is raised,** as part of writing it.
- **When a new tag is declared,** on earlier things it fits, so finding it finds them all.
- **At the end of each iteration or chapter,** in a short tidy-up: merge near-duplicates, split or drop any tag that isn't helping, check the size of the set, and clear working tags whose work is done.

## Choosing tags

- **Balance aggregating and differentiating.** A tag gathers things that belong together and separates them from the rest. Too general and it separates nothing, as with a tag on nearly everything. Too specific and it gathers nothing, as with a tag on one thing, which finds nothing its code wouldn't.
- **Would it last?** Ask whether this would still be a meaningful place on the map once the current work is over. If not, it's a working tag.
- **Landmarks are found, not designed.** Early tags are provisional, because landmarks only become clear as material comes in. Tidy-ups are where the map settles, and a tag can wait a while for a second use.
- **Cover different directions,** such as a feature, a party and a place. Then combining tags really does narrow down where something sits, and they can stay plain words with no extra structure.

## Keeping the set small

Left unchecked, tags multiply, and sorting out the noise becomes a real cost. Aim for the smallest set that still represents the domain. A small set is also worth more: when tags are few and chosen with care, each one says more, and combining them does the work that extra tags would. With too many, each one means less. With too few, important distinctions get lost, so the aim is balance, not the lowest number.

- **Treat a new tag as a cost.** Before declaring one, check whether an existing tag or a combination already places the thing. Declare it only if it lets people find something they otherwise couldn't.
- **Keep each item sparse too.** Give it the tags that place it, not every tag it touches.
- **Check the scale at each tidy-up.** The whole list should stay quick to read. If it isn't, or it's growing faster than new landmarks are being found, merge and retire until it is.
- **Keep what earns its place.** If people rely on a distinction to find things, keep its tag, however tidy the list would look without it.

## Declaring tags

Declare every tag once, with what it means, in a script of its own: `tags.js` beside the model, or `records/tags.js` in a discovery sandbox.

```js
const TAGS = [
  { tag: 'platform-changes', means: 'A train moved to another platform, and how passengers come to know.' }
];
```

Load that script on any page that shows the tags. Whatever carries a tag lists it in a `tags` field: `tags: ['platform-changes', 'passengers']`.

- **Reuse before you add.** Read the list first, and declare a new tag before using it.
- **Say what it covers in `means`,** clearly enough that two people would tag the same things with it.
- **Lowercase words joined by hyphens,** plural for a thing (`platforms`), as it reads for a topic (`platform-changes`).

## Changing tags

Because tags say nothing about the domain and nothing rests on them, they can change later, even on a card that's otherwise never edited. Changing them keeps the audit trail whole, as long as the old word still explains itself.

**Retire a tag by keeping its declaration** and saying what replaced it, so anyone meeting the old word can follow it. Then move everything carrying it to the replacement.

```js
{ tag: 'platform-moves', means: 'Trains moved to another platform.', replacedBy: ['platform-changes'] }   // merged
{ tag: 'delays', means: 'Late trains, and how they’re shown.', replacedBy: ['late-running', 'delay-wording'] }   // split
{ tag: 'misc', means: 'Anything else.', replacedBy: [] }   // dropped
```

- **To change a tag's meaning, declare a new tag** and retire the old one. Otherwise, things tagged earlier would quietly mean something else.
- **Never reuse a retired tag,** for the same reason.
- **Show only the current tags** where people choose one, such as in a filter.
- **Tags say how things are found today.** They aren't history, so looking back at an earlier iteration shows the current tags.

## What tags are for

- **Searching and filtering,** such as in [`sb-search`](../components/sb-search/manifest.md) and [`sb-sources`](../components/sb-sources/manifest.md), which treat tags like any other field.
- **Moving through the map,** by combining tags to narrow down, or swapping one to move sideways.
- **Grouping,** to give a view or a board one topic at a time and keep it readable.
- **Gathering what to read,** so an agent or a person can start on a topic with what's been tagged for it, instead of reading everything.
- **Preparing a [workshop](workshops.md),** by gathering what a session on a topic needs. Anything picked out just for that session gets a working tag.
- **Noticing gaps.** A tag on plenty of excerpts with no question or decision may be a topic nobody has looked at. That's only a reason to look: reading the content decides whether anything is missing.

## Not yet: tags that relate

Tags are plain words for now, on purpose, and they say nothing about each other. A later version of Sandkit could let them relate, more like a knowledge graph: `signals` *contains* `platform-changes`, or a `diesel-unit` *is a* `train`. No sandbox has needed that yet.

Stay with plain tags, and don't invent a structure in a sandbox. If plain tags keep getting in the way, for instance a person keeps wanting everything under a broader topic and listing the narrower tags won't do, say so to the person, and suggest they raise it with Sandkit's author, with the example that showed the need.

Even then, such links would be for finding and moving around. What something truly is or has in the domain is content, and belongs in cards and the model.
