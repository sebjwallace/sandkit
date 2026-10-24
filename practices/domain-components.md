# Domain components

How to give a sandbox components of its own: parts of its surface that stand for something in its subject, such as an order card in a warehouse sandbox or a train on a departure board, written once and used wherever that thing appears. Many are best made by putting a few Sandkit components together, and that is encouraged. Read this when a piece of the surface is about to be written a second time.

## Why it matters

- **Economy.** Sandkit exists partly to keep the agent from spending tokens needlessly. Writing the same markup and wiring again spends them every time; reading one line about a part costs almost nothing. Reuse and composition are how a sandbox stays cheap to grow, for the same reason Sandkit's components are used through their manifests, never their source.
- **Consistency.** If an order looks the same everywhere, people learn it once. Change it in one place and every use follows.
- **Reuse.** A sandbox grows over many iterations and pages. Its own parts shouldn't be rebuilt each time.

## When to make one

Making one too early freezes a guess; making one too late spreads copies that drift apart.

**Make one when:**
- A second use appears, or is clearly coming: another chapter, another page.
- It stands for a thing in the subject that must look the same wherever it appears.

**Don't make one when:**
- It's used once. Write it in the page.
- Its shape is still settling. Wait until it has survived feedback, like any polish.
- A Sandkit component already does the job, set from the model. Check the catalog first.

## Cheapest first

Go only as far as the part needs:

1. **A function that returns HTML** for one thing, such as `orderCard(order)`. Many domain components stay here. Keep them in `parts.js`, beside `model.js`, and include it in the pages that use it.
2. **A custom element,** once the part has state or behaviour of its own, such as something to open or a choice to remember. Keep it in `components/<name>/<name>.js`, where ejected components go too.

## Composing from Sandkit

Often the best domain component is a few Sandkit components put together for one thing in the subject: a train as its `sb-id` code, an `sb-stamp` for its status and an `sb-stat` for its delay; a substation as an `sb-graph` of its lines beside an `sb-rule` for its limit. Make one whenever the same group appears in more than one place. It's where the most is saved, because the wiring is written once: which part of the model goes to which component, and which refs light which part.

```js
// A train wherever one appears: its code, its status as a stamp, its delay as a figure.
class DbTrain extends HTMLElement {
  set train(train) {
    if (!this.firstChild) this.innerHTML = '<sb-id></sb-id> <sb-stamp></sb-stamp> <sb-stat></sb-stat>';
    this.dataset.ref = train.id;
    this.querySelector('sb-id').code = train.id;
    Object.assign(this.querySelector('sb-stamp'), { label: train.status, tone: train.late ? 'bad' : 'good' });
    this.querySelector('sb-stat').stats = [{ id: 'delay', label: 'Delay', value: train.delay, unit: 'min', better: 'lower' }];
  }
}
customElements.define('db-train', DbTrain);
```

- **Sandkit's rule that components never reference each other binds Sandkit, not the sandbox.** The sandbox is where composition happens, and a domain component is part of the sandbox.
- **Use each Sandkit component through its manifest,** as the page would.
- **A function will do** when the components inside need only attributes and slots. Once they need properties set, such as lists of data, or events passed on, make it a custom element that sets them and routes `highlight` to them.
- **Build the inside once, then update it.** Setting new values on the same components lets them show what changed, as `sb-stat` marks a figure's change; drawing them afresh each time loses it.
- **Keep the parts recognisable.** A stamp inside a train still looks like a stamp, so people read it the same way everywhere.

## Keep them light

A domain component only saves tokens if it stays smaller than the copies it replaces.

- **The least that does the job.** A few lines of HTML in a function beat a custom element; a custom element beats a framework. No build step, no libraries.
- **Only the options its uses need.** Add one when a second use needs it, not in case one might. A component grown for every possible use costs more to read than writing the part out.
- **Compose before writing.** Where Sandkit has a component for a piece, use it rather than drawing that piece again by hand.
- **Read its line, not its code.** Once it's listed in `AGENTS.md`, use it from there; open the code only to change it.

## How they behave

The same principles as Sandkit's components, kept light:

- **Driven by the model.** A domain component shows what it's given and reports what viewers do as events. Rules, checks and calculations stay in `model.js`, so the model remains the one source of truth.
- **Built from anything.** Plain HTML, CSS and JavaScript, Sandkit components, or both (see above).
- **Pointable and findable.** Give each part that stands for a thing `data-ref` with its id, so highlighting, locating, comments and trace mode reach it. Parts a function returns are the sandbox's own parts, covered by `pointable`; a custom element offers `highlight` and `reveal` where it needs them, like Sandkit's. See the [highlighting practice](highlighting.md#your-own-parts).
- **Styled like Sandkit.** Colours from the `--sb-*` tokens, in `style.css` or the component's own file, with tones, lighting and corners as the [style guide](../STYLE.md) describes.
- **A look of its own, never a borrowed material.** A thing in the subject should be recognisable at a glance, the same everywhere. Don't dress it in one of Sandkit's materials: paper means source material, and an order card on paper would read as one.
- **Its own prefix, never `sb-`,** which belongs to Sandkit. A short prefix from the sandbox's name, the same for all of them: `wh-order-card` in a warehouse sandbox.

## Keeping track of them

- **List each in `AGENTS.md`,** under **This sandbox's components**, one line each: its name, where it is, and what it takes. A fresh agent reads the line, not the code.
  ```md
  - `orderCard(order)` in `parts.js`: an order as a card, its code as a pill and its status as a stamp.
  - `<wh-route>` in `components/wh-route/`: a delivery route, stops lit as the van reaches them. See its manifest.
  ```
- **A short manifest** for a custom element with more than a property or two, in the shape of Sandkit's.
- **Changes go in the journal,** since one edit changes every place the part appears (see the [journal practice](journal.md)).
- **If one looks general enough for any subject,** say so in the handover. It may belong in Sandkit, which welcomes hearing about parts sandboxes found themselves building again.
