# Sandkit

**Understand almost anything by exploring it.**

We tend to understand complicated and complex things not by reading about them but by working with them: trying something, adjusting it, seeing what happens, and trying again until it makes sense.

Sandkit is a toolkit for **domain sandboxing**: building small, interactive models that let you explore a subject by working with it directly. The subject might be how water moves through a river catchment, how a warehouse decides what to ship first, how information spreads through a network, or how an ocean current might behave under a changing climate. If it can be described, it can be sandboxed.

---

## Why this exists

We depend on systems we cannot see inside: supply chains, ecosystems, economies, the software woven through daily life. For most people, most of the time, they are black boxes. We now live in a world where AI produces more black boxes. Transparent glass boxes are what we need if we are to trust and navigate the world around us.

AI ought to help bring transparency, and in one sense it does. It can read a great deal of material and produce an analysis in minutes. But what it returns is usually a wall of text, and a wall of text is simply another black box. The understanding exists somewhere in those pages, but it has not yet reached the reader.

Domain sandboxes close that gap. Rather than reading about how something works, you engage with it: test ideas against it, see it demonstrated, challenge it, experiment with it, refine it, have fun with it, and find some truth from it. The aim is to keep people genuinely in the loop as the world grows more complex, able to see, question and steer the systems around them rather than take them on blind trust.

## What a domain sandbox is

A domain sandbox is a small, self-contained application that houses an interactive model of a subject, along with everything needed to explore it.

The **model** is the core: the subject captured as code that runs. It expresses the rules, the moving parts, the cause and effect. Code alone is as opaque as anything else, so the sandbox surrounds it with things you can see, handle and experiment with: simulations, controls, scenarios to play out, tables that highlight which rule has just applied, diagrams that respond as the model changes.

Alongside these sit the explanation, the sources, and whatever else helps. A sandbox can be organised into chapters, so a subject is worked through one stage at a time, much as a well-designed game introduces one idea before the next.

AI does most of the building. You do the exploring, the questioning and the steering.

## From black box to glass box

- A **black box** is anything you cannot see into: a subject, a system, or a long AI report you have not absorbed.
- A **sandbox** is how you look inside.
- A **glass box** is the result: the same subject, now clear to you.

Nothing about the subject changes. What changes is how much of it you can see.

## Why exploration works

Learning by doing is how people have always come to grips with difficult things. Scientists build simulations to test what they cannot test on the real thing. People spend hours with games that are, underneath, detailed models of cities, ecosystems or economies, enjoying every minute and coming away understanding them more deeply than any textbook achieved.

Exploration also offers something reading rarely does: surprise. Adjust a working model and it will sometimes behave in a way nobody anticipated, not you, not the AI, not the sources. Those moments are a pleasure to watch, and often the first sign of something genuinely new. A document can only tell you what its author already knew; a model can reveal what no one has yet noticed.

## Getting started

You don't need to be a programmer to build a sandbox. You need curiosity about a subject, and an AI assistant that can work with files on your computer.

