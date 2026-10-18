# Working on this sandbox

A domain sandbox about how a shop's checkout is built, and Sandkit's example for finding and going to a part wherever it appears ([locating practice](../../practices/locating.md)). It follows [building a sandbox](../../practices/building-a-sandbox.md), except that, as an example inside Sandkit, it loads components straight from `../../components/` rather than copying them into `lib/`.

Use components through their manifests, never their source. Codes are issued in `model.js`: `PER` person, `SYS` software system, `CON` container, `CMP` component, `REL` relationship.

## Where it stands

- **Version:** 0.6.0
- **Chapters built:**
  1. The parts: the architecture as a C4 diagram to walk into, an outline of every part, and what crosses a selected part's edge. Names in the prose go to their part in the diagram.
  2. Placing an order: one checkout as thirteen messages, told as a walkthrough with the sequence and the architecture side by side; the architecture follows each message to the level where it can be seen.
  3. What's sent: the four messages that cross a network, each one's JSON beside the sequence, with the fields that matter spotlit and noted.
  4. Where it's kept: the shop database's tables beside their rows, the three writes the order makes replayed one at a time, with the cells each changes marked.
  5. When payment fails: the declined conversation from the charge on, beside the rows it undoes, ending with what a lost reply and the idempotency key mean.
- **Across chapters:** clicking any code opens a cross-reference (`sb-xref`) floating beside the page: every place the thing appears, in any chapter, and what the model links it to (a part's place and lines, a line's ends and messages), with a trail and Back.
- **Chapters planned:** none. The first plan is complete.
- **Chosen direction:** none yet; waiting on the handover.
- **Open questions:**
  - Chapter 3 assumes a saved card (`payment_method: pm_4242`) so the card number never reaches the shop; how it got saved isn't modelled.
  - Database calls are shown without their replies, to keep the conversation short. Is that clear enough?
  - Chapter 2's walkthrough has thirteen steps and chapter 5's eleven; the walkthrough manifest suggests five to ten. Group them into stages if they feel long.
  - Chapter 5's sequence numbers messages by position, so `MSG-17` shows as 12. Chapter 2's numbers happen to match its codes.
