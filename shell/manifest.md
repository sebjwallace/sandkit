# Sandbox shell

The environment around a sandbox: a header with its title, goal and pages, a mode picker, controls for full screen and hiding the header, a settings dialog with theming, and an Export button. Three elements, packaged together: `sb-shell`, `sb-theme-settings` and `sb-export`.

Use them through this interface. You don't need to read their source.

## Usage

```html
<head>
  <!-- Theming first, so the page never flashes the wrong theme. -->
  <script src="lib/sandkit/shell/sb-theme-settings.js"></script>
  <script src="lib/sandkit/shell/sb-shell.js"></script>
  <script src="lib/sandkit/shell/sb-export.js"></script>
  <script src="sandbox.js"></script>
</head>
<body>
  <sb-shell>
    <sb-theme-settings slot="settings"></sb-theme-settings>
    <sb-export slot="actions"></sb-export>
    <sb-comments slot="modes"></sb-comments>
  </sb-shell>
  …
</body>
```

The sandbox's name, goal and pages are written once, in its own `sandbox.js`, which every page includes (see the [pages practice](../practices/pages.md)):

```js
document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('sb-shell');
  shell.heading = 'Supply chain sandbox';
  shell.goal = 'Understand how goods get from suppliers to customers.';
  shell.pages = [{ href: 'index.html', title: 'Start' }, { href: 'stock.html', title: 'Stock' }];
});
```

Style the page with the theme tokens, for example `body { background: var(--sb-bg); color: var(--sb-text); font-family: var(--sb-font); }`.

## sb-shell

| Attribute or slot | Meaning |
|---|---|
| `heading` | The sandbox's title. Defaults to the page title. |
| `page` | The current page's file name, for marking it in the navigation. Defaults to the address's; set by exports, which may be renamed. |
| `exported`, `version`, `sandkit` | Set by `tools/export.mjs` on an exported page: the date (`2026-10-18`), the sandbox's version and Sandkit's. The header notes them, and other pages show as not included. |
| `controls` | Which header buttons to show, in order: any of `fullscreen settings collapse`. Default: all three. |
| `collapsed` | Start with the header hidden. A viewer's own choice, once made, is remembered and wins. |
| children | Header content for this page, shown instead of the goal. Long content shows one line, with More / Less. |
| `slot="actions"` | Buttons or links shown beside the header controls. |
| `slot="settings"` | A section in the settings dialog. Titled by its `heading` attribute or property. |
| `slot="modes"` | A mode, offered in the header's mode picker by its `heading` attribute or property. Its key is the first letter of its heading, or its own `key` attribute. |
| `slot="panels"` | A panel, such as [`sb-outliner`](../components/sb-outliner/manifest.md), opened and closed by a button in the header named by its `heading` attribute or property. |

| Property or method | Meaning |
|---|---|
| `heading` | Get or set the title. |
| `goal` | The sandbox's goal, shown as header content when the page has none of its own. |
| `pages` | `[{ href, title }]`: the sandbox's pages, shown as navigation (when there are two or more), the current page marked with `aria-current="page"` and matched by file name. |
| `collapsed` | Get or set whether the header is hidden. |
| `compact` | Read only. Whether the header is showing compact at the top of the window, the page having scrolled past it. |
| `toggleFullscreen()` | Enter or leave full screen. |
| `openSettings()`, `closeSettings()` | Show or hide the settings dialog. |
| `settings` | Every saveable section's settings, as written to a settings file. |
| `importSettings(data)` | Apply a settings file's contents. Throws if it isn't a Sandkit settings file. |

| Event | Detail | When |
|---|---|---|
| `sb-collapse` | `{ collapsed }` | The header is hidden or shown. Useful for resizing canvases. |
| `sb-open` | `{ panel, open }` | The viewer opened or closed a panel with its header button. `panel` is its heading. Bubbles to `document`, where panels closed from their own bars are heard too. |
| `sb-mode` | `{ mode, active }` | The viewer chose a mode in the picker (`active: true`, with its heading), or Explore (`active: false`, with the mode that ended). Bubbles to `document`, where modes started or ended from their own banners are heard too. |

**Compact while scrolled.** Once the page has scrolled past the header, a compact one stays at the top of the window: the title, the mode picker, actions and controls, without the goal or pages. Scrolling back up shows the full header again. The full header keeps its place on the page meanwhile, so nothing below it moves. The shell sets `--sb-header-height` on `<html>` to the compact header's height while it shows, and `0px` otherwise, so anything else sticking to the top of the window can sit below it: `top: var(--sb-header-height, 0px)`. It also sets the page's scroll padding to that height, so going to any part of the page lands below the header. A hidden (collapsed) header stays hidden.

