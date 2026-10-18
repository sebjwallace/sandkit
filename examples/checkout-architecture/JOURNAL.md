# Journal

What changed in this sandbox, and why: one entry per change, newest first, only ever added to. Each entry is a version. See the [journal practice](../../practices/journal.md).

## 0.7.0 · 2026-10-18 · Added

**Changed:** A six-step tour (`sb-tour`), started from "Take the tour" in the header: the shop in the diagram, Payments in the outline, the details panel (waiting until a code is clicked), and the charge in chapter 2's sequence, opening the folded branch and the closed chapter on the way. A step naming a view (`data-in`) goes to the place inside it.
**Why:** A first visit needs to know where to look, and the tour tests going to a part through every kind of hiding place this sandbox has.
**Open:** None new.

## 0.6.0 · 2026-10-18 · Added

**Changed:** Clicking any code opens a cross-reference beside the page: everywhere the thing appears, in any chapter, grouped by chapter and view, with places in closed chapters marked and those in a walkthrough's other steps listed but not gone to; and what the model links it to (`linksOf`), walkable with a trail and Back.
**Why:** One part shows up in up to five views here, which is what cross-references are for. It also answers the open question of a way back after going somewhere.
**Open:** Parts inside a box the diagram hasn't entered aren't drawn, so aren't listed there.

## 0.5.0 · 2026-10-18 · Added

**Changed:** Chapter 5, when payment fails: a second conversation in the model, the same as placing an order up to the charge, then declined (`MSG-14` to `MSG-21`), with its two writes putting the stock back and marking the order failed. Shown as a walkthrough of the sequence beside the rows it undoes, ending with a lost reply and the idempotency key from chapter 3.
**Why:** What a system undoes when something fails shows its design as much as the happy path does, and it ties up the pending order and the retry key left open earlier.
**Open:** Chapter 5's sequence numbers messages by position, not by code.

## 0.4.1 · 2026-10-18 · Fixed

**Changed:** In chapter 4, pointing at a table or field in a step lights it in the rows as well as the diagram.
**Why:** It lit only the diagram, so the rows beside it seemed not to respond.
**Open:** None.

## 0.4.0 · 2026-10-18 · Added

**Changed:** Chapter 4, where it's kept: the Shop database's tables and starting rows in the model, with every write the order makes tied to its message (`MSG-4`, `MSG-6`, `MSG-11`) and replayed one at a time; shown as a walkthrough of the tables' diagram beside their rows.
**Why:** What's written is all the shop remembers once the shopper has gone, and the pending order after `MSG-6` sets up what chapter 5 asks.
**Open:** None new.

## 0.3.0 · 2026-10-18 · Added

**Changed:** Chapter 3, what's sent: the payloads of the four messages that cross a network (`MSG-2`, `MSG-8`, `MSG-9`, `MSG-12`), in the model with the fields that matter and a note on each, shown as a walkthrough of the sequence beside the JSON.
**Why:** The conversation says who talks to whom; the payloads show what one order looks like as it passes through, and why some fields are there.
**Open:** The saved card behind `payment_method` isn't modelled.

## 0.2.1 · 2026-10-18 · Fixed

**Changed:** The page takes the whole window; paragraphs keep their readable width.
**Why:** Capped at 1200px, the walkthrough squeezed both diagrams, hiding much of each.
**Open:** Whether viewers should choose the page width themselves, in the shell's settings.

## 0.2.0 · 2026-10-18 · Added

**Changed:** Chapter 2, placing an order: one checkout as thirteen messages (`MSG-1` to `MSG-13`), each travelling along a relationship, told as a walkthrough with the sequence and the architecture side by side, the architecture following each message to the level where it can be seen. Chapters are now tabs.
**Why:** The architecture says who can call whom; the conversation shows what actually happens when someone pays, and in what order.
**Open:** Database calls are shown without their replies.

## 0.1.1 · 2026-10-18 · Fixed

**Changed:** Names in the prose go to their part in the diagram, walking in when it isn't drawn, rather than to the first place the part appears (usually the outline).
**Why:** The prose is about the diagram, and the diagram's own `reveal` already goes there. The locating practice's `goTo` is for when a sandbox doesn't know where a thing is, and now says so. The words keep their target in `data-go`, so they're never found as places themselves.
**Open:** Going away leaves no way back.

## 0.1.0 · 2026-10-18 · Added

**Changed:** First iteration: the checkout's architecture as a model with codes, and chapter 1, the parts, as a C4 diagram, an outline and the selected part's connections. Names in the prose go to their part.
**Why:** To see how a checkout is built, and to try the locating practice on a sandbox where one part shows up in many views.
**Open:** Going to a part the diagram hasn't drawn; prose names that would find themselves first (see Where it stands in `AGENTS.md`).
