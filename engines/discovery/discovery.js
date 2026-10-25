// Sandkit discovery 0.1.1 · MIT Licence · https://github.com/sebjwallace/sandkit
// The engine of domain discovery: the method's rules, written once. Given the sandbox's records,
// it works out what follows from them, the same way every time, so a record holds only what
// someone wrote and never a conclusion. It draws nothing and knows no component.
//
// So far it weighs claims (which passages count, and a claim's standing, score and basis, from each
// source's authored grade) and works out every status that follows from the records, as of any
// iteration: a question answered, an assumption refuted, a decision under review.
//
//   const discovery = createDiscovery({ sources, claims, questions, decisions, … });
//   discovery.weigh('CLM-3', { asOf: 2, reliedOn: true });   // → { standing, score, basis, passages }
//   discovery.status('DEC-1', { asOf: 2 });                   // → 'review'
//   discovery.reviewReasons('DEC-1', { asOf: 2 });            // → [{ ref: 'CLM-3', now: 'contested', why: 'rests on' }]
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

  function createDiscovery({ sources = [], claims = [], questions = [], assumptions = [], inferences = [], observations = [],
    predictions = [], outcomes = [], investigations = [], experiments = [], actions = [], decisions = [] } = {}) {
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
      prediction: predictions, outcome: outcomes, investigation: investigations, experiment: experiments, action: actions, decision: decisions };
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

    return { weigh, strength, originOf, status, reviewReasons };
  }

  if (typeof module !== 'undefined') module.exports = { createDiscovery };
  else window.createDiscovery = createDiscovery;
})();
