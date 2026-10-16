# Sandbox shell

The environment around a sandbox: a header with its title and goal, controls for full screen and hiding the header, and a settings dialog with theming. Two elements, packaged together: `sb-shell` and `sb-theme-settings`.

Use them through this interface. You don't need to read their source.

## Usage

```html
<head>
  <!-- Theming first, so the page never flashes the wrong theme. -->
  <script src="lib/sandkit/shell/sb-theme-settings.js"></script>
  <script src="lib/sandkit/shell/sb-shell.js"></script>
</head>
<body>
  <sb-shell heading="Supply Chain Sandbox">
    <sb-theme-settings slot="settings"></sb-theme-settings>
    <p><strong>Goal:</strong> understand how goods get from suppliers to customers.</p>
  </sb-shell>
  …
</body>
```

Style the page with the theme tokens, for example `body { background: var(--sb-bg); color: var(--sb-text); font-family: var(--sb-font); }`.

## sb-shell

| Attribute or slot | Meaning |
|---|---|
| `heading` | The sandbox's title. Defaults to the page title. |
| `controls` | Which header buttons to show, in order: any of `fullscreen settings collapse`. Default: all three. |
| `collapsed` | Start with the header hidden. A viewer's own choice, once made, is remembered and wins. |
| children | Header content, such as the goal. Long content shows one line, with More / Less. |
| `slot="actions"` | Buttons or links shown beside the header controls. |
| `slot="settings"` | A section in the settings dialog. Titled by its `heading` attribute or property. |

| Property or method | Meaning |
|---|---|
| `collapsed` | Get or set whether the header is hidden. |
| `toggleFullscreen()` | Enter or leave full screen. |
| `openSettings()`, `closeSettings()` | Show or hide the settings dialog. |
| `settings` | Every saveable section's settings, as written to a settings file. |
| `importSettings(data)` | Apply a settings file's contents. Throws if it isn't a Sandkit settings file. |

| Event | Detail | When |
|---|---|---|
| `sb-collapse` | `{ collapsed }` | The header is hidden or shown. Useful for resizing canvases. |

**Settings sections.** Any element can be a section. If it also has `settingsKey`, `exportSettings()` and `importSettings(data)`, it is included when viewers export or import their settings as a file. The shell knows no section by name; the sandbox declares the ones it wants.

## sb-theme-settings

The Theme section: built-in themes (Match system, Light, Dark), viewer-saved presets, and a token editor. Loading its script applies the viewer's theme at once.

| Member | Meaning |
|---|---|
| `themes` | The themes on offer. To add one, define its tokens in the sandbox's stylesheet under `[data-theme="sepia"] { … }`, then `themeSettings.themes = themeSettings.themes.concat([{ id: 'sepia', label: 'Sepia' }])`. |

| Event | Detail | When |
|---|---|---|
| `sb-theme` | `{ choice, theme }` | Fired on `document` whenever the theme changes. Canvas drawings should re-read the tokens. |

## Theme tokens

`--sb-bg`, `--sb-surface`, `--sb-surface-2`, `--sb-text`, `--sb-muted`, `--sb-border`, `--sb-accent`, `--sb-accent-text`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-font`, `--sb-radius`.

## Notes

- **Dependencies:** none. The two elements are packaged together; nothing else depends on them, and every component works without them.
- **Export:** safe for single-file export.
- **Storage:** the viewer's theme, presets and header state are kept in browser storage, and can be exported and imported as a file from Settings.
