# Fulfilment: stress-testing the principled model

A mock-up asking whether the ideas of `demos/lineage/` hold up in a harder domain: fulfilment inside one spare-parts warehouse that supplies rail maintenance depots. Kept apart from the lineage page and from `examples/supply-chain/`.

Open `index.html` by double-clicking it. `NOTES.md` records what each step taught us, including where the views hold, where they need extending and where they break.

## The idea

The departure board is a stateless function from a few facts to what's shown. A warehouse isn't: it has stock that runs out, orders competing for it, and a day that unfolds hour by hour. So a version here doesn't map facts to outputs; it runs a day. The page has two axes: the model's history (the lineage) and the warehouse's clock (the scrubber). Beside them, the maps of its two decisions: an order line's (with quantities as bands) and an order's. Under the stock, the ledger, checking the equation each version believes must balance.

## What's here

| File | What it is |
|---|---|
| `index.html` | The lineage as a tree, the selected version's warehouse and ledger at any hour, and the maps of the line's and the order's decisions. |
| `model.js` | The parts, the days, every version, running a version through a day, the ledger, and grouping each decision into its map's regions. |
| `style.css` | The page's look. |
| `NOTES.md` | Findings, step by step. |

It's a mock-up: plain HTML around Sandkit's shell and `sb-scrubber`.
