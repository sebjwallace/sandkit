# sb-matrix

A matrix, or a vector (a matrix with one column), shown as a block of numbers in brackets. It sits inline in a sentence or on its own line. Entries can be made editable, whole rows or columns can be coloured, and rows, columns or single cells can be highlighted, so the numbers can point at what they mean elsewhere in the sandbox.

Use this component through the interface below. You don't need to read its source.

## Usage

```html
<script src="components/sb-matrix/sb-matrix.js"></script>

<p>The matrix <sb-matrix id="a" name="A" editable></sb-matrix> sends î to its first column.</p>

<script>
  const a = document.getElementById('a');
  a.values = [[1, 1], [0, 1]];
  a.tones = { columns: ['good', 'bad'] };
  a.addEventListener('sb-change', (e) => model.setMatrix(e.detail.values));
</script>
```

For a vector, give a flat list: `vector.values = [2, 1]` is the column vector with entries 2 and 1.

## Attributes

| Attribute | Meaning |
|---|---|
| `name` | Shown before the brackets, as in "A = …". |
| `editable` | Turns each entry into a number field. |
| `step` | The step for editable entries, such as `1` or `0.5`. Default: any number. |

## Properties

| Property | Meaning |
|---|---|
| `values` | Rows of numbers, `[[1, 0], [0, 1]]`, or a flat list for a column vector. Getting it returns a copy, always as rows. |
| `tones` | `{ rows: [tone, …], columns: [tone, …] }`: colours for whole rows or columns. Columns take precedence. Tones are `accent`, `good`, `warn`, `bad` and `muted`. |
| `highlight` | `{ rows: [i, …], columns: [j, …], cells: [[i, j], …] }`: what to point at. Indexes count from 0. |

## Events

| Event | Detail | When |
|---|---|---|
| `sb-change` | `{ row, column, value, values }` | An editable entry is changed to a number. Bubbles. |

## Styling

Theme tokens: `--sb-text`, `--sb-bg`, `--sb-border`, `--sb-accent`, `--sb-accent-soft`, `--sb-good`, `--sb-warn`, `--sb-bad`, `--sb-muted`.

Classes: `sb-matrix__name`, `sb-matrix__grid` (its brackets are drawn with `::before` and `::after`), `sb-matrix__cell` (with `--highlighted`), `sb-matrix__input`. Tones are classes too, such as `sb-matrix--good`.

The matrix is `inline-flex` by default, so it sits in a line of text; give it `display: flex` to place it on its own.

## Works well with

Suggestions only: nothing here is wired in. The sandbox composes these itself.

- **[`sb-plane`](../sb-plane/manifest.md),** to show a transformation's matrix beside it. Colour the columns `good` and `bad` to match the plane's î and ĵ, and set the plane's `matrix` from `sb-change`.
- **Prose,** wherever a vector or matrix is mentioned, inline in the sentence.

## Notes

- **Numbers are shown as people write them:** with a true minus sign, to at most two decimal places. Editable fields show the plain number.
- **Editing updates in place,** so a field keeps its focus while being typed in. An entry that isn't a number yet, such as a lone "-", is ignored until it is one.
- **Not yet:** symbolic entries (letters such as *a* and *b*) and row or column headings.
- **Dependencies:** none.
- **Export:** safe for single-file export. Classic script, no fetches, no external assets.
- **Accessibility:** the matrix is a labelled group, and each entry is labelled by its row and column.
- **Renaming:** if another component on the page is already called `sb-matrix`, the console says so. Replace every `sb-matrix` in `sb-matrix.js` to give this copy a new name.
