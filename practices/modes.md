# Modes

How a sandbox offers other ways of using it, such as commenting on parts or tracing why they're there, one at a time. Read this before putting a mode in a sandbox, or building one.

## Why it matters

Normally a click in a sandbox acts: it selects, steps, opens. A mode changes what a click does for a while: in comment mode it picks a part to comment on, in trace mode a part to see why it's there. People need to know which mode they're in, how to leave it, and that only one is on at a time. Modes share one shape, so people learn it once.

## Putting modes in a sandbox

Modes go in the shell's `modes` slot. The shell offers them in a mode picker in the header, after **Explore**, the sandbox as it normally is:

```html
<sb-shell>
  <sb-comments slot="modes"></sb-comments>
  <sb-trace-mode slot="modes"></sb-trace-mode>
</sb-shell>
```

Then wire what a pick does, as each mode's manifest says. Every sandbox has comment mode; trace mode comes once the model cites its sources (see the [sources practice](sources.md)); inspect mode once the sandbox has labels people could misread; tags mode once it has opted in to [tagging](tagging.md).

| Mode | In the picker | A pick |
|---|---|---|
| [`sb-comments`](../components/sb-comments/manifest.md) | Comment | opens a box to comment on the part |
| [`sb-trace-mode`](../components/sb-trace-mode/manifest.md) | Trace | asks the sandbox to show why the part is there |
| [`sb-inspect-mode`](../components/sb-inspect-mode/manifest.md) | Inspect | holds the card saying what the part is, shown already by pointing |
| [`sb-tags-mode`](../components/sb-tags-mode/manifest.md) | Tags | holds the card showing the part's tags; a click on a tag keeps it lit |

To act when a mode starts, such as closing a tour, listen on `document`:

```js
document.addEventListener('sb-mode', (e) => { if (e.detail.active) tour.close(); });
```

## What every mode has

- **A way in:** the shell's mode picker, or the mode's key, the first letter of its name unless it asks for another, as Tags does, since T is Trace's. A mode has no button of its own.
- **A sign it's on:** the picker turns amber, and the mode draws a banner at the bottom saying what clicking does. A mode people visit to do one job and leave, such as Comment, Trace or Inspect, also draws an amber frame round the page: amber says "not exploring", never blending with the sandbox. A mode people keep on while they work, such as Tags, goes without, using the accent, since a frame they live in stops warning and starts getting in the way. Build a new mode with amber unless people will keep it on while working.
- **Picking instead of acting:** pointing shows what can be picked; a click picks it and never reaches the page.
- **What it lets through:** its own parts, and anything marked `data-modes`, such as the mode picker, so another mode is always a choice away.
- **A way out:** the banner's buttons, or choosing another mode or Explore. Leaving never loses work: comment mode opens its comments to send, and tags mode keeps its chosen tags lit.
- **One at a time:** the shell turns the others off.

What a pick does is each mode's own business. A mode never searches the page: it looks only at `data-ref`, or reports where the viewer clicked for the sandbox to answer with the refs there (`refsAt` in the [locating practice](locating.md)). Tags mode also reads `data-tags` across the page to count and step through what's tagged: one attribute parts publish for the whole page, never their content.

## The protocol

A mode is any element with a `heading` (its name in the picker) and an `active` property.

- **The shell sets `active`** when the viewer chooses in the picker, turning the others off. Setting `active` fires nothing, as properties never fire viewers' events.
- **`sb-mode` says a viewer changed modes,** with `{ mode, active }`, `mode` being the heading. The shell fires it when the viewer chooses; a mode fires it from itself, bubbling, when the viewer ends it from its banner, or starts it again. It reaches `document`, so anything may listen.
- **The shell follows** a mode that ends or starts itself, so the picker always shows the mode that's on.

No mode knows about any other, or about the shell.
