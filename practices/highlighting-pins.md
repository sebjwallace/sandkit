# Pins

Pointing lights things only while the pointer stays. Once a page is for doing, not only looking, people need highlights that last. Part of the [highlighting practice](highlighting.md).

[`sb-outliner`](../components/sb-outliner/manifest.md) lists what can be pointed at, and pins each thing as a **fill** or an **outline**, so two can be kept and compared. It sends every pinned trace in one page-wide event, `sb-pins`, bubbling to `document`, whenever pins, the outline or the model change:

```js
{ fill: ['T3', 'E3', 'T3.board.expected'], outline: ['T5'], glow: false }
```

- **The script keeps them lit** everywhere their refs appear, through redraws: a fill as a tint, and on SVG a thick stroke; an outline as an outline, and on SVG a dashed stroke. Pointing outranks a pin while it lasts.
- **A tint can't show through solid contents,** so a fill pin on a whole discovery card or a piece of paper barely shows. Use an outline pin for those.
- **When the model changes, set the outliner's `items` again,** or call its `refresh()`, so a pinned case's lit rules follow whichever rules decide it now.
- **Components with a `highlight` the script can't reach** take pins as they take pointing: the sandbox routes them.
- **Glow.** With `glow` on, pinned highlights fade slowly down to 5% and back, to catch the eye while people work elsewhere. The outliner animates one number, `--sb-glow`, on anything with the class `sb-outliner__glowing`, which the script puts on the page while any outliner glows. Pointing stays at full strength.
