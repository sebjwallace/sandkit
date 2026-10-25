// Sandkit discovery 0.1.2 · MIT Licence · https://github.com/sebjwallace/sandkit
// The engine of domain discovery: the method's rules, written once. Given the sandbox's records,
// it works out what follows from them, the same way every time, so a record holds only what
// someone wrote and never a conclusion. It draws nothing and knows no component.
//
// So far it weighs claims (which passages count, and a claim's standing, score and basis, from each
// source's authored grade), works out every status that follows from the records, as of any
// iteration, and what rests on what: the links between records, and what each iteration shows.
//
//   const discovery = createDiscovery({ sources, claims, questions, decisions, … });
//   discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });   // → { standing, score, basis, passages }
//   discovery.status('DEC-1', { asOf: 2 });                   // → 'review'
//   discovery.reviewReasons('DEC-1', { asOf: 2 });            // → [{ ref: 'CLM-3', now: 'contested', why: 'rests on' }]
//   discovery.iteration(2);                                   // → { cards: [{ id, as }], links: [{ from, to }] }
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

  // A claim in doubt: some of what speaks to how things are says no.
  const DOUBTED = ['refuted', 'contested'];

  // What each kind's fields point at, as links [from, to]: what a record rests on points at it, and
  // what it bears on it points at. Passages and cited sources link a source to the record citing it.
  const cites = (list) => (list ?? []).map(({ source }) => source);
  const EDGES = {
    claim: (r) => [...Object.keys(r.assertions ?? {}).map((id) => [id, r.id]), ...(r.informs ?? []).map((id) => [r.id, id])],
    question: (r) => [[r.raisedBy?.[0], r.id], ...Object.keys(r.answers ?? {}).map((id) => [id, r.id])],
    decision: (r) => [...(r.restsOn ?? []), ...cites(r.sources)].map((id) => [id, r.id]),
    action: (r) => [r.from, ...cites(r.sources)].map((id) => [id, r.id]),
    risk: (r) => [...[r.from ?? []].flat(), ...cites(r.sources)].map((id) => [id, r.id]),
    awaited: (r) => [[r.for, r.id]],
    goal: (r) => [[r.setIn?.[0], r.id]],
    prediction: (r) => [[r.from, r.id]],
    entity: (r) => (r.foundedOn ?? []).map((id) => [id, r.id]),
    primitive: (r) => (r.foundedOn ?? []).map((id) => [id, r.id]),
    scenario: (r) => (r.foundedOn ?? []).map((id) => [id, r.id]),
    rule: (r) => (r.foundedOn ?? []).map((id) => [id, r.id]),
    investigation: (r) => [[r.prompt, r.id]],
    experiment: (r) => [[r.from, r.id], [r.setIn?.[0], r.id]],
    observation: (r) => [[r.at?.[0], r.id], [r.id, r.tests?.[0]], [r.id, r.resultOf], [r.id, r.metric]],
    assumption: (r) => [[r.setIn?.[0], r.id]],
    inference: (r) => (r.premises ?? []).map((id) => [id, r.id]),
    definition: (r) => [[r.setIn?.[0], r.id]],
    opinion: (r) => [[r.said?.[0], r.id]],
    outcome: (r) => [...[r.from ?? []].flat(), ...cites(r.sources)].map((id) => [id, r.id]).concat([[r.id, r.against]]),
    agreement: (r) => [[r.setIn?.[0], r.id], [r.from, r.id]],
    constraint: (r) => [[r.setIn?.[0], r.id], [r.from, r.id]],
  };

  // Kinds that come back when what they rest on changes, so they can be judged again: a decision
  // reviewed against new grounds, a goal or prediction newly measured, an assumption or inference
  // retested, a metric or experiment with a new reading.
  const COMES_BACK = ['decision', 'goal', 'prediction', 'experiment', 'metric', 'assumption', 'inference'];

  function createDiscovery({ sources = [], claims = [], questions = [], assumptions = [], inferences = [], observations = [],
    predictions = [], outcomes = [], investigations = [], experiments = [], actions = [], decisions = [], goals = [], metrics = [],
    definitions = [], opinions = [], agreements = [], constraints = [], risks = [], awaited = [], entities = [], primitives = [],
    scenarios = [], rules = [], also = {} } = {}) {
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

    // ---- Statuses ----

    // Every record by its id, with its kind.
    const lists = { claim: claims, question: questions, assumption: assumptions, inference: inferences, observation: observations,
      prediction: predictions, outcome: outcomes, investigation: investigations, experiment: experiments, action: actions, decision: decisions,
      goal: goals, metric: metrics, definition: definitions, opinion: opinions, agreement: agreements, constraint: constraints, risk: risks,
      awaited, entity: entities, primitive: primitives, scenario: scenarios, rule: rules, model: also.records ?? [] };
    const recordOf = new Map(Object.entries(lists).flatMap(([kind, list]) => list.map((record) => [record.id, { kind, record }])));
    const kindOf = (id) => recordOf.get(id)?.kind;

    // Whether a source or record had arrived, or been raised, by an iteration. One without an
    // iteration always had.
    const arrived = (thing, asOf) => (thing.iteration ?? 0) <= asOf;
    const arrivedById = (id, asOf) => arrived(sourceOf.get(id) ?? recordOf.get(id)?.record ?? {}, asOf);

    // What the observations testing a record say of it, by an iteration: any no outweighs every yes.
    const tested = (id, asOf, [against, borne, untested]) => {
      const verdicts = observations.filter((o) => o.tests?.[0] === id && arrived(o, asOf)).map((o) => stanceOf(o.tests[1]));
      return verdicts.includes('−') ? against : verdicts.includes('+') ? borne : untested;
    };

    // Each kind's rule. A kind without one keeps what its record says.
    const RULES = {
      claim: (claim, asOf) => weigh(claim, { asOf }).standing,
      // Answered once a source that answers it has arrived, and the answer is written up.
      question: (question, asOf) => (question.answer && Object.keys(question.answers ?? {}).some((id) => arrivedById(id, asOf)) ? 'answered' : 'unresolved'),
      assumption: (assumption, asOf) => tested(assumption.id, asOf, ['refuted', 'confirmed', 'untested']),
      // Shaken once any premise is in doubt.
      inference: (inference, asOf) => ((inference.premises ?? []).some((id) => inDoubt(id, asOf)) ? 'shaken' : 'sound'),
      // Measured by the latest outcome against it; until then, supported or put in doubt by results.
      prediction: (prediction, asOf) => {
        const latest = outcomes.filter((o) => o.against === prediction.id && arrived(o, asOf)).pop();
        if (latest) return { worked: 'borne out', partly: 'partly', failed: 'not borne out' }[latest.result];
        return tested(prediction.id, asOf, ['in doubt', 'supported', 'pending']);
      },
      // Done once a source it gathered has arrived; an experiment, once a result has.
      investigation: (investigation, asOf) => (sources.some((s) => s.gatheredBy === investigation.id && arrived(s, asOf)) ? 'done' : 'under way'),
      experiment: (experiment, asOf) => (observations.some((o) => o.resultOf === experiment.id && arrived(o, asOf)) ? 'done' : 'planned'),
      // Done once what shows it's done has arrived.
      action: (action, asOf) => (action.done && arrivedById(action.done, asOf) ? 'done' : action.status),
      decision: (decision, asOf) => (reviewReasons(decision.id, { asOf }).length ? 'review' : decision.status),
      outcome: (outcome) => outcome.result,
    };

    // A record's status as of an iteration (by default, everything), by its kind's rule.
    function status(id, { asOf = Infinity } = {}) {
      if (!recordOf.has(id)) throw new Error(`No record ${id}.`);
      const { kind, record } = recordOf.get(id);
      return RULES[kind] ? RULES[kind](record, asOf) : record.status ?? null;
    }

    function inDoubt(id, asOf) {
      if (kindOf(id) === 'claim') return DOUBTED.includes(status(id, { asOf }));
      if (kindOf(id) === 'assumption') return status(id, { asOf }) === 'refuted';
      if (kindOf(id) === 'inference') return status(id, { asOf }) === 'shaken';
      return false;
    }

    // Why a decision needs another look, as of an iteration: a claim it rests on has turned against
    // it, or an assumption it rests on been refuted, since it was taken; or what it predicted wasn't
    // borne out. Grounds already in doubt when it was taken were part of its reasoning, not a reason.
    function reviewReasons(id, { asOf = Infinity } = {}) {
      const decision = recordOf.get(id)?.record;
      if (!decision) throw new Error(`No record ${id}.`);
      const restsOn = decision.restsOn ?? [], taken = decision.iteration ?? 0;
      const turned = (list, isDoubted) => list.filter((r) => restsOn.includes(r.id)).flatMap((r) => {
        const then = status(r.id, { asOf: taken }), now = status(r.id, { asOf });
        return isDoubted(now) && !isDoubted(then) ? [{ ref: r.id, now, why: 'rests on' }] : [];
      });
      return [
        ...turned(claims, (s) => DOUBTED.includes(s)),
        ...turned(assumptions, (s) => s === 'refuted'),
        ...predictions.filter((p) => p.from === id && status(p.id, { asOf }) === 'not borne out').map((p) => ({ ref: p.id, now: 'not borne out', why: 'predicted' })),
      ];
    }

    // ---- Links ----

    // What the sandbox's model adds until the engine knows it: more of what a record rests on (an
    // entity's primitives, a run's changes), more iterations it comes back in (a part's new version,
    // a test's new result), and links only one iteration has (a run to the tests it shows).
    const more = { inputs: also.inputs ?? (() => []), appearances: also.appearances ?? (() => []), linksInto: also.linksInto ?? (() => []) };

    // Every link, from what something rests on to what rests on it, each once.
    let allLinks = null;
    function links() {
      if (allLinks) return allLinks;
      const pairs = [
        ...[...recordOf.values()].flatMap(({ kind, record }) => (EDGES[kind]?.(record) ?? [])),
        ...sources.filter((s) => s.gatheredBy).map((s) => [s.gatheredBy, s.id]),
        ...[...recordOf.keys()].flatMap((id) => more.inputs(id).map((from) => [from, id])),
      ].filter(([from, to]) => from && to);
      const seen = new Set();
      allLinks = pairs.filter(([from, to]) => !seen.has(`${from} ${to}`) && seen.add(`${from} ${to}`)).map(([from, to]) => ({ from, to }));
      return allLinks;
    }

    // What a record rests on: the sources and the records linking to it.
    function inputsOf(id) {
      const into = links().filter((l) => l.to === id).map((l) => l.from);
      return { sources: into.filter((from) => sourceOf.has(from)), records: into.filter((from) => !sourceOf.has(from)) };
    }

    // ---- Iterations ----

    const iterationOf = (id) => (sourceOf.get(id) ?? recordOf.get(id)?.record)?.iteration ?? 1;

    // The iterations a record appears in: the one it was raised in, and each later one that brought
    // new material for it, or that brought back what it rests on, for kinds that come back.
    const appeared = new Map();
    function appearances(id) {
      if (appeared.has(id)) return appeared.get(id);
      appeared.set(id, [iterationOf(id)]); // so a loop in what rests on what ends here
      const first = iterationOf(id), { sources: from, records } = inputsOf(id);
      const later = from.map(iterationOf);
      if (COMES_BACK.includes(recordOf.get(id)?.kind)) later.push(...records.flatMap(appearances));
      if (recordOf.get(id)?.kind === 'investigation') later.push(...sources.filter((s) => s.gatheredBy === id).map((s) => iterationOf(s.id)));
      later.push(...more.appearances(id));
      const result = [...new Set([first, ...later.filter((k) => k > first)])].sort((a, b) => a - b);
      appeared.set(id, result);
      return result;
    }

    // Every appearance of everything, and the links between them, each to the version of what it
    // rests on that stood by then. What brought a record about links to it only where it did.
    let versions = null;
    function versioned() {
      if (versions) return versions;
      const key = (id, k) => `${id}@${k}`;
      const latest = (id, k) => appearances(id).filter((at) => at <= k).pop();
      const nodes = [], found = [];
      for (const id of [...sources.map((s) => s.id), ...recordOf.keys()]) {
        const at = appearances(id), { sources: from, records } = inputsOf(id), record = recordOf.get(id)?.record ?? {};
        at.forEach((k, i) => {
          const before = i ? at[i - 1] : 0;
          nodes.push({ key: key(id, k), id, k, as: i ? 'updated' : 'raised' });
          for (const s of from) if (iterationOf(s) > before && iterationOf(s) <= k) found.push([key(s, iterationOf(s)), key(id, k)]);
          for (const r of records) {
            if (i && [record.from, record.prompt].includes(r)) continue;
            const version = latest(r, k);
            if (version > before || (!i && version)) found.push([key(r, version), key(id, k)]);
          }
          for (const r of more.linksInto(id, k)) found.push([key(r, k), key(id, k)]);
        });
      }
      versions = { nodes, links: found };
      return versions;
    }

    // What an iteration shows: every record raised in it or brought back by new material, and the
    // earlier ones its records rest on, carried in as they last stood; and the links among them.
    function iteration(k) {
      const { nodes, links: found } = versioned();
      const here = new Set(nodes.filter((n) => n.k === k).map((n) => n.key));
      const restedOn = (n) => found.some(([from, to]) => from === n.key && here.has(to) && !to.startsWith(`${n.id}@`));
      const shown = nodes.filter((n) => n.k === k || (n.k < k && restedOn(n)));
      const keys = new Set(shown.map((n) => n.key));
      const idOf = (key) => key.slice(0, key.lastIndexOf('@'));
      return {
        cards: shown.map((n) => (n.k === k ? { id: n.id, as: n.as } : { id: n.id, as: 'carried', from: n.k })),
        links: found.filter(([from, to]) => keys.has(from) && keys.has(to)).map(([from, to]) => ({ from: idOf(from), to: idOf(to) })),
      };
    }

    return { weigh, strength, originOf, status, reviewReasons, links, inputsOf, appearances, iteration };
  }

  if (typeof module !== 'undefined') module.exports = { createDiscovery };
  else window.createDiscovery = createDiscovery;
})();
