# Sandbox shell changelog

Covers `sb-shell` and `sb-theme-settings`, which are versioned together.

## 0.1.2 · 2026-10-18
- A Page width setting in the Theme section: Narrow, Wide or Full. It sets `--sb-page-width` for the sandbox's page to use (unset until chosen, so each page keeps its own default), is remembered per viewer apart from themes and presets, and is exported with the settings.

## 0.1.1 · 2026-10-17
- The shell moved by another element while the page loads is built once, not twice; for example, inside a walkthrough's step.

## 0.1.0 · 2026-10-17
- First release. The header (goal, full screen, collapse, actions), the settings dialog built from sections, theme tokens, light and dark themes, viewer presets, and settings export and import.
