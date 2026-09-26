---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Tap a button, play a note, and see which note Riff Boi hears**
  Becomes usable: A running Riff Boi page (black and red) with a Recording screen. Tap New Riff, allow the mic, play one note, and its name (e.g. "A2") and pitch show on screen live.
  Why now: This is the riskiest part: the mic, the Web Audio API and loading Pitchy from the CDN. If any of it doesn't work the way the spec assumed, we want to know on day one. It also sets up the project (files, local server) as part of making something real.
  PRD ref: `prd.md > Starting a Riff`, `prd.md > Live Note-to-Tab`
  Spec ref: `spec.md > Stack` (verify Pitchy loads early), `spec.md > Audio Listener (audio.js)`, `spec.md > Note Detector (notes.js)` (frequency → note only), `spec.md > File Structure`, `spec.md > Look and Feel`, `spec.md > Where It Runs and How Someone Tries It`
  Build: Create `index.html`, `css/style.css` (color variables, dark mobile-first base), `js/app.js`, `js/audio.js` (default input, AnalyserNode, ~60 readings a second, Pitchy from jsDelivr), and `js/notes.js` (clarity/volume limits, guitar range, frequency → note name and MIDI number). Show the current note on the Recording screen with a Stop button that stops listening.
  Verify (mechanical): Serve with `python3 -m http.server 8000`, load the page in the browser pane and confirm no console errors and that Pitchy imports; run a Node check that known frequencies map to the right notes (110 Hz → A2, 82.4 Hz → E2, 329.6 Hz → E4); feed a test tone into the page in place of the mic and confirm the right note name appears.
  Learner check: Run the server, open http://localhost:8000 in Chrome, tap New Riff, allow the mic, and play a few single notes (open low E, 5th fret A string…). Does the note name on screen match what you played?
  Commit: `Set up Riff Boi and detect live notes from the mic`

- [x] **2. Play a riff and watch the tab build up live**
  Becomes usable: The core idea works: play single notes and each one appears as a fret number on a six-line tab, left to right in the order played. Held notes stay one note; picking the same note again adds a new one.
  Why now: This is the unique kernel ("I play a riff and the tabs just show up"). It comes right after the audio works, so everything after it is built around a working kernel, not the other way round.
  PRD ref: `prd.md > Live Note-to-Tab`, `prd.md > The Core Journey` (step 3)
  Spec ref: `spec.md > Note Detector (notes.js)` (new-note logic), `spec.md > Position Rule and Tab Drawing (tab.js)`, `spec.md > Data Model` (note shape)
  Build: Add new-note detection to `notes.js` (after quiet, pitch change held for a few readings, volume jump). Create `js/tab.js` with the standard-tuning position rule (first note lowest fret, then closest fret to the previous note, tie → lower string) and six-line monospace tab drawing that scrolls sideways. Keep the notes of the current riff in memory with `t` times.
  Verify (mechanical): Node check that the position rule always returns a real, playable spot (every MIDI note 40–86, fret 0–22) and follows the closest-fret rule for a known sequence; feed a sequence of test tones in the browser (including a repeated note with a gap) and confirm the right fret numbers appear in order.
  Learner check: Play a short single-note riff you know. Do the notes appear in order, live, while you play? Are the fret positions playable, even if they're not exactly where you played them? (This is the early feedback checkpoint: tell me anything about how it feels that should change the rest of the build.)
  Commit: `Turn detected notes into live tab`

