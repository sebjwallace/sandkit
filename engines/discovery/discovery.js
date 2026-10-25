// Sandkit discovery 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// The engine of domain discovery: the method's rules, written once. Given the sandbox's records,
// it works out what follows from them, the same way every time, so a record holds only what
// someone wrote and never a conclusion. It draws nothing and knows no component.
//
// So far it weighs claims: which passages count, and a claim's standing, score and basis, as of
// any iteration, from each source's authored grade.
//
//   const discovery = createDiscovery({ sources, claims });
//   discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });
//   // → { standing: 'contested', score: -12, basis: 'reported', passages: [...] }
//
// See manifest.md for the full contract.
(function () {
  // A source's grade is authored, with its reasons: a value from 1 (weak) to 5 (strong). One not
  // graded yet weighs as ordinary, and says so.
  const ORDINARY = 3;

  // Only a source that speaks to how things are can back a claim about the world. One that says what
  // should be, such as a plan or a manual, shows but isn't counted.
  const countsFor = (source) => (source.speaksTo ?? 'how things are') === 'how things are';

  // A stance as records write it: yes, or no ('−', or '-' typed plainly).
  const stanceOf = (mark) => (mark === '+' ? '+' : '−');

  function createDiscovery({ sources = [], claims = [] } = {}) {
    const sourceOf = new Map(sources.map((source) => [source.id, source]));
    const claimOf = new Map(claims.map((claim) => [claim.id, claim]));

    const source = (id) => {
      if (!sourceOf.has(id)) throw new Error(`No source ${id}.`);
      return sourceOf.get(id);
    };

    // A source's strength: its grade's value, 1 to 5.
    const strength = (id) => source(id).grade?.value ?? ORDINARY;

    // A source that copies another is counted as the one it copies, all the way back.
    function originOf(id) {
      let at = source(id);
      while (at.copies) at = source(at.copies);
      return at.id;
    }

    // A claim's passages from the sources that had arrived by an iteration, each with its stance.
    // A source with no iteration has always been there.
    function passagesOf(claim, asOf) {
      return Object.entries(claim.assertions ?? {})
        .filter(([id]) => (source(id).iteration ?? 0) <= asOf)
        .map(([id, [mark, quote]]) => ({ source: id, stance: stanceOf(mark), quote }));
    }

    // Weighs a claim, by its id or as a record, as of an iteration (by default, everything). Whether
    // anything rests on it tells an assumption from a conjecture when nothing backs it.
    function weigh(claimOrId, { asOf = Infinity, reliedOn = false } = {}) {
      const claim = typeof claimOrId === 'string' ? claimOf.get(claimOrId) : claimOrId;
      if (!claim) throw new Error(`No claim ${claimOrId}.`);
      const passages = passagesOf(claim, asOf);
      const says = new Map(passages.map((p) => [p.source, p.stance]));

      // A repeat says what the source it copies says, in the same claim; it adds nothing.
      const repeats = (p) => source(p.source).copies && says.get(originOf(p.source)) === p.stance;
      const weighed = passages.map((p) => {
        const inScope = countsFor(source(p.source)), repeated = repeats(p);
        return { ...p, strength: strength(p.source), counted: inScope && !repeated,
          ...(repeated && { repeats: originOf(p.source) }),
          ...(!inScope && { outOfScope: source(p.source).speaksTo }),
          ...(!source(p.source).grade && { ungraded: true }) };
      });

      const independent = (stance) => new Set(weighed
        .filter((p) => p.stance === stance && countsFor(source(p.source)))
        .map((p) => originOf(p.source))).size;
      const yes = independent('+'), no = independent('−');
      const standing = yes && no ? 'contested' : no ? 'refuted' : yes >= 2 ? 'corroborated' : yes ? 'single source' : 'unbacked';

      const score = weighed.filter((p) => p.counted).reduce((total, p) => total + (p.stance === '+' ? p.strength : -p.strength), 0);

      // What holds it up, from the yeses that speak to the world: observed when data or an image
      // backs it, reported when someone says so first-hand, inferred when only an analysis does.
      const backers = weighed.filter((p) => p.stance === '+' && countsFor(source(p.source))).map((p) => source(p.source));
      const basis = backers.some((s) => ['data', 'image'].includes(s.format)) ? 'observed'
        : backers.some((s) => !s.derivedFrom) ? 'reported'
        : backers.length ? 'inferred'
        : reliedOn ? 'assumption' : 'conjecture';

      // Repeats sit under the source they repeat, so the passages read as the evidence does.
      const order = weighed.filter((p) => !p.repeats)
        .flatMap((p) => [p, ...weighed.filter((other) => other.repeats === p.source)]);

      return { standing, score, basis, passages: order };
    }

    return { weigh, strength, originOf };
  }

  if (typeof module !== 'undefined') module.exports = { createDiscovery };
  else window.createDiscovery = createDiscovery;
})();
