# Working on this sandbox

A domain sandbox about how a shop's checkout is built, and Sandkit's example for finding and going to a part wherever it appears ([locating practice](../../practices/locating.md)). It follows [building a sandbox](../../practices/building-a-sandbox.md), except that, as an example inside Sandkit, it loads components straight from `../../components/` rather than copying them into `lib/`.

Use components through their manifests, never their source. Codes are issued in `model.js`: `PER` person, `SYS` software system, `CON` container, `CMP` component, `REL` relationship.

## Where it stands

- **Version:** 0.1.0
- **Chapters built:** 1 · The parts: the architecture as a C4 diagram to walk into, an outline of every part, and what crosses a selected part's edge.
- **Chapters planned:**
  2. Placing an order: one checkout stepped through as a sequence, each message lighting its line in the diagram.
  3. What's sent: the request and reply of each message, as JSON.
  4. Where it's kept: the shop database's tables.
  5. When payment fails: the unhappy path, and the order's life as a statechart.
- **Chosen direction:** none yet; waiting on the handover.
- **Open questions:**
  - Going to a part the diagram hasn't drawn (inside a box not entered) lands on the outline; the diagram only marks the box holding it. Should `goTo` ask components with `reveal` when a ref isn't on the page?
  - A name in the prose marked with `data-ref` would be the first place found, so `goTo` would go to the word just clicked. The prose uses `data-go` instead. Should the practice say so, or `goTo` skip the place it came from?
