# sb-scrubber changelog

## 0.2.0 · 2026-10-17
- **Breaking:** renamed from `sb-timeline`, which now names a timeline of events. Copy `components/sb-scrubber/sb-scrubber.js` in place of `sb-timeline.js`, and replace every `sb-timeline` with `sb-scrubber` (tags, selectors and `sb-timeline__` classes). Nothing else changed.

## 0.1.0 · 2026-10-17
- First release, as `sb-timeline`. A bounded range to scrub back and forth or play at a steady pace, with named marks to jump to, an optional loop, and a formatted label.
