// Sandkit sb-highlighting 0.1.11 · MIT Licence · https://github.com/sebjwallace/sandkit
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
// To show what's related, tag a part. Pointing at it also lights, faintly, whatever shares a tag:
//
//   <tr data-ref="SRC-3" data-tags="platforms passengers">…</tr>
//
// To keep topics lit while people work, send sb-tag-focus: { tags: [...], match: 'all' | 'any' }.
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
  // A part may also be a shape, or a line of text, itself. The outline sits exactly on the ring, and
  // shows where a part's own solid contents, such as a card's sheet, would cover the tint and ring.
  const litRules = (parts) => `
    ${htmlParts(parts)} {
      background-color: color-mix(in srgb, ${ACCENT} 22%, transparent) !important;
      box-shadow: inset 0 0 0 2px ${ACCENT} !important;
      outline: 2px solid ${ACCENT} !important;
      outline-offset: -2px !important;
    }
    ${svgShapes(parts)} {
      stroke: ${ACCENT} !important;
      stroke-width: 3 !important;
      filter: drop-shadow(0 0 4px ${ACCENT});
    }
    ${svgText(parts)} { fill: ${ACCENT} !important; }`;

  // Related, not the same: only a thin line, so it says less than lit does and hides nothing. Words
  // keep their colour. See-through lines let what's underneath read through them.
  const faint = `color-mix(in srgb, ${ACCENT} 60%, transparent)`;
  const relatedRules = (parts) => `
    ${htmlParts(parts)} { outline: 1px solid ${faint} !important; outline-offset: -1px !important; }
    ${svgShapes(parts)} { stroke: ${faint} !important; stroke-width: 2 !important; stroke-dasharray: 2 3 !important; }`;

  // Topics someone chose to follow: a dashed line in a colour of its own, so it reads apart from
  // lit, pinned and faint in shape as well as colour, and no fill, so it hides nothing.
  const CHOSEN = `var(--sb-tag-focus, color-mix(in srgb, ${ACCENT} 30%, #c026d3))`;
  const chosenRules = (parts) => `
    ${htmlParts(parts)} { outline: 2px dashed ${CHOSEN} !important; outline-offset: -2px !important; }
    ${svgShapes(parts)} { stroke: ${CHOSEN} !important; stroke-width: 2.5 !important; stroke-dasharray: none !important; }`;

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

  const attributeForTag = (tag) => `[data-tags~="${CSS.escape(String(tag))}"]`;
  const selectorForTags = (tags) => tags.map(attributeForTag).join(', ');

  // Parts carrying every chosen tag, or any of them. The chosen tags sit in :where, so however many
  // there are, these rules weigh the same as the others, and their order alone decides who wins.
  function chosenSelector(tags, match) {
    const chosen = match === 'any' ? selectorForTags(tags) : tags.map(attributeForTag).join('');
    return `[data-tags]:where(${chosen})`;
  }

  // Whatever shares a tag, unless it's already lit or pinned, which both say more.
  function relatedSheet() {
    if (!announcedTags.length) return '';
    const stronger = [...announcedRefs, ...pinnedRefs];
    const tagged = selectorForTags(announcedTags);
    return relatedRules(stronger.length ? `:is(${tagged}):where(:not(${selectorFor(stronger)}))` : tagged);
  }

  // Rules rather than classes, so a part redrawn while lit is lit the moment it's drawn. Strongest
  // last: faint, then chosen, then pins, then pointing, which outranks a pin while it lasts.
  let announcedRefs = [];
  let announcedTags = [];
  let pinnedRefs = [];
  let pinnedSheet = '';
  let chosenSheet = '';
  const draw = () => { sheet.textContent = relatedSheet() + chosenSheet + pinnedSheet + rulesFor(litRules, announcedRefs); };

  function light({ ref, refs, tags }) {
    announcedRefs = ref == null ? [] : refs ?? [ref];
    announcedTags = Array.isArray(tags) ? tags : [];
    draw();
  }

  // ---- Chosen tags ----

  document.addEventListener('sb-tag-focus', (e) => {
    const { tags, match } = e.detail ?? {};
    chosenSheet = Array.isArray(tags) && tags.length ? chosenRules(chosenSelector(tags, match)) : '';
    draw();
  });

  // ---- Pins ----

  const pinsByOutliner = new Map();

  // Each outliner sends all its own pins, so two on a page add together.
  document.addEventListener('sb-pins', (e) => {
    pinsByOutliner.set(e.target, e.detail);
    const every = [...pinsByOutliner.values()];
    pinnedRefs = every.flatMap((pins) => [pins.fill ?? [], pins.outline ?? []]).flat();
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

  // What makes one announcement different from the next. Null when it's about nothing.
  function identityOf({ ref, refs, tags }) {
    if (ref == null && !tags?.length) return null;
    return JSON.stringify([refs ?? [ref], tags ?? []]);
  }

  function announce(detail) {
    speaking = true;
    document.dispatchEvent(new CustomEvent('sb-highlight', { detail }));
    speaking = false;
    ours = identityOf(detail) !== null;
  }

  document.addEventListener('sb-highlight', (e) => {
    const detail = e.detail ?? {};
    // A null only ends the last thing pointed at. It says nothing about what's being pointed at now.
    lastAnnounced = identityOf(detail);
    if (lastAnnounced !== null) spoken = true;
    if (!speaking) ours = false;
    light(detail);
  });

  const namesIn = (attribute = '') => attribute.split(/\s+/).filter(Boolean);

  // The refs and tags of the innermost thing holding an element: what a part is, what some words
  // point at, or only what it's about. A part's tags are its own: it never takes those of what
  // holds it. Null if it's in none of these, or a component speaks for it.
  function partAt(element) {
    if (element.closest('[data-sb-announces]')) return null;
    const held = element.closest('[data-ref]:not([data-ref=""]), [data-points-at], [data-tags]:not([data-tags=""])');
    if (!held || held.hasAttribute('data-sb-lights')) return null;
    const refs = held.hasAttribute('data-points-at') ? namesIn(held.dataset.pointsAt)
      : held.dataset.ref ? [held.dataset.ref] : [];
    const tags = namesIn(held.dataset.tags);
    return refs.length || tags.length ? { refs, tags } : null;
  }

  function announcementOf({ refs, tags }) {
    const detail = refs.length > 1 ? { ref: refs[0], refs } : { ref: refs[0] ?? null };
    return tags.length ? { ...detail, tags } : detail;
  }

  function arrive(element) {
    if (spoken) return;
    const part = partAt(element);
    if (!part) {
      if (ours) announce({ ref: null });
      return;
    }
    const detail = announcementOf(part);
    if (identityOf(detail) !== lastAnnounced) announce(detail);
  }

  function leave() {
    if (ours) announce({ ref: null });
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
