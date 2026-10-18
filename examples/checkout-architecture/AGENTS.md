# Working on this sandbox

A domain sandbox about how a shop's checkout is built, and Sandkit's example for finding and going to a part wherever it appears ([locating practice](../../practices/locating.md)). It follows [building a sandbox](../../practices/building-a-sandbox.md), except that, as an example inside Sandkit, it loads components straight from `../../components/` rather than copying them into `lib/`.

Use components through their manifests, never their source. Codes are issued in `model.js`: `PER` person, `SYS` software system, `CON` container, `CMP` component, `REL` relationship.

## Where it stands

- **Version:** 0.3.0
- **Chapters built:**
  1. The parts: the architecture as a C4 diagram to walk into, an outline of every part, and what crosses a selected part's edge. Names in the prose go to their part in the diagram.
  2. Placing an order: one checkout as thirteen messages, told as a walkthrough with the sequence and the architecture side by side; the architecture follows each message to the level where it can be seen, and pointing at a line's code lights every message along it.
  3. What's sent: the four messages that cross a network, as a walkthrough of the sequence beside each one's JSON, with the fields that matter spotlit and noted: money in pence, the order number born in Orders, the key that makes a retried charge safe.
- **Chapters planned:**
  4. Where it's kept: the shop database's tables.
  5. When payment fails: the unhappy path, and the order's life as a statechart.
- **Chosen direction:** none yet; waiting on the handover.
- **Open questions:**
  - Going away leaves no way back. Harmless on one page; worth answering once a jump switches chapters, or when cross-references arrive.
  - Chapter 3 assumes a saved card (`payment_method: pm_4242`) so the card number never reaches the shop; how it got saved isn't modelled.
  - Database calls are shown without their replies, to keep the conversation short. Is that clear enough?
  - The walkthrough has thirteen steps, one per message; its manifest suggests five to ten. Group them into stages if it feels long.
  - Words in the walkthrough's hidden steps carry `data-ref`, so they're found as places but can't be gone to: `sb-walkthrough` has no `reveal` yet (second wave).
