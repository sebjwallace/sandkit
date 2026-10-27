# Style guide

How Sandkit looks, so components that never reference each other still look like one kit. Read it before styling a component or changing how one looks, and in a sandbox before styling its own parts (see the [domain components practice](practices/domain-components.md)). Sandkit's `DECISIONS.md` says why; this says what.

Components stay isolated: they never reference each other, and none of them knows about this guide. The guide is the one thing that knows them all. It says how each should look, so they stay consistent while sharing no code.

## Changing a look

- **Change only the component you were asked to work on.** Never update another component to match it, however inconsistent the two look.
- **Ask before touching any other.** If a change affects a look other components share, such as a material or a token, or you notice drift elsewhere, name each component it would affect and ask the person. Change them only once they've said yes to those components by name.
- **A change to a shared look is a change to this guide.** Propose it with the change, and update the guide only when the person agrees.

## Recognisable by material

Most interfaces are flat: everything is a rounded box, so nothing says what it is. Sandkit gives each kind of thing a few cues that make it recognisable at a glance, like paper, a card or a stamp, without textures or realism.

- **A material means one thing.** Paper means source material, so nothing else is paper.
- **A few cues, not a costume.** Paper is a warm tint, a folded corner and a soft shadow, and nothing more.
- **Comments never blend with content.** Modes, stamps and marks each have a look that can't be mistaken for what they're about.

## Materials

| Material | Means | Cues | Worn by |
|---|---|---|---|
| Paper | Source material: what everything rests on | A sheet of `--sb-surface` mixed 6% with `#f3e2b8`, an edge of `--sb-text` at 24%, a folded corner, a soft drop shadow | `sb-source`, `sb-sources`, `sb-discovery-card`; a sandbox's own source cards, such as a trace's in the sources practice |
| Card with a header band | A record: a decision, a card of discovery | A `--sb-surface-2` band with a border below it, above a `--sb-surface` body | `sb-choice`, `sb-discovery-card` |
| Amber frame | Not exploring: a mode is on | A 2px outline and a banner in `--sb-warn` | `sb-comments`, `sb-trace-mode`, `sb-inspect-mode` |
| Dashed circle | An agent rather than a person | The person's circle drawn dashed | `sb-person` |
| Ink | A status pressed on at one moment | A bordered stamp in one ink colour, letter-spaced capitals | `sb-stamp` |

- **Paper changes only in size.** The fold is 20px on a full source, 16px on a catalogue card, and 12px in a trace or on a discovery card's source or passage, and the shadow shrinks with it. The tint and edge stay the same.
- **Each component names its own copy of a material's tokens** (`--sb-source-paper`, `--sb-sources-paper`, `--sb-discovery-card-paper`), with the same default. Changing one means asking about the others (see above).

## Tokens

Colours, the font and corners come from the theme's tokens, defined in `shell/sb-theme-settings.js`. Every use has a fallback, which is exactly the light theme's value, so a component without the shell looks like the light theme:

| Token | For | Fallback |
|---|---|---|
| `--sb-bg` | The page behind everything | `#f5f6f8` |
| `--sb-surface` | Panels and cards | `#fff` |
| `--sb-surface-2` | Subtle fills: bands, tracks, quiet buttons | `#eef0f3` |
| `--sb-text` | Text | `#1f2933` |
| `--sb-muted` | Secondary text, axes, quiet lines | `#616e7c` |
| `--sb-border` | Borders and dividers | `#d5d9e0` |
| `--sb-accent` | What's pointed at, chosen or main | `#2563eb` |
| `--sb-accent-soft` | A fill behind lit or hovered parts | `#eaf0ff` |
| `--sb-accent-text` | Text on `--sb-accent` | `#fff` |
| `--sb-good`, `--sb-warn`, `--sb-bad` | Tones | `#3f9142`, `#d69e2e`, `#c53030` |
| `--sb-font` | Text | `system-ui, sans-serif` |
| `--sb-radius` | Corners of boxes and buttons | `8px` |