1. **Install an AI assistant that can work with files.** [Claude Code](https://claude.com/claude-code) is one. Any assistant that can read and write the files in a folder will do.
2. **Make a new folder** for your sandbox, and open the assistant there.
3. **Ask for the sandbox you want,** and point it to Sandkit:
   > Using Sandkit (https://github.com/sebjwallace/sandkit), build me a sandbox to explore how a city's water supply works, from reservoir to tap.
4. **Open `index.html`** in your web browser when it is ready. The first version is deliberately small: the model and a first chapter, with a few suggestions for where it could go next. If the sandbox shows its source material, ask the assistant to serve it, and open the address it gives instead: a page opened straight from your computer can't read the sandbox's own files.
5. **Steer it from there.** Play with it, and keep talking to the assistant: ask why something happens, say where it seems wrong, choose what to explore next. The sandbox grows one step at a time, in the direction your understanding takes it.

Some starting points, to show the range:

- "…how the immune system responds to a new infection."
- "…how a bill becomes law, and where it can stall."
- "…how a mortgage is paid down over thirty years, and what overpaying changes."
- "…how a forest recovers after a fire."
- "…how heat moves through a house in winter."
- "…how messages flow through our order system, using these design documents."

Bring your own material where you have it: documents, data, notes from conversations. The assistant builds the model from what you give it, so the better the material, the better the sandbox.

**What happens behind the scenes.** The assistant reads Sandkit's [guide to building a sandbox](practices/building-a-sandbox.md), chooses the components the subject needs, and copies them into your folder alongside the sandbox itself. Your sandbox is entirely self-contained: nothing to install, nothing fetched from the internet, and it keeps working exactly as it is while Sandkit moves on. When you want newer components, ask the assistant to update them.

## Building a sandbox

**Begin with a question.** What do you want to understand, decide or discover? That question shapes everything that follows, so state it clearly and keep it visible to everyone involved, people and AI alike.

**Gather what is known.** Documents, data, articles, conversations, and the knowledge of people close to the subject. Both variety and quality matter, because a sandbox can only be as good as the material behind it.

**Let AI build a first version,** then play with it. Push on it, test it, try to break it. You will soon find places that feel wrong or incomplete, or that raise a question you cannot yet answer. Investigate, bring back what you learn, and build again.

Each round improves two things: how much of the subject the sandbox **covers**, and how much of what it covers is **correct**. Neither needs to be perfect; both need only be good enough for the question at hand. Judging when that point has been reached is part of the craft.

## Sharing a sandbox

A sandbox is a folder of plain files that opens in any web browser, with nothing to install. It can be zipped and sent, or opened in a meeting. Any page of it can also be exported as a single HTML file that still runs, ready to send in a message, attach to an email or put on a website: press Export on the page, and ask the assistant with the prompt it gives you. Only that page goes in, so a large sandbox can be shared a part at a time.

This is where sandboxes prove most valuable. Put several people in front of the same working model and let them experiment together. Disagreements that would have stayed vague in conversation become concrete and testable. The model is challenged and corrected, everyone sees the correction, and understanding moves forward together. Each person's picture of the subject shapes the model, and the model in turn reshapes their picture, until the people and the model are in agreement. To run a session like this, ask the assistant to workshop the sandbox with the people who know the subject: it follows Sandkit's [workshops practice](practices/workshops.md), from preparing the session to recording what it decided.

Once a sandbox has served its purpose, the model need not stay within it. Because it is a clear, working description of how something behaves, it can become the basis for other things: a specification, a real system, a teaching resource. Equally, it may simply have done its job, since understanding is a worthwhile outcome in itself.

## How far to trust it

That depends on the sandbox's purpose.

- **For intuition.** Sometimes the goal is a feel for how something works, such as how fluids move or how a processor handles data. Here the model need only behave believably.
- **For decisions.** When people will act on what a sandbox shows, it must be well grounded, and that grounding must be something they can verify.
- **For exploring possibilities.** Some of the most exciting sandboxes take a model beyond what has actually been observed, to see what might happen. These are powerful, provided everyone treats their output as possibilities rather than predictions.

### Showing the working

A trustworthy sandbox makes clear where everything came from. Any behaviour in the model should lead back to the evidence behind it, so that anyone can judge whether it rests on solid ground or on guesswork. Short identifying codes make this practical, letting people and AI refer to exactly the same claim, question or source without ambiguity.

Sandkit's [sources practice](practices/sources.md) keeps this record. The material a sandbox is built from is kept beside it and catalogued, every rule, figure and assumption in the model cites the passages it rests on, and anything on the page can be traced back to them: click a button, ask why it's there, and follow the reasoning to the very words of an interview or a standard. Gaps show too: something resting on nothing cited is marked as such. A journal of every change, and why, means whoever takes up a sandbox later knows what is understood, what is still open, and where to begin.

## What is in this repository

Sandboxes for very different subjects tend to need the same kinds of pieces: logs, parameters, identifying codes, charts, diagrams. Sandkit provides these as ready-made parts, so each sandbox can concentrate on its subject rather than its scaffolding. An agent uses each part through its manifest, a short contract, rather than reading its code, so the work that went into a part is spent once and costs little each time it's reused.

```
sandkit/
  CATALOG.md        everything on offer, one line each: start here
  AGENTS.md         how agents work on Sandkit itself
  practices/        guides to doing things well, starting with building a sandbox
  components/       reusable building blocks, each in its own folder with a demo
  shell/            the environment around a sandbox: header, settings, theming
  templates/        the starting point for a new sandbox
  tools/            optional helpers, such as setting up a sandbox in one command
  examples/         complete sandboxes, built with the parts above
  test/             the test runner, and tests that span the whole library
  CHANGELOG.md      what changed in each release (components keep their own)
  DECISIONS.md      the decisions behind Sandkit, and why
  STYLE.md          how components look, so they look like one kit
```

**Components** are the parts you see and work with. They give you and the AI a shared, visual way to engage with a model, rather than exchanging only text. Each finished component has a demo that shows it at work and explains where it helps.

**Practices** teach an AI, and anyone else, to do the things around the components well: building a sandbox from start to finish, or using identifying codes consistently.

Each component comes with a short description of how to use it, its manifest, which the AI reads in place of the code itself. This keeps the work quick and economical. If you want a component to behave differently, take your own copy and change it as you wish. Nothing here locks you in.

### How components are built

For contributors:

- **Keep it small.** Plain JavaScript, or a very small library only where there is no reasonable alternative. No build tools and no installation.
- **Keep it independent.** Each component works on its own when copied into a sandbox. A little repetition is acceptable, as simplicity matters more here than tidiness.
- **Keep it contained.** No global variables and nothing leaking out to clash with anything else. Each component's tag name begins with `sb-`.
- **Communicate through the interface.** Components receive data and emit events. They never reach into one another or into the page.
- **Never depend on one another.** Components are combined in the sandbox, not inside each other. A component that should hold the sandbox's content offers a slot, and its manifest can suggest good pairings in words.
- **Let sandboxes set the style.** Colours and fonts are supplied by the sandbox through CSS custom properties.
- **Survive packaging.** Every component must continue to work when an entire sandbox is packaged into a single file.
- **Test simply.** Each component has a test page that runs in a browser, with no test framework.
- **Reveal, do not merely display.** This is the most important test. A table that lists rules displays; a table that highlights the rule which has just fired, and shows why, reveals.

## What it is not

- **Not production software.** Sandboxes are meant to be light, quick and disposable, closer to a sketch than a finished structure.
- **Not a way to consume AI needlessly.** Done well, sandboxing conserves effort: reusable parts mean less rebuilding, and a few minutes of exploration can replace pages of explanation that go unread. If a plain paragraph would do, write the paragraph.
- **Not a replacement for judgment.** Whoever builds a sandbox chooses the question, the sources, and how far to trust the result.
- **Not a rulebook.** Sandboxing is a craft. What is offered here are patterns and parts to build with, not instructions to follow.

## Where this comes from

Sandboxing draws on a long tradition of learning through play and exploration: simulation games, cellular automata, and the intricate patterns of reaction-diffusion models. It borrows the idea of a domain model from software design. It also shares a spirit with explorable explanations, the interactive essays of people such as Bret Victor and Nicky Case, which showed how much more one understands when able to reach in and move things.

What is new is the partnership. AI builds the model from real source material, often in subjects nobody has fully mapped, and can drive the sandbox to demonstrate things while explaining them. The people involved remain firmly in charge of what it all means.

## Early days

This is a young method, and much remains to be learned about where it excels and where it struggles. If you try it, we would welcome hearing how it went: what worked, what did not, and what you discovered along the way. See [CONTRIBUTING](CONTRIBUTING.md).

## Licence

The code is under the [MIT Licence](LICENSE). Each component carries a one-line licence note so that it travels with the code. The writing, skills and knowledge scheme are under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): use them freely, with attribution.
