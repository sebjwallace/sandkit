# Tags

A ref says "this exact thing". A tag says "things about this". Both light with no wiring. Part of the [highlighting practice](highlighting.md); the [tagging practice](tagging.md) says what tags are and how to choose them.

## Lighting what's related

Once parts carry tags, pointing at one also lights, faintly, everything sharing a tag with it, where a sandbox has opted in to tagging.

```html
<tr data-ref="SRC-3" data-tags="platforms passengers">…</tr>
<span class="point" tabindex="0" data-tags="platform-changes">platform changes</span>
```

- **Put tags on the part, beside its `data-ref`.** Components do it for you when given tags.
- **Faint means related, never the same:** a thin line with no fill, on SVG a thin dotted stroke. A part also named by ref, or pinned, keeps that stronger look.
- **Tags with no ref work too.** They announce only tags, and light faintly themselves.
- **A part's tags are its own.** It takes nothing from what holds it, so an untagged passage in a tagged card announces no tags.
- **Only semantic tags.** Never pass `working` tags.
- **A tag on nearly everything lights nearly everything.** That's a sign to look at the map, not to change the lighting. To leave a view out, don't pass it tags.

## Keeping topics lit

[`sb-tags-mode`](../components/sb-tags-mode/manifest.md) lets people choose tags to keep lit, and tells the script through one page-wide event, `sb-tag-focus`, bubbling to `document`:

```js
{ tags: ['platform-changes', 'passengers'], match: 'all', colors: { 'platform-changes': '#0d9488' }, without: ['delays'] }
```

- **`tags` and `match`:** whatever carries every tag (`all`) or any (`any`) stays lit through redraws, until the event comes again. No tags and no `without` lights none.
- **`without`:** whatever carries one isn't lit. With no `tags`, it takes away from everything tagged.
- **`colors`:** each tag's own colour. A part's line takes the first it carries. Without them, it's `--sb-tag-focus`, a mix of the accent and magenta.
- **The look is a dashed line, with no fill,** and on SVG a stroke, so it reads apart from everything else by shape as well as colour.
- **Four strengths, strongest last:** faint, chosen, pinned, lit. A stronger look replaces a weaker one on the same part.
