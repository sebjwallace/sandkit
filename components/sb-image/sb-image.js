// Sandkit sb-image 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// An image to zoom and pan, starting on just the part that matters, with boxes and pins marking
// what the prose is about. Highlighting a mark glides to it and dims the rest, so words can steer
// the eye around a large picture.
//
//   image.view = { x: 0.2, y: 0.1, w: 0.5, h: 0.4 };   // fractions of the image
//   image.marks = [{ id: 'pump', x: 0.31, y: 0.22, w: 0.08, h: 0.06, label: 'Pump' }];
//   image.highlight = 'pump';
//
// See manifest.md for the full contract.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-image';
  const existing = customElements.get('sb-image');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-image>, so only one can run. Rename one by replacing every "sb-image" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-image { display: block; }
    .sb-image__frame { position: relative; overflow: hidden; width: 100%; aspect-ratio: 3 / 2; height: var(--sb-image-height, auto); max-height: var(--sb-image-max-height, 70vh); border-radius: var(--sb-radius, 8px); background: var(--sb-surface-2, #eef0f3); cursor: grab; touch-action: none; user-select: none; outline: none; }
    .sb-image__frame:focus-visible { box-shadow: inset 0 0 0 2px var(--sb-accent, #2563eb); }
    .sb-image__frame--dragging { cursor: grabbing; }
    .sb-image__stage { position: absolute; left: 50%; top: 50%; }
    .sb-image__stage--glide { transition: width 0.5s ease, transform 0.5s ease; }
    @media (prefers-reduced-motion: reduce) { .sb-image__stage--glide { transition: none; } }
    .sb-image__img { display: block; width: 100%; height: auto; pointer-events: none; }
    .sb-image__marks { position: absolute; inset: 0; }
    .sb-image__mark { --sb-image-tone: var(--sb-accent, #2563eb); position: absolute; box-sizing: border-box; padding: 0; font: 600 12px/1.5 var(--sb-font, system-ui); background: none; border: 0; cursor: pointer; }
    .sb-image__mark--good { --sb-image-tone: var(--sb-good, #3f9142); }
    .sb-image__mark--warn { --sb-image-tone: var(--sb-warn, #b7791f); }
    .sb-image__mark--bad { --sb-image-tone: var(--sb-bad, #c53030); }
    .sb-image__mark:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 3px; }
    .sb-image__mark--box { border: 2px solid var(--sb-image-tone); border-radius: 4px; box-shadow: 0 0 0 1px rgb(255 255 255 / 0.7); }
    .sb-image__mark--pin { width: 16px; height: 16px; margin: -8px 0 0 -8px; border: 2px solid #fff; border-radius: 50%; background: var(--sb-image-tone); box-shadow: 0 1px 3px rgb(0 0 0 / 0.4); }
    .sb-image__label { position: absolute; white-space: nowrap; padding: 0 7px; border-radius: 999px; color: #fff; background: var(--sb-image-tone); }
    .sb-image__mark--box .sb-image__label { left: 3px; top: 3px; }
    .sb-image__mark--pin .sb-image__label { left: calc(100% + 6px); top: 50%; transform: translateY(-50%); }
    .sb-image__mark--highlighted { z-index: 1; }
    .sb-image__mark--box.sb-image__mark--highlighted { box-shadow: 0 0 0 200vmax rgb(0 0 0 / 0.45); }
    .sb-image__mark--pin.sb-image__mark--highlighted::before { content: ''; position: absolute; left: 50%; top: 50%; width: 80px; height: 80px; margin: -40px 0 0 -40px; border-radius: 50%; box-shadow: 0 0 0 200vmax rgb(0 0 0 / 0.45); pointer-events: none; }
    .sb-image__tools { position: absolute; top: 8px; right: 8px; z-index: 2; display: flex; gap: 4px; }
    .sb-image__tools[hidden] { display: none; }
    .sb-image__tool { width: 28px; height: 28px; padding: 0; font: 600 16px/1 var(--sb-font, system-ui); color: var(--sb-text, #1f2933); background: var(--sb-surface, #fff); border: 1px solid var(--sb-border, #d9dde3); border-radius: var(--sb-radius, 8px); cursor: pointer; }
    .sb-image__tool:focus-visible { outline: 2px solid var(--sb-accent, #2563eb); outline-offset: 1px; }
    .sb-image__message { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; text-align: center; font: 13px var(--sb-font, system-ui); color: var(--sb-muted, #616e7c); }
    .sb-image__message:empty { display: none; }
    .sb-image__caption { margin-top: 6px; font: 13px var(--sb-font, system-ui); color: var(--sb-muted, #616e7c); }
    .sb-image__caption:empty { display: none; }`;

  const BOX_MARGIN = 0.25;     // room around a highlighted box, as a share of its size on each side
  const PIN_ZOOM = 2;          // a highlighted pin is shown at twice the starting view's zoom
  const ZOOM_STEP = 1.5;       // each zoom button press or key
  const PAN_STEP = 0.15;       // each arrow key, as a share of the frame
  const MAX_PIXEL_ZOOM = 8;    // viewers can zoom in until one image pixel is this many screen pixels
  const DRAG_THRESHOLD = 4;    // pixels a press moves before it pans rather than clicks

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const round = (n) => Math.round(n * 1000) / 1000;
  const isPin = (mark) => mark.w == null || mark.h == null;

  function addStyle() {
    if (document.getElementById('sb-image-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-image-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  // A mark as given, keeping only what it means: a box has a size, a pin doesn't.
  function readMark(mark) {
    const read = { id: String(mark.id), x: Number(mark.x), y: Number(mark.y), label: mark.label ?? '', tone: mark.tone ?? '' };
    if (mark.w != null && mark.h != null) Object.assign(read, { w: Number(mark.w), h: Number(mark.h) });
    return read;
  }

  function markHtml(mark, highlighted) {
    const place = isPin(mark)
      ? `left: ${mark.x * 100}%; top: ${mark.y * 100}%;`
      : `left: ${mark.x * 100}%; top: ${mark.y * 100}%; width: ${mark.w * 100}%; height: ${mark.h * 100}%;`;
    const classes = ['sb-image__mark', `sb-image__mark--${isPin(mark) ? 'pin' : 'box'}`];
    if (mark.tone) classes.push(`sb-image__mark--${mark.tone}`);
    if (highlighted) classes.push('sb-image__mark--highlighted');
    const label = mark.label ? `<span class="sb-image__label">${esc(mark.label)}</span>` : '';
    return `<button type="button" class="${esc(classes.join(' '))}" style="${place}" data-id="${esc(mark.id)}" aria-label="${esc(mark.label || mark.id)}">${label}</button>`;
  }

  // The camera is where the frame looks: the image point at its centre (cx, cy, as fractions of
  // the image) and the zoom z, the image's width as a multiple of the frame's. Both are relative,
  // so a frame that changes size keeps looking at the same place.
  class SbImage extends HTMLElement {
    static origin = ORIGIN;
    static observedAttributes = ['src', 'alt', 'caption', 'empty-text'];

    constructor() {
      super();
      this._view = { x: 0, y: 0, w: 1, h: 1 };
      this._marks = [];
      this._highlight = null;
      this._natural = null; // the image's size in pixels, once it has loaded
      this._camera = null;
      this._dragged = false;
      this.addEventListener('click', (e) => this._click(e));
      this.addEventListener('keydown', (e) => this._key(e));
      this.addEventListener('pointerdown', (e) => this._press(e));
      this.addEventListener('wheel', (e) => this._wheel(e), { passive: false });
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-image');
      this.render();
    }

    attributeChangedCallback(name) {
      if (name === 'src') this.render();
      else this._showText();
    }

    // ---- Public API ----

    // The starting view: { x, y, w, h } as fractions of the image. It sets the frame's shape.
    get view() { return { ...this._view }; }
    set view(view) {
      const { x = 0, y = 0, w = 1, h = 1 } = view || {};
      this._view = { x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
      if (!this._natural) return;
      this._shape();
      this._place(this._home(), true);
    }

    // Boxes ({ id, x, y, w, h }) and pins ({ id, x, y }), with an optional label and tone.
    get marks() { return this._marks.map((mark) => ({ ...mark })); }
    set marks(marks) {
      this._marks = (marks || []).map(readMark);
      this._showMarks();
    }

    // A mark's id, or null. The view glides to it and dims the rest; null glides back to the view.
    get highlight() { return this._highlight; }
    set highlight(id) {
      this._highlight = id == null ? null : String(id);
      this._showMarks();
      if (this._natural) this._place(this._home(), true);
    }

    // The part of the image in the frame now, as { x, y, w, h } fractions, or null before it loads.
    get shown() {
      if (!this._camera) return null;
      const { cx, cy, z } = this._camera;
      const w = 1 / z, h = this._frameRatio() / (this._imageRatio() * z);
      return { x: round(cx - w / 2), y: round(cy - h / 2), w: round(w), h: round(h) };
    }

    // Glides back to the highlighted mark, or else the starting view.
    reset() {
      if (this._natural) this._place(this._home(), true);
    }

    // ---- Rendering ----

    render() {
      if (!this.isConnected) return;
      this._natural = null;
      this._camera = null;
      this.innerHTML = `
        <div class="sb-image__frame" tabindex="0" role="group">
          <div class="sb-image__stage" hidden>
            <img class="sb-image__img" draggable="false">
            <div class="sb-image__marks"></div>
          </div>
          <div class="sb-image__tools" hidden>
            <button type="button" class="sb-image__tool" data-tool="in" aria-label="Zoom in">+</button>
            <button type="button" class="sb-image__tool" data-tool="out" aria-label="Zoom out">−</button>
            <button type="button" class="sb-image__tool" data-tool="reset" aria-label="Back to the start">↺</button>
          </div>
          <div class="sb-image__message"></div>
        </div>
        <div class="sb-image__caption"></div>`;
      const img = this.querySelector('.sb-image__img');
      img.addEventListener('load', () => this._loaded(img));
      img.addEventListener('error', () => this._say('The image could not be loaded.'));
      const src = this.getAttribute('src');
      if (src) img.src = src;
      else this._say(this.getAttribute('empty-text') || 'No image yet.');
      this._showText();
      this._showMarks();
    }

    _loaded(img) {
      this._natural = { width: img.naturalWidth, height: img.naturalHeight };
      this.querySelector('.sb-image__stage').hidden = false;
      this.querySelector('.sb-image__tools').hidden = false;
      this._say('');
      this._shape();
      this._place(this._home(), false);
    }

    _say(message) {
      this.querySelector('.sb-image__message').textContent = message;
    }

    _showText() {
      const frame = this.querySelector('.sb-image__frame');
      if (!frame) return;
      const alt = this.getAttribute('alt') || '';
      this.querySelector('.sb-image__img').alt = alt;
      frame.setAttribute('aria-label', alt || 'Image');
      this.querySelector('.sb-image__caption').textContent = this.getAttribute('caption') || '';
    }

    _showMarks() {
      const layer = this.querySelector('.sb-image__marks');
      if (layer) layer.innerHTML = this._marks.map((mark) => markHtml(mark, mark.id === this._highlight)).join('');
    }

    // The frame takes the starting view's shape, so a crop sits in the page as if it were the image.
    _shape() {
      const { width, height } = this._natural;
      this.querySelector('.sb-image__frame').style.aspectRatio = `${this._view.w * width} / ${this._view.h * height}`;
    }

    // ---- The camera ----

    _frame() { return this.querySelector('.sb-image__frame'); }
    _imageRatio() { return this._natural.height / this._natural.width; }

    // The frame's height over its width; before layout, the shape it is about to take.
    _frameRatio() {
      const frame = this._frame();
      if (frame.clientWidth && frame.clientHeight) return frame.clientHeight / frame.clientWidth;
      return (this._view.h * this._natural.height) / (this._view.w * this._natural.width);
    }

    // The camera that shows all of a region, centred.
    _fit({ x, y, w, h }) {
      const z = Math.min(1 / w, this._frameRatio() / (this._imageRatio() * h));
      return { cx: x + w / 2, cy: y + h / 2, z };
    }

    // Where the sandbox is pointing: the highlighted mark, or else the starting view.
    _home() {
      const mark = this._marks.find((m) => m.id === this._highlight);
      if (!mark) return this._fit(this._view);
      if (isPin(mark)) return { cx: mark.x, cy: mark.y, z: PIN_ZOOM * this._fit(this._view).z };
      const mx = mark.w * BOX_MARGIN, my = mark.h * BOX_MARGIN;
      return this._fit({ x: mark.x - mx, y: mark.y - my, w: mark.w + 2 * mx, h: mark.h + 2 * my });
    }

    // Moves the camera, gliding when the sandbox or a button moves it, following at once when the
    // viewer drags or scrolls. Along each side, an image larger than the frame always covers it,
    // and one smaller sits in the middle.
    _place({ cx, cy, z }, glide) {
      const halfWide = 1 / (2 * z), halfHigh = this._frameRatio() / (2 * this._imageRatio() * z);
      const keep = (centre, half) => (half >= 0.5 ? 0.5 : clamp(centre, half, 1 - half));
      this._camera = { cx: keep(cx, halfWide), cy: keep(cy, halfHigh), z };
      const stage = this.querySelector('.sb-image__stage');
      stage.classList.toggle('sb-image__stage--glide', glide);
      stage.style.width = `${z * 100}%`;
      stage.style.transform = `translate(${-this._camera.cx * 100}%, ${-this._camera.cy * 100}%)`;
    }

    // Zooms by a factor, keeping the image point under (x, y) in the frame still; the centre by default.
    // Viewers can zoom out until the whole image fits, and in until its pixels are large.
    _zoomBy(factor, glide, at = null) {
      const { cx, cy, z } = this._camera;
      const width = this._frame().clientWidth || 1;
      const least = Math.min(1, this._frameRatio() / this._imageRatio());
      const most = Math.max(MAX_PIXEL_ZOOM * this._natural.width / width, z);
      const zoom = clamp(z * factor, least, most);
      const dx = at ? at.x - width / 2 : 0;
      const dy = at ? at.y - (width * this._frameRatio()) / 2 : 0;
      const moved = (offset, scale) => offset / (z * scale) - offset / (zoom * scale);
      this._place({ cx: cx + moved(dx, width), cy: cy + moved(dy, width * this._imageRatio()), z: zoom }, glide);
    }

    // Moves the view by a distance in screen pixels, as if dragging the image the other way.
    _panBy(dx, dy, glide) {
      const { cx, cy, z } = this._camera;
      const width = this._frame().clientWidth || 1;
      this._place({ cx: cx - dx / (z * width), cy: cy - dy / (z * width * this._imageRatio()), z }, glide);
    }

    // ---- Interaction ----

    _tool(name) {
      if (name === 'in') this._zoomBy(ZOOM_STEP, true);
      if (name === 'out') this._zoomBy(1 / ZOOM_STEP, true);
      if (name === 'reset') this.reset();
    }

    // Dragging pans; a press that barely moves is left to become a click.
    _press(e) {
      if (e.button !== 0 || !this._camera || e.target.closest('.sb-image__tools')) return;
      this._dragged = false;
      const start = { x: e.clientX, y: e.clientY };
      let last = start;
      const move = (m) => {
        if (!this._dragged && Math.hypot(m.clientX - start.x, m.clientY - start.y) < DRAG_THRESHOLD) return;
        this._dragged = true;
        this._frame().classList.add('sb-image__frame--dragging');
        this._panBy(m.clientX - last.x, m.clientY - last.y, false);
        last = { x: m.clientX, y: m.clientY };
      };
      const stop = () => {
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', stop);
        this._frame()?.classList.remove('sb-image__frame--dragging');
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', stop);
    }

    // Zooming needs Ctrl or ⌘ (a trackpad pinch sends it), so scrolling the page past the image
    // still scrolls the page.
    _wheel(e) {
      if (!this._camera || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const box = this._frame().getBoundingClientRect();
      this._zoomBy(Math.exp(-e.deltaY / 200), false, { x: e.clientX - box.left, y: e.clientY - box.top });
    }

    _click(e) {
      const tool = e.target.closest('.sb-image__tool');
      if (tool) return this._tool(tool.dataset.tool);
      if (this._dragged) {
        this._dragged = false;
        return;
      }
      const mark = e.target.closest('.sb-image__mark');
      if (mark) {
        const chosen = this._marks.find((m) => m.id === mark.dataset.id);
        this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { id: chosen.id, mark: { ...chosen } } }));
        return;
      }
      if (this._camera && e.target.closest('.sb-image__frame')) this._point(e);
    }

    // Reports where on the image a viewer clicked, so marks and views can be placed by clicking.
    _point(e) {
      const box = this.querySelector('.sb-image__stage').getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width, y = (e.clientY - box.top) / box.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      this.dispatchEvent(new CustomEvent('sb-point', { bubbles: true, detail: { x: round(x), y: round(y) } }));
    }

    _key(e) {
      if (!this._camera || !e.target.classList.contains('sb-image__frame')) return;
      const width = this._frame().clientWidth, height = this._frame().clientHeight;
      const actions = {
        '+': () => this._zoomBy(ZOOM_STEP, true),
        '=': () => this._zoomBy(ZOOM_STEP, true),
        '-': () => this._zoomBy(1 / ZOOM_STEP, true),
        '0': () => this.reset(),
        ArrowLeft: () => this._panBy(width * PAN_STEP, 0, true),
        ArrowRight: () => this._panBy(-width * PAN_STEP, 0, true),
        ArrowUp: () => this._panBy(0, height * PAN_STEP, true),
        ArrowDown: () => this._panBy(0, -height * PAN_STEP, true)
      };
      if (!actions[e.key]) return;
      e.preventDefault();
      actions[e.key]();
    }
  }

  customElements.define('sb-image', SbImage);
})();
