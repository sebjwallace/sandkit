# sb-code

Code, or pseudocode, walked through a step at a time: the line running now is marked, and the variables beside it show what each step changed. Use it wherever a sandbox explains a procedure: an algorithm, a calculation, a recipe followed to the letter.

The steps are a **trace** that the sandbox's model records as it runs: for each step, the line and the variables. The component shows the trace and lets people move through it, backwards as easily as forwards. It never runs code itself, so it works for any language or none, and what it shows is always exactly what the model did.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-code/sb-code.js"></script>

<sb-code controls></sb-code>

<script>
  const code = document.querySelector('sb-code');
  code.code = 'total = 0\nfor each n in numbers\n  total = total + n';

  // The model records each step as it runs.
  const trace = [];
  let total = 0;
  trace.push({ line: 1, variables: { total } });
  for (const n of [4, 7]) {
    trace.push({ line: 2, variables: { total, n } });
    total += n;
    trace.push({ line: 3, variables: { total, n }, note: `Added ${n}` });
  }
  code.trace = trace;
  code.addEventListener('sb-step', (e) => showElsewhere(e.detail.entry));
</script>
```

## Trace

Each entry of `trace` is one step:

| Field | Required | Meaning |
|---|---|---|
| `line` | yes | The line running at this step, counting from 1. |
| `variables` | no | `{ name: value }`: the variables to show, in order. Copy lists and objects as you record them (`[...list]`), so each step keeps its own values. |
| `note` | no | A sentence about this step, shown above the code. |

## Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `controls` | off | Shows buttons (first, back, forward, last), a slider and the step count. |
| `empty-text` | `No code yet.` | Shown when there's no code. |

## Properties

| Property | Meaning |
|---|---|
| `code` | The code, as text. Coloured by `syntax`, plus strings and numbers. |
| `syntax` | `{ keywords, literals, comments }`: how to colour the code (below). Fields left out keep their defaults. |
| `trace` | The steps, in order. Setting it keeps the step where it was, within the new trace. |
| `step` | Which step to show, counting from 0. Kept within the trace. Setting it doesn't fire `sb-step`. |
| `highlight` | `{ lines: [numbers], names: [variable names] }`: what to point at. A name lights every mention of it in the code, and its row beside it. |

Variables that changed since the step before, or are new, are marked, and hovering one shows what it was. Pointing at a variable, in the code or beside it, lights every mention of it while the pointer is there. Names in the code count as variables when they're in the current step's `variables`.

## Syntax

The code is coloured lightly, the same way for any language: comments, strings (in `"`, `'` or `` ` ``), numbers, keywords and literals. Words match whatever their case. The defaults suit pseudocode, JavaScript and Python:

```js
{
  keywords: ['if', 'then', 'else', 'elif', 'for', 'each', 'in', 'of', 'to', 'while', 'do', 'repeat', 'until', 'loop', 'break',
    'continue', 'return', 'function', 'procedure', 'def', 'let', 'const', 'var', 'and', 'or', 'not', 'is', 'begin', 'end',
    'class', 'switch', 'case', 'default', 'try', 'catch', 'throw', 'async', 'await'],
  literals: ['true', 'false', 'null', 'none', 'nil', 'undefined'],
  comments: ['//', '#']    // what starts a comment that runs to the end of the line
}
```

For a language of your own, such as a sandbox's DSL, extend them, since reading `syntax` gives the current words:

```js
code.syntax = { ...code.syntax, keywords: [...code.syntax.keywords, 'reorder', 'ship'], comments: ['--'] };
```

Keywords and literals aren't variables, so they can't be pointed at as one.

## Events

| Event | Detail | When |
|---|---|---|
| `sb-step` | `{ step, entry }` | A viewer moves to another step with the controls. Bubbles. |
| `sb-select` | `{ line }` | A line is clicked. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-muted`, `--sb-surface-2`, `--sb-accent`, `--sb-accent-soft`, `--sb-accent-text`, `--sb-good`, `--sb-warn`, `--sb-radius`, `--sb-font`.

Its own custom property: `--sb-code-height`, the code's greatest height before it scrolls (for example `260px`). The current line is kept in view.

Classes: `sb-code__bar`, `sb-code__button`, `sb-code__slider`, `sb-code__count`, `sb-code__note`, `sb-code__body`, `sb-code__code`, `sb-code__line` (`--current`, `--highlighted`), `sb-code__number`, `sb-code__text`, `sb-code__comment`, `sb-code__string`, `sb-code__number-literal`, `sb-code__keyword`, `sb-code__literal`, `sb-code__name` (`--variable`, `--highlighted`), `sb-code__variables`, `sb-code__variable` (`--changed`, `--highlighted`), `sb-code__empty`.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-timeline`](../sb-timeline/manifest.md),** to play the trace at a steady pace: a range from 0 to the last step, setting `step` on `sb-change`.
- **A picture of the data,** such as [`sb-table`](../sb-table/manifest.md) or [`sb-matrix`](../sb-matrix/manifest.md): on `sb-step`, show `e.detail.entry.variables` there too, so the code and the data move together.
- **[The highlighting practice](../../practices/highlighting.md).** Route `sb-highlight` refs to `highlight`, so the prose can point at lines and variables.

## Notes

- **The model is the source of truth.** The trace is recorded by the model, never written by hand, so the two can't disagree. Running real code to produce a trace automatically may come later, as a separate tool.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Renaming:** if another component on the page is already called `sb-code`, the console says so. Replace every `sb-code` in `sb-code.js` to give this copy a new name.
