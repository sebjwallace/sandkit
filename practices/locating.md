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
| [`sb-log`](../components/sb-log/manifest.md) | each entry given an `id` | — |
| [`sb-flowchart`](../components/sb-flowchart/manifest.md) | each step and lane, and each edge given an `id` | — |
| [`sb-statechart`](../components/sb-statechart/manifest.md) | each state | — |
| [`sb-decision-tree`](../components/sb-decision-tree/manifest.md) | each question and outcome | — |
| [`sb-wireframe`](../components/sb-wireframe/manifest.md) | the parts the sandbox marks in its screens | goes to the screen holding the place, or else the ref |
| [`sb-panel`](../components/sb-panel/manifest.md) | — | expands the panel if it holds the place or the ref, and brings it to the front |
| [`sb-image`](../components/sb-image/manifest.md) | each mark | glides to the mark |
| [`sb-timeline`](../components/sb-timeline/manifest.md) | each event, and each lane's label | — |
| [`sb-board`](../components/sb-board/manifest.md) | each card and column | — |
| [`sb-c4`](../components/sb-c4/manifest.md) | each box in the current view, and each line carrying one relationship with an `id` | goes to the view where an element can be seen |
| [`sb-math`](../components/sb-math/manifest.md), [`sb-annotate`](../components/sb-annotate/manifest.md), [`sb-walkthrough`](../components/sb-walkthrough/manifest.md) | the parts the sandbox marks in their content | — |
| The sandbox's own elements | whatever it marks | — |
| [`sb-xref`](../components/sb-xref/manifest.md) | nothing: it lists places, below | — |
| [`sb-tour`](../components/sb-tour/manifest.md) | nothing: its steps name what they point at with `data-at` | — |

More components join as sandboxes need them. A component's manifest says what it marks and whether it has `reveal`.

## Finding and going

The sandbox does the finding, so no component ever searches the page. Write these once, in the page script:

```js
const announce = (ref) => document.dispatchEvent(new CustomEvent('sb-highlight', { detail: { ref } }));

// Every place on the page a ref appears, in page order.
const placesOf = (ref) => [...document.querySelectorAll(`[data-ref="${CSS.escape(ref)}"]`)];

// Go to where a ref appears: open whatever hides it, scroll to it, and light it up briefly.
// Returns the place it went to, or false if the ref isn't on the page.
function goTo(ref, index = 0) {
  let place = placesOf(ref)[index];
  if (!place) return false;
  revealAround(place, ref);
  // Revealing can redraw what holds the place, so find it again if it was replaced.
  if (!place.isConnected) place = placesOf(ref)[index];
  if (!place) return false;
  place.scrollIntoView({ block: 'center', behavior: 'smooth' });
  announce(ref);
  setTimeout(() => announce(null), 1500);
  return place;
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

## Listing where a ref appears

[`sb-xref`](../components/sb-xref/manifest.md) lists every place a ref appears, grouped by view, and what the model links it to. It never searches the page: the sandbox gives it the places, and goes when one is clicked.

```js
// The words inside an element, as they read: its pieces of text joined by spaces, since table
// cells and the lines of a diagram sit side by side without any. A diagram's tooltips are left out.
function textOf(el) {
  const pieces = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('title')) pieces.push(walker.currentNode.textContent);
  return pieces.join(' ').replace(/\s+/g, ' ').replace(/\s([.,;:)])/g, '$1').replace(/\(\s/g, '(').trim();
}

// The view a place is in: the nearest heading the sandbox gave, such as a chapter, and the view it
// fills in a layout, such as a walkthrough's slot.
function viewOf(place) {
  const heading = place.closest('[heading]')?.getAttribute('heading');
  const slot = place.closest('[slot]')?.getAttribute('slot');
  return [heading, slot].filter(Boolean).join(' › ') || 'Page';
}

// A walkthrough's other steps can't be gone to: its steps are what reveal.
const unavailable = (place) => (place.closest('[data-step][hidden]') ? 'In another step of a walkthrough' : undefined);

function showXref(ref) {
  const thing = model.find(ref);
  xref.subject = { ref, title: thing?.name ?? ref, kind: thing?.kind };
  xref.places = placesOf(ref).map((place) => ({
    view: viewOf(place),
    context: textOf(place).slice(0, 120),
    hidden: !place.checkVisibility(),
    unavailable: unavailable(place)
  }));
  xref.links = model.linksOf?.(ref) ?? [];
}

xref.addEventListener('sb-go', (e) => goTo(e.detail.ref, e.detail.index));
xref.addEventListener('sb-follow', (e) => showXref(e.detail.ref));
xref.addEventListener('sb-back', (e) => showXref(e.detail.ref));
document.addEventListener('sb-select', (e) => { if (e.detail.code) showXref(e.detail.code); }); // a pill clicked
```

- **Name views as readers know them.** Give chapters and panels a `heading`, and the names follow. A place's context is the words around it; take a row or paragraph rather than a lone code when the code alone says little.
- **Put it in a panel** beside the model, so going somewhere never hides the list.
- **Give links in the model's words** ("rests on", "affects"), so a chain of evidence can be walked, and Back walks it home.

## Touring the page

[`sb-tour`](../components/sb-tour/manifest.md) points at one thing at a time, with a tooltip beside it. Its steps name what they point at with `data-at`, not `data-ref`, since a step is a way to a place, not a place. On each step the sandbox goes there and hands the tour what it found:

```js
tour.addEventListener('sb-step', (e) => {
  tour.anchor = e.detail.ref ? goTo(e.detail.ref) || null : null;
});
```

When a step means a particular view, carry it on the step (`data-view="diagram"`) and call that view's `reveal` instead, as for words in the prose.

## What isn't found, on purpose

- **Things a component doesn't draw,** such as rows hidden by a viewer's filter, or cells on a canvas. They aren't in the page, so they can't be found or gone to. A sandbox that needs them answers from its model, which knows where everything is.
- **A walkthrough's hidden steps.** A walkthrough's steps are what do the revealing: each one outlines views and lights parts inside them. Its words carry `data-ref` to say what they point at, so they're found, but nothing goes into a walkthrough to open a step. Go to the views it points at instead.
- **Other pages.** Finding across pages needs an index and links into each page, which wait until a sandbox needs them.

## Good practice

- **Use the same ref everywhere,** as for highlighting: the model's id, the tree's node, the phrase in the prose. A thing found in one place and not another is usually a ref spelled two ways.
- **Say where a ref appears before going.** "Appears in 3 places" with a list beats jumping to the first and leaving the reader to guess there are more.
- **Let viewers' choices stand.** If a ref is hidden by something a viewer chose, say so rather than undoing it.
