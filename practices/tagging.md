# Tagging

How to label the things in a sandbox so people and agents can find them, group them and move around them. Semantic tagging is opt-in. This page holds what always applies. Then read only what you need:

| You're about to… | Read |
|---|---|
| Decide whether a sandbox should tag | Nothing more: "Opting in", below |
| Tag sources, excerpts, cards or anything else, or declare a tag | [Applying tags](tagging-applying.md) |
| Tidy up, merge or retire tags, or run the report | [Changing and checking tags](tagging-tidying.md) |
| Offer people ready-made selections of tags | [Presets](tagging-presets.md) |

Showing tags takes no wiring: give a part `data-tags`, or a component its `tags`, and add [`sb-tags-mode`](../components/sb-tags-mode/manifest.md) to the sandbox's pages when it opts in.

## Why it matters

A sandbox soon holds more than anyone can keep in mind. [Codes](identifiers.md) name one thing each, but people also ask about many things at once: everything on platform changes, whichever kind it is and whenever it arrived. A tag gathers those under one word. Left alone, tags drift, so each is declared with what it means.

## Two kinds of tag

**Semantic tags are a map of the domain.** Each marks a landmark found while exploring, and an item's combination says where it sits: `platform-changes` + `passengers` places a card where those two meet. They're long-lived, chosen with care, declared, and carried in a `tags` field. Elsewhere in these pages, "tag" means this kind.

**Working tags group things for a situation,** such as `workshop-3` or `recheck-after-survey`. Keep them in a field of their own, `working: ['workshop-3']`, undeclared, and clear them when the work is done, or they become permanent by accident.

## Opting in

Choosing, declaring, applying and tidying tags all use tokens, on every source and card, for as long as the sandbox lasts. So a sandbox tags only if the person says so. Never add semantic tags without a yes. Working tags need no opt-in, but never let them stand in for semantic tags after a no.

- **Ask near the start,** in a few lines: what it would give them, what it would cost, and what you recommend. The person decides.
- **Recommend what the sandbox needs.** It tends to pay when traceability or search matters, or with many sources, several people or a long life ahead. It's likely overkill for something small, short or simple, or that nobody needs to search.
- **Record the answer** under **Tagging** in the sandbox's `AGENTS.md`, yes or no, and why, so the next agent doesn't ask again.
- **Suggest starting if things change,** such as people struggling to find things. Ask once for each change, and say how far back you'd tag, since that costs tokens too.
- **Suggest stopping if it isn't paying,** such as when tags go unused. Stopping means no more adding or tidying. Leave existing tags where they are: they do no harm, and tagging can resume later. Update the record either way.

## What a tag is

**A tag is a pointer to content, not content.** It's a tool for finding things. The content is what gets reasoned about.

- **Never reason from a tag.** No status, weighing, rule, test, decision or model rests on one. Take every tag away, and people should find things less easily while everything known stays the same.
- **The map isn't the model.** It shows which tags occur together, not how the domain works.
- **Read what it points to** before concluding anything.
- **A missing tag means nothing.** Something untagged may still be on the topic, so what a tag gathers is a place to start, not everything there is.

## What tags give people

- **Searching and filtering,** as in [`sb-search`](../components/sb-search/manifest.md) and [`sb-sources`](../components/sb-sources/manifest.md).
- **Moving through the map,** by combining tags to narrow down, or swapping one to move sideways.
- **Seeing what's related:** pointing at a tagged part faintly lights whatever shares a tag, and Tags mode keeps topics lit, to see where one sits or where two meet. Related, never the same: that's what a ref is for.
- **Gathering what to read,** to start on a topic without reading everything, or to prepare a [workshop](workshops.md). Anything picked out just for one session gets a working tag.
- **Noticing gaps.** A tag on plenty of excerpts with no question or decision may be a topic nobody has looked at. That's only a reason to look.
