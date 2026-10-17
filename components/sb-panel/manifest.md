# sb-panel

A frame that lets viewers rearrange a sandbox. Wrap any content in a panel, and viewers can pop it out into a floating window, drag it by its title bar, resize it from its corner, collapse it to its title, make it full screen, and dock it back where the sandbox placed it. While a panel floats, a placeholder of the same size holds its place, so the rest of the page never moves.

The panel never looks inside its content: anything can go in it, including other components.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-panel/sb-panel.js"></script>

<sb-panel id="rules" heading="Rules">
  <sb-rules></sb-rules>
</sb-panel>
```

Give a panel an `id` and each viewer's arrangement (floating or docked, position, size, collapsed) is remembered in their browser.

## Attributes

| Attribute | Meaning |
|---|---|
| `heading` | The title shown in the panel's bar. |
| `id` | Lets the panel remember how each viewer arranged it. Without one, it starts docked every time. |
| `floating`, `collapsed` | Reflect the panel's state, for styling. Set by the panel; use the methods to change them. |

## Properties and methods

| Member | Meaning |
|---|---|
| `floating`, `collapsed` | Read-only. Whether the panel is floating, and whether it is collapsed. |
| `popOut({ left, top, width, height })` | Float the panel. Without a position, it floats exactly where it was. |
| `dock()` | Return the panel to its place in the page. |
| `toggleCollapsed()` | Collapse the panel to its bar, or expand it again. |
| `toggleFullscreen()` | Make the panel fill the screen, or leave full screen. |
| `bringToFront()` | Raise a floating panel above other floating panels. Touching one does this too. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-layout` | `{ floating, collapsed }` | The panel is floated, docked, collapsed or expanded. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-surface`, `--sb-surface-2`, `--sb-radius`.

Classes: `sb-panel__bar`, `sb-panel__heading`, `sb-panel__button`, `sb-panel__body`, `sb-panel__placeholder`. The element carries `floating` and `collapsed` attributes when they apply.

The body scrolls when its content is taller than the panel. Give a docked panel a height in the sandbox's layout if it should scroll there too.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **Any component that people want to keep in view while they explore,** such as [`sb-rules`](../sb-rules/manifest.md), [`sb-log`](../sb-log/manifest.md) or [`sb-chart`](../sb-chart/manifest.md): float it beside the part of the sandbox they're working with.
- **[`sb-chart`](../sb-chart/manifest.md) and [`sb-graph`](../sb-graph/manifest.md)** fit themselves to the panel's width, so they stay readable as a floating panel is resized.

## Notes

- **Floating panels stay within reach:** they can't be dragged off the top of the window, and part of their bar always stays on screen.
- **Designed for desktop and tablet screens.** Phones are out of scope for now.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** every control is a labelled button; the collapse button reports whether the panel is expanded.
- **Renaming:** if another component on the page is already called `sb-panel`, the console says so. Replace every `sb-panel` in `sb-panel.js` to give this copy a new name.
