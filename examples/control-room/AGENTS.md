# Working on this sandbox

A domain sandbox about how the grid holds its frequency after its largest unit trips, and why the control room's new frequency screen is designed as it is. It is Sandkit's example for sources and traceability working end to end ([sources practice](../../practices/sources.md)). It follows [building a sandbox](../../practices/building-a-sandbox.md), except that, as an example inside Sandkit, it loads components straight from `../../components/` rather than copying them into `lib/`.

Use components through their manifests, never their source. Codes are issued in `model.js` (`ITEMS`): `PAR` parameter, `RUL` rule, `ASM` assumption, `REQ` what operators asked for, `SCR` a part of the new screen, `QST` an open question. Sources are `SRC-`, in `sources/catalogue.json`.

**Serve it from Sandkit's root,** since the page loads components from `../../`: `node tools/serve.mjs .`, then open `/examples/control-room/`. Opened by double-clicking, everything but Sources and Trace works, and those say why.

## Where it stands

- **Version:** 0.2.0
- **Chapters built:**
  1. The first seconds after a trip: the operator's screen as a wireframe, live from a frequency model; a calm day or a windy night, extra response booked from the screen or not, and the frequency after the trip against the 49.5 Hz limit.
- **Across chapters:** Sources in the header lists the catalogue (`sb-sources`); the header's mode picker offers Comment (`sb-comments`) and Trace (`sb-trace-mode`), where clicking any part with a code opens why it's there (`sb-source-trace`) in a modal, and a source opens on paper (`sb-source`) in a second modal over it.
- **The sources** are invented but realistic: an interview, the standard, a fault log, workshop notes and a sketch of the current screen, with an email waiting in the inbox. PAR-2 cites "falls below 49.2 Hz", which isn't in the interview, on purpose, so the not-found marking and `tools/sources.mjs check` have something to find.
- **Chapters planned:**
  2. Why the screen is as it is: each part of the screen beside the requirements and evidence behind it.
  3. What could go wrong: providers refusing a booking (the inbox email), and the open question of predicting the floor.
- **Chosen direction:** none yet; waiting on the handover.
- **Open questions:**
  - The physics is one number for the whole grid, and "twice as fast on windy nights" rests on six trips (ASM-1). Good enough for the screen's story; not for real decisions.
  - Trace mode is wired in the page; Sandkit plans to make modes components the shell hosts, and this page will move to them.