**Modes.** A mode changes what a click does until the viewer leaves it, such as commenting or tracing (see the [modes practice](../practices/modes.md)). Any element with a `heading` and an `active` property can be one. The picker offers Explore, then each mode; choosing one sets its `active` and turns the others off, so only one is ever on. A mode ended or started from its own banner fires `sb-mode` from itself, and the picker follows. The picker is marked `data-modes`, which every mode lets clicks through, so it's always in reach. Each mode has a key: the first letter of its heading (C for Comment, T for Trace, I for Inspect), or a `key` attribute on the mode; a letter already taken leaves a later mode without one. Pressing it turns the mode on, and pressing it again goes back to Explore, as Esc does in every mode. Keys are left alone while someone is typing in a field, with Ctrl, ⌘ or Alt held, or when something on the page has already used the key. The picker shows each mode's key beside its name, and lists them all when pointed at. The shell knows no mode by name, and without modes shows no picker.

**Panels.** A panel is something viewers keep beside the page while they work, such as an outline of what can be highlighted. Any element with a `heading` and an `open` property can be one. Each gets a button in the header, named by its heading and pressed while it's open; pressing it switches `open` and fires `sb-open`. Several can be open at once, and none changes what a click does, which is what sets them apart from modes. A panel closed from its own bar fires `sb-open` from itself (`open: false`), and its button follows. Panels sit after the header, outside its bar, so hiding the header never hides them; they float, draw their own frame and handle their own clicks. The shell knows no panel by name, and without panels shows no buttons.

**Settings sections.** Any element can be a section. If it also has `settingsKey`, `exportSettings()` and `importSettings(data)`, it is included when viewers export or import their settings as a file. The shell knows no section by name; the sandbox declares the ones it wants.

## sb-theme-settings

The Theme section: built-in themes (Match system, Light, Dark), viewer-saved presets, a token editor, and the page width. Loading its script applies the viewer's theme and width at once.

**Page width.** Viewers choose Narrow (900px), Wide (1400px) or Full. The choice sets `--sb-page-width` on `<html>` (`900px`, `1400px` or `none`); until a viewer chooses, nothing is set. The sandbox decides what it caps, usually its main area: `main { max-width: var(--sb-page-width, none); margin: 0 auto; }`, where the fallback is its own default.

| Member | Meaning |
|---|---|
| `themes` | The themes on offer. To add one, define its tokens in the sandbox's stylesheet under `[data-theme="sepia"] { … }`, then `themeSettings.themes = themeSettings.themes.concat([{ id: 'sepia', label: 'Sepia' }])`. |

| Event | Detail | When |
|---|---|---|
| `sb-theme` | `{ choice, theme }` | Fired on `document` whenever the theme changes. Canvas drawings should re-read the tokens. |

## sb-export

The Export button, placed with `slot="actions"`. A page opened from the computer can't read its own files, so exporting is an agent's job, done with `tools/export.mjs` (copied into `lib/sandkit/tools/`). The button opens a dialog that explains what an export is, offers to leave out images, and shows the prompt asking the agent to export this page, with a Copy button. It hides in an exported page.

| Member | Meaning |
|---|---|
| `prompt` | The prompt, as worded for the options chosen. |
| `open()` | Open the dialog. |

## Theme tokens

`--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-accent-text`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`, `--sb-radius`. `--sb-page-width` is set only by the viewer's page width choice; themes don't define it.

**Lift,** for a part that sits on something, such as a card in a panel or a badge in a card: `--sb-lift` is a see-through tint laid over whatever is beneath (a few percent white in dark themes, where lighter reads as nearer; mostly transparent in light ones), and `--sb-lift-shadow` a soft shadow that does most of the work in light themes. Because the tint is see-through, it lifts a part off any layer, and lifts inside lifts stack:

```css
.card { background-image: linear-gradient(var(--sb-lift), var(--sb-lift)); box-shadow: var(--sb-lift-shadow); }
```

Use it for parts that sit on something, not for every component, or the page becomes a stack of floating boxes.

**Drop,** the opposite: `--sb-drop` is a see-through dark tint, so a part sits a step below whatever it's in. Lifts inside lifts climb towards grey in dark themes and run out of room in light ones; a drop at that point keeps each layer apart from the one around it, so the eye can follow the nesting. Drop a part as a whole, with no shadow, and don't lift what's inside it, or it climbs straight back to its parent's shade:

```css
.card .detail { background-image: linear-gradient(var(--sb-drop), var(--sb-drop)); }
```

A sandbox's own theme sets these tokens in its CSS; the settings' token editor doesn't offer them.

## Notes

- **Dependencies:** none. The three elements are packaged together; nothing else depends on them, and every component works without them.
- **Export:** safe for single-file export.
- **Storage:** the viewer's theme, presets and header state are kept in browser storage, and can be exported and imported as a file from Settings.
