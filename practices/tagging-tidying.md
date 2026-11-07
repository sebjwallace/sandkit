# Changing and checking tags

How to keep a sandbox's tags useful as it grows. Read [tagging.md](tagging.md) first if you haven't: it says what always applies, above all never to reason from a tag.

## Tidying up

At the end of each iteration or chapter, briefly: merge near-duplicates, split or drop any tag that isn't helping, clear working tags whose work is done, and check the whole list is still quick to read. If it isn't, or it's growing faster than new landmarks are being found, merge and retire until it is.

## Changing tags

Nothing rests on a tag, so tags can change later, even on a card that's otherwise never edited. The audit trail stays whole as long as the old word still explains itself.

**Retire a tag by keeping its declaration** and saying what replaced it, then move everything carrying it to the replacement.

```js
{ tag: 'platform-moves', means: 'Trains moved to another platform.', replacedBy: ['platform-changes'] }   // merged
{ tag: 'delays', means: 'Late trains, and how they’re shown.', replacedBy: ['late-running', 'delay-wording'] }   // split
{ tag: 'misc', means: 'Anything else.', replacedBy: [] }   // dropped
```

- **To change a tag's meaning, declare a new tag** and retire the old one. Otherwise, things tagged earlier would quietly mean something else.
- **Never reuse a retired tag,** for the same reason.
- **Show only current tags** where people choose one, such as in a filter.
- **Tags say how things are found today.** They aren't history, so an earlier iteration shows the current tags.

## Checking the map

A script can see the whole map without reading the material. Run it after a batch of tagging and at each tidy-up, where Node is available:

```sh
node lib/sandkit/tools/tags.mjs report .
```

It says how far tags reach and how well they narrow, then lists only what's worth a look: presets naming a tag that's no longer current, untagged items, tags that may be too broad or too narrow, places where many items share the same tags, tags that overlap, and a few items to spot-check.

- **It's an indication, never a score.** A skewed map can be right: a sandbox about platform changes will have many cards on them. Read the content before changing anything, and never change tags just to improve the numbers.
- **It can't tell whether a tag fits.** That's what the spot-checks are for, so read those, not everything.

## Not yet: tags that relate

Tags are plain words, on purpose, and say nothing about each other. Stay with that, and don't invent a structure in a sandbox. If plain tags keep getting in the way, such as a person wanting everything under a broader topic, or the report showing one tag inside another, say so to the person, and suggest they raise it with Sandkit's author, with the example. Even then, such links would only be for finding things: what something truly is in the domain belongs in cards and the model.
