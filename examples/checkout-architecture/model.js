// The checkout's architecture: every part and how they talk, written once, with codes to cite
// them by. No UI here. The page reads the architecture and asks it questions.
//
// Codes: PER person, SYS software system, CON container (an app or a database), CMP component
// (a part inside an app), REL relationship.

const CHECKOUT = {
  elements: [
    { id: 'PER-1', name: 'Shopper', kind: 'person', description: 'Buys things from the shop online' },
    { id: 'SYS-1', name: 'Corner Shop', kind: 'system', description: 'Sells things online and takes payment', children: [
      { id: 'CON-1', name: 'Storefront', kind: 'container', technology: 'Web app', description: 'The pages the shopper browses, with the basket' },
      { id: 'CON-2', name: 'Shop API', kind: 'container', technology: 'Node.js', description: 'Takes orders and payments', children: [
        { id: 'CMP-1', name: 'Orders', kind: 'component', description: 'Turns a basket into an order' },
        { id: 'CMP-2', name: 'Stock', kind: 'component', description: 'Holds back what was ordered' },
        { id: 'CMP-3', name: 'Payments', kind: 'component', description: 'Charges the shopper for an order' }
      ] },
      { id: 'CON-3', name: 'Shop database', kind: 'database', technology: 'PostgreSQL', description: 'Orders and stock' }
    ] },
    { id: 'SYS-2', name: 'Payment provider', kind: 'system', external: true, description: 'Charges cards on the shop’s behalf' }
  ],
  // Each relationship is written where it really happens, between the parts that call each other.
  relationships: [
    { id: 'REL-1', from: 'PER-1', to: 'CON-1', label: 'Shops and pays using', technology: 'HTTPS' },
    { id: 'REL-2', from: 'CON-1', to: 'CMP-1', label: 'Places orders with', technology: 'JSON over HTTPS' },
    { id: 'REL-3', from: 'CMP-1', to: 'CMP-2', label: 'Holds back stock with' },
    { id: 'REL-4', from: 'CMP-1', to: 'CMP-3', label: 'Asks for payment from' },
    { id: 'REL-5', from: 'CMP-3', to: 'SYS-2', label: 'Charges the card through', technology: 'HTTPS' },
    { id: 'REL-6', from: 'CMP-1', to: 'CON-3', label: 'Saves orders in', technology: 'SQL' },
    { id: 'REL-7', from: 'CMP-2', to: 'CON-3', label: 'Keeps stock levels in', technology: 'SQL' }
  ]
};

const KIND_NAMES = { person: 'Person', system: 'Software system', container: 'Container', component: 'Component', database: 'Database' };

// Answers questions about an architecture: what a code is, what it's inside, and what it talks to.
function createArchitecture(spec) {
  const entries = new Map(); // code → { element, path: [codes of what it's inside, outermost first] }
  (function index(elements, path) {
    for (const element of elements) {
      entries.set(element.id, { element, path });
      if (element.children) index(element.children, [...path, element.id]);
    }
  })(spec.elements, []);

  const relationships = new Map(spec.relationships.map((r) => [r.id, r]));

  const element = (code) => entries.get(code)?.element ?? null;
  const path = (code) => entries.get(code)?.path ?? [];
  const contains = (outer, code) => code === outer || path(code).includes(outer);

  // The relationships crossing a part's edge, its own and those of everything inside it, as a
  // diagram rolls them up. `via` names the part inside that really makes the call.
  function connections(code) {
    const crossing = spec.relationships.filter((r) => contains(code, r.from) !== contains(code, r.to));
    const via = (end) => (end === code ? null : end);
    return {
      outgoing: crossing.filter((r) => contains(code, r.from)).map((r) => ({ relationship: r, other: r.to, via: via(r.from) })),
      incoming: crossing.filter((r) => contains(code, r.to)).map((r) => ({ relationship: r, other: r.from, via: via(r.to) }))
    };
  }

  // What a code refers to, in the shape an sb-id pill asks for.
  function define(code) {
    const found = element(code);
    if (found) return { kind: KIND_NAMES[found.kind ?? 'system'], title: found.name, description: found.description };
    const r = relationships.get(code);
    if (r) return { kind: 'Relationship', title: `${element(r.from).name} → ${element(r.to).name}`, description: r.label };
    return null;
  }

  return { spec, element, path, connections, define, relationship: (code) => relationships.get(code) ?? null };
}

const checkout = createArchitecture(CHECKOUT);

// Lets Node load the model too, for model tests once the sandbox needs them.
if (typeof module !== 'undefined') module.exports = { CHECKOUT, createArchitecture, checkout };
