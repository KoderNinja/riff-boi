---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Tap a button, play a note, and see which note Riff Boy hears**
  Becomes usable: A running Riff Boy page (black and red) with a Recording screen. Tap New Riff, allow the mic, play one note, and its name (e.g. "A2") and pitch show on screen live.
  Why now: This is the riskiest part: the mic, the Web Audio API and loading Pitchy from the CDN. If any of it doesn't work the way the spec assumed, we want to know on day one. It also sets up the project (files, local server) as part of making something real.
  PRD ref: `prd.md > Starting a Riff`, `prd.md > Live Note-to-Tab`
  Spec ref: `spec.md > Stack` (verify Pitchy loads early), `spec.md > Audio Listener (audio.js)`, `spec.md > Note Detector (notes.js)` (frequency → note only), `spec.md > File Structure`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Create `index.html`, `css/style.css` (color variables, dark mobile-first base), `js/app.js`, `js/audio.js` (default input, AnalyserNode, ~60 readings a second, Pitchy from jsDelivr), and `js/notes.js` (clarity/volume limits, guitar range, frequency → note name and MIDI number). Show the current note on the Recording screen with a Stop button that stops listening.
  Verify (mechanical): Serve with `python3 -m http.server 8000`, load the page in the browser pane and confirm no console errors and that Pitchy imports; run a Node check that known frequencies map to the right notes (110 Hz → A2, 82.4 Hz → E2, 329.6 Hz → E4); feed a test tone into the page in place of the mic and confirm the right note name appears.
  Learner check: Run the server, open http://localhost:8000 in Chrome, tap New Riff, allow the mic, and play a few single notes (open low E, 5th fret A string…). Does the note name on screen match what you played?
  Commit: `Set up Riff Boy and detect live notes from the mic`

- [x] **2. Play a riff and watch the tab build up live**
  Becomes usable: The core idea works: play single notes and each one appears as a fret number on a six-line tab, left to right in the order played. Held notes stay one note; picking the same note again adds a new one.
  Why now: This is the unique kernel ("I play a riff and the tabs just show up"). It comes right after the audio works, so everything after it is built around a working kernel, not the other way round.
  PRD ref: `prd.md > Live Note-to-Tab`, `prd.md > The Core Journey` (step 3)
  Spec ref: `spec.md > Note Detector (notes.js)` (new-note logic), `spec.md > Position Rule and Tab Drawing (tab.js)`, `spec.md > Data Model` (note shape)
  Build: Add new-note detection to `notes.js` (after quiet, pitch change held for a few readings, volume jump). Create `js/tab.js` with the standard-tuning position rule (first note lowest fret, then closest fret to the previous note, tie → lower string) and six-line monospace tab drawing that scrolls sideways. Keep the notes of the current riff in memory with `t` times.
  Verify (mechanical): Node check that the position rule always returns a real, playable spot (every MIDI note 40–86, fret 0–22) and follows the closest-fret rule for a known sequence; feed a sequence of test tones in the browser (including a repeated note with a gap) and confirm the right fret numbers appear in order.
  Learner check: Play a short single-note riff you know. Do the notes appear in order, live, while you play? Are the fret positions playable, even if they're not exactly where you played them? (This is the early feedback checkpoint: tell me anything about how it feels that should change the rest of the build.)
  Commit: `Turn detected notes into live tab`

