// Sandkit sb-highlighting 0.1.9 · MIT Licence · https://github.com/sebjwallace/sandkit
// Page-wide pointing and lighting with no wiring. Include it, and any element with a data-ref
// announces sb-highlight while it's pointed at or focused, lights up when its ref is announced, and
// stays lit while an outliner on the page pins it. See practices/highlighting.md for the events.
//
//   <script src="lib/sandkit/shell/sb-highlighting.js"></script>
//
// To point at several things on purpose, name them. The words themselves aren't one of those things:
//
//   <span data-points-at="TRK-1 SIG-1 RUL-1">the parts that stop a train</span>
//
// Two attributes let a component speak for itself:
//   data-sb-announces  nothing inside this element is announced here: the component does it
//   data-sb-lights     this part lights itself, so it's neither lit nor announced here
(function () {
  if (document.querySelector('style[data-sb-highlighting]')) return;

  // ---- Lighting ----

  const SHAPES = 'rect, circle, ellipse, polygon, path, line, polyline';
  const ACCENT = 'var(--sb-accent, #2563eb)';

  const sheet = document.createElement('style');
  sheet.dataset.sbHighlighting = '';
  document.head.append(sheet);

  const selectorFor = (refs) => refs.map((ref) => `[data-ref="${CSS.escape(String(ref))}"]`).join(', ');
  const htmlParts = (parts) => `:is(${parts}):not(svg *, [data-sb-lights])`;
  const svgShapes = (parts) => `svg :is(${parts}) > :is(${SHAPES}), svg :is(${parts}):is(${SHAPES})`;
  const svgText = (parts) => `svg :is(${parts}):is(text, tspan)`;

  // A part may sit over something people need to see, such as a picture, so tints are see-through.
  // SVG takes a stroke and never a fill: a fill can hide what's drawn over the shape, or the words
  // on it. Only a part's own shapes change, so lighting an entity leaves the fields inside it alone.
  // A part may also be a shape, or a line of text, itself.
  const litRules = (parts) => `
    ${htmlParts(parts)} {
      background-color: color-mix(in srgb, ${ACCENT} 22%, transparent) !important;
      box-shadow: inset 0 0 0 2px ${ACCENT} !important;
    }
    ${svgShapes(parts)} {
      stroke: ${ACCENT} !important;
      stroke-width: 3 !important;
      filter: drop-shadow(0 0 4px ${ACCENT});
    }
    ${svgText(parts)} { fill: ${ACCENT} !important; }`;

  // Pins fade with --sb-glow, the one number the outliner animates (practices/highlighting.md).
  const pinned = (percent) => `color-mix(in srgb, ${ACCENT} calc(var(--sb-glow, 1) * ${percent}%), transparent)`;

  const pinnedFillRules = (parts) => `
    ${htmlParts(parts)} { background-color: ${pinned(28)} !important; }
    ${svgShapes(parts)} {
      stroke: ${pinned(100)} !important;
      stroke-width: 4 !important;
      filter: drop-shadow(0 0 4px ${pinned(100)});
    }
    ${svgText(parts)} { fill: ${pinned(100)} !important; }`;

  const pinnedOutlineRules = (parts) => `
    ${htmlParts(parts)} { outline: 2px solid ${pinned(100)} !important; }
    ${svgShapes(parts)} { stroke: ${pinned(100)} !important; stroke-width: 2 !important; stroke-dasharray: 6 3 !important; }
    ${svgText(parts)} { fill: ${pinned(100)} !important; }`;

  const rulesFor = (rules, refs) => (refs.length ? rules(selectorFor(refs)) : '');

  // Rules rather than classes, so a part redrawn while lit is lit the moment it's drawn. Pointing
  // comes last, so it outranks a pin while it lasts.
  let litSheet = '';
  let pinnedSheet = '';
  const draw = () => { sheet.textContent = pinnedSheet + litSheet; };

  function light({ ref, refs }) {
    litSheet = ref == null ? '' : rulesFor(litRules, refs ?? [ref]);
    draw();
  }

  // ---- Pins ----

  const pinsByOutliner = new Map();

  // Each outliner sends all its own pins, so two on a page add together.
  document.addEventListener('sb-pins', (e) => {
    pinsByOutliner.set(e.target, e.detail);
    const every = [...pinsByOutliner.values()];
    pinnedSheet = rulesFor(pinnedFillRules, every.flatMap((pins) => pins.fill))
      + rulesFor(pinnedOutlineRules, every.flatMap((pins) => pins.outline));
    document.documentElement.classList.toggle('sb-outliner__glowing', every.some((pins) => pins.glow));
    draw();
  });

  // ---- Announcing ----

  let lastAnnounced = null;  // what was most recently announced, by anyone, to compare with what's next
  let ours = false;          // whether that announcement was ours, and so ours to end
  let speaking = false;      // true while we announce, to tell our own event from anyone else's
  let spoken = false;        // whether anyone has announced a ref for the pointing being handled
  let touching = false;      // a tap isn't pointing: it acts, and there's no way to stop pointing after it

  const identityOf = (refs) => JSON.stringify(refs);

  function announce(refs) {
    const detail = !refs ? { ref: null } : refs.length > 1 ? { ref: refs[0], refs } : { ref: refs[0] };
    speaking = true;
    document.dispatchEvent(new CustomEvent('sb-highlight', { detail }));
    speaking = false;
    ours = Boolean(refs);
  }

  document.addEventListener('sb-highlight', (e) => {
    const detail = e.detail ?? {};
    // A null only ends the last thing pointed at. It says nothing about what's being pointed at now.
    if (detail.ref != null) spoken = true;
    lastAnnounced = detail.ref == null ? null : identityOf(detail.refs ?? [detail.ref]);
    if (!speaking) ours = false;
    light(detail);
  });

  const namesIn = (attribute) => attribute.split(/\s+/).filter(Boolean);

  // The refs to announce for an element, from the innermost thing holding it: what a part is, or
  // what some words point at. Null if it's in neither, or a component speaks for it.
  function refsAt(element) {
    if (element.closest('[data-sb-announces]')) return null;
    const held = element.closest('[data-ref]:not([data-ref=""]), [data-points-at]');
    if (!held || held.hasAttribute('data-sb-lights')) return null;
    if (!held.hasAttribute('data-points-at')) return [held.dataset.ref];
    const named = namesIn(held.dataset.pointsAt);
    return named.length ? named : null;
  }

  function arrive(element) {
    if (spoken) return;
    const refs = refsAt(element);
    if (refs && identityOf(refs) !== lastAnnounced) announce(refs);
    else if (!refs && ours) announce(null);
  }

  function leave() {
    if (ours) announce(null);
  }

  // A move runs pointerover, pointerenter, the old part's mouseleave, then mouseover. Starting at
  // the first and deciding at the last lets a sandbox's wiring and every component speak first,
  // however they listen.
  addEventListener('pointerover', (e) => {
    spoken = false;
    touching = e.pointerType === 'touch';
  }, true);
  addEventListener('focusin', () => { spoken = false; }, true);

  document.addEventListener('mouseover', (e) => { if (!touching) arrive(e.target); });
  document.addEventListener('focusin', (e) => { if (e.target.matches(':focus-visible')) arrive(e.target); });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) leave(); });
  document.addEventListener('focusout', (e) => { if (!e.relatedTarget) leave(); });
})();
