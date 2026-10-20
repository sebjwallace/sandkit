# Workshops

How to run a workshop in a sandbox: the agent and the people who know a subject working through its model together, until they understand it, have corrected it, and own it. Read this when someone asks to workshop a sandbox, review a model with the people who know it, or hand an analysis over to the people who'll rely on it. It builds on [building a sandbox](building-a-sandbox.md); read that first if there's no sandbox yet.

## Why workshop

An agent can analyse a great deal of material and model a subject well, and the result is still a black box to the people who must rely on it. They didn't shape it, can't see into it, and are rightly wary of acting on it. Showing them the finished model doesn't change that; working through it with them does.

A workshop aims at three things, each visible on the page by the end:

- **Understanding.** Each person's picture of the subject and the model's agree. Where they didn't, one of them was wrong, and now isn't.
- **Correction.** Wherever the model was wrong or missing something, it's been fixed, with the evidence and the name of whoever supplied it.
- **Ownership.** Decisions made by the people in the room, with their names on them, and every open question with someone chasing it.

A model can be complete and correct and still not be trusted. A workshop is how it earns trust.

## Principles

- **People act; the agent responds.** Understanding and ownership come from committing to judgements, not from watching a presentation. Give people something to answer, predict or decide at every step.
- **Flexible, not a conveyor belt.** The activities below are tools on the table. Suggest what fits the moment; the room chooses.
- **Hidden until everyone has answered.** Predictions, polls and leanings stay hidden until all are in, then show at once, so the first or most senior voice doesn't steer the rest.
- **Being wrong is the point,** for people and for the agent. Say so at the start. A wrong prediction is the most useful thing a workshop produces.
- **Push back on evidence, not on standing.** Don't defend the analysis, and don't simply agree with the room. If someone contradicts the sources, show the passage and ask. If they know something the sources don't, that's new evidence: capture it, with their name, and change the model. Often the best pushback is running the scenario their way and letting the result speak.
- **Watch for easy agreement.** Everyone confident on thin evidence is a reason to probe, not to move on.
- **Keep three things apart:**
  - a **correction**: the model doesn't match how things are. It needs evidence, and changes the model.
  - a **fork**: the sources disagree about how things are. The room decides, and the model follows.
  - a **proposal**: how things should be in future. It's recorded as a decision or a question for later, and leaves the model as it is.

  Mixing them turns a review of the model into a debate about policy.
- **Keep it cheap.** Work out results before the session, so a reveal costs nothing. Send things to the agent in batches, one round trip per activity, not per answer.

## Roles

| Role | Who | Does |
|---|---|---|
| **Facilitator** | The agent | Prepares the session, suggests what to do next and why, runs the model, answers from the sources, records everything. Gives its own view only after people have given theirs, and says it's the agent's. |
| **Participants** | The people who know the subject | Answer, predict, challenge, decide. Each has a badge, and their name goes on everything they contribute. |
| **Owner** | One participant per part or question | Takes responsibility for a part of the model, an assumption or an open question after the session. |
| **Driver** | Whoever has the keyboard | Works the shared screen, answers on others' behalf when they take turns, and pastes prompts to the agent. |

Keep one list of the people taking part, with an id, name and role each, and draw every badge, picker and owner list from it. The agent is in it too, marked as an agent.

## Before the session

Prepare with the person who asked for the workshop, then build the page.

1. **Purpose and exit conditions.** What must the room leave with? For example: "everyone can say how a storm becomes a flood; every part of the model has an owner or an open question with someone chasing it; we're ready to choose a direction". These are checked at the end.
2. **People.** Who's coming, their roles, where each knows the subject deeply and where only loosely, and which decisions the room can make itself.
3. **What the agent isn't sure of.** Go through the model and list:
   - **forks:** every place the sources disagree or the agent had to choose a reading, and which way it went;
   - **grounding:** what's cited, what's inferred, what's assumed (the [sources practice](sources.md) shows which items cite nothing);
   - **open questions** the sources can't answer.
