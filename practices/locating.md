# Locating

How to find everywhere a ref appears on the page, and go to one of those places: open whatever hides it, scroll to it and light it up. Read this before building anything that sends people to a thing, such as a "where is this used?" list, a link from a note to the rule it cites, or a guided tour.

It builds on the [highlighting practice](highlighting.md), which lights things up, and the [identifiers practice](identifiers.md), which gives things their codes.

## Why it matters

Pointing lights up what is already in view. But a rule may also appear in a closed chapter, a folded branch or another view, and a reader who can't see it can't check it. Finding and going answer the two questions behind every cross-reference:

1. **Where does it appear?** Every place on the page the thing shows up.
2. **Take me there.** Make one of those places visible, scroll to it and light it up.

Cross-references list the places a ref appears; comments cite the refs under what a viewer selected; tours go to a ref at each step. Each is a small layer on these two answers.

## The protocol

Two parts, both plain DOM.

- **`data-ref` names what a part is.** Every part a component draws for a thing with an id carries `data-ref` with that id, unchanged: a tree's node, a tab's content, an equation's term. The sandbox marks its own elements the same way, such as a phrase in the prose that mentions a rule. Several parts may share a ref, and only a part's outermost element carries it. Whether a part also answers pointing is up to each component.
- **`reveal(ref, place)` shows a part a component has hidden.** A component that can hide parts (a closed tab, a folded branch) offers `reveal`: it opens, expands or switches until the part is visible within it, and returns `true`, or `false` if it holds no such part. It never selects, never fires the events viewers' actions fire, and never undoes a viewer's search or filter. `place` is optional: the element being gone to, for components holding the sandbox's content, where a ref may appear in several panels. Components that draw their own parts go by the ref alone. Scrolling isn't hiding: `scrollIntoView` scrolls a table's own scroll box as well as the page, so a component that only scrolls has no `reveal`.

So "where does it appear?" is a single query, and "take me there" is calling `reveal` on whatever holds the place.

## Who takes part

| Part | Marks its parts with `data-ref` | `reveal(ref)` |
|---|---|---|
| [`sb-tree`](../components/sb-tree/manifest.md) | every node, folded ones too | opens the branches on the way |
| [`sb-tabs`](../components/sb-tabs/manifest.md) | — | shows the panel holding the place, or else the ref |
| [`sb-id`](../components/sb-id/manifest.md) | each pill, with its code | — |
| [`sb-table`](../components/sb-table/manifest.md) | each row with an `id` (not rows a viewer's search hides) | — |
| [`sb-rules`](../components/sb-rules/manifest.md) | each rule's row | — |
| [`sb-graph`](../components/sb-graph/manifest.md) | each node, and each edge and label line given an `id` | — |
| [`sb-sequence`](../components/sb-sequence/manifest.md) | each participant, and each message and note given an `id` | — |
| [`sb-erd`](../components/sb-erd/manifest.md) | each entity, and each field as `entity.field` | — |
| [`sb-c4`](../components/sb-c4/manifest.md) | each box in the current view, and each line carrying one relationship with an `id` | goes to the view where an element can be seen |
| [`sb-math`](../components/sb-math/manifest.md), [`sb-annotate`](../components/sb-annotate/manifest.md), [`sb-walkthrough`](../components/sb-walkthrough/manifest.md), [`sb-wireframe`](../components/sb-wireframe/manifest.md) | the parts the sandbox marks in their content | — |
| The sandbox's own elements | whatever it marks | — |

More components join as sandboxes need them. A component's manifest says what it marks and whether it has `reveal`.

## Finding and going

The sandbox does the finding, so no component ever searches the page. Write these once, in the page script:

```js
const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

// Every place on the page a ref appears, in page order.
const placesOf = (ref) => [...document.querySelectorAll(`[data-ref="${CSS.escape(ref)}"]`)];

// Go to where a ref appears: open whatever hides it, scroll to it, and light it up briefly.
function goTo(ref, index = 0) {
  const place = placesOf(ref)[index];
  if (!place) return false;
  revealAround(place, ref);
  place.scrollIntoView({ block: 'center', behavior: 'smooth' });
  announce(ref);
  setTimeout(() => announce(null), 1500);
  return true;
}

// Outermost first: a tab must open before the tree inside it can expand. The place says which tab, when a ref is in several.
function revealAround(place, ref) {
  const hosts = [];
  for (let el = place.parentElement; el; el = el.parentElement) if (typeof el.reveal === 'function') hosts.unshift(el);
  hosts.forEach((host) => host.reveal(ref, place));
}
```

- **Lighting up reuses `sb-highlight`,** so whatever already lights up for a ref, through the highlighting practice's wiring, lights up on arrival. Nothing new to style.
- **Calling `reveal` is wiring, not coupling.** It's a documented method, called by the sandbox; no component knows `goTo` exists.
- **When you know which view you mean, call its `reveal` directly.** A sentence about the diagram goes to the diagram: `diagram.reveal('CMP-3')` walks in and shows the part, even when it isn't drawn yet. `goTo` is for when you don't know where a thing is, as in a list of every place it appears.
- **A word that goes somewhere is a link, not a place.** Don't mark it with `data-ref`, or it's the first place found; keep its target in an attribute of your own, such as `data-go`.
- **Going is a click, not a point.** Call `goTo` on a click (see "Pointing shows, clicking acts" in the highlighting practice), and let pointing at the same word preview it with `announce`.

## What isn't found, on purpose

- **Things a component doesn't draw,** such as rows hidden by a viewer's filter, or cells on a canvas. They aren't in the page, so they can't be found or gone to. A sandbox that needs them answers from its model, which knows where everything is.
- **Other pages.** Finding across pages needs an index and links into each page, which wait until a sandbox needs them.

## Good practice

- **Use the same ref everywhere,** as for highlighting: the model's id, the tree's node, the phrase in the prose. A thing found in one place and not another is usually a ref spelled two ways.
- **Say where a ref appears before going.** "Appears in 3 places" with a list beats jumping to the first and leaving the reader to guess there are more.
- **Let viewers' choices stand.** If a ref is hidden by something a viewer chose, say so rather than undoing it.
