// Sandkit tags 0.1.0 · MIT Licence · https://github.com/sebjwallace/sandkit
// The engine of tagging: finding your way around a sandbox's tag map, with the rules written once.
// Given the items that carry tags and the tags' declarations, it says what carries a selection of
// tags, what's like a set of items, and where to go from a selection. It draws nothing, reads no
// files, and knows no component.
//
// Every result has a score from 0 to 1: how much of the weight of their tags an item and the
// selection share. Rarer tags weigh more, so a tag on nearly everything counts for little. A score
// says where to look first, never what's true.
//
//   const tags = createTags({ items: [...SOURCES, ...CLAIMS], tags: TAGS });
//   tags.find({ tags: ['platform-changes', 'passengers'] });  // → { results: [{ id, score, carries, lacks, item }], total, selection, followed, undeclared }
//   tags.like(['CLM-4']);                                     // → { results: [{ id, score, shares, closest, item }], total, unknown }
//   tags.ways({ tags: ['platform-changes'] });                // → { narrow: [{ add, count, selection }], widen: [{ drop, count, selection }] }
//   tags.list();                                              // → [{ tag, means, declared, on }]
//
// See manifest.md for the full contract.
(function () {
  // Below this many items, rarity says little, so every tag weighs the same.
  const FEW_ITEMS = 10;
  // How many ways to narrow or widen are worth offering at once.
  const MOST_WAYS = 5;

  const unique = (list) => [...new Set(list)];
  const tagsOf = (item) => (Array.isArray(item.tags) ? item.tags : []);
  const rounded = (score) => Math.round(score * 100) / 100;
  // Codes in order, numbers counted as numbers: CLM-2 before CLM-10.
  const byCode = (a, b) => a.localeCompare(b, 'en', { numeric: true });

  // What a person can still be sent to: one item per id (the last given), and nothing superseded.
  // Working tags live in their own field, so they never reach the map.
  function currentItems(items) {
    const withIds = items.filter((item) => typeof item?.id === 'string');
    const superseded = new Set(withIds.flatMap((item) => [item.supersedes ?? []].flat()));
    const byId = new Map(withIds.map((item) => [item.id, item]));
    return [...byId.values()].filter((item) => !superseded.has(item.id) && item.status !== 'superseded');
  }

  function createTags({ items = [], tags = [] } = {}) {
    const declared = new Map(tags.map((declaration) => [declaration.tag, declaration]));
    const current = currentItems(items);
    const byId = new Map(current.map((item) => [item.id, item]));

    const carriers = new Map();
    for (const item of current) for (const tag of tagsOf(item)) carriers.set(tag, [...(carriers.get(tag) ?? []), item.id]);

    // A tag on few items says more than one on many.
    const weight = (tag) => (current.length < FEW_ITEMS ? 1 : Math.log(1 + current.length / (carriers.get(tag)?.length || 1)));
    const weightOf = (tagList) => tagList.reduce((sum, tag) => sum + weight(tag), 0);

    // The share of weight two lists of tags have in common: 1 when they're the same, 0 when they share none.
    function closeness(a, b) {
      const all = unique([...a, ...b]);
      return all.length ? weightOf(a.filter((tag) => b.includes(tag))) / weightOf(all) : 0;
    }

    // A selection as asked, with retired tags swapped for what replaced them. A preset passes as it is.
    function resolve({ tags: chosen = [], match, without = [] } = {}) {
      const followed = [];
      const follow = (tag) => {
        const replacedBy = declared.get(tag)?.replacedBy;
        if (!replacedBy) return [tag];
        followed.push({ from: tag, to: replacedBy });
        return replacedBy;
      };
      const selection = { tags: unique(chosen.flatMap(follow)), match: match === 'any' ? 'any' : 'all', without: unique(without.flatMap(follow)) };
      const undeclared = unique([...selection.tags, ...selection.without]).filter((tag) => !declared.has(tag));
      return { selection, followed, undeclared };
    }

    // With no tags chosen, only leaving some out: everything tagged, less those.
    function fits(item, { tags: chosen, match, without }) {
      const carried = tagsOf(item);
      if (without.some((tag) => carried.includes(tag))) return false;
      if (!chosen.length) return carried.length > 0;
      return match === 'any' ? chosen.some((tag) => carried.includes(tag)) : chosen.every((tag) => carried.includes(tag));
    }

    // Highest score first, ties by code, so the order never depends on how the items were given.
    const ranked = (results) => results
      .sort((a, b) => b.score - a.score || byCode(a.id, b.id))
      .map((result) => ({ ...result, score: rounded(result.score) }));

    function find(asked, { limit = Infinity, exclude = [] } = {}) {
      const { selection, followed, undeclared } = resolve(asked);
      const left = new Set(exclude);
      const results = ranked(current.filter((item) => !left.has(item.id) && fits(item, selection)).map((item) => ({
        id: item.id,
        kind: item.kind,
        score: closeness(selection.tags, tagsOf(item)),
        carries: selection.tags.filter((tag) => tagsOf(item).includes(tag)),
        lacks: selection.tags.filter((tag) => !tagsOf(item).includes(tag)),
        item
      })));
      return { results: results.slice(0, limit), total: results.length, selection, followed, undeclared };
    }

    // Each item scored by the one given that it's closest to, which it names.
    function like(ids, { limit = Infinity, exclude = [] } = {}) {
      const given = ids.map((id) => byId.get(id)).filter(Boolean);
      const left = new Set([...ids, ...exclude]);
      const results = ranked(current.filter((item) => !left.has(item.id)).flatMap((item) => {
        const best = given
          .map((other) => ({ other, score: closeness(tagsOf(other), tagsOf(item)) }))
          .reduce((a, b) => (b.score > a.score ? b : a), { score: 0 });
        if (!best.score) return [];
        const shares = tagsOf(item).filter((tag) => tagsOf(best.other).includes(tag));
        return [{ id: item.id, kind: item.kind, score: best.score, shares, closest: best.other.id, item }];
      }));
      return { results: results.slice(0, limit), total: results.length, unknown: ids.filter((id) => !byId.has(id)) };
    }

    // One step from a selection: adding a tag, or with two or more, dropping one or switching between
    // all and any, each with how many it would find. Fewer is narrowing, more widening, gentlest first.
    function ways(asked) {
      const { selection } = resolve(asked);
      const count = (next) => current.filter((item) => fits(item, next)).length;
      const now = count(selection);
      const switched = selection.match === 'all' ? 'any' : 'all';
      const others = [...carriers.keys()].filter((tag) => !selection.tags.includes(tag) && !selection.without.includes(tag));
      const steps = [
        ...others.map((tag) => ({ add: tag, selection: { ...selection, tags: [...selection.tags, tag] } })),
        ...(selection.tags.length > 1 ? [
          ...selection.tags.map((tag) => ({ drop: tag, selection: { ...selection, tags: selection.tags.filter((t) => t !== tag) } })),
          { match: switched, selection: { ...selection, match: switched } }
        ] : [])
      ].map((step) => ({ ...step, count: count(step.selection) }));
      const byCount = (direction) => (a, b) => direction * (a.count - b.count);
      return {
        narrow: steps.filter((step) => step.count > 0 && step.count < now).sort(byCount(-1)).slice(0, MOST_WAYS),
        widen: steps.filter((step) => step.count > now).sort(byCount(1)).slice(0, MOST_WAYS)
      };
    }

    // Every tag: those declared, in their order, then any in use but never declared.
    function list() {
      const undeclared = [...carriers.keys()].filter((tag) => !declared.has(tag));
      return [
        ...tags.map((declaration) => ({ ...declaration, declared: true, on: carriers.get(declaration.tag) ?? [] })),
        ...undeclared.map((tag) => ({ tag, means: null, declared: false, on: carriers.get(tag) }))
      ];
    }

    return { items: () => current, list, find, like, ways };
  }

  if (typeof module !== 'undefined') module.exports = { createTags };
  else window.createTags = createTags;
})();
