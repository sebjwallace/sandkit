# sb-comments changelog

## 0.2.1 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.2.0 · 2026-10-19
- **Breaking:** a mode, chosen in the shell's mode picker, with no Comment button of its own. Move it from `slot="actions"` to `slot="modes"` (shell 0.1.4 or later); its name in the picker is `heading`, default `Comment`. Outside a shell, start a session by setting `active`.
- **Breaking:** `sb-mode` is no longer fired when a session starts from the picker (the shell fires it), and now carries `mode`, the heading: `{ mode, active }`. To act on any mode starting, listen on `document` for `sb-mode` with `active: true`.
- However a session ends, including choosing another mode, comments written open in the list to send, so none are put away unseen.
- Clicks on `data-modes` (such as the mode picker) pass through in comment mode, as in every mode.
- The banner sits at the bottom of the window, clear of the header.

## 0.1.0 · 2026-10-18
- First release. Comment mode, where a click picks instead of acting and the sandbox answers with the refs there, as a session with a clear end: Cancel forgets its comments, Done lists them to edit, copy or download, then clears everything; a comment box with kinds; one markdown text to copy as a prompt (falling back to copying by hand) or download; numbers that only go up; its own amber colour, so it never blends with the sandbox. Comments live only in the page, leaving nothing behind.
