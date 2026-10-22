# Sandbox shell changelog

Covers `sb-shell`, `sb-theme-settings` and `sb-export`, which are versioned together.

## 0.1.8 · 2026-10-22
- Panels: a `panels` slot for things viewers keep beside the page, such as `sb-outliner`. Each gets a button in the header, by its heading, that opens and closes it; `sb-open` says so, and a panel closed from its own bar puts its button back. Any element with a `heading` and an `open` property can be one.

## 0.1.7 · 2026-10-22
- Keys for modes: each mode's first letter (C, T, I), or a `key` attribute on the mode, turns it on, and again goes back to Explore. Shown in the mode picker beside each name ("Trace · T") and listed when the picker is pointed at. Left alone while typing, with Ctrl, ⌘ or Alt, or when the page has used the key.
- The mode picker's chevron is the header's own icon, set in from the edge like the other buttons, in place of the browser's, which sat against the border.

## 0.1.6 · 2026-10-21
- Drop: a theme token, `--sb-drop`, the opposite of lift. A see-through dark tint so a part sits a step below whatever it's in, for when lifts inside lifts have climbed too far to stand apart.

## 0.1.5 · 2026-10-20
- Lift: two theme tokens, `--sb-lift` (a see-through tint) and `--sb-lift-shadow`, for parts that sit on something, so a card or badge stands off whatever is beneath it, in any layer and in either theme.
- The header stays within reach: once the page has scrolled past it, a compact header (title, mode picker, actions and controls) stays at the top of the window, without moving anything below. `compact` says when; `--sb-header-height` on `<html>` gives its height for anything else that sticks to the top, and the page's scroll padding keeps jumps below it.

## 0.1.4 · 2026-10-19
- Modes: a `modes` slot and a mode picker in the header, offering Explore and each mode by its `heading`. Choosing one turns it on and the others off, and fires `sb-mode` (`{ mode, active }`); a mode ending or starting itself is followed. The picker is marked `data-modes`, so modes let clicks through to it. See the modes practice.

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