- [x] **3. Stop, save, and find your riff on the home screen**
  Becomes usable: The full core journey: home screen with Latest Riffs (newest first) and New Riff → record → Stop → "Saving…" confirmation → back home with the riff on top. Tapping a riff opens its tab. Riffs survive closing and reopening the browser. Empty list says "No riffs yet"; stopping with no notes saves nothing and says so.
  Why now: Once the kernel works, saving is what makes a captured riff safe, which was your reason for the home list. It depends on the note shape from slice 2.
  PRD ref: `prd.md > The Core Journey`, `prd.md > Stopping and Saving`, `prd.md > Latest Riffs List`, `prd.md > States and Boundaries` (first use, persistence)
  Spec ref: `spec.md > App Shell and Screens`, `spec.md > Latest Riffs Screen`, `spec.md > Saving and Storage (storage.js)`, `spec.md > Saving Confirmation`, `spec.md > Riff View`, `spec.md > Data Model`
  Build: Create `js/storage.js` (`riffboi.riffs` in localStorage, newest first, date/time label). Add the four screens to `index.html` and screen switching in `app.js`: Latest Riffs list, Recording, Saving confirmation (~1.5 s), Riff View using the same tab drawing as Recording. Pick the heading font with the learner.
  Verify (mechanical): In the browser pane, record a riff from test tones, press Stop, confirm the confirmation text, the riff at the top of the list and the saved JSON in localStorage; reload and confirm it's still there; open it in Riff View; stop with no notes and confirm nothing is saved.
  Learner check: Record two riffs, then close the tab and reopen http://localhost:8000. Are both there, newest on top? Tap one: is its tab the one you played?
  Commit: `Save riffs and show them on the home screen`

