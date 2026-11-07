# Tag presets

Tags pile up, and a list of them says little about where to start. A preset is a saved selection, a named region of the map: these tags, combined this way, less those. Offer a few where they'd help people find their way in, and they appear in Tags mode with no wiring. Read [tagging.md](tagging.md) first if you haven't: it says what always applies, above all never to reason from a tag.

Put them in the same script as the tags:

```js
const TAG_PRESETS = [
  { name: 'Platform changes passengers raised', asks: 'What did passengers say about platform changes?',
    tags: ['platform-changes', 'passengers'], match: 'all' },
  { name: 'Platform changes, no announcements tag', asks: 'Where might announcements not have come up?',
    tags: ['platform-changes'], without: ['announcements'] }
];
```

- **`tags`** add to the selection and **`without`** takes away. **`match`** is `all` (intersection, the default) or `any` (union).
- **Name a place to look, never a finding.** "Platform changes, no announcements tag" says where things sit. "Unannounced platform changes" claims something no tag can show. `asks` says what the preset helps someone look into.
- **Keep to a handful,** and drop one that isn't used. A long list is the noise presets are there to cut.
- **Keep them simple.** If one wants more than this can say, a tag may be missing, or the question may be two questions.
- **Check them when tags change.** [The report](tagging-tidying.md) flags a preset naming a tag that's no longer current.
