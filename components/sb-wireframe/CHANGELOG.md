# sb-wireframe changelog

## 0.1.2 · 2026-10-25
- Manifest: names no other component, not even as a suggestion. Which components go together is for the practices.

## 0.1.1 · 2026-10-18
- `reveal` takes an optional place, the part to go to when several share a ref, and returns `true`, or `false` if there's no such part (see the locating practice).

## 0.1.0 · 2026-10-17
- First release. A wireframe prototype written in plain HTML: everything inside drawn as a wireframe, themed by a few tokens; one screen or many, with a bar naming them and `data-go` moving between them; parts marked `data-ref` pointed at, highlighted (marking the screen that holds them), revealed and selected; and a few helper classes for rows, stacks, boxes, image and text placeholders and primary buttons.