- [ ] **4. Pick your audio interface, and hear about it when Riff Boi can't hear you**
  Becomes usable: A dropdown on the home screen to choose the mic or your audio interface, remembered between visits (falls back to the default if it's unplugged). The Recording screen shows "Can't hear your guitar" if the mic is blocked or no clear note comes in within about 5 seconds, and hides it once a note is caught.
  Why now: These make the core journey reliable with your real setup. They come after the kernel works, and before tuning, so tuning happens through the interface you'll demo with.
  PRD ref: `prd.md > Screens and Layout` (input picker), `prd.md > States and Boundaries` (can't hear, mic permission)
  Spec ref: `spec.md > Input Picker (audio.js + home screen)`, `spec.md > "Can't Hear Your Guitar" Message`, `spec.md > Important Failure Modes`, `spec.md > Data Model` (`riffboi.inputDeviceId`)
  Build: Add input listing (`enumerateDevices`) and the picker to the home screen, save the choice in `riffboi.inputDeviceId`, open that device in `audio.js` with fallback to default. Add the "Can't hear your guitar" message for permission denied / input fails / 5 seconds with no note. Show an error if Pitchy fails to load.
  Verify (mechanical): In the browser pane, confirm the picker lists inputs and the choice survives a reload; set a saved device id that doesn't exist and confirm it falls back; make getUserMedia fail and confirm the message; start recording with silence and confirm the message shows after about 5 seconds and hides when a test tone starts.
  Learner check: Plug in your interface, pick it in the dropdown, reload the page and check it's still picked, then record a riff through it. Also try tapping New Riff and not playing anything: does the message show up?
  Commit: `Add input picker and can't-hear message`

- [x] **5. Tune your guitar with the built-in tuner**
  Becomes usable: A Tuner button on the home screen opens a tuner screen: play one string and it shows the nearest note and how sharp or flat you are, with a clear "in tune" state. Uses the input you picked.
  Why now: An out-of-tune string sits between two notes, which makes Riff Boi flip between them. Tuning up right before the precision test means the test measures Riff Boi, not the guitar. It reuses the listening code from slices 1 and 4.
  PRD ref: `prd.md > Screens and Layout` (Tuner), `prd.md > What We're Building`
  Spec ref: `spec.md > Audio Listener (audio.js)`, `spec.md > Note Detector (notes.js)` (frequency → note), `spec.md > Look and Feel`
  Build: Add a Tuner screen and home-screen button. Show the nearest note and its offset in cents (hundredths of a semitone) from the exact pitch, with an "in tune" state within a few cents. Stop listening when leaving the screen.
  Verify (mechanical): Node check of the cents math (440 Hz = A4, 0 cents; 446 Hz ≈ +23 cents); in the browser pane, feed in-tune and out-of-tune test tones and confirm the note, the sharp/flat direction and the in-tune state; confirm the mic is released after leaving the screen.
  Learner check: Tune your guitar with it, then check one string against another tuner you trust. Do they agree?
  Commit: `Add a guitar tuner`

- [ ] **6. See how confident Riff Boi is about your tab**
  Becomes usable: A small confidence bar with a percentage under the tab, live while recording and on every saved riff, plus a one-line hint about the weakest part (e.g. "Lots of background noise", "Guitar may be out of tune — try the tuner").
  Why now: The learner asked for it (after the tuner, before the final look). It reuses the tracker's readings and the tuner math, and it should be honest, so it gets checked against the labeled recordings.
  PRD ref: `prd.md > Live Note-to-Tab` (added feature: confidence bar)
  Spec ref: `spec.md > Note Detector (notes.js)`, `spec.md > Saving and Storage (storage.js)`, `spec.md > Look and Feel`
  Build: Track per-note clarity, steadiness and tuning (cents) in the tracker, measure background noise vs note loudness, combine them in a new `js/confidence.js`, show the bar on the Recording screen and Riff View, and save it with each riff.
  Verify (mechanical): Checks for clean vs noisy/out-of-tune notes; a Confidence column in the scoreboard that rates the least accurate recording (Crazy Train, laptop mic) lowest; browser test of the live bar, saved bar and hint.
  Learner check: Record the same riff clean and then with more distortion or background noise. Does the bar drop, and does the hint make sense?
  Commit: `Add a confidence bar`

- [ ] **7. Find out how precise Riff Boi is, and tune it**
  Becomes usable: Detection limits tuned from real testing on your guitar, with the results written down for your demo. Answers your question "how will the precision of the app be?"
  Why now: Tuning only makes sense once the whole journey and your interface work. The results feed straight into your demo and write-up.
  PRD ref: `prd.md > Live Note-to-Tab` (acceptance criteria)
  Spec ref: `spec.md > Decisions and Open Issues` (the agreed precision investigation), `spec.md > Note Detector (notes.js)` (tunable limits)
  Build: You play a known 8–12 note riff three ways (slow + clean through the interface, faster + clean, with distortion) and count correct, missed and extra notes. Adjust the clarity/volume/new-note numbers at the top of `notes.js`, retest, and record the before/after results.
  Verify (mechanical): Re-run the Node note and position checks and the browser test-tone sequence after tuning, confirming nothing broke.
  Learner check: Play the same riff again after tuning. Did the counts improve? Your numbers go in `devpost/learning-log.md` in your own words.
  Commit: `Tune note detection from precision testing`

- [ ] **8. Make it look finished and runnable by judges**
  Becomes usable: Final metal look pass, "Add to Home Screen" support (manifest + icon), and a README that tells a judge how to run Riff Boi.
  Why now: Polish last, once behavior is settled. The README is required for submission and must describe the finished app.
  PRD ref: `prd.md > Look and Feel`, `prd.md > What We're Building`
  Spec ref: `spec.md > Look and Feel`, `spec.md > File Structure` (`manifest.webmanifest`, `icons/`, `README.md`), `spec.md > Where It Runs and How Someone Tries It`
  Build: Styling pass per the spec (big red buttons, heading font, monospace tab), `manifest.webmanifest` and a simple icon, and a README with what it is, how to run it locally, tech used, and a placeholder section for your AI-use disclosure (in your own words).
  Verify (mechanical): Load the page in the browser pane at phone width and desktop width with no console errors or horizontal scrolling; confirm the manifest loads; follow the README run steps exactly from a fresh terminal.
  Learner check: Open Riff Boi on phone width (or your phone later via GitHub Pages) and run through the whole journey. Does it look like it belongs with technical metal? Follow the README steps yourself: could a judge get it running?
  Commit: `Polish look, add manifest and README`

- [ ] **9. Bend a string and see it in the tab**
  Becomes usable: Bends show up like real tab while you play: `7b9` for a bend, `7b9r7` for a bend and release, `7pb9r7` for a pre-bend once it's released. Hammer-ons, slides and vibrato stay as they were.
  Why now: The learner asked for it after the design pass. It changes the note tracker, the most tested part of the app, so it comes with checks and the scoreboard.
  PRD ref: `prd.md > What We're Building` (bends)
  Spec ref: `spec.md > Bends (notes.js + tab.js)`, `spec.md > Data Model` (bend fields)
  Build: Follow the ringing note's pitch with decimals in `notes.js` and decide glide (bend) vs jump (new note) when it settles; `tabToken()` in `tab.js` writes 7b9, 7b9r7 and 7pb9r7; save the bend fields with riffs; `tools/score.mjs` reads bends in answer keys and counts right and false bends.
  Verify (mechanical): Checks for whole, half and 1½-step bends, bend + release, pre-bend, a 0.4 s bend and a slightly flat bend, and that hammer-ons, slides, vibrato and the Crazy Train smear are NOT bends; the scoreboard stays at 110/115 with 0 false bends; a browser test with a fake riff of bends.
  Learner check: Record a few bends with `?debug` (a whole step, a half step, a bend and release, a pre-bend release) and write their answer keys (like `G: 7b9r7`). Does the tab show them right? Those recordings become the bend test set.
  Commit: `Hear string bends and write them in the tab`

- [ ] **10. See the rhythm: note values in a Songsterr-style tab**
  Becomes usable: The tab is drawn like Songsterr: string lines with the fret numbers on them, bar lines, the tempo, bends as arrows and the rhythm underneath (quarter, eighth, sixteenth notes and so on), at the BPM you set on the home screen. A Rhythm switch turns it off to just see the notes.
  Why now: The learner asked for note values, picked "I set the BPM", then asked for it to look like a Songsterr tab and picked option A from 3 rendered options.
  PRD ref: `prd.md > What We're Building` (note values)
  Spec ref: `spec.md > Tab Picture and Rhythm (tabsvg.js + rhythm.js)`, `spec.md > Data Model` (bpm, endTime, riffboi.settings)
  Build: `rhythm.js` snaps note starts to sixteenths at the tempo and picks note values; `tabsvg.js` draws the picture; tempo control and Rhythm switch on the home screen; each riff saves its BPM and when its last note ended.
  Verify (mechanical): Checks for note values at 120 and 60 BPM, notes a little early or late, bars, fret order, bend arrows, rhythm off and an empty staff (86 checks); a browser test of the tempo control (limits, remembered), the live and saved tab, card previews and the Rhythm switch.
  Learner check: Set the tempo, play a riff you know along with a metronome, and look at the note values. Are they right? Switch rhythm off: is it just the notes?
  Commit: `Draw the tab like Songsterr, with note values at your tempo`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 2 (live tab from your real guitar): random notes and wrong strings reported → fixed with recordings + scoring; learner: "a lot better"
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
- Smarter position rule in `tab.js` (4-fret hand box, string-jump cost, open strings only near the nut, first note on the thickest string at fret ≤ 5) replaces "closest fret to the previous note" — the learner's Crazy Train test put the D on the open D string instead of A string 5th fret. Still a guess; tap-to-edit stays deferred.
- Rewrote note detection to follow the note's name and pick the lowest octave heard (fixing the last note when the real octave shows up late); fold readings an octave below the low E back up; clarity 0.9 → 0.8; a same-note re-pick must reach 75% of the note's loudest volume; non-octave harmonics (+19, +28, +31) ignored when unpicked — the learner's Crazy Train recording (laptop mic, slightly distorted amp) showed octave errors, notes just under the clarity limit, and ~6 Hz volume pulsing that looked like re-picks. Score on that recording: 8 → 26 of 31 notes correct. Added `tools/score.mjs` and `tools/check.mjs` so every change is measured; the early precision work from slice 6 partly moved here.
- Renamed the app Riff Boy → Riff Boi (learner decision); localStorage keys are now `riffboi.*`.
- Added slice 5 (built-in tuner) at the learner's request; placed before precision testing because an out-of-tune guitar causes note flipping. The learner's tuning-setting idea (e.g. Drop D) went to `prd.md > Possible Later Enhancements`.
- Labeled test set: the learner recorded frets 1–12 on every string with answer keys; `tools/score.mjs` now reads tab answers, scores notes AND strings, and prints a scoreboard over `tools/recordings/`. New rules from that data: fifth-above harmonics ignored by note name; a same-note re-pick must hold its pitch 7 readings (it was often the next note's pick); `cleanUpRiff()` drops ghost notes quieter than 35% of the riff's typical note (background noise) and fixes octave glitches in stepwise runs; the string rule keeps walking along a string fret by fret; first note = lowest fretted spot. Scoreboard: 97/103 notes, 72/72 strings — but these recordings were used for tuning, so a new riff with tab is needed as a fair test.
- Independent review (3 reviewers + verifiers, 9 confirmed problems) and the learner's held-out pentatonic recording (converted from mp3 with the same Pitchy pipeline): fixed picked octave jumps, false octave "fixes" on real lower notes, fast repeated picks, missed re-picks (a short pitch break now also counts, but not right after a note starts), fifths after a pitch break; glitch clean-up now needs the fixed note strictly between two different neighbours (a pedal riff like E2 F#3 E2 was being broken) and also fixes notes heard a third too low; string rule keeps its walk direction on repeated notes and now tries every first-note place and finger, preferring the least hand movement, then the usual first spot, then lower on the neck. Readings now come from a steady 60/s timer (not the screen refresh, which is 120 Hz on many Macs). Held-out pentatonic before fixes: 10/12 notes, 6/10 strings; after: 11/12, 11/11. Scoreboard: 110/115 notes (96%), 0 wrong, 83/83 strings. A very soft first note can still be missed (lowering the clarity limit made everything else worse).
- Build order changed at the learner's request (priorities: final look, tuner, confidence score): the tuner (slice 5) was built before slice 4; slice 4 (input picker + can't-hear message) is kept; final look stays last. A "confidence score" feature was requested and will be added as a slice once the learner describes what it should show.
- Project published to GitHub (public, the 8 commits with their original dates), first as KoderNinja/riff-boi, then moved to the learner's `riff-boi` org (https://github.com/riff-boi/riff-boi) so a collaborator can deploy it on Vercel. The build continues in a Claude Code cloud session: each checked step is pushed, and the learner tests on the live link with the guitar. New order at the learner's request: slice 6 (confidence bar) → README (from slice 8) → design and layout pass (from slice 8) → string bends (new slice, learner request) → slice 4 → app icon + manifest (slice 8) → slice 7 if time allows. To-do and idea lists: `devpost/todo.md`.
- Design pass (the look part of slice 8): two layouts were rendered as real screenshots and the learner picked "B: Metal", then asked for it to look less AI-made but still professional, so the glows and glossy gradients were removed (flat red, angled corners, grain, Oswald labels). New layout: round New Riff record button, riff cards with a mini tab and confidence, a REC timer and big last note while recording, Stop/Done at the bottom. The manifest and icon from slice 8 are still to do.
- App icon (the learner picked the blackletter R from 2 options) and `manifest.webmanifest`, so slice 8 is built; its learner check is still to do.
- Bends (slice 9, learner request). First version lost a Crazy Train note: a smeared note change (A2 to G#2) settled 0.7 semitones down and was read as a pre-bend. Fix: a bend must settle within 0.25 of a whole semitone, otherwise the normal note rules take over. Stricter settling for very slow bends was tried side by side and lost 6 to 7 real notes, so it wasn't used. Scoreboard unchanged (110/115, 83/83), 0 false bends, 74 checks.
- Note values (slice 10, learner request): the learner chose to set the BPM, then asked for the tab to look like Songsterr and picked the full look (rhythm stems, bend arrows) from 3 rendered options. The last note first ran until Stop was tapped, which made it a whole note, so it now ends when the guitar goes quiet. A Rhythm on/off switch (learner request) came with it. Time signatures other than 4/4 are next on the to-do list.
- The build moved from the cloud session to the learner's Mac (the cloud commits were fetched from a zip and fast-forwarded). Riff Boi is live at https://riffboi.com (Vercel, deploys from GitHub `main`). At the learner's request, slice 4 was built next, ahead of the time signature, as the most important step for getting the app out. Added while building it: a short hint under each message about what to try, a separate "Couldn't load the pitch detector" message (the fix is the internet, not the mic), the tuner using the picked input, and the dropdown refreshing when an input is plugged in or unplugged. Checked in the browser pane with a pretend mic (inputs listed, choice kept after a reload, unplugged input falls back, blocked and broken mic messages, the message after 5 silent seconds and gone once a tone plays) and in `check.mjs` (5 new checks, 91 total). Scoreboard unchanged (110/115, 83/83). Its learner check with the real interface is still to do.
- Code review (learner request) plus the learner's iPhone report (Chrome on iPhone, amp: the timer ran, no notes). Fixed in `audio.js`: iPhones start the `AudioContext` paused, so it's resumed in the tap, after the mic opens and on every pause (`statechange`). Checked in the browser by making every new `AudioContext` start paused and pause again when the mic opens: the old code wrote no notes, the fixed code all 8, and a pause mid-riff recovered within 0.5 s. `?debug` now shows the mic's numbers (sound state, sample rate, mic state, the voice clean-up the phone really applied, volume, clarity, pitch). Two more bugs from the review: a bend on a note whose octave was just fixed came out as 3 notes (bend tracking now restarts on an octave fix), and amp hiss above the volume limit made the last note last until Stop (it now lasts while its own pitch is heard, `stillRinging` in `notes.js`; picked from several rules on all 8 recordings with 3 s of their own room noise added). 8 new checks (99 total), each proven by breaking the fix on purpose (6 mutations, all caught). Scoreboard unchanged (110/115, 83/83). The learner's iPhone check is still to do.
- Rhythm switch fix (learner request): it used to redraw every saved riff; now each riff saves `rhythm` (old riffs: on). The learner chose no toggle on the saved-riff screen. Also on the Mac: the cloud's `main` couldn't fast-forward (the Mac had an unpushed bar line fix), so the learner chose a rebase; the only conflict was the README's check count.
- Time signature and Auto tempo (learner request and idea), built on the `time-signature` branch, then merged. The learner chose one dropdown of common time signatures (7/8 as 2+2+3), an Auto switch that works on Stop (not live), typing the right tempo on a saved riff instead of ½× and 2× buttons, and letting a worked-out tempo fill the box for the next riff. Auto does nothing with rhythm off (that tab has no tempo). Verify: 129 checks (26 new, including the 12 made-up tempo cases plus one at 150 BPM that was added when a changed tempo range went unnoticed), a mutation test of each part, and a browser test with a pretend mic at 390 and 320 px wide. The scoreboard didn't change.
- Manual tab editor (learner request), on the `tab-editor` branch. The learner chose a New Tab button on the home screen, tap a string then set the fret, and a note value per note. Claude's defaults (tell the learner): the button sits top left across from Tuner; frets 0 to 24; Undo only (no editing in the middle); no rests, bends or chords yet; it uses the home screen's tempo and time signature; a written tab keeps its note values when its tempo is changed; New Tab starts fresh each time (found in the browser test: Dotted stayed on from the last tab). Verify: 134 checks (5 new, each mutation-tested) and a browser test at 390 and 320 px.
- Ideas ranked (learner request), then idea 1, Rename and Delete (learner pick: on every card, not the Riff View). Claude's default: a new name replaces the date as the title and the date shows under it. Verify: 138 checks (4 new, mutation-tested) and a browser test, including a 40-character name at 320 px.
- Idea 2, playback (learner pick: a plucked string, Karplus-Strong). Claude's default: it plays what the tab shows (beats and note values at the riff's tempo), not the raw timing, unless rhythm is off. Two bugs found by testing: the pluck loop averaged the wrong two samples, so notes were up to about 24 cents flat on high notes (a pitch check caught it; now within 0.1 cents from E2 to E6 by Pitchy in the browser); and following along with animation frames never finished in a background page (the browser test caught it; now timers). Verify: 147 checks (9 new, mutation-tested; two checks were tightened when changing the fade and the offset went unnoticed) and a browser test that listened to the real output.
- Clearer switch labels (learner request): "Auto detect tempo" and "Show note lengths" (the learner's pick).
- Idea 3, Upload a recording + Try a sample (learner picks: both, with the learner's pentatonic.mp3 in the public repo). Claude's defaults: the buttons sit under New Riff; the riff is named after the file and opens on the Riff View; up to 5 minutes; decoded at 48 kHz. `notesFromReadings` (in `notes.js`) is the one shared copy of the live steps for whole recordings; the live path in `app.js` was left alone this close to the deadline. Mutation testing found two lines that can't change anything (the tracker already updates the note in place), so they stay to match `app.js`. Verify: 150 checks (3 new: every real recording and the made-up bends give the same riff as the scoreboard's replay) and a browser test: the sample mp3 gave exactly the tab of its saved readings (11/12, 85%), plus an upload, a text file, a silent wav, and the layout at 320 px.
- Idea 4, move a note to another string, built while the learner was away (they asked Claude to keep going with recommended defaults and to wait to push). Choices to confirm with the learner: tap a note on the Riff View (or Tab + Enter), a row of other strings under the tab plus Cancel, a hint line, focus returns to the note. Verify: 153 checks (3 new, mutation-tested) and a browser test (move, only-one-spot, keyboard, cancel, tap during playback, 390 px).
- Idea 5, Copy as text tab, built while the learner was away. Choices to confirm: Copy sits next to Play; the text has a title line (name, tempo, time signature) and bar lines; no credit line. The browser pane blocks the Clipboard API even on a real click ("Write permission denied"), which is what made Claude add the hidden-text-box fallback; a real click then copied the exact text. Verify: 155 checks (2 new, mutation-tested) and the browser test.
- Idea 6, key and scale finder, built while the learner was away. Choices to confirm: the 7 scales, the ranking (fewest notes outside, then the home note, then the smaller scale), naming the relative scale too, sharps. Mutation testing changed the design: the first ranking put scale size before the home note, and a riff living on A came out as "E minor pentatonic"; with the home note first it's "A minor". It also found the tests never checked the first-note or lowest-note weights, so two riffs were added that do. Verify: 157 checks (2 new, covering 12 riffs) and a browser test with the sample.
- Ideas 7 to 9 (Drop D, dimming unsure notes, hammer-ons/pull-offs/slides) were skipped while the learner was away: they change how notes are heard, so they need the learner's decisions and guitar tests.
- Idea 10, Share a riff with a link, built while the learner was away. Choices to confirm: the riff lives in the link after `#` (nothing uploaded), phones get the share menu, Save to my riffs, "Shared with you". Mutation testing found the link-safe swap (+ and / to - and _) wasn't tested, because the test riff's base64 had neither; a name that makes both fixed that. Verify: 160 checks (3 new: a round trip with bends, an emoji name and a `<b>` in it; 9 bad links turned down; odd values made safe) and a browser test (share menu, copy, opening by hash change and by a fresh load, Save, a garbled link).
- Ideas 11 to 13 (metronome while recording, offline version, calibrate to my rig) were skipped while the learner was away: a click while recording can leak into the mic, a service worker for offline use can keep old versions of the site around by mistake right before the deadline, and calibration is part of the accuracy work planned with the learner.
- Idea 14, practice loop (Speed, Loop, Click), built while the learner was away; it also covers most of 15 (the tab already scrolls along during Play). Mutation testing: two first tries used a sed feature macOS doesn't have (they changed nothing), and one changed the code in a way that gives the same answer on the test riff; exact-text mutations and a longer 3/4 test fixed that. Verify: 163 checks (3 new) and a browser test that listened to the output: half speed (1 s per quarter at 120), Loop and turning it off mid-round, Click about 9 dB louder at 1.5 to 2 kHz than without, restart on a speed change, 320 px.
- New Tab: type a fret and press Enter to add it (learner request and pick). Claude's choice: the fret stays selected instead of clearing, so Enter on its own repeats it. `typedFret` only takes whole numbers 0 to 24. Verify: 164 checks (1 new, mutation-tested); the learner tries it in the browser.
