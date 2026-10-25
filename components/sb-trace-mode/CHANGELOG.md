# sb-trace-mode changelog

## 0.1.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.0 · 2026-10-19
- First release. Trace mode, chosen in the shell's mode picker: pointing outlines the innermost part whose ref the sandbox says is traceable, drawn over it in the top layer; a click on it fires `sb-pick` with that ref instead of acting. A banner says what clicking does, with Stop; Escape ends the mode when no dialog is open. Clicks on `data-modes` and in open dialogs pass through. Amber, like every mode.
