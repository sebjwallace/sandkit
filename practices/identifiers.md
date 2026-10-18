# Identifiers

How to give the things in a sandbox short identifying codes, and use them consistently. Read this before building a sandbox's model, and before using [`sb-id`](../components/sb-id/manifest.md).

## Why codes matter

A sandbox is a conversation between people, agents and a model. Conversations go wrong when two parties mean different things by the same words. "The reorder rule" might be one of three rules; "the north store" might have been renamed. A code like `RUL-001` means exactly one thing, to everyone, for as long as the sandbox exists.

Codes make three things possible:

- **Unambiguous reference.** A person can say "RUL-001 looks wrong" and an agent knows precisely what to open. An agent can say "this behaviour comes from RUL-001" and a person can find it in seconds.
- **Traceability.** When the model's behaviour cites the codes of the rules, claims or sources it rests on, anyone can follow a behaviour back to its evidence and judge how far to trust it.
- **Quick lookup.** A code is short enough to scan, type and search for, in the sandbox, in notes, and in conversation.

## Format

Use `PREFIX-NUMBER`: a short uppercase prefix for the type of thing, a hyphen, and a number.

- **One prefix per type.** Choose prefixes that read naturally in the domain. Keep them to two to four letters.
- **Numbers are padded where order helps** (`RUL-001`), or short where there are only a few (`DC-1`). Pick one style per prefix and keep to it.
- **A letter suffix is fine for small, named sets** (`SUP-A`, `ST-N`) when the letters carry meaning.
- **Families of the same type get a prefix each.** When a sandbox has several sets of the same kind of thing, such as seven machines each with their own rules, give each set its own prefix (`INC-4`, `PAL-10`) rather than sharing one (`RUL-`). The prefix then says which set a code belongs to.

Example prefixes for different kinds of sandbox:

| Sandbox | Prefixes |
|---|---|
| Supply chain | `RUL` rule, `DC` distribution centre, `ST` store, `SUP` supplier, `SHP` shipment |
| Event-driven system | `SVC` service, `TOP` topic, `EVT` event type, `RUL` routing rule |
| Discovery of an unfamiliar domain | `CLM` claim, `QST` question, `ANS` answer, `SRC` source, `ASM` assumption |
| Physics or chemistry | `EQN` equation, `PAR` parameter, `RXN` reaction |

## Rules

- **Codes are stable.** Once issued, a code always refers to the same thing. Never renumber, and never reuse a code for something else, even after the original is removed. Retired codes stay retired.
- **Retired codes still answer.** Record each one in the model with the version that retired it and what replaced it, and answer for it in `sb-resolve`, so its pill says where it went instead of showing as unresolved. The [journal practice](journal.md) shows how.
- **Codes live in the model first.** Give each thing its code where it is defined, as data. Everything else (UI, logs, prose, conversation) refers to that.
- **Names can change; codes don't.** Show both where there is room: "Store North (`ST-N`)". The name is for reading, the code is for referring.
- **Don't encode meaning that may change.** `ST-N` is fine while stores are named by region; avoid codes like `ST-BUSY` that describe a state.
- **Issue codes for what people will discuss.** Rules, entities, claims and sources usually deserve codes. Momentary things, such as each individual step of a simulation, usually don't.

## Codes created while the sandbox runs

Some codes are issued by the sandbox itself, for example when a person writes their own rule.

- **Give them their own prefix,** so they are never confused with codes the model ships with (`YOU-1`, `YOU-2`).
- **Issue them from a counter that only goes up.** A deleted rule's code is retired, never reused, as for any other code.
- **Register the definition before showing the code.** A pill asks what its code means as soon as it appears, so the model must already know. If it can't, show the pill and then call its `refresh()`.
- **Decide whether they last.** If people's own rules should survive a reload, save them with the counter; otherwise they belong to the visit.

## Where codes appear

Everywhere the thing appears. A code that only exists in the model doesn't help anyone.

- **In the model:** as the `id` of each rule, entity, claim or source.
- **In the interface:** beside names, in detail panels, in tables and logs. Use `sb-id` so the code explains itself on hover.
- **In prose:** chapter text, explanations and notes cite codes inline.
- **In behaviour:** where the model acts on a rule, record which rule. "Store North ordered 63 (RUL-001)" is traceable; "Store North ordered 63" is not.
- **In conversation:** agents should name codes when explaining what the sandbox does or when proposing changes to it.

## Citing

Write the code exactly as issued, in its own right, without decoration: "The DC alternates suppliers (RUL-002)." In a sandbox's HTML, wrap it in `sb-id` so readers can see what it refers to:

```html
<p>The DC alternates its orders between suppliers (<sb-id code="RUL-002"></sb-id>).</p>
```

## Using sb-id

`sb-id` shows a code as a pill. Hovering or focusing it shows what it refers to; clicking it highlights every mention of the same code on the page.

The pill doesn't keep a list of definitions. It asks the sandbox, by firing a bubbling `sb-resolve` event, and the sandbox answers from its model. Add one listener for the whole sandbox:

```js
document.addEventListener('sb-resolve', (e) => {
  const thing = model.find(e.detail.code);
  if (thing) e.detail.definition = { kind: thing.kind, title: thing.name, description: thing.summary };
});
```

A code nothing answers for is shown as unresolved (dashed). Treat that as a broken reference to fix, not a style to work around.