4. **Scenarios,** routine to unusual, weighted towards where the agent is least sure. Work out their results in advance.
5. **Freeze the model's version** in the journal, so everything in the session refers to one version, and any correction raises it.
6. **Build the workshop page** (below), with an opening section and the first activity ready. Prepare more than you'll need; the room decides the order.

## The workshop page

A workshop is a page of its own (see the [pages practice](pages.md)), sharing the sandbox's model, so it can be exported and shared on its own afterwards.

- **The page is an [`sb-notebook`](../components/sb-notebook/manifest.md):** one section per moment in the session, each with its kind, who led it and when. Mark the sections that matter `key`, and side discussions `aside`. A week later the page reads as the record of what was asked, found, corrected and decided, with names on all of it.
- **Open with a section** giving the purpose, the exit conditions, who is here (a row of [`sb-person`](../components/sb-person/manifest.md) badges, the agent's among them) and how you'll work, including that answers stay hidden until everyone has answered, and that being wrong is the point.
- **Give everything people will discuss a code** ([identifiers practice](identifiers.md)), such as `PRD-` for predictions, `POL-` polls, `FRK-` forks, `QST-` questions, `DEC-` decisions and `FB-` feedback, and mark it with `data-ref`. The notebook counts codes per section and filters by them, and comments cite them.
- **Keep comment mode on** ([feedback practice](feedback.md)), so anyone can point at anything and say what they think.
- **Add a section as the session moves on:** what came up, the activity that followed, and what it found.

## Activities

Use them freely, in any order the conversation calls for. Each follows the same shape: ask, let people answer, show the result, send it to the agent if it needs the agent's view, and record what came of it.

| Activity | It asks | Built with |
|---|---|---|
| **Predict and reveal** | Do our pictures of the subject and the model's agree? | [`sb-poll`](../components/sb-poll/manifest.md) with `reasons` and an `outcome`, under a [`sb-scenario`](../components/sb-scenario/manifest.md) with its outcome left out; then the model's own view of why |
| **Confidence check** | How sure is each of us that this part is right? | `sb-poll` with five options, `1 · Not at all` to `5 · Completely`; its person slots can hold a badge beside an [`sb-stat`](../components/sb-stat/manifest.md) |
| **Fork** | The sources disagree: which reading should the model keep? | The model runs both readings; the page shows a switch between them and the same scenarios under each; `sb-poll` for leanings; [`sb-choice`](../components/sb-choice/manifest.md) for the decision |
| **Checking sources** | Does each citation hold up? | [`sb-source-trace`](../components/sb-source-trace/manifest.md) and [`sb-source`](../components/sb-source/manifest.md); people's verdict on each citation (sound, out of date, misread, missing something), built in the page |
| **Questions** | What can't we settle today, and who's chasing it? | A card per question with its code, who raised it, an owner and a status, built in the page; ask the agent about any one with [`sb-handoff`](../components/sb-handoff/manifest.md) |
| **Decision** | What do we choose, and why? | `sb-choice`, `editable`, with the deciders ticked |
| **Facilitator's suggestion** | Should we change course? | [`sb-callout`](../components/sb-callout/manifest.md) with a heading such as "The agent suggests", the suggestion, the reason, and Accept, Suggest something else or Keep going |

### Predict and reveal

The heart of a workshop. Before the model shows anything, everyone says what they expect, and why. Reveal them together, then show what the model does and why. Every miss means someone's picture, or the model's, needs work: ask the person what they expected and why, and look for what they know that the model doesn't. Each miss becomes a feedback item (`FB-`), and either a correction or an explanation.

- **Ask before showing.** Once the model has run, a prediction tests memory, not understanding.
- **Choose scenarios where the agent is least sure,** and where people's pictures are likely to differ.

### Confidence check

A quick way to find where to dig. Read the spread, not the average: the one person who is unsure may know something the others don't. In the mock-up, the engineer who operates a sluice was the least sure of the rule for opening it, and was right to be.

### Fork

When the sources disagree, the model holds both readings and runs either. Show the same scenarios under both, side by side, so it's clear where the choice matters and where it doesn't. Collect leanings, hidden until all are in, then give the agent's leaning apart from the room's, and step back. The agent drafts the decision with both options and no option chosen; the room chooses on the card, and the model follows. A second fork, not yet discussed, stays visible until someone settles it.

### Checking sources

Point at any part of the model and trace it to the passages it cites. People who know the material give each citation a verdict, with a note. Verdicts needn't be hidden: they're about evidence, not opinion. A part citing nothing is an assumption until someone owns it; say so wherever it appears. This activity finds corrections the others miss, such as a figure that measures the wrong thing.

### Questions and decisions

Questions that can't be settled get a code, an owner and a status: open, answered or deferred. A proposal for the future becomes a deferred question or a decision for a later session, not a change to the model. Decisions go on `sb-choice` cards, opened with the question the group faced and closed with the answer and the reason, with the deciders' names.

## The round trip with the agent

When an activity needs the agent's view, [`sb-handoff`](../components/sb-handoff/manifest.md) carries it:

1. **The page writes the prompt:** the activity's code, the model's version, what people said and why (for a poll, `poll.describe()`), what's being asked, and where the reply goes.
2. **The driver copies it and pastes it to the agent.**
3. **The agent writes its reply as data,** never as page code: a script such as `replies.js`, keyed by code, holding the reply, any notes to individual answers, feedback items, or a draft decision.
4. **The page loads the replies** and shows each where it belongs: the summary in the hand-off, notes under each answer (`poll.notes`), a draft on an `sb-choice` card for the room to decide.

Batch the round trips: one per activity, not one per answer. Prepare the next activity while the room works through the current one.

Every reply is on the record: keep each as a source, following the [sources practice](sources.md), with `role` `answer`, `correction` or `decision` as fits.

## Driving attention

A room follows what moves. Use the [highlighting practice](highlighting.md) everywhere things relate, so pointing at one thing lights up the others: a reading and its columns in a comparison, a code and every place it appears, a person's badge and everything they contributed.

- **Show effects where people act.** A switch that changes something further down the page feels dead. Say what it did beside it, with a way to go and look.
- **Tour each activity, not only the page.** A short [`sb-tour`](../components/sb-tour/manifest.md) per section ("Walk me through") explains an activity as it's used, and its steps can light things up as they point at them.
- **Keep each view small** enough to read across a room: a handful of options, people and figures.

## Closing

Give the last section the outcome first:

- **What was decided,** with who and why.
- **What was corrected,** with the evidence and who supplied it, and the model's new version.
- **What's still open,** each with an owner.
- **The exit conditions,** each met or not, and if not, what's next.
- **How it worked,** asked of each person, so the next workshop runs better.

Then record it:

- **The journal** ([journal practice](journal.md)): a new version for the corrections, and an entry saying what the workshop changed and why.
- **The sources:** decisions, replies and comments saved as sources, so every change traces back to the session that made it.
- **The page itself** stays as it is, as the record of the session. A later session is a new page.

## Components at a glance

| Component | In a workshop |
|---|---|
| [`sb-notebook`](../components/sb-notebook/manifest.md) | The session's page: sections with who and when, filters by code, kind and person |
| [`sb-person`](../components/sb-person/manifest.md) | Everyone taking part, the agent marked; in other components' person slots |
| [`sb-poll`](../components/sb-poll/manifest.md) | Predictions, confidence checks and leanings, hidden until all are in |
| [`sb-handoff`](../components/sb-handoff/manifest.md) | Every round trip with the agent |
| [`sb-choice`](../components/sb-choice/manifest.md) | Decisions, drafted by the agent and made by the room |
| [`sb-scenario`](../components/sb-scenario/manifest.md) | The scenario a prediction is about |
| [`sb-source-trace`](../components/sb-source-trace/manifest.md), [`sb-source`](../components/sb-source/manifest.md) | Checking what a part of the model rests on |
| [`sb-callout`](../components/sb-callout/manifest.md) | The agent's suggestions to change course |
| [`sb-tour`](../components/sb-tour/manifest.md) | A walk through the page, or through one activity |
| [`sb-comments`](../components/sb-comments/manifest.md) | Comments on anything, from anyone |
