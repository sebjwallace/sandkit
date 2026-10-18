# Sandbox shell changelog

Covers `sb-shell`, `sb-theme-settings` and `sb-export`, which are versioned together.

## 0.1.3 · 2026-10-18
- Pages: `pages` (`[{ href, title }]`) shows navigation in the header, the current page marked; `goal` shows the sandbox's goal when a page gives no header content of its own; `heading` can be set as a property. A sandbox sets all three once, in its own `sandbox.js`.
- An exported page's shell (`exported`, `version`, `sandkit`, `page`, set by `tools/export.mjs`) notes when it was exported and from which versions, and shows the other pages as not included.
- Added `sb-export`, an Export button for the header: it explains exporting, offers to leave out images, and gives the prompt asking an agent to export the page, ready to copy.

## 0.1.2 · 2026-10-18
- A Page width setting in the Theme section: Narrow, Wide or Full. It sets `--sb-page-width` for the sandbox's page to use (unset until chosen, so each page keeps its own default), is remembered per viewer apart from themes and presets, and is exported with the settings.

## 0.1.1 · 2026-10-17
- The shell moved by another element while the page loads is built once, not twice; for example, inside a walkthrough's step.

## 0.1.0 · 2026-10-17
- First release. The header (goal, full screen, collapse, actions), the settings dialog built from sections, theme tokens, light and dark themes, viewer presets, and settings export and import.
