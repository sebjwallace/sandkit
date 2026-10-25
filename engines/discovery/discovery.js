// Sandkit discovery 0.2.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// The engine of domain discovery: the method's rules, written once. Given the sandbox's records,
// it works out what follows from them, the same way every time, so a record holds only what
// someone wrote and never a conclusion. It draws nothing and knows no component.
//
// It weighs claims (which passages count, and a claim's standing, score and basis, from each
// source's authored grade), works out every status that follows from the records, as of any
// iteration, and what rests on what: the links between records, and what each iteration shows. And
// it runs the model being built: every version and candidate against every scenario and rule, what
// each run found, whether a trial earns its place, and the compression signal.
//
//   const discovery = createDiscovery({ sources, claims, questions, decisions, … });
//   discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });   // → { standing, score, basis, passages }
//   discovery.status('DEC-1', { asOf: 2 });                   // → 'review'
//   discovery.reviewReasons('DEC-1', { asOf: 2 });            // → [{ ref: 'CLM-3', now: 'contested', why: 'rests on' }]
//   discovery.iteration(2);                                   // → { cards: [{ id, as }], links: [{ from, to }] }
//   discovery.run('RUN-3');                                   // → { tests, met, change, … }
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
    scenarios = [], rules = [], model: { versions = [], candidates = [] } = {} } = {}) {
    // The model being built: one version per iteration, `{ iteration, parts: { partId: Class } }`,
    // and candidates trying a proposal, `{ iteration, tries, parts }`. Every version is kept, so every
    // run can be repeated. A run is worked out for each version, set against the one before, and for
    // each candidate, set against the model it would join.
    // The model as it stood by an iteration: its latest version then, if any.
    const modelAt = (k) => versions.filter((v) => (v.iteration ?? 1) <= k).pop() ?? { iteration: 0, parts: {} };
    const runs = [
      ...versions.map((v, i) => ({ iteration: v.iteration, parts: v.parts, against: versions[i - 1]?.parts ?? null,
        changes: Object.keys(v.parts).filter((id) => v.parts[id] !== versions[i - 1]?.parts[id]) })),
      ...candidates.map((c) => ({ iteration: c.iteration, parts: c.parts, tries: c.tries, against: modelAt(c.iteration).parts, changes: [c.tries] })),
    ].map((run, i) => ({ id: `RUN-${i + 1}`, ...run }));

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
      awaited, entity: entities, primitive: primitives, scenario: scenarios, rule: rules, run: runs };
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
      entity: (part, asOf) => stage(part, asOf),
      primitive: (part, asOf) => stage(part, asOf),
      scenario: (test, asOf) => (passesWith(test, modelAt(asOf).parts) ? 'met' : 'not met'),
      rule: (test, asOf) => (passesWith(test, modelAt(asOf).parts) ? 'met' : 'not met'),
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

    // What the model adds: an entity rests on the primitives its class is made of, and a run on what
    // it changed; a part comes back when its version or stage changes, and a test when what it says
    // against the model does; and the runs of an iteration that say something about a test link to it there.
    const more = {
      inputs: (id) => (kindOf(id) === 'entity' ? primitivesOf(id) : kindOf(id) === 'run' ? recordOf.get(id).record.changes : []),
      appearances: (id) => {
        const changed = (differs) => versions.filter((v, i) => i && differs(v, versions[i - 1])).map((v) => v.iteration);
        if (['scenario', 'rule'].includes(kindOf(id))) {
          const said = (v) => JSON.stringify(results(id, { asOf: v.iteration }));
          return changed((v, before) => said(v) !== said(before));
        }
        if (['entity', 'primitive'].includes(kindOf(id))) {
          const rejected = recordOf.get(id).record.rejected;
          return [...changed((v, before) => v.parts[id] !== before.parts[id]), ...(rejected ? [rejected.in] : [])];
        }
        return [];
      },
      linksInto: (id, k) => (['scenario', 'rule'].includes(kindOf(id)) ? runsShowing(id, k).map((run) => run.id) : []),
    };

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
    let graph = null;
    function versioned() {
      if (graph) return graph;
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
      graph = { nodes, links: found };
      return graph;
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

    // ---- The model ----

    // A part's stage: rejected once turned down, integrated once a version of the model holds it,
    // trying once a candidate tries it, proposed until then.
    const candidateOf = (id, k) => candidates.find((c) => c.tries === id && c.iteration <= k);
    function stage(part, k) {
      if (part.rejected && part.rejected.in <= k) return 'rejected';
      if (modelAt(k).parts[part.id]) return 'integrated';
      return candidateOf(part.id, k) ? 'trying' : 'proposed';
    }

    // The model's classes by their parts' names, as tests use them: "Clock time" becomes ClockTime.
    const className = (name) => name.split(/\s+/).map((word) => word[0].toUpperCase() + word.slice(1)).join('');
    const classesOf = (parts) => Object.fromEntries(Object.entries(parts).map(([id, cls]) => [className(recordOf.get(id).record.name), cls]));

    // A test played against a set of parts: a scenario's result for each step (null where a step
    // isn't checked), or the cases a rule fails for. A scenario the model can't even play fails every
    // step it checks, saying why; so does a rule.
    function resultsWith(test, parts) {
      try {
        if (kindOf(test.id) === 'scenario') return test.play(classesOf(parts)).map((r) => (r?.ok ? { ok: true } : r));
        return test.check(classesOf(parts));
      } catch (error) {
        if (kindOf(test.id) === 'scenario') return test.steps.map((step) => (step.keyword === 'Given' ? null : { ok: false, actual: error.message }));
        return [error.message];
      }
    }
    const passesWith = (test, parts) => {
      const found = resultsWith(test, parts);
      return kindOf(test.id) === 'scenario' ? found.every((r) => !r || r.ok) : found.length === 0;
    };
    const testRecord = (id) => {
      if (!['scenario', 'rule'].includes(kindOf(id))) throw new Error(`No scenario or rule ${id}.`);
      return recordOf.get(id).record;
    };
    const results = (id, { asOf = Infinity } = {}) => resultsWith(testRecord(id), modelAt(asOf).parts);
    const testsBy = (k) => [...scenarios, ...rules].filter((t) => iterationOf(t.id) <= k);

    // ---- The compression signal ----

    // A class and every class it extends, oldest first.
    function chainOf(cls) {
      const chain = [];
      for (let c = cls; c && c.toString().startsWith('class'); c = Object.getPrototypeOf(c)) chain.unshift(c);
      return chain;
    }
    const classesIn = (parts) => [...new Set(Object.values(parts).flatMap(chainOf))];
    const methodsOf = (cls) => Object.getOwnPropertyNames(cls.prototype).filter((name) => name !== 'constructor' && typeof cls.prototype[name] === 'function');
    const decisionsOf = (parts) => classesIn(parts).reduce((sum, cls) => sum + countDecisions(cls.toString()), 0);
    // The method holding the most decisions: where code would crowd if compression were chased.
    const busiestOf = (parts) => classesIn(parts)
      .flatMap((cls) => methodsOf(cls).map((name) => ({ name: `${cls.name}.${name}`, decisions: countDecisions(cls.prototype[name].toString()) })))
      .reduce((most, method) => (method.decisions > most.decisions ? method : most), { name: 'none', decisions: 0 });
    const measure = (parts) => ({ decisions: decisionsOf(parts), busiest: busiestOf(parts) });

    // The model as it stood by an iteration: its parts, its classes by name, and its size.
    function model(k = Infinity) {
      const { iteration, parts } = modelAt(k);
      return { iteration, parts, classes: classesOf(parts), ...measure(parts) };
    }

    // Where a class's decisions are: it and every class it extends, oldest first, each with its own
    // count and each method's.
    const decisionsIn = (cls) => chainOf(cls).map((c) => ({ cls: c, decisions: countDecisions(c.toString()),
      methods: methodsOf(c).map((name) => ({ name, decisions: countDecisions(c.prototype[name].toString()) })) }));

    // What a change of model does to the tests written by an iteration: those it newly meets, those
    // it breaks, how many parts and decisions it adds, and how many of those went into parts already there.
    function compare(before, after, k) {
      const kept = Object.fromEntries(Object.entries(after).filter(([id]) => id in before));
      return {
        met: testsBy(k).filter((t) => !passesWith(t, before) && passesWith(t, after)).map((t) => t.id),
        broken: testsBy(k).filter((t) => passesWith(t, before) && !passesWith(t, after)).map((t) => t.id),
        added: Object.keys(after).length - Object.keys(before).length,
        decisions: decisionsOf(after) - decisionsOf(before),
        inPlace: decisionsOf(kept) - decisionsOf(before),
      };
    }
    const earnsItsPlace = (change) => change.met.length > 0 && !change.broken.length;

    // What kind of change it was, judged by what it met against what it added: real structure meets
    // more for no more choices; a patch adds a choice to existing code to meet one test; a new part
    // meeting a new need, the rest untouched, is new capability.
    function changeKind({ met, broken, decisions, added, inPlace }) {
      if (broken.length) return 'it breaks what was met';
      if (!met.length) return decisions > 0 ? 'more decisions, nothing more met' : 'nothing more met';
      if (decisions <= 0) return 'more met for no more decisions: structure';
      if (added > 0 && inPlace <= 0) return 'met by a new part, the rest untouched: new capability';
      if (met.length === 1) return 'a patch, adding to existing code to meet one test';
      return decisions < met.length ? 'one change, many met: structure' : 'met by adding decisions';
    }

    // ---- Runs ----

    // What a run found: each test written by its iteration, met or not; the model's size and busiest
    // method; the change against what it's set against, of what kind, and whether a trial earns its
    // place; and, for a version, the new tests the version before already met on arrival.
    const ran = new Map();
    function run(id) {
      if (!ran.has(id)) ran.set(id, runOf(id));
      return ran.get(id);
    }
    function runOf(id) {
      const found = runs.find((r) => r.id === id);
      if (!found) throw new Error(`No run ${id}.`);
      const tests = testsBy(found.iteration).map((t) => t.id);
      const met = tests.filter((t) => passesWith(recordOf.get(t).record, found.parts));
      const change = found.against ? compare(found.against, found.parts, found.iteration) : null;
      const arrived = found.against && !found.tries ? tests.filter((t) => iterationOf(t) === found.iteration) : [];
      return {
        ...found, tests, met, notMet: tests.filter((t) => !met.includes(t)), ...measure(found.parts),
        change: change && { ...change, kind: changeKind(change), earnsItsPlace: earnsItsPlace(change) },
        arrived, metOnArrival: arrived.filter((t) => passesWith(recordOf.get(t).record, found.against)),
      };
    }

    // The runs of an iteration that say something about a test: the model's own, always, and a
    // trial's where it newly meets it.
    const runsShowing = (testId, k) => runs.filter((r) => r.iteration === k && (!r.tries || run(r.id).change.met.includes(testId)));

    // ---- Parts ----

    // The part a class is, in the model of an iteration.
    const partOfClass = (cls, k) => Object.entries(modelAt(k).parts).find(([, c]) => c === cls)?.[0];
    // The primitives an entity's class is made of (its static properties naming them), in any version.
    const primitivesOf = (id) => [...new Set(versions.flatMap((v) => Object.values(v.parts[id]?.properties ?? {})
      .map((type) => (typeof type === 'string' ? null : partOfClass(type, v.iteration))).filter(Boolean)))];
    // The definition a part's name rests on: one it's founded on, defining that very word.
    const definitionOf = (id) => {
      const part = recordOf.get(id)?.record;
      return definitions.find((d) => part?.foundedOn?.includes(d.id) && d.term.toLowerCase() === part.name.toLowerCase()) ?? null;
    };

    // What a test exercised of each part when it ran against the model of an iteration, watched:
    // objects made, methods called, fields read. Methods run with the watched object as this, so calls
    // inside the model are caught too. Kept, since the model and the test are fixed for both.
    const watched = new Map();
    function watch(testId, k) {
      const key = `${testId}@${k}`;
      if (watched.has(key)) return watched.get(key);
      const touched = new Map();
      const noteOf = (id) => touched.get(id) ?? touched.set(id, { made: false, calls: new Set(), reads: new Set() }).get(id);
      const proxied = {};
      const wrap = (id, cls) => new Proxy(cls, {
        construct(target, args, newTarget) {
          noteOf(id).made = true;
          const made = Reflect.construct(target, args, newTarget === proxied[className(recordOf.get(id).record.name)] ? target : newTarget);
          return new Proxy(made, {
            get(object, name, receiver) {
              const value = Reflect.get(object, name, receiver);
              if (typeof name === 'string' && name !== 'constructor') {
                if (typeof value === 'function') noteOf(id).calls.add(name);
                else if (Object.hasOwn(object, name)) noteOf(id).reads.add(name);
              }
              return value;
            },
          });
        },
      });
      for (const [id, cls] of Object.entries(modelAt(k).parts)) proxied[className(recordOf.get(id).record.name)] = wrap(id, cls);
      const test = testRecord(testId);
      try {
        kindOf(testId) === 'scenario' ? test.play(proxied) : test.check(proxied);
      } catch {
        // A test the model can't run still touched whatever it reached first.
      }
      watched.set(key, touched);
      return touched;
    }

    // The tests that exercised a part, by an iteration, and what each used of it: for an entity, any
    // that made it or called it; for a primitive, only those that read its value, since every object
    // is built from primitives.
    function exercisedBy(id, { asOf = Infinity } = {}) {
      const exercises = (touch) => touch && (kindOf(id) === 'entity' ? touch.made || touch.calls.size : touch.reads.size);
      return testsBy(asOf).map((t) => ({ test: t.id, touch: watch(t.id, asOf).get(id) })).filter(({ touch }) => exercises(touch))
        .map(({ test, touch }) => ({ test, made: touch.made, calls: [...touch.calls], reads: [...touch.reads] }));
    }

    return {
      weigh, strength, originOf, status, reviewReasons, links, inputsOf, appearances, iteration,
      model, runs: () => runs.map((r) => r.id), run, results, decisionsIn, partOfClass, primitivesOf, definitionOf, exercisedBy,
    };
  }

  // Decisions in code: every point where it chooses (if, case, &&, ||, ??, and the ternary ?), counted
  // in its source with strings and comments taken out, so writing it densely changes nothing; only
  // fewer real choices count.
  function countDecisions(source) {
    const code = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, '""');
    return (code.match(/\bif\b|\bcase\b|&&|\|\||\?\?|\?(?![.?])/g) ?? []).length;
  }

  if (typeof module !== 'undefined') module.exports = { createDiscovery };
  else window.createDiscovery = createDiscovery;
})();
