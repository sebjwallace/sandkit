# Pages

How a sandbox grows into several pages that share one model, and how any page is exported as one HTML file that runs anywhere. Read this when a sandbox gets heavy, when a part of it is worth sharing on its own, or when someone asks for an export.

## Why pages

A whole sandbox can grow large, with data, images and many chapters, and often only one part needs sharing. Picking a piece of one page and working out what code and data make it run isn't reliable: the page script ties everything together. A page solves it. Each HTML file already declares everything it needs in its script, stylesheet and image tags, so exporting a page means putting in exactly what it points to, and nothing from other pages comes along.

Single-page sandboxes are fine. Split when a sandbox grows heavy, or when a part is worth sharing alone: a chapter, a topic or a view. Tabs are still fine inside a page.

## The shape

```
my-sandbox/
  index.html        the first page: where to start
  pricing.html      a page per part worth sharing on its own
  stock.html
  sandbox.js        the sandbox's name, goal and pages
  model.js          the domain model, shared by every page
  style.css         shared styles
  data/prices.js    data the model needs, as scripts
  images/…
  sources/…         raw source material, never loaded by pages
  lib/sandkit/…     Sandkit, copied in
```

- **One model, shared.** Every page includes `model.js`. A page may add a small model of its own, but the main model is common.
- **Each page includes what it uses, and only that:** the shell, the components on that page, `sandbox.js`, `model.js`, and the data files it needs. That's what makes a page exportable alone.
- **Data as scripts, never fetched.** Browsers block `fetch` from a page opened by double-clicking it, so data the pages use lives in `.js` files that set it for the model (`window.prices = [...]`), included with a script tag. Raw material in `sources/` is never loaded by pages.

## sandbox.js

The name, goal and pages live in one file that every page includes, so adding a page never means editing every other one. It belongs to the sandbox, unlike the shell in `lib/sandkit/`, which is replaced when Sandkit is updated.

```js
// This sandbox's shared settings: its name, goal and pages. Every page includes this file.
document.addEventListener('DOMContentLoaded', () => {
  const shell = document.querySelector('sb-shell');
  shell.heading = 'Supply chain sandbox';
  shell.goal = 'Understand how goods get from suppliers to customers.';
  shell.pages = [
    { href: 'index.html', title: 'Start' },
    { href: 'pricing.html', title: 'Pricing' },
    { href: 'stock.html', title: 'Stock' }
  ];
});
```

The shell shows the pages as navigation in its header, marking the current one. A page with header content of its own shows that instead of the goal.

## Adding a page

1. **Copy `lib/sandkit/templates/page.html`** into the sandbox folder under the new page's name.
2. **List it in `sandbox.js`.**
3. **Include only what it uses.** With Node, `node <sandkit>/tools/setup.mjs <sandbox-folder> sb-log --page stock.html` copies a component in and adds its tag to that page.

## Exporting a page

Every page's header has an Export button. It tells people what an export is, lets them leave out images, and gives them a prompt to copy to you. A page opened from the computer can't read its own files, so exporting is the agent's job:

```sh
node lib/sandkit/tools/export.mjs pricing.html                 # → export/pricing.html
node lib/sandkit/tools/export.mjs pricing.html --no-images     # images left out
node lib/sandkit/tools/export.mjs . --all                      # every page
```

Run it from the sandbox folder. It puts every script, stylesheet and image the page points to inside one file, marks the shell as exported (with the date, the sandbox's version from `JOURNAL.md` and Sandkit's), and the exported page shows its other pages as not included, so nothing leads to a broken link.

**Report what went out.** Tell the person where it saved, list every file that went in with its size, and pass on every warning. The list is how they check they're sharing only what they mean to.

**Warnings to act on, not hide:**
- **A file named in code** (an image path in `model.js`) isn't included. Load it with a tag the export can follow, or as data in a script.
- **`fetch` or `XMLHttpRequest`** won't work in the export. Load the data as a script instead.
- **Remote URLs** are left as links, so the export needs the internet.
- **A file over 10 MB** may be too big to email. Offer to leave out images.

## What doesn't cross pages yet

Cross-references, tours and comments work within a page. State starts fresh on each page, since the model is created anew, which suits sandboxes: each page is a place to start from.