- [ ] **3. Stop, save, and find your riff on the home screen**
  Becomes usable: The full core journey: home screen with Latest Riffs (newest first) and New Riff → record → Stop → "Saving…" confirmation → back home with the riff on top. Tapping a riff opens its tab. Riffs survive closing and reopening the browser. Empty list says "No riffs yet"; stopping with no notes saves nothing and says so.
  Why now: Once the kernel works, saving is what makes a captured riff safe, which was your reason for the home list. It depends on the note shape from slice 2.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Stopping and Saving`, `prd.md > Latest Riffs List`, `prd.md > States and Boundaries` (first use, persistence)
  Spec ref: `spec.md > App Shell and Screens`, `spec.md > Latest Riffs Screen`, `spec.md > Saving and Storage (storage.js)`, `spec.md > Saving Confirmation`, `spec.md > Riff View`, `spec.md > Data Model`
  Build: Create `js/storage.js` (`riffboy.riffs` in localStorage, newest first, date/time label). Add the four screens to `index.html` and screen switching in `app.js`: Latest Riffs list, Recording, Saving confirmation (~1.5 s), Riff View using the same tab drawing as Recording. Pick the heading font with the learner.
  Verify (mechanical): In the browser pane, record a riff from test tones, press Stop, confirm the confirmation text, the riff at the top of the list and the saved JSON in localStorage; reload and confirm it's still there; open it in Riff View; stop with no notes and confirm nothing is saved.
  Learner check: Record two riffs, then close the tab and reopen http://localhost:8000. Are both there, newest on top? Tap one: is its tab the one you played?
  Commit: `Save riffs and show them on the home screen`

- [ ] **4. Pick your audio interface, and hear about it when Riff Boy can't hear you**
  Becomes usable: A dropdown on the home screen to choose the mic or your audio interface, remembered between visits (falls back to the default if it's unplugged). The Recording screen shows "Can't hear your guitar" if the mic is blocked or no clear note comes in within about 5 seconds, and hides it once a note is caught.
  Why now: These make the core journey reliable with your real setup. They come after the kernel works, and before tuning, so tuning happens through the interface you'll demo with.
  PRD ref: `prd.md > Screens and Layout` (input picker), `prd.md > States and Boundaries` (can't hear, mic permission)
  Spec ref: `spec.md > Input Picker (audio.js + home screen)`, `spec.md > "Can't Hear Your Guitar" Message`, `spec.md > Important Failure Modes`, `spec.md > Data Model` (`riffboy.inputDeviceId`)
  Build: Add input listing (`enumerateDevices`) and the picker to the home screen, save the choice in `riffboy.inputDeviceId`, open that device in `audio.js` with fallback to default. Add the "Can't hear your guitar" message for permission denied / input fails / 5 seconds with no note. Show an error if Pitchy fails to load.
  Verify (mechanical): In the browser pane, confirm the picker lists inputs and the choice survives a reload; set a saved device id that doesn't exist and confirm it falls back; make getUserMedia fail and confirm the message; start recording with silence and confirm the message shows after about 5 seconds and hides when a test tone starts.
  Learner check: Plug in your interface, pick it in the dropdown, reload the page and check it's still picked, then record a riff through it. Also try tapping New Riff and not playing anything: does the message show up?
  Commit: `Add input picker and can't-hear message`

- [ ] **5. Find out how precise Riff Boy is, and tune it**
  Becomes usable: Detection limits tuned from real testing on your guitar, with the results written down for your demo. Answers your question "how will the precision of the app be?"
  Why now: Tuning only makes sense once the whole journey and your interface work. The results feed straight into your demo and write-up.
  PRD ref: `prd.md > Live Note-to-Tab` (acceptance criteria)
  Spec ref: `spec.md > Decisions and Open Issues` (the agreed precision investigation), `spec.md > Note Detector (notes.js)` (tunable limits)
  Build: You play a known 8–12 note riff three ways (slow + clean through the interface, faster + clean, with distortion) and count correct, missed and extra notes. Adjust the clarity/volume/new-note numbers at the top of `notes.js`, retest, and record the before/after results.
  Verify (mechanical): Re-run the Node note and position checks and the browser test-tone sequence after tuning, confirming nothing broke.
  Learner check: Play the same riff again after tuning. Did the counts improve? Your numbers go in `devpost/learning-log.md` in your own words.
  Commit: `Tune note detection from precision testing`

- [ ] **6. Make it look finished and runnable by judges**
  Becomes usable: Final metal look pass, "Add to Home Screen" support (manifest + icon), and a README that tells a judge how to run Riff Boy.
  Why now: Polish last, once behavior is settled. The README is required for submission and must describe the finished app.
  PRD ref: `prd.md > Look and Feel`, `prd.md > What We're Building`
  Spec ref: `spec.md > Look and Feel`, `spec.md > File Structure` (`manifest.webmanifest`, `icons/`, `README.md`), `spec.md > Where It Runs and How Someone Tries It`
  Build: Styling pass per the spec (big red buttons, heading font, monospace tab), `manifest.webmanifest` and a simple icon, and a README with what it is, how to run it locally, tech used, and a placeholder section for your AI-use disclosure (in your own words).
  Verify (mechanical): Load the page in the browser pane at phone width and desktop width with no console errors or horizontal scrolling; confirm the manifest loads; follow the README run steps exactly from a fresh terminal.
  Learner check: Open Riff Boy on phone width (or your phone later via GitHub Pages) and run through the whole journey. Does it look like it belongs with technical metal? Follow the README steps yourself: could a judge get it running?
  Commit: `Polish look, add manifest and README`

## Hands-on Checkpoints

- [ ] Early usable behavior explored — after slice 2 (live tab from your real guitar)
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence:
Route and stops:
Edit outcome:
Reflection:
Activity mode:

## Revisions
- Stricter new-note rules in `notes.js` (unpicked pitch changes must hold longer; likely harmonic jumps ignored) — the first real-guitar test (laptop mic + slightly distorted amp, picked and legato playing) added many extra notes that clean test tones never produced.
- Added a `?debug` recorder (save raw readings as a file) and `tools/replay.mjs` (replay a recording through `notes.js`) — tuning needs evidence from real playing; the spec's file structure didn't include dev tools. Used again in slice 5.
