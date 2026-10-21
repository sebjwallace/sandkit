# Departure board: programming a domain from inside its space

A demo of an idea, built in one evening: once an agent has discovered a domain deeply enough to model it, people can develop that domain themselves, without the agent, by working inside the space the model describes.

Open `index.html` by double-clicking it. The pages share one board, one set of rules and one set of trains, so a change on any page shows on the others. `NOTES.md` records what each step taught us.

## The idea

Sandboxing has been about **discovery**: an agent and the people who know a subject build a model until it's complete and correct enough to understand. That runs one way, model to person. The next stage is **development**: changing the domain.

The naive way is to tell the agent what to change. That puts the agent in the way, as the engineer everyone must go through, and every change of mind costs a round trip. But a good discovery pass has already worked out the domain's **principled space**: its facts, the values they take, what can be shown, and how one leads to the other. The domain as found is just **one configuration** inside that space. So the agent can build an interface onto the space and step back, and people program the domain directly. The agent only returns when someone reaches the edge of the space or finds it wrong.

The subject here is deliberately small: a station's departure board. Trains come in as data, the board works out four facts about each one (running or not, how late, whether its platform is settled, how soon it's due), and rules turn those facts into what each part of the board shows.

## The path we took

Each step came from using the last one.

1. **Rules as decision tables** under a live board: click a cell to change a condition, choose what the board shows, watch every train follow. What the board shows is drawn as the board draws it, so there's nothing to translate.
2. **Rules as a graph**: the same rules as a flow, from a train's details through its facts and the rules to what the board shows. The tables say *what*, the graph says *why*. Both edit one mechanism.
3. **Highlights you can pin**, as an outliner of every train, rule and part of one. Pointing at an input traces what it affects; pointing at something on the board traces why it says that. Pinned traces stay lit, and can glow.
4. **Programming by example**: say what one part of the board should show for one train, and the model finds the widest rule that does it without changing anything you didn't ask for. Examples are kept and checked, so they become the specification, and the rules are derived from them.
5. **A scenario catalog**: every combination of facts (108 here) is a scenario with a code, its line on the board and its Given / When / Then, grouped into families by the rules they pass through. Most were never seen by anyone; the rules simply imply them.
6. **Choosing instead of saying**: for one scenario, a population of whole board lines to pick from, generation after generation, as in selective breeding. Variations borrowed from neighbouring scenarios make sense where random ones didn't.
7. **A map of the space**: the lines for one scenario laid out on a grid, ordered by meaning, with the path of choices drawn through it. Pointing anywhere previews that line on the board and in the scenario card.

## What it suggests

Developing a domain is a search. The space of possible domain models is far too large to plan through, but it can be navigated: by examples, by choosing among variations, by seeing where you are and where you've been. The discovered model is one point in that space, and often a local optimum; the interfaces here are ways to move from it towards something better, with the scenarios as landmarks.

This demo went the same way. It started with a decision table, a sensible local answer, and each step's use showed the next, until it arrived somewhere none of us would have planned at the start: choosing lines in a map of the scenario space. That is the point of the method as much as its subject.

The pieces have well-known neighbours: decision tables, specification by example, programming by example, business rules engines, equivalence classes in testing. What's new is the combination: the agent builds the principled space quickly during discovery, and people then program inside it, starting from the domain as found, or from nothing.

## Inspiration

**Kenneth Stanley and Jeff Clune**, and their work on interactive and open-ended evolution: Picbreeder, where people breed images by choosing among offspring (Jimmy Secretan, Kenneth Stanley and colleagues), EndlessForms, which did the same for 3D shapes (Jeff Clune and Hod Lipson), and the idea that great things are found by following stepping stones rather than fixed objectives (Kenneth Stanley and Joel Lehman, *Why Greatness Cannot Be Planned*). Choosing a line, and seeing the path through the space, come straight from that work.

Also: the switchboards and patch cables of early computers, and Zachtronics games, for the feel of a constrained, playful space to program in.

## What's here

| File | What it is |
|---|---|
| `index.html` | The board, with its rules as tables or as a graph, the trains, a tour, and the highlights outliner. |
| `example.html` | Programming by example, and choosing a line with its scenario card and map. |
| `catalog.html` | The scenario catalog, with search, facets and sorting. |
| `model.js` | The principled model: facts, what can be shown, the original rules, the sets of trains, and finding a rule from examples. |
| `board.js` | What the pages share: saved state, the board, the trains, changing rules, highlighting. |
| `tables.js`, `graph.js` | The two ways of drawing the rules. |
| `NOTES.md` | Findings, step by step, including candidates for Sandkit components. |

It's a mock-up: plain HTML around Sandkit's shell and components (`sb-tabs`, `sb-panel`, `sb-tour`, `sb-scenario`, `sb-notebook`), with everything kept in the browser.
