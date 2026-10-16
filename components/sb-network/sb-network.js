// Sandkit sb-network · MIT Licence · https://github.com/sebjwallace/sandkit
// Locations joined by routes, with things moving along them.
(function () {
  // One definition per tag name. The same script loaded twice is skipped quietly; a different
  // component already using the name is reported, because only one of them can run.
  const ORIGIN = 'sandkit/sb-network';
  const existing = customElements.get('sb-network');
  if (existing) {
    if (existing.origin !== ORIGIN) {
      console.error(`Two different components are named <sb-network>, so only one can run. Rename one by replacing every "sb-network" in its file.`);
    }
    return;
  }

  const CSS = `
    .sb-network { display: block; }
    .sb-network__svg { width: 100%; height: auto; display: block; font-family: inherit; }
    .sb-network__edge { stroke: var(--sb-border, #d5d9e0); stroke-width: 2; }
    .sb-network__node { cursor: pointer; }
    .sb-network__box { fill: var(--sb-surface, #fff); stroke: var(--sb-muted, #616e7c); stroke-width: 1.5; }
    .sb-network__node--selected .sb-network__box { stroke: var(--sb-accent, #2563eb); stroke-width: 3; }
    .sb-network__label { font-size: 12px; font-weight: 600; fill: var(--sb-text, #1f2933); }
    .sb-network__sublabel { font-size: 11px; fill: var(--sb-muted, #616e7c); }
    .sb-network__bar-bg { fill: var(--sb-surface-2, #eef0f3); }
    .sb-network__bar { fill: var(--sb-good, #3f9142); }
    .sb-network__node--low .sb-network__bar { fill: var(--sb-warn, #d69e2e); }
    .sb-network__node--out .sb-network__bar { fill: var(--sb-bad, #c53030); }
    .sb-network__node--out .sb-network__box { stroke: var(--sb-bad, #c53030); }
    .sb-network__token { fill: var(--sb-accent, #2563eb); }
    .sb-network__token-label { font-size: 9px; fill: var(--sb-accent-text, #fff); font-weight: 600; pointer-events: none; }`;

  const NODE_WIDTH = 140;
  const NODE_HEIGHT = 56;
  const BAR_WIDTH = NODE_WIDTH - 20;

  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clamp01 = (n) => Math.max(0, Math.min(1, n || 0));

  function addStyle() {
    if (document.getElementById('sb-network-style')) return;
    const style = Object.assign(document.createElement('style'), { id: 'sb-network-style', textContent: CSS });
    document.head.prepend(style); // first, so the sandbox's own stylesheet wins
  }

  class SbNetwork extends HTMLElement {
    static origin = ORIGIN;

    static observedAttributes = ['selected', 'width', 'height'];

    constructor() {
      super();
      this._data = { nodes: [], edges: [], tokens: [] };
      // pointerdown, not click: the SVG re-renders often, and a click can be lost between press and release.
      this.addEventListener('pointerdown', (e) => this._select(e));
    }

    connectedCallback() {
      addStyle();
      this.classList.add('sb-network');
      this.render();
    }

    attributeChangedCallback() { this.render(); }

    get data() { return this._data; }
    set data(value) {
      this._data = { nodes: [], edges: [], tokens: [], ...value };
      this.render();
    }

    get selected() { return this.getAttribute('selected'); }
    set selected(id) {
      if (id == null) this.removeAttribute('selected');
      else this.setAttribute('selected', id);
    }

    _select(e) {
      const node = e.target.closest('[data-node-id]');
      if (!node) return;
      this.selected = node.dataset.nodeId;
      this.dispatchEvent(new CustomEvent('sb-select', { bubbles: true, detail: { id: this.selected } }));
    }

    render() {
      if (!this.isConnected) return;
      const { nodes, edges, tokens } = this._data;
      const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
      const width = this.getAttribute('width') || 700;
      const height = this.getAttribute('height') || 400;

      this.innerHTML = `
        <svg class="sb-network__svg" viewBox="0 0 ${width} ${height}">
          ${edges.map((e) => this._edge(byId[e.from], byId[e.to])).join('')}
          ${nodes.map((n) => this._node(n)).join('')}
          ${tokens.map((t) => this._token(t, byId[t.from], byId[t.to])).join('')}
        </svg>`;
    }

    _edge(from, to) {
      if (!from || !to) return '';
      return `<line class="sb-network__edge" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"/>`;
    }

    _node(n) {
      const classes = ['sb-network__node', `sb-network__node--${n.type || 'default'}`];
      if (n.status) classes.push(`sb-network__node--${n.status}`);
      if (n.id === this.selected) classes.push('sb-network__node--selected');
      const bar = n.max ? `
        <rect class="sb-network__bar-bg" x="10" y="44" width="${BAR_WIDTH}" height="5" rx="2"/>
        <rect class="sb-network__bar" x="10" y="44" width="${clamp01(n.value / n.max) * BAR_WIDTH}" height="5" rx="2"/>` : '';

      return `
        <g class="${esc(classes.join(' '))}" data-node-id="${esc(n.id)}" transform="translate(${n.x - NODE_WIDTH / 2}, ${n.y - NODE_HEIGHT / 2})">
          <title>${esc(n.label)}</title>
          <rect class="sb-network__box" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="8"/>
          <text class="sb-network__label" x="${NODE_WIDTH / 2}" y="19" text-anchor="middle">${esc(n.label)}</text>
          <text class="sb-network__sublabel" x="${NODE_WIDTH / 2}" y="35" text-anchor="middle">${esc(n.sublabel)}</text>
          ${bar}
        </g>`;
    }

    // A token sits part-way along its route: progress 0 is at `from`, 1 is at `to`.
    _token(t, from, to) {
      if (!from || !to) return '';
      const p = clamp01(t.progress);
      const x = from.x + (to.x - from.x) * p;
      const y = from.y + (to.y - from.y) * p;
      return `
        <g><title>${esc(t.title || t.label)}</title>
          <circle class="sb-network__token" cx="${x}" cy="${y}" r="11"/>
          <text class="sb-network__token-label" x="${x}" y="${y + 3}" text-anchor="middle">${esc(t.label)}</text>
        </g>`;
    }
  }

  customElements.define('sb-network', SbNetwork);
})();