- **Never a bare colour.** If the theme has no token for something, mix one from the tokens (`color-mix(in srgb, var(--sb-good, #3f9142) 10%, var(--sb-surface, #fff))`) rather than writing a hex value.
- **A component's own tokens start with its tag** (`--sb-wireframe-ink`) and default to theme tokens. Document them under Styling in the manifest.
- **`--sb-lift` and `--sb-drop`** are for parts that sit on something, such as the shell's panels, not for every component.

## Tones

`good`, `warn` and `bad` mean the same thing everywhere: fine, needs a look, wrong. Components that draw several lines or sets also take `accent` and `muted`, so a sandbox can pick a quiet one.

- **A tone is named, never a colour.** Data says `tone: 'bad'`; the component maps it to `--sb-bad`.
- **One local token per tone,** set by a class: `.sb-callout--bad { --sb-callout-tone: var(--sb-bad, #c53030); }`, with the rest of the CSS reading `--sb-callout-tone`.
- **Say it in words too.** A tone is never the only sign: a status reads "broken" as well as being red.
- **Lit outranks tone.** A part that is both lit and warned shows as lit.

## Pointing and lighting

Pointing is the [highlighting practice](practices/highlighting.md); this is only how it looks.

- **Lit is the accent.** An `--sb-accent-soft` fill for rows and boxes, an `--sb-accent` outline or ring for something that must stand out, a thicker `--sb-accent` stroke for lines in SVG.
- **The class is `sb-name__part--highlighted`.** The sandbox's own parts use `is-lit`.
- **Hover looks like lit,** so pointing feels the same from either end.

## Shapes and type

- **Boxes and buttons use `--sb-radius`.** Pills are `999px`, dots `50%`.
- **Text sizes:** 13px for body text in a component, 12px for details and labels, 11px for small capitals and badges. Larger only for a component's one headline, such as a stat's value.
- **Code and identifiers** use `ui-monospace, Menlo, Consolas, monospace`.
- **Every button has a `:focus-visible` style,** an `--sb-accent` outline, so the keyboard can see where it is.

## How a component carries its styles

- **One stylesheet per component,** added once with the id `sb-name-style`, at the start of `<head>` so the sandbox's own stylesheet wins.
- **Classes are `sb-name__part` and `sb-name__part--state`.** State that sandboxes may style travels as `data-` attributes (`data-tone`, `data-status`).
- **Canvas and SVG drawn from JavaScript** keep a table of fallbacks matching the tokens, and listen for `sb-theme` on `document` if they read tokens in JavaScript.

## Where components differ today

Known drift in Sandkit's components. Don't copy it. When you're already changing a component, you may fix its own drift, with a changelog entry; drift in any other component is for the person to decide (see [Changing a look](#changing-a-look)). In a sandbox, leave `lib/` as it is.

- **White text on tones.** `sb-rule`, `sb-scenario`, `sb-choice`, `sb-ontology` and `sb-image` set `#fff` on good, bad or accent backgrounds, which is hard to read in the dark theme. The theme has no "text on a tone" token yet.
- **Corners not on the radius token.** About 70 literal radii (`4px`, `2px`, `3px`, `6px`, `10px`), so the viewer's corner setting misses them. The theme has no small radius token yet.
- **Fallbacks off the theme.** `--sb-warn` falls back to `#b7791f` in `sb-choice`, `sb-code`, `sb-json` and `sb-image`; `--sb-font` to plain `system-ui` in a few; one stray border (`#d9dde3`) and background (`#f4f5f7`).
- **Lit under other names.** `--lit` in `sb-accordion`, `sb-outliner` and the source components, plus `--spotlit`, `--pointed` and `--on`; ring widths vary from 1.5px to 3px.
- **Buttons.** Padding, fill and modifier names vary (`--main`, `--primary`; quiet as transparent or as `--sb-surface-2`).
- **No focus style** in `sb-c4`, `sb-choice`, `sb-controls`, `sb-handoff`, `sb-panel`, `sb-parameters`, `sb-poll`, `sb-scrubber`, `sb-statechart` and `sb-wireframe`.
- **Text sizes** include 9px, 10.5px, 12.5px and 14.5px.
