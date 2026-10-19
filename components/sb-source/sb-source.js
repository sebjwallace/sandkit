// Sandkit sb-source 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// One source, with the passages the model cites marked where they are. Quotes it can't find are
// listed as not found, never hidden. A source's text is never rendered as markup.
//
//   <sb-source></sb-source>
//   view.source = { id: 'SRC-3', title: 'Interview with the warehouse manager', author: 'Priya Shah', … };
//   view.content = text;   // the page loads the file; the component never fetches
//   view.passages = [{ id: 'RUL-014', quote: 'we reorder as soon as we drop under forty' }];
//   view.current = 'RUL-014';
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-source';
  const existing = customElements.get('sb-source');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-source>, so only one can run. Rename one by replacing every "sb-source" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-source { display: flex; flex-direction: column; min-height: 0; padding: 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); color: var(--sb-text, #1f2933); font: 13px/1.5 var(--sb-font, system-ui, sans-serif); }
    .sb-source__empty { margin: 0; color: var(--sb-muted, #616e7c); }

    /* What's known about the source, on a card of its own, held with the source in one frame. */
    .sb-source__head { display: grid; gap: 4px; padding: 10px 12px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: var(--sb-radius, 8px); background: var(--sb-surface, #fff); }
    .sb-source__title { display: flex; align-items: baseline; gap: 8px; margin: 0; font-size: 15px; font-weight: 600; }
    .sb-source__name { flex: 1; min-width: 0; }
    .sb-source__id { flex: none; padding: 0 6px; border-radius: 4px; background: var(--sb-surface-2, #eef0f3); color: var(--sb-muted, #616e7c); font: 600 11px/1.6 ui-monospace, Menlo, Consolas, monospace; }
    .sb-source__format { flex: none; align-self: center; padding: 1px 7px; border: 1px solid var(--sb-source-edge); border-radius: 4px; color: var(--sb-text, #1f2933); font: 600 10px/1.5 var(--sb-font, system-ui, sans-serif); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
    .sb-source__summary { margin: 2px 0 0; }
    .sb-source__fields { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 6px 14px; margin: 6px 0 0; }
    .sb-source__fields div { min-width: 0; }
    .sb-source__fields dt { color: var(--sb-muted, #616e7c); font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    .sb-source__fields dd { margin: 0; overflow-wrap: anywhere; font-size: 12px; }
    .sb-source__status::before { content: ''; display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: var(--sb-source-status, var(--sb-muted, #616e7c)); vertical-align: 1px; }
    .sb-source__status--inbox { --sb-source-status: var(--sb-warn, #d69e2e); }
    .sb-source__status--catalogued { --sb-source-status: var(--sb-accent, #2563eb); }
    .sb-source__status--reviewed { --sb-source-status: var(--sb-good, #3f9142); }
    .sb-source__status--superseded { --sb-source-status: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-source__fields .sb-source__sensitivity--confidential { color: var(--sb-bad, #c53030); font-weight: 600; }
    .sb-source__links { color: var(--sb-muted, #616e7c); font-size: 12px; }

    .sb-source__count { margin-top: 4px; color: var(--sb-muted, #616e7c); font-size: 12px; }
    .sb-source__missing { margin: 4px 0 0; padding: 6px 10px; border-left: 3px solid var(--sb-bad, #c53030); border-radius: 0 var(--sb-radius, 8px) var(--sb-radius, 8px) 0; background: color-mix(in srgb, var(--sb-bad, #c53030) 8%, transparent); font-size: 12px; }
    .sb-source__missing strong { color: var(--sb-bad, #c53030); }
    .sb-source__missing ul { margin: 2px 0 0; padding-left: 18px; }

    /* The source itself, as a sheet of paper with a folded corner: something real, apart from what's said about it.
       The edges are drawn from the text colour, so they stand out in light and dark themes alike. */
    .sb-source { --sb-source-fold: 20px; --sb-source-edge: color-mix(in srgb, var(--sb-text, #1f2933) 24%, transparent); }
    .sb-source__desk { flex: 1; min-height: 240px; display: flex; flex-direction: column; }
    .sb-source__desk:fullscreen { padding: 32px 40px; background: var(--sb-surface-2, #eef0f3); }
    .sb-source__desk:fullscreen .sb-source__sheet { width: 100%; max-width: 920px; margin: 0 auto; }
    .sb-source__sheet { --sb-source-sheet: var(--sb-source-paper, color-mix(in srgb, var(--sb-surface, #fff) 94%, #f3e2b8)); position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; margin: 14px 6px 6px 0; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.14)) drop-shadow(0 5px 12px rgba(0, 0, 0, 0.2)); }
    .sb-source__sheet::before, .sb-source__page { clip-path: polygon(0 0, calc(100% - var(--sb-source-fold)) 0, 100% var(--sb-source-fold), 100% 100%, 0 100%); }
    .sb-source__sheet::before { content: ''; position: absolute; inset: 5px -5px -5px 5px; border: 1px solid var(--sb-source-edge); border-radius: 2px; background: color-mix(in srgb, var(--sb-source-sheet) 75%, var(--sb-bg, #f4f5f7)); }
    .sb-source__sheet::after { content: ''; position: absolute; top: 0; right: 0; width: var(--sb-source-fold); height: var(--sb-source-fold); border-left: 1px solid var(--sb-source-edge); border-bottom: 1px solid var(--sb-source-edge); border-bottom-left-radius: 2px; background: linear-gradient(to top right, color-mix(in srgb, var(--sb-source-sheet) 84%, var(--sb-text, #1f2933)) 50%, transparent 50%); }
    .sb-source__page { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 18px 30px 0 26px; border: 1px solid var(--sb-source-edge); border-radius: 2px; background: linear-gradient(135deg, color-mix(in srgb, var(--sb-source-sheet) 97%, #fff), var(--sb-source-sheet) 45%, color-mix(in srgb, var(--sb-source-sheet) 93%, #000)); }
    /* The paper's top line stays put while the text under it scrolls, keeping its controls to hand. */
    .sb-source__running { flex: none; display: flex; align-items: center; gap: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--sb-border, #d5d9e0); }
    .sb-source__body { flex: 1; min-height: 0; overflow-y: auto; margin-right: -14px; padding: 14px 14px 22px 0; }
    .sb-source__path { flex: 1; min-width: 0; overflow-wrap: anywhere; color: var(--sb-muted, #616e7c); font: 11px/1.4 ui-monospace, Menlo, Consolas, monospace; }
    .sb-source__toggle { padding: 1px 8px; border: 1px solid var(--sb-source-edge); border-radius: 999px; background: none; color: var(--sb-muted, #616e7c); font: 11px/1.5 var(--sb-font, system-ui, sans-serif); cursor: pointer; }
    .sb-source__toggle:hover { color: var(--sb-text, #1f2933); border-color: var(--sb-muted, #616e7c); }
    .sb-source__toggle:focus-visible, .sb-source__gap:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-source__gap { display: block; width: 100%; margin: 2px 0; padding: 1px 0; border: 0; border-top: 1px dashed var(--sb-source-edge); border-bottom: 1px dashed var(--sb-source-edge); background: none; color: var(--sb-muted, #616e7c); font: italic 12px/1.6 var(--sb-font, system-ui, sans-serif); text-align: center; cursor: pointer; }
    .sb-source__gap:hover { color: var(--sb-text, #1f2933); background: color-mix(in srgb, var(--sb-text, #1f2933) 5%, transparent); }
    .sb-source__fold { display: none; }
    .sb-source__gap--open, .sb-source--expanded .sb-source__gap { display: none; }
    .sb-source__gap--open + .sb-source__fold, .sb-source--expanded .sb-source__fold { display: inline; }
    .sb-source__full { display: grid; place-items: center; width: 24px; height: 24px; margin: -4px -6px -4px 0; padding: 0; border: 0; border-radius: 4px; background: none; color: var(--sb-muted, #616e7c); cursor: pointer; }
    .sb-source__full:hover { background: color-mix(in srgb, var(--sb-text, #1f2933) 8%, transparent); color: var(--sb-text, #1f2933); }
    .sb-source__full:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); }
    .sb-source__text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font: 14.5px/1.7 var(--sb-source-font, Georgia, 'Iowan Old Style', 'Times New Roman', serif); }
    .sb-source__text--code { font: 12px/1.55 ui-monospace, Menlo, Consolas, monospace; }
    .sb-source__md-h1 { font-size: 1.45em; font-weight: 700; line-height: 1.5; }
    .sb-source__md-h2 { font-size: 1.2em; font-weight: 700; }
    .sb-source__md-h3 { font-weight: 700; }
    .sb-source__md-strong { font-weight: 700; }
    .sb-source__md-em { font-style: italic; }
    .sb-source__md-code { font: 0.85em ui-monospace, Menlo, Consolas, monospace; }
    .sb-source__md-quote { color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-source__md-mark { opacity: 0.4; }
    .sb-source__passage { padding: 0; border-bottom: 2px solid var(--sb-accent, #2563eb); border-radius: 2px; background: color-mix(in srgb, var(--sb-accent, #2563eb) 14%, transparent); color: inherit; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
    .sb-source__passage[data-depth="2"], .sb-source__passage[data-depth="3"] { background: color-mix(in srgb, var(--sb-accent, #2563eb) 26%, transparent); }
    .sb-source__passage--lit { background: color-mix(in srgb, var(--sb-accent, #2563eb) 36%, transparent); }
    .sb-source__passage--current { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    /* The label's text comes from data-label, so selecting the source's words never picks it up. */
    .sb-source__label { display: inline-block; margin-right: 3px; padding: 0 4px; border-radius: 4px; background: var(--sb-accent, #2563eb); color: var(--sb-accent-text, #fff); font: 600 10px/1.5 ui-monospace, Menlo, Consolas, monospace; vertical-align: 2px; white-space: nowrap; cursor: default; user-select: none; }
    .sb-source__label::before { content: attr(data-label); }
    .sb-source__body--fill { display: flex; flex-direction: column; }
    .sb-source__figure { position: relative; cursor: crosshair; touch-action: none; user-select: none; }
    .sb-source__image { display: block; width: 100%; height: auto; }
    .sb-source__region { position: absolute; padding: 0; border: 2px solid var(--sb-accent, #2563eb); border-radius: 2px; background: color-mix(in srgb, var(--sb-accent, #2563eb) 10%, transparent); }
    .sb-source__region .sb-source__label { position: absolute; bottom: 100%; left: -2px; border-radius: 4px 4px 0 0; vertical-align: 0; }
    .sb-source__region.sb-source__passage--lit { background: color-mix(in srgb, var(--sb-accent, #2563eb) 26%, transparent); }
    .sb-source__draft { position: absolute; border: 2px dashed var(--sb-accent, #2563eb); pointer-events: none; }
    .sb-source__pdf { flex: 1; width: 100%; min-height: 360px; border: 0; background: var(--sb-surface, #fff); }
    .sb-source__note { margin: 0; color: var(--sb-muted, #616e7c); font-style: italic; }
    .sb-source__note a { color: var(--sb-accent, #2563eb); font-style: normal; }
    .sb-source__cited { margin: 4px 0 0; padding: 0; list-style: none; font-size: 12px; }
    .sb-source__cited li { padding: 2px 4px; border-radius: 4px; cursor: pointer; }
    .sb-source__cited li:hover, .sb-source__cited li.sb-source__passage--lit { background: var(--sb-accent-soft, #eaf0ff); }
    .sb-source__cited li.sb-source__passage--current { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: -2px; }
    .sb-source__cited .sb-source__label { vertical-align: 1px; }
    .sb-source__pick { margin-top: 8px; font-size: 12px; }
    .sb-source__pick summary { color: var(--sb-muted, #616e7c); cursor: pointer; }
    .sb-source__pick form { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; }
    .sb-source__pick input { padding: 3px 6px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface, #fff); color: inherit; font: inherit; }
    .sb-source__pick input[name="quote"] { flex: 1; min-width: 160px; }
    .sb-source__pick input[name="page"] { width: 64px; }
    .sb-source__pick button { padding: 3px 10px; border: 1px solid var(--sb-border, #d5d9e0); border-radius: 4px; background: var(--sb-surface-2, #eef0f3); color: inherit; font: inherit; cursor: pointer; }
    .sb-source__label:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-source__label--lit { box-shadow: 0 0 0 2px var(--sb-accent-soft, #eaf0ff), 0 0 0 3px var(--sb-accent, #2563eb); }`;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function addStyle() {
    if (document.getElementById('sb-source-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-source-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // ---- Finding quotes ----

  // The text with every run of whitespace as one space, in lower case, and where each of its
  // characters came from, so a match can be marked in the original.
  function normalise(text) {
    let out = '';
    const from = [];
    let inSpace = true; // leading whitespace is dropped
    for (let i = 0; i < text.length; i++) {
      if (/\s/.test(text[i])) {
        if (!inSpace) { out += ' '; from.push(i); }
        inSpace = true;
      } else {
        const lower = text[i].toLowerCase();
        out += lower.length === 1 ? lower : text[i];
        from.push(i);
        inSpace = false;
      }
    }
    return { out, from };
  }

  // Every place the quote appears, as [start, end) in the original text. Whitespace and capitals don't matter.
  function find(text, quote) {
    const wanted = String(quote ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!wanted) return [];
    const ranges = [];
    for (let at = text.out.indexOf(wanted); at >= 0; at = text.out.indexOf(wanted, at + 1)) {
      ranges.push([text.from[at], text.from[at + wanted.length - 1] + 1]);
    }
    return ranges;
  }

  // The runs of lines to fold away: every line except those holding a passage, the nearest written
  // line before one, so an answer keeps its question, and each less indented line above it, so a
  // field in JSON or YAML keeps the structure it sits in. A single line is never folded.
  function folds(text, places) {
    const starts = [0];
    for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1);
    const endOf = (line) => (line + 1 < starts.length ? starts[line + 1] : text.length);
    const isBlank = (line) => !text.slice(starts[line], endOf(line)).trim();
    const lineAt = (offset) => starts.findLastIndex((start) => start <= offset);
    const indentOf = (line) => text.slice(starts[line], endOf(line)).match(/^[ \t]*/)[0].length;

    const kept = new Set();
    for (const { start, end } of places) {
      let first = lineAt(start) - 1;
      while (first > 0 && isBlank(first)) first--;
      for (let line = Math.max(first, 0); line <= lineAt(end - 1); line++) kept.add(line);
      let indent = indentOf(lineAt(start));
      for (let line = lineAt(start) - 1; line >= 0 && indent > 0; line--) {
        if (isBlank(line) || indentOf(line) >= indent) continue;
        kept.add(line);
        indent = indentOf(line);
      }
    }

    const runs = [];
    for (let line = 0; line < starts.length; line++) {
      if (kept.has(line)) continue;
      let last = line;
      while (last + 1 < starts.length && !kept.has(last + 1)) last++;
      if (last > line) runs.push({ start: starts[line], end: endOf(last), lines: last - line + 1 });
      line = last;
    }
    return runs;
  }

  // Cuts the text wherever a passage, fold or style starts or ends, so each piece is marked, folded
  // and styled all the same way, and overlapping passages share the pieces they overlap.
  function pieces(length, places, ranges) {
    const edges = [...places, ...ranges].flatMap((p) => [p.start, p.end]);
    const cuts = [...new Set([0, length, ...edges])].sort((a, b) => a - b);
    return cuts.slice(0, -1).map((start, i) => {
      const end = cuts[i + 1];
      const covering = places.filter((p) => p.start <= start && p.end >= end).sort((a, b) => (a.end - a.start) - (b.end - b.start));
      return { start, end, covering, starting: places.filter((p) => p.start === start) };
    });
  }

  // Markdown, lightly: headings, quotes, code and emphasis styled, with their marks dimmed but
  // kept, so what shows is still exactly the file and a selection still quotes it.
  function markdown(text) {
    const styles = [];
    const add = (start, end, style) => { if (end > start) styles.push({ start, end, style }); };
    let offset = 0;
    let fenced = false;
    for (const line of text.split('\n')) {
      const end = offset + line.length;
      const fence = /^\s*```/.test(line);
      if (fence) fenced = !fenced;
      if (fence || fenced) {
        add(offset, end, 'code');
      } else {
        const heading = line.match(/^(#{1,6}) /);
        const quote = line.match(/^> ?/);
        const bullet = line.match(/^\s*([-*+]|\d+[.)]) /);
        if (heading) { add(offset, end, `h${Math.min(heading[1].length, 3)}`); add(offset, offset + heading[1].length, 'mark'); }
        if (quote) { add(offset, end, 'quote'); add(offset, offset + quote[0].length, 'mark'); }
        if (bullet) add(offset, offset + bullet[0].length, 'mark');
        for (const m of line.matchAll(/\*\*(.+?)\*\*|\*([^*\s][^*]*)\*|`([^`]+)`/g)) {
          const at = offset + m.index;
          const width = m[1] ? 2 : 1;
          add(at, at + m[0].length, m[1] ? 'strong' : m[2] ? 'em' : 'code');
          add(at, at + width, 'mark');
          add(at + m[0].length - width, at + m[0].length, 'mark');
        }
      }
      offset = end + 1;
    }
    return styles;
  }

  const isMarkdown = (source) => source.format === 'markdown' || /\.(md|markdown)$/i.test(source.path ?? '');

  // Data and code read best in fixed-width type; everything else is set like a document.
  const CODE_FILE = /\.(json|jsonl|ndjson|csv|tsv|ya?ml|xml|html?|toml|ini|log|js|mjs|ts|py|rb|go|rs|java|c|h|cpp|cs|sql|sh)$/i;
  const isCode = (source) => /^(data|code)$/.test(source.format ?? '') || CODE_FILE.test(source.path ?? '');

  const FULL_SCREEN_ICON = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/></svg>';

  const IMAGE = /\.(png|jpe?g|gif|webp|svg)$/i;
  const MAX_QUOTE = 300;      // a selection longer than this is cut, at a word
  const MIN_REGION = 0.01;    // a drag smaller than this, as a share of the image, is a click

  // How a source is shown: as text when its content is given, otherwise by its file.
  function kindOf(source, content, url) {
    if (content != null) return 'text';
    if (!url) return 'none';
    const file = url.split(/[?#]/)[0];
    if (source.format === 'pdf' || /\.pdf$/i.test(file)) return 'pdf';
    if (source.format === 'image' || IMAGE.test(file)) return 'image';
    return 'other';
  }

  // A region is [x, y, width, height], as fractions of the image.
  const isRegion = (region) => Array.isArray(region) && region.length === 4 && region.every(Number.isFinite);
  const percent = (fraction) => `${+(fraction * 100).toFixed(3)}%`;
  const round = (n) => Math.round(n * 1000) / 1000;

  // A selection as a quote: whitespace evened out, and cut at a word when it runs long.
  function quoteOf(selection) {
    const text = selection.replace(/\s+/g, ' ').trim();
    if (text.length <= MAX_QUOTE) return text;
    const cut = text.slice(0, MAX_QUOTE);
    return cut.slice(0, Math.max(cut.lastIndexOf(' '), 1)).trim();
  }

  class SbSource extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['expanded'];

    constructor() {
      super();
      this._source = null;
      this._content = null;
      this._url = null;
      this._passages = [];
      this._current = null;
      this._highlight = [];
      this._pointed = null;
      this._found = [];
      this._missing = [];
      this._drag = null;      // { x, y, box }: a region being drawn on an image
      this._selected = '';    // the last selection reported, so it's reported once

      this.addEventListener('pointerover', (e) => this._pointAt(this._passageAt(e.target)));
      this.addEventListener('pointerleave', () => this._pointAt(null));
      this.addEventListener('focusin', (e) => this._pointAt(this._passageAt(e.target)));
      this.addEventListener('focusout', (e) => { if (!this.contains(e.relatedTarget)) this._pointAt(null); });
      this.addEventListener('pointerdown', (e) => this._startRegion(e));
      this.addEventListener('pointermove', (e) => this._drawRegion(e));
      this.addEventListener('pointerup', (e) => { this._endRegion(e); this._reportSelection(); });
      this.addEventListener('keyup', () => this._reportSelection());
      this.addEventListener('click', (e) => { this._goToCited(e); this._toggleFullScreen(e); this._unfold(e); });
      this.addEventListener('submit', (e) => this._pickFromPdf(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-source');
      this._render();
    }

    // ---- Public API ----

    // The catalogue entry: { id, title, author, authored, format, stance, role, … }.
    get source() { return this._source; }
    set source(source) {
      this._source = source ? { ...source } : null;
      this._render();
    }

    // The source's text, loaded by the page. Always shown as text, never as markup, and exactly as the file is.
    get content() { return this._content; }
    set content(content) {
      this._content = content == null ? null : String(content);
      this._render();
    }

    // Where an image, PDF or other file can be opened, when there is no text to give.
    get url() { return this._url; }
    set url(url) {
      this._url = url ? String(url) : null;
      this._render();
    }

    // [{ id, quote, label }], [{ id, region }] or [{ id, page, quote }]: the passages to mark,
    // each named by what cites it.
    get passages() { return this._passages; }
    set passages(passages) {
      this._passages = (passages || []).map((p) => ({ ...p, id: String(p.id) }));
      this._render();
    }

    // The id of the passage to go to and mark as current, or null.
    get current() { return this._current; }
    set current(id) {
      this._current = id == null ? null : String(id);
      this._showMarks();
      this._goToCurrent();
    }

    // Whether all the text shows, rather than the cited lines with the rest folded. Mirrors the attribute.
    get expanded() { return this.hasAttribute('expanded'); }
    set expanded(on) { this.toggleAttribute('expanded', Boolean(on)); }

    attributeChangedCallback() {
      this._showFolds();
    }

    // The passage ids to light up: ['RUL-014'].
    get highlight() { return this._highlight; }
    set highlight(ids) {
      this._highlight = (ids || []).map(String);
      this._showMarks();
    }

    // The passages shown in the source, and those it can't show: a quote not in the text, or an
    // image's passage without a region. A PDF's quotes can't be searched, so they're all listed.
    get found() { return this._found; }
    get missing() { return this._missing; }

    // ---- Rendering ----

    _render() {
      if (!this.isConnected) return;
      const source = this._source;
      this.dataset.ref = source?.id ?? '';
      this._found = [];
      this._missing = [];
      this._folds = 0;
      if (!source) {
        this.innerHTML = '<p class="sb-source__empty">Choose a source to see it here.</p>';
        return;
      }
      const kind = kindOf(source, this._content, this._url);
      const body = this[`_${kind}Html`](source);
      this.innerHTML = this._headHtml(source, kind) + this._sheetHtml(source, body, kind === 'pdf');
      this._showFolds();
      this._showMarks();
      this._goToCurrent();
    }

    _sheetHtml(source, body, fill) {
      return `
        <div class="sb-source__desk">
          <div class="sb-source__sheet">
            <div class="sb-source__page">
              <div class="sb-source__running">
                <span class="sb-source__path">${esc(source.path ?? '')}</span>
                ${this._folds ? `<button class="sb-source__toggle" type="button" aria-pressed="${this.expanded}">${this.expanded ? 'Show cited only' : 'Show all'}</button>` : ''}
                <button class="sb-source__full" type="button" aria-label="Full screen" title="Full screen">${FULL_SCREEN_ICON}</button>
              </div>
              <div class="sb-source__body${fill ? ' sb-source__body--fill' : ''}">${body}</div>
            </div>
          </div>
        </div>`;
    }

    _headHtml(source, kind) {
      const links = [
        source.supersedes && `Supersedes ${esc(source.supersedes)}`,
        source.derivedFrom?.length && `Derived from ${source.derivedFrom.map(esc).join(', ')}`
      ].filter(Boolean).join(' · ');
      const format = this._formatOf(source);
      return `
        <div class="sb-source__head">
          <h3 class="sb-source__title">
            <span class="sb-source__id">${esc(source.id)}</span>
            <span class="sb-source__name">${esc(source.title ?? source.path ?? '')}</span>
            ${format ? `<span class="sb-source__format">${esc(format)}</span>` : ''}
          </h3>
          ${source.summary ? `<p class="sb-source__summary">${esc(source.summary)}</p>` : ''}
          ${this._fieldsHtml(source)}
          ${links ? `<div class="sb-source__links">${links}</div>` : ''}
          ${kind === 'pdf' ? this._citedHtml() + this._pickHtml() : this._countHtml(kind)}
        </div>`;
    }

    // What kind of material it is, and the file's type: "transcript · txt".
    _formatOf(source) {
      const type = (source.path ?? '').match(/\.(\w+)$/)?.[1]?.toLowerCase();
      return [source.format, type !== source.format && type].filter(Boolean).join(' · ');
    }

    // Each detail labelled, so nothing needs guessing. Only what the catalogue gives is shown.
    _fieldsHtml(source) {
      const role = source.role && (source.respondsTo ? `${source.role}, to ${source.respondsTo}` : source.role);
      const fields = [
        ['Author', source.author],
        ['Written', source.authored],
        ['Added', source.captured],
        ['Status', source.status, 'status'],
        ['Stance', source.stance],
        ['Role', role],
        ['Sensitivity', source.sensitivity, 'sensitivity']
      ].filter(([, value]) => value);
      if (!fields.length) return '';
      const html = fields.map(([label, value, kind]) => {
        const kindClass = kind ? ` class="sb-source__${kind} sb-source__${kind}--${esc(String(value).replace(/\W+/g, '-'))}"` : '';
        return `<div><dt>${label}</dt><dd${kindClass}>${esc(value)}</dd></div>`;
      }).join('');
      return `<dl class="sb-source__fields">${html}</dl>`;
    }

    _countHtml(kind) {
      if (!this._passages.length || (kind !== 'text' && kind !== 'image')) return '';
      const total = this._passages.length;
      const count = `<div class="sb-source__count">${this._found.length} of ${total} cited ${total === 1 ? 'passage' : 'passages'} found here</div>`;
      if (!this._missing.length) return count;
      const why = kind === 'image' ? 'Not marked on this image</strong>, since these citations give no region' : 'Not found in this source</strong>, so these citations need fixing';
      const items = this._missing.map((p) => `<li><b>${esc(p.label ?? p.id)}</b>${p.quote ? `: “${esc(p.quote)}”` : ''}</li>`).join('');
      return `${count}<div class="sb-source__missing"><strong>${why}:<ul>${items}</ul></div>`;
    }

    // A PDF's passages, listed with their pages: a click opens the viewer there.
    _citedHtml() {
      this._found = [...this._passages];
      if (!this._passages.length) return '';
      const total = this._passages.length;
      const items = this._passages.map((p) => `
        <li tabindex="0" data-ref="${esc(p.id)}" data-passages="${esc(p.id)}" data-passage="${esc(p.id)}">
          <span class="sb-source__label" data-label="${esc(p.label ?? p.id)}"></span>${p.page ? `p. ${esc(p.page)} ` : ''}“${esc(p.quote ?? '')}”
        </li>`).join('');
      return `<div class="sb-source__count">${total} cited ${total === 1 ? 'passage' : 'passages'}, not checked: a PDF can't be searched here</div><ul class="sb-source__cited">${items}</ul>`;
    }

    // Text inside the browser's PDF viewer can't be selected from here, so a passage is named by hand.
    _pickHtml() {
      return `
        <details class="sb-source__pick">
          <summary>Name a passage in this PDF</summary>
          <form><input name="quote" placeholder="Quote, copied from the PDF" required>
            <input name="page" type="number" min="1" placeholder="Page"><button>Choose</button></form>
        </details>`;
    }

    // The text, with each passage marked and labelled where it starts. Every piece of the source
    // goes through esc, so its markup shows as text.
    _textHtml(source) {
      const text = this._content;
      const places = this._locate(text);
      const runs = places.length ? folds(text, places) : [];
      const styles = isMarkdown(source) ? markdown(text) : [];
      this._folds = runs.length;
      const html = pieces(text.length, places, [...runs, ...styles]).map(({ start, end, covering, starting }) => {
        const labels = starting.map(({ passage }) => this._labelHtml(passage)).join('');
        const classes = styles.filter((s) => s.start <= start && s.end >= end).map((s) => `sb-source__md-${s.style}`);
        const words = esc(text.slice(start, end));
        const piece = classes.length ? `<span class="${classes.join(' ')}">${words}</span>` : words;
        const opens = runs.find((run) => run.start === start);
        const closes = runs.some((run) => run.end === end);
        const before = opens ? `<button class="sb-source__gap" type="button">⋯ ${opens.lines} lines</button><span class="sb-source__fold">` : '';
        const after = closes ? '</span>' : '';
        if (!covering.length) return before + labels + piece + after;
        const ids = [...new Set(covering.map((p) => p.passage.id))];
        return `${labels}<mark class="sb-source__passage" data-ref="${esc(ids[0])}" data-passages="${esc(ids.join(' '))}" data-depth="${Math.min(covering.length, 3)}">${piece}</mark>`;
      }).join('');
      return `<pre class="sb-source__text${isCode(source) ? ' sb-source__text--code' : ''}">${html}</pre>`;
    }

    _labelHtml(passage) {
      const label = esc(passage.label ?? passage.id);
      return `<span class="sb-source__label" tabindex="0" role="note" aria-label="${label}" data-label="${label}" data-passage="${esc(passage.id)}"></span>`;
    }

    // Finds every passage's quote, keeping which were found and which weren't.
    _locate(text) {
      const normalised = normalise(text);
      const places = [];
      for (const passage of this._passages) {
        const ranges = find(normalised, passage.quote);
        (ranges.length ? this._found : this._missing).push(passage);
        for (const [start, end] of ranges) places.push({ start, end, passage });
      }
      return places;
    }

    // The image, whole, with each passage's region drawn as a box. Dragging draws a new one.
    _imageHtml(source) {
      const boxes = this._passages.map((passage) => {
        if (!isRegion(passage.region)) return this._missing.push(passage), '';
        this._found.push(passage);
        const [x, y, width, height] = passage.region;
        return `<div class="sb-source__passage sb-source__region" data-ref="${esc(passage.id)}" data-passages="${esc(passage.id)}"
          style="left: ${percent(x)}; top: ${percent(y)}; width: ${percent(width)}; height: ${percent(height)}">${this._labelHtml(passage)}</div>`;
      }).join('');
      return `<div class="sb-source__figure"><img class="sb-source__image" src="${esc(this._url)}" alt="${esc(source.title ?? '')}" draggable="false">${boxes}</div>`;
    }

    // The browser's own viewer, at the current passage's page.
    _pdfHtml(source) {
      return `<iframe class="sb-source__pdf" src="${esc(this._pdfAt(this._pageOf(this._current)))}" title="${esc(source.title ?? 'PDF')}"></iframe>`;
    }

    _otherHtml() {
      return `<p class="sb-source__note">This kind of file can't be shown here. <a href="${esc(this._url)}" target="_blank" rel="noopener">Open the file</a></p>`;
    }

    _noneHtml() {
      return '<p class="sb-source__note">The file isn\'t loaded.</p>';
    }

    _pageOf(id) {
      return this._passages.find((p) => p.id === id)?.page ?? null;
    }

    _pdfAt(page) {
      const file = this._url.split('#')[0];
      return page ? `${file}#page=${page}` : file;
    }

    // Lights the pointed, highlighted and current passages, each wherever it appears.
    _showMarks() {
      const lit = new Set([...this._highlight, this._pointed].filter(Boolean));
      for (const mark of this.querySelectorAll('[data-passages]')) {
        const ids = mark.dataset.passages.split(' ');
        mark.classList.toggle('sb-source__passage--lit', ids.some((id) => lit.has(id)));
        mark.classList.toggle('sb-source__passage--current', ids.includes(this._current));
      }
      for (const label of this.querySelectorAll('.sb-source__page .sb-source__label')) {
        label.classList.toggle('sb-source__label--lit', lit.has(label.dataset.passage));
      }
    }

    // Scrolls to the current passage, and opens a PDF at its page.
    // Scrolls the paper, never the page around it, so setting current doesn't move the sandbox.
    _goToCurrent() {
      const body = this.querySelector('.sb-source__body');
      const mark = this.querySelector('.sb-source__body .sb-source__passage--current');
      if (body && mark) {
        const view = body.getBoundingClientRect();
        const place = mark.getBoundingClientRect();
        if (place.top < view.top || place.bottom > view.bottom) body.scrollTop += place.top - view.top - body.clientHeight / 3;
      }
      const pdf = this.querySelector('.sb-source__pdf');
      const page = this._pageOf(this._current);
      if (pdf && page) pdf.src = this._pdfAt(page);
    }

    // ---- Interaction ----

    // The passage under a label, mark or region: the shortest one there, when passages overlap.
    _passageAt(target) {
      const part = target?.closest?.('[data-passage], [data-passages]');
      if (!part || !this.contains(part)) return null;
      return part.dataset.passage ?? part.dataset.ref;
    }

    _pointAt(id) {
      if (id === this._pointed) return;
      this._pointed = id;
      this._showMarks();
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { id } }));
    }

    _choose(passage) {
      this.dispatchEvent(new CustomEvent('sb-passage', { bubbles: true, detail: { source: this._source.id, ...passage } }));
    }

    // Selecting words in the text names them as a passage, once per selection.
    _reportSelection() {
      const text = this.querySelector('.sb-source__text');
      const selection = getSelection();
      const inText = text && selection.rangeCount && !selection.isCollapsed &&
        text.contains(selection.anchorNode) && text.contains(selection.focusNode);
      const quote = inText ? quoteOf(selection.toString()) : '';
      if (quote === this._selected) return;
      this._selected = quote;
      if (quote) this._choose({ quote });
    }

    // Dragging across an image names the region it covers.
    _startRegion(e) {
      const figure = e.target.closest?.('.sb-source__figure');
      if (!figure || e.button !== 0) return;
      const box = Object.assign(document.createElement('div'), { className: 'sb-source__draft' });
      this._drag = { figure, box, ...this._fractionAt(figure, e) };
      try { figure.setPointerCapture(e.pointerId); } catch { /* not a live pointer: the drag still works inside the image */ }
    }

    _drawRegion(e) {
      if (!this._drag) return;
      const [x, y, width, height] = this._dragRegion(e);
      Object.assign(this._drag.box.style, { left: percent(x), top: percent(y), width: percent(width), height: percent(height) });
      if (!this._drag.box.isConnected) this._drag.figure.append(this._drag.box);
    }

    _endRegion(e) {
      if (!this._drag) return;
      const region = this._dragRegion(e);
      this._drag.box.remove();
      this._drag = null;
      if (region[2] >= MIN_REGION && region[3] >= MIN_REGION) this._choose({ region: region.map(round) });
    }

    // The region from where the drag started to the pointer, kept inside the image.
    _dragRegion(e) {
      const { x, y } = this._fractionAt(this._drag.figure, e);
      return [Math.min(x, this._drag.x), Math.min(y, this._drag.y), Math.abs(x - this._drag.x), Math.abs(y - this._drag.y)];
    }

    _fractionAt(figure, e) {
      const rect = figure.getBoundingClientRect();
      const clamp = (n) => Math.min(1, Math.max(0, n));
      return { x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) };
    }

    // Folding only hides text that's already there, so nothing is redrawn and full screen stays.
    _showFolds() {
      const expanded = this.expanded;
      for (const gap of this.querySelectorAll('.sb-source__gap')) gap.classList.remove('sb-source__gap--open');
      this.classList.toggle('sb-source--expanded', expanded);
      const toggle = this.querySelector('.sb-source__toggle');
      if (!toggle) return;
      toggle.textContent = expanded ? 'Show cited only' : 'Show all';
      toggle.setAttribute('aria-pressed', String(expanded));
    }

    // A gap opens on its own; the toggle shows everything, or folds it all back.
    _unfold(e) {
      const gap = e.target.closest?.('.sb-source__gap');
      if (gap) return gap.classList.add('sb-source__gap--open');
      if (!e.target.closest?.('.sb-source__toggle')) return;
      this.expanded = !this.expanded;
      this.dispatchEvent(new CustomEvent('sb-toggle', { bubbles: true, detail: { expanded: this.expanded } }));
    }

    // The paper alone, filling the screen, or back in its place. Escape also brings it back.
    _toggleFullScreen(e) {
      if (!e.target.closest?.('.sb-source__full')) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else this.querySelector('.sb-source__desk').requestFullscreen?.();
    }

    // Clicking a PDF's cited passage opens the viewer at its page.
    _goToCited(e) {
      const item = e.target.closest?.('.sb-source__cited li');
      const page = item && this._pageOf(item.dataset.passage);
      const pdf = this.querySelector('.sb-source__pdf');
      if (page && pdf) pdf.src = this._pdfAt(page);
    }

    _pickFromPdf(e) {
      if (!e.target.closest('.sb-source__pick')) return;
      e.preventDefault();
      const form = new FormData(e.target);
      const quote = quoteOf(String(form.get('quote') ?? ''));
      const page = Number(form.get('page')) || null;
      if (quote) this._choose(page ? { page, quote } : { quote });
    }
  }

  customElements.define('sb-source', SbSource);
})();
