---
doc: spec
status: approved
---

# Riff Boi — Technical Spec

## How This Works, In Plain Language
Riff Boi is a **web app**: a set of files that a browser (like Chrome) opens and runs. There's no server and no accounts. Everything happens on your own device.

It's built from the three basic web languages:
- **HTML** is the structure: the riff list, the buttons, the tab area.
- **CSS** is the look: black and red, the metal feel.
- **JavaScript** is the behavior: listening, finding notes, drawing tab, saving.

When you tap **New Riff**, the browser's **Web Audio API** (its built-in sound toolkit) starts listening to your chosen input: the laptop mic, or your audio interface. Many times a second, a small free library called **Pitchy** looks at the sound and answers two questions: *what note is this* and *how sure am I* (its "clarity" score). When a new clear note starts, Riff Boi works out a string and fret for it, using a simple rule that stays close to the previous note, and adds it to the tab on screen.

When you tap **Stop**, the riff is saved in **localStorage**, a notebook the browser keeps for this one website. That's why your riffs are still there when you come back. Your choice of audio input is saved there too.

**Why this shape:** everything runs in the browser, so there's nothing to set up, no cost, no keys, and much less to break in 5 days. A mobile app or a server would add a lot of setup without making the core idea any better.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **You open Riff Boi** → the browser loads `index.html`, then `app.js` reads your saved riffs and input choice from localStorage → you see **Latest Riffs** (newest first), the **input picker** and the **New Riff** button.
2. **You tap New Riff** → `audio.js` asks the browser for the chosen input (the first time, the browser asks your permission) → the **Recording** screen shows the empty six-line tab and a **Stop** button.
3. **You play a note** → Web Audio gives `audio.js` a small slice of sound many times a second → Pitchy returns a frequency and a clarity score → `notes.js` turns the frequency into a note name and decides whether a *new* note just started → `tab.js` picks a string and fret and draws the number on the tab.
4. **You tap Stop** → listening stops → `storage.js` saves the riff (date/time label + list of notes) into localStorage → the **Saving** confirmation shows the label, the note count and "Saved to Latest Riffs."
5. **After a moment** → back to Latest Riffs, with the new riff on top. Tapping it opens the **Riff View**, which draws its saved tab.

```
 your guitar ─→ amp mic / audio interface ─→ browser (Web Audio)
                                                   │
                                            audio.js: sound slices
                                                   │
                                        Pitchy: frequency + clarity
                                                   │
                              notes.js: which note? is it a new one?
                                                   │
                               tab.js: pick string + fret, draw tab
                                                   │
                                 Stop ─→ storage.js ─→ localStorage
                                                   │
                                app.js: Latest Riffs list, Riff View
```

## Stack
| Piece | Choice | Why (agreed with learner) | Docs |
|---|---|---|---|
| Structure/look/behavior | Plain HTML, CSS, JavaScript (ES modules), no framework | Nothing extra to learn first, and you can understand every file. Tradeoff: gets messier than a framework if the app grows a lot | [MDN: JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) |
| Microphone/audio | Web Audio API + `navigator.mediaDevices.getUserMedia` | Built into every modern browser | [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) |
| Input list | `navigator.mediaDevices.enumerateDevices` | Lists your audio inputs for the picker | [MDN: enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices) |
| Pitch detection | **Pitchy 4.1.0** (checked on npm, Sep 25, 2026), loaded from the jsDelivr CDN: `https://cdn.jsdelivr.net/npm/pitchy@4.1.0/+esm` | Ready-made, well-known pitch detector (McLeod method) that also gives a clarity score. No need to write the math ourselves | [Pitchy on GitHub](https://github.com/ianprime0509/pitchy), [npm](https://www.npmjs.com/package/pitchy) |
| Saving | `localStorage` | No accounts or server, and data stays on your device | [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) |
| Hosting (for phone + judges) | GitHub Pages | Free, runs from the public repo you have to submit anyway, gives an https link | [GitHub Pages docs](https://docs.github.com/en/pages) |

**Verify early in the build:** that the jsDelivr `+esm` link loads Pitchy (and its helper library `fft.js`) correctly in the browser. If it doesn't, download the files into `js/vendor/` instead.

## Where It Runs and How Someone Tries It
- **Runtime:** any modern browser. Chrome is recommended for testing on the Mac.
- **Tools already on this Mac:** Python 3.9 (for a local server), Node 24 (not required), git. The GitHub CLI (`gh`) is **not** installed. You can publish the repo through github.com instead, or install `gh` later.
- **Run locally** (from the project folder):
  ```
  python3 -m http.server 8000
  ```
  Then open **http://localhost:8000** in Chrome. Browsers allow the mic on `localhost` without https.
- **Why not just double-click `index.html`?** JavaScript modules and the microphone don't work from a `file://` address, so the app needs a tiny local server.
- **On your phone:** use https://riffboi.com *(on Vercel; the plan was GitHub Pages)*. Phones only allow the mic on secure (https) sites.
- **For the demo recording:** screen-record Chrome on the Mac (for example with QuickTime) while playing through the audio interface with a clean tone, plus a short clip of it on the phone if the Pages link is up.
- **Submission needs:** a public GitHub repo + README with these run steps + a 3–5 min demo video. The GitHub Pages link is a recommended extra.

## Look and Feel
From `prd.md > Look and Feel`: dark, "kinda metal looking," black and red.
- **Colors** (defined once as CSS variables in `style.css`):
  - background: near-black `#0b0b0b`
  - panels/cards: `#161616`
  - main red for buttons, borders and big red text: `#d2131e` *(was `#d7141f`; a hair darker so white text on it passes the 4.5:1 readability guideline, 4.6:1, with no visible change, learner's OK)*
  - red for small text (the newest note, status lines, Delete on hover): `#f5363f`, lighter so it's 4.7:1 on the panels *(added with the learner's OK)*
  - darker red for pressed states: `#8e0d14`
  - main text: off-white `#ececec`
  - muted text: grey `#8a8a8a`
- **Type:** a heavy, sharp metal-style display font **only for the "Riff Boi" logo and screen titles**, e.g. a Google Font like *Metal Mania* or *New Rocker*, picked by the learner during the build. A clean, bold sans-serif (e.g. *Oswald* or system font) for everything else. **The tab uses a monospace font** so fret numbers line up like real tab.
- **Layout:** mobile-first. One column, big thumb-sized buttons, and the New Riff and Stop buttons as the biggest red things on screen.
- **Metal style** *(picked by the learner during the build from two rendered options, "B: Metal", then made flatter at the learner's request so it looks less AI-made but still professional)*: angled cut corners on buttons, cards and panels (CSS `clip-path`), flat colors with no glows or glossy gradients, a fine grain texture behind everything (an SVG noise pattern), and *Oswald* in capitals for buttons and labels. **New Riff** is a big round red record button with Tuner in the top corner; each saved riff is a card with its date, note count, confidence and a mini tab of its first 12 notes. The Recording screen shows a pulsing REC dot with a timer and the last note big; Stop and Done sit at the bottom of the screen, under your thumb. Animations are switched off for people who ask their device for less motion.
- **Tone of copy:** short and punchy ("New Riff", "Can't hear your guitar").
- **Home-screen icon:** a small `manifest.webmanifest` + icon so "Add to Home Screen" on a phone opens it full-screen like an app. This is a polish step, done last.

## Components

### App Shell and Screens (`app.js`, `index.html`)
Holds the four screens as sections of one page and shows one at a time: Latest Riffs, Recording, Saving, Riff View. Connects the buttons to the other modules.
PRD ref: `prd.md > Screens and Layout`, `prd.md > The Core Journey`.

### Latest Riffs Screen
The list of saved riffs, newest first. Each riff is a card with the date/time label, note count, confidence (if it was saved with one) and a mini tab of its first 12 notes. Tapping a card opens the Riff View. Under each card are **Rename** and **Delete** *(added after the build, learner request: on every card, the learner's pick over the Riff View)*. Rename swaps them for a name box (up to 40 characters; Enter or Save keeps it, Escape or Cancel doesn't, and an empty name goes back to the date). A renamed card shows the date under the name. Delete asks "Delete ...? This can't be undone." first. When empty, it says "No riffs yet. Tap New Riff, allow the mic, and play single notes." *(the how-to-start line, learner request)*. On a computer, **Space** starts recording on the home screen and stops it while recording, but not while you're typing in a box or have a button picked (Space already presses a picked button); New Riff and Stop say "(Space)" when you hover over them *(learner request)*. Holds the **input picker** and the **New Riff** button.
PRD ref: `prd.md > Latest Riffs List`, `prd.md > States and Boundaries`.

### Input Picker (`audio.js` + home screen)
A dropdown listing audio inputs, e.g. "MacBook Microphone" or "Scarlett 2i2." The chosen input is saved in localStorage and reused for every new riff.
- **Catch:** browsers hide input *names* until mic permission has been granted once. Before that, the picker shows just "Default input." After the first recording, it fills in the real names.
- If the saved input is gone (e.g. the interface is unplugged), fall back to the default input. The choice stays saved, so plugging the interface back in picks it again. The dropdown refreshes when an input is plugged in or unplugged.
- The tuner listens to the same input *(added during the build)*.
Learner decision (added during spec, a change from the PRD's no-setup idea): see **Decisions and Open Issues**.

### Audio Listener (`audio.js`)
Opens the chosen input with `getUserMedia`, connects it to a Web Audio `AnalyserNode`, and about 60 times a second hands a slice of sound to Pitchy. It also measures volume (how loud the slice is) to help spot new notes. It stops everything cleanly when you tap Stop.
*(Fixed after the code review)* iPhones often start the sound system (the `AudioContext`) paused, even inside a tap, and pause it again for a call or Siri. While it's paused, Pitchy only gets silence, so no notes show up (the learner's iPhone test). So the listener asks it to start inside the tap, again once the mic is open, and every time it gets paused.
*(Added after the code review)* With `?debug` in the address, the Recording and Tuner screens show the mic's numbers: whether the sound system is running, its sample rate, whether the mic is live, the phone's voice clean-up settings as the phone really applied them, and the latest volume, clarity and pitch. After a recording, it can save the readings (JSON) and, since Sep 26, the raw sound as a WAV file (16-bit, one channel), copied by an AudioWorklet (`recorder-worklet.js`, loaded only with `?debug`), for testing ideas like telling strings apart by their sound (`devpost/string-detection.md`).
PRD ref: `prd.md > Starting a Riff`, `prd.md > Live Note-to-Tab`.

### Note Detector (`notes.js`)
Turns Pitchy's results into a list of notes:
- **Ignore unclear sound:** only accept readings with clarity ≥ about 0.9 and volume above a small threshold (both tunable numbers at the top of the file).
- **Frequency → note:** convert to the nearest note number, e.g. A2 = 110 Hz.
- **New note or the same one?** A new note starts when a clear pitch appears after quiet, when the pitch changes to a different note and stays for a few readings, or when the volume jumps sharply (picking the same note again). A held note stays one note, even with vibrato (see Bends).
- Only notes in guitar range (low E ≈ 82 Hz up to about the 22nd fret on the high E) are accepted.
- **Distortion and fast notes** *(added after the build, from the learner's Crazy Train and pentatonic recordings)*: with distortion, Pitchy often hears a short note less clearly, or locks onto a whole fraction of its pitch (1/2 to 1/6, often below the guitar's range). So once a new note has 2 clear readings, one more reading can complete it if it's the same note name in tune (within 40 cents) with clarity 0.6 or more, or a whole fraction of its pitch (within 40 cents). Those readings can never start a note on their own, and they don't count while a note is bending. And a note change right after a break in the pitch (2+ junk readings) counts as a new attack, so it needs 3 readings like a picked note, not 4 like a hammer-on (distortion squashes the volume jump of a pick). On the scoreboard: 110/115 → 113/115, with 0 wrong, no new extra notes, the clean fret runs unchanged, and notes caught closer to when they were played.
- **The note you're playing, right away** *(added after the build, learner request, since the live tab felt a bit laggy)*: the big note name on the Recording screen shows a note as soon as it's heard (2 clear readings of that name in a row, in its lowest octave heard), in gray until the tab is sure of it, then red. It shows the right note about 17 ms before the tab does, and can flash a wrong name for a moment (about 1 name change in 6 on the learner's recordings, like a tuner flickering), which is why it's gray until the tab confirms it. The tab itself still waits for its rules: confirming picked notes on 2 readings instead of 3 was tried and let fake notes in (111/115, 2 wrong, 3 extra). Stricter rules for the name (clarity 0.9+, or 3 readings) cut the wrong flashes but lost the head start.
PRD ref: `prd.md > Live Note-to-Tab`.

### Position Rule and Tab Drawing (`tab.js`)
- **Standard tuning** (low to high): E2, A2, D3, G3, B3, E4. Frets 0–22.
- For each note, list every string/fret spot where it can be played.
  - **First note:** pick the lowest fret.
  - **After that:** pick the spot whose fret is closest to the previous note's fret, so your hand stays put; on a tie, pick the lower string.
- **Draw** the tab as six lines (high e on top, like real tab), with fret numbers placed left to right in the order played. It scrolls sideways when it gets long.
PRD ref: `prd.md > Live Note-to-Tab`. Accepted limitation: `prd.md > Product Decisions` (simple rule, no editing).

### Saving and Storage (`storage.js`)
Reads and writes riffs and the chosen input in localStorage. On Stop, it builds the riff (label, time, notes), adds it to the saved list and saves it. **If no notes were caught, nothing is saved** and the Recording screen says so (see **Decisions and Open Issues**).
PRD ref: `prd.md > Stopping and Saving`.

### Saving Confirmation
Shows "Saving…", then the riff's label, its note count and "Saved to Latest Riffs" for about 1.5 seconds, then returns to the home screen.
PRD ref: `prd.md > Stopping and Saving`, `prd.md > Open Questions` (where it's saved = the Latest Riffs list).

### Riff View
Draws a saved riff's tab with the same drawing code as Recording, plus a back button, a **Play** button and the riff's tempo.
- **Key and scale** *(added after the build, learner idea)*: a line under the note count, like "Sounds like E minor pentatonic (the same notes as G major pentatonic)". `findScale` in `scale.js` tries 7 scales (minor and major pentatonic, blues, minor, major, harmonic minor, Phrygian) in all 12 keys. Best = the fewest notes outside it; then the root that sounds like home (the first note counts most, then the lowest, then the last); then the smaller scale. Scales with a relative (major/minor, and the pentatonics) name both. Hidden with fewer than 4 different notes, or when over a quarter of the notes fit no scale; with a few outside, it says how many. Claude's choices while the learner was away: the scales in the list, the ranking, sharps (like the rest of the app).
- **Share** *(added after the build, learner idea)*: packs the riff into a link (`riffToLink` in `share.js`): this page's address + `#riff=` + the riff as compact JSON in link-safe base64. The part after `#` is never sent to the website, so nothing is stored anywhere. Phones get their share menu; otherwise the link is copied ("Link copied"). Opening a link shows the riff with **Save to my riffs** (and "Shared with you" under it); saving gives it its own place in Latest Riffs. `riffFromLink` checks everything, because anyone can make a link: the format version, 1 to 2000 notes, strings 1 to 6, frets 0 to 24, times 0 to 3600 s, bends 0 to 3, and that each string and fret really give that note; odd tempos, time signatures, ends and names fall back to safe ones, and names are only ever shown as text. A link that can't be read says so. Claude's choices while the learner was away: all of the above.
- **Copy** *(added after the build, learner idea: export as text)*: copies the riff as text tab: its name (with the tempo and time signature when it has rhythm), then six lines like `A|-5-7-|-7b9r7-|` with a bar line where each bar starts (`barStarts` in `rhythm.js`, `tabText` in `tab.js`). The button says Copied, or Couldn't copy, for 2 seconds. It tries the Clipboard API first and falls back to copying from a hidden text box, because some browsers (like in-app ones, and the Claude app's browser pane) block the Clipboard API. Claude's choices while the learner was away: the button sits next to Play, no "made with Riff Boi" line.
- **Save .txt** *(added Sep 26, learner request: "save individual riffs to your files")*: saves the same text as Copy as a .txt file named after the riff (characters file names can't have, like / and :, become dots). A browser download: on an iPhone it goes to Downloads in the Files app.
- **Edit a note** *(added after the build, learner request)*: Riff Boi can't hear which string you played, so it guesses. **Drag** a note up or down to another string: it stays the same note, so its fret changes to match (`fretOn` in `tab.js`); while dragging it shows the fret it would have there, or × where it can't go, and letting go saves it (a note that can't go there jumps back, and the hint line says so). **Tap** a note (or Tab to it and press Enter) for an edit row under the tab: a Fret box (type and press Enter, or − and +) that changes the fret and so the note (`withFret`), "The same note on:" buttons for the other strings (the same as dragging, without dragging), Delete note (it asks first; a riff's only note can't be deleted) and Done. Frets go from 0 to 24, like New Tab. The tapped note is red, and keyboard focus goes back to the note afterwards. It stops playback. *(First built as a tap-to-move row while the learner was away; the learner then asked for dragging and changing the fret, and said a note can be fully changed.)*
- **Hammer-ons, pull-offs and slides** *(added after the build, learner request)*: the tab shows how a note was played from the one before it on the same string: an arc with h (hammer-on, up) or p (pull-off, down), or a slanted line for a slide (up or down); text tab writes them like `5h7p5` and `7/9` (`linkMark` in `tab.js`; `note.link` is `'legato'` or `'slide'`). For now they're marked by hand: tap a note, and "From the ... before it:" offers Picked, Hammer-on/Pull-off and Slide up/down (only when the note before is on the same string at another fret). Riff Boi can already tell when a note started without a pick or a pitch break, but on the learner's recordings (believed all picked) that marked 5 of 114 notes, so writing h or p from it would be wrong about 1 time in 23, and it can't tell a hammer-on from a slide yet: detection waits for the learner's labeled recordings (`devpost/test-recordings.md`). Share links carry the marks (an 8th number per note; older links still open). Claude's choices: marking by hand in the edit row, the look of the marks.
PRD ref: `prd.md > Latest Riffs List` (tap to view).

### "Can't Hear Your Guitar" Message
Shown on the Recording screen when:
- mic permission is denied or the input fails to open, or
- no clear note is detected within about 5 seconds of starting.

It disappears as soon as a note is caught.

*(Added during the build)* A short grey hint under the message says what to try: allow the mic, check the input is plugged in and not used by another app, or play louder and check the input on the home screen. If Pitchy can't be downloaded, the message is "Couldn't load the pitch detector" instead, because the fix is different (check the internet). The tuner shows the same messages.
PRD ref: `prd.md > States and Boundaries`.

### Tuner *(added during the build)*
A screen opened from the home screen. It uses the same listener (`audio.js`) and frequency → note math (`notes.js`), and shows the nearest note plus how far off it is in cents (hundredths of a semitone), with an "in tune" state within a few cents.
PRD ref: `prd.md > Screens and Layout` (Tuner).

### Confidence Bar (`confidence.js`) *(added during the build)*
Under the tab on the Recording screen (live, updated 4 times a second) and in the Riff View (saved with the riff): a bar from 0 to 100% plus a one-line hint about the weakest part (e.g. "Lots of background noise", "Guitar may be out of tune. Try the tuner").
It combines four things Riff Boi can measure about the *sound*, each from 0 (bad) to 1 (good): **tone** (Pitchy's clarity), **tuning** (cents off, like the tuner), **background noise** (the quiet moments vs the notes) and **steadiness** (how often a note's first readings were really that note). Notes Riff Boi had to correct count against it. It can't know whether a string guess is right.
PRD ref: `prd.md > What We're Building` (confidence bar).

### Faded Notes (`confidence.js` + `tabsvg.js`) *(added after the build, learner idea)*
Notes Riff Boi wasn't sure about are drawn faded (45% opacity), live and on saved riffs, so you know which to double-check. `noteSureness` scores one note from its first readings the same way the confidence bar scores a riff (clear, steady, in tune; background noise is left out, since that's the whole riff's), and `isUnsure` fades notes under 0.4. On the learner's recordings that's about 1 note in 11, all in the hardest spots (fast, distorted notes and a soft first note), and none on the clean fret runs. An octave fix alone doesn't fade a note: it's routine on clean notes and usually gets it right (tried first; it faded a clean G3). The note still ringing isn't judged until it has 8 readings, so it doesn't flicker. Saved notes keep an `unsure` flag; editing a note (drag, fret, same note) clears it, since you've checked it. A saved riff with faded notes says so in the line under its tab. Claude's choices while the learner was away: the 0.4 line, the 45% fade, and that editing clears it.

### Bends (`notes.js` + `tab.js`) *(added during the build, learner request)*
Bending pushes the string sideways, so the ringing note's pitch **glides** smoothly through the in-between pitches with no new pick. Hammer-ons, pull-offs and slides **jump** from fret to fret instead. The note tracker follows the ringing note's pitch in semitones with decimals, measured from the note's own pitch (the middle of its first 3 clear readings). When the pitch moves 0.3 semitones or more, it waits for the pitch to settle (3 readings within 0.15), then decides:
- It glided (at least 3 readings in between two notes) and settled within 0.25 of 1, 2 or 3 semitones up: a **bend**, written `7b9` (fret 7 bent up to sound like fret 9). Gliding back down to the note: a **release**, `7b9r7`.
- It glided *down* 1 to 3 semitones from the picked pitch: the string was bent before the pick and then released, a **pre-bend**, `7pb9r7`. The note becomes the fretted (lower) note. A pre-bend that's never released sounds exactly like a normal note, so it can't be heard.
- It jumped, settled between two notes, or didn't settle within 40 readings: not a bend, so the normal new-note rules handle it (on the learner's Crazy Train recording, a smeared note change settled 0.7 semitones below the note and must not count). One exception *(added Sep 26, from the learner's RIFFTEST.mp3)*: a bend can pause on its way up, so if the pitch settles at least half a step up, between two notes, and not on a real note either, Riff Boi keeps following it (RIFFTEST's 8b10 paused 2/3 of the way up and came out as 8-9-10). The "not on a real note" part matters: in Crazy Train, a G#2 played 17 cents sharp and then an A2 15 cents flat are only 2/3 of a step apart.
While a bend glides or is held, its pitches can't start new notes, and the note's quality for the confidence bar stops being measured (a bent note is out of tune on purpose). A new pick always starts a new note. But vibrato makes the volume swell and fade, which can look like a pick *(fixed Sep 26: RIFFTEST's vibrato on the bent note came out as two extra notes)*: so while a bend is held, and for picking the same note again, a pick only counts if it blurred the pitch (a reading under 0.9 clarity within 6 readings) or made the volume double in one reading. Real re-picks in the learner's recordings always blur the pitch; vibrato never does. If the note's octave gets fixed right after it starts (distortion often makes Pitchy hear the octave above for a moment), the bend tracking starts over from the fixed pitch *(fixed after the code review: before, a bend on that note came out as 3 separate notes)*.
Checked on the learner's 8 recordings (which have no bends): the same 110/115 notes and 0 false bends. Settling stricter (so bends slower than about 0.4 s for a whole step aren't split) lost 6 to 7 real notes on those recordings, so it wasn't used. Real bend recordings are needed to tune it further.
PRD ref: `prd.md > What We're Building` (bends).

### Tab Picture and Rhythm (`tabsvg.js` + `rhythm.js`) *(added during the build, learner request)*
The tab is drawn as a picture (SVG) like a Songsterr tab, the learner's pick from 3 rendered options: six string lines with the fret numbers on them, "TAB" and the time signature at the start, bar lines with measure numbers, the tempo (♩ = 120), bends as curved arrows labelled ½, full or 1½, and the rhythm underneath: no stem for a whole note, a short stem for a half note, a full stem for shorter notes, beams joining eighths and sixteenths in the same beat (flags for a lone one) and a dot for dotted notes.
- **Tempo:** the learner sets the BPM on the home screen (− / + or typing, 40 to 240, default 120). Each riff saves the BPM it was played at.
- **Note values:** each note lasts until the next note starts, and its value comes from the most likely way to write the riff at that tempo (`readRhythm`: timing, a beat that can drift up to about 9%, and a preference for simple beats; see the code tour). *(Changed Sep 26, learner request: it used to snap each note to the nearest sixteenth on its own, which gave stray dotted notes when a note was late or the tempo drifted.)* The last note lasts while its own pitch can still be heard (in any octave, or at its bent pitch, with clarity 0.5 or more, 2 readings in a row), or until Stop. The longest value that fits is used; leftover time is just space. *(Changed after the code review: it used to last until the volume dropped below the volume limit, but amp hiss can be louder than that, and then the last note lasted until Stop.)*
- **Time signature** *(added after the build, learner request)*: a "Time" dropdown with 2/4, 3/4, 4/4, 5/4, 6/8, 7/8, 9/8 and 12/8 (default 4/4). The tempo always counts quarter notes, so a bar is top × 4 / bottom beats (7/8 is 3½). Beams join one beat in x/4, threes in 6/8, 9/8 and 12/8, and 2+2+3 in 7/8. Each riff saves its time signature.
- **Auto tempo** *(added after the build, learner idea)*: an "Auto detect tempo" switch next to the tempo. When you tap Stop, `detectTempo` tries every tempo from 80 up to 160 BPM and keeps the one where the rhythm reads most likely, fine-tuned with a best-fit line. It always makes a guess; with under 4 notes or no steady beat it's marked "not sure" (on the Saving screen and next to the tempo). *(Changed Sep 26, learner request: the old way needed a steady pulse and gave up on most real playing, and then it quietly used the last tempo, so it looked stuck on 141.)* A sure tempo is kept for the next riff. While Auto is on, the tempo box is blank and its − and + are off (the learner's request); the live tab works the tempo out as you play (from 4 notes on, every 4 notes, from the last 24), and turning Auto off shows the last sure tempo in the box. Auto does nothing with rhythm off.
- **Count-in** *(added after the build, then taken out at the learner's request, Sep 26)*: one bar of clicks before recording, so the first note would land on a beat. While building it, a test showed that notes are stamped when they're confirmed, 60 to 100 ms after they're played (see the checklist).
- **Changing a tempo:** a saved riff shows its tempo in a box (with "auto", or "auto, not sure", if Riff Boi worked it out). Typing a new tempo, 40 to 240, keeps the note values and plays faster or slower (`retime`). A Detect tempo button next to it (recorded riffs only) works the tempo out again and reads the rhythm again, for when the tempo was wrong while recording. Hidden when rhythm was off. *(Changed Sep 26, learner request: typing a tempo on a recorded riff used to keep its times and change its note values, so Play sounded the same.)*
- **Rhythm switch** (labelled "Show note lengths", the learner's pick, so it's clear what it does): with rhythm off, the tab is just the notes, evenly spaced, with no bars, tempo or stems. It only changes the riff being recorded: each riff saves whether rhythm was on and is always drawn that way. *(Changed after the build, learner request: it used to redraw every saved riff too.)*
- The newest note is red while recording. The old text tab (`drawTab`) stays for the checks and a future "copy as text".
PRD ref: `prd.md > What We're Building` (note values).

### Upload a Recording (`upload.js`) *(added after the build, learner idea)*
"Upload a recording" sits under New Riff. It opens the file picker for a sound file (mp3, wav, m4a and so on, up to 5 minutes). *(A "Try a sample" button with the learner's pentatonic recording was added with it, then taken out at the learner's request.)*
- **The same steps as live, all at once:** the file is decoded at 48 kHz and mixed to one channel, then read like the live input: 60 readings a second, each from the latest 2048 samples (timed where the slice ends), with Pitchy and the same loudness math as `audio.js`. `notesFromReadings` in `notes.js` runs the same steps as `app.js` while recording, and the last note ends where it stopped ringing. The riff then gets strings, a confidence score, and the tempo, time signature, Auto detect tempo and Show note lengths settings like a recorded riff.
- It's saved with the file's name and opens straight away on the Riff View, where Play works.
- **Checked:** the made-up bend readings and every real recording give the same notes, strings and end through `notesFromReadings` as the scoreboard's replay; and in the browser the sample mp3 gives exactly the tab the saved readings of it give (11 of 12 notes, 85% confidence, the same as the scoreboard). Reading the 6-second sample takes about 0.1 s.
- **Problems:** "Couldn't read that file" (not a sound file the browser can read), "That recording is too long" (over 5 minutes), "No notes found", or "Couldn't load the pitch detector" (no internet). Each shows for 3 seconds, then home.

### Playback (`playback.js`) *(added after the build, learner request)*
A **Play** button on the Riff View and in New Tab plays the tab back with a plucked-string sound (the learner's pick over a simple tone). Each note turns red as it plays and the tab scrolls to keep it in view; the button says Stop while it plays. Leaving the screen, changing the tempo or adding a note stops it.
- **What it plays:** what the tab shows. With rhythm on, each note starts on its beat and lasts its note value at the riff's tempo, and leftover time is silence. With rhythm off, the notes play when they were played. Bends glide up, releases glide back down (after 60% of the note), pre-bends start up. A note is cut (a 40 ms fade) when its time is up, and rings at most 2.9 s.
- **The sound:** Karplus-Strong. A burst of noise one loop long, then each new sample is the average of the two from one loop back, times 0.996, so it smooths into a tone that fades like a string. A loop of N samples sounds once every N + 0.5 samples, so each note's loop is played a little faster or slower to land exactly on its pitch (checked with Pitchy in the browser: within 0.1 cents from E2 to E6, bends too).
- **Following along** uses timers set to when each note is heard (after the start delay and the speakers' own delay), not animation frames, because a page in the background gets no frames and would never finish.
- Its own sound system (`AudioContext`), made and resumed in the tap, because phones only allow sound after one. On an iPhone, the silent switch can mute it.
- **Practice** *(added after the build, learner idea: practice loop)*: a row under Play on a saved riff. **Speed** 100%, 75% or 50% (the notes keep their pitch; the times are divided by the speed). **Loop** goes round again at the end until Stop (it's checked each time round, so it can be turned off while playing). **Click** plays a short blip on every beat (quarter note), higher and louder on the first beat of each bar (`clickTimes`); it only plays during playback, so it can't leak into the mic, and it's hidden for riffs without rhythm. Changing the speed or the click while it plays starts it again. Claude's choices while the learner was away: all of the above, and that they're not remembered between visits.

### New Tab (`editor.js` + `app.js`) *(added after the build, learner request)*
Write a tab by hand. A "New Tab" button on the home screen (top left, across from Tuner) opens the editor. Tap one of 6 string buttons (e B G D A E, high e first like the tab), set the fret (0 to 24) with − / + or by typing it and pressing Enter (the fret stays selected, so typing the next one replaces it, and Enter on its own adds the same fret again; a fret that isn't 0 to 24 isn't added; the box uses the keyboard with an enter key, since the iPhone number pad has none), pick how long the note lasts (whole, half, quarter, 8th or 16th, and Dotted, which isn't offered for whole or 16th), then Add note. Undo takes the last note off. It uses the tempo and time signature from the home screen, and the tab is drawn as you go, newest note in red.
- `writtenRiff` turns the notes into the same kind of riff Riff Boi saves when it hears you: each note starts where the one before it ended, in seconds at that tempo, so it's drawn, saved and listed the same way (the card says "written"). No confidence score, rhythm always on.
- Changing a written tab's tempo on the Riff View keeps its note values (`retime` moves the notes closer together or further apart). A recorded riff keeps its times instead.
- Not in this first version: bends and other techniques, rests, chords, editing a note in the middle, or editing recorded riffs. Leaving with notes asks "Throw away this tab?"

## Data Model
Everything lives in the browser's localStorage, as text in JSON format (a simple way of writing data as text).

**`riffboi.riffs`**: the list of saved riffs, newest first:
```json
[
  {
    "id": "1758843720000",
    "label": "Sep 25, 7:42 PM",
    "createdAt": "2026-09-25T19:42:00",
    "notes": [
      { "midi": 52, "name": "E3", "string": 5, "fret": 7, "t": 0.00 },
      { "midi": 55, "name": "G3", "string": 5, "fret": 10, "t": 0.41 }
    ],
    "confidence": { "score": 0.87, "tone": 0.95, "tuning": 0.9, "noise": 0.7, "steadiness": 0.85, "hint": "Sounds clean" }
  }
]
```
- `midi` is the note number: every note has one, e.g. low E = 40.
- `string` counts 1–6 from high e to low E, the same as the lines on the tab.
- `t` is seconds since you tapped New Riff. It's saved now and kept for later (e.g. rhythm).
- `unsure: true` marks a note Riff Boi wasn't sure about (drawn faded; only saved when true).
- Bent notes also have `bend` (semitones, 1 to 3), and `release: true` and/or `prebend: true` when those happened. `fret` is always the fretted note, so `{ "fret": 7, "bend": 2, "release": true }` is drawn as `7b9r7`.
- `bpm` is the tempo the riff was played at, and `endTime` is when the last note ended (seconds since New Riff), so the note values can be drawn again. Riffs from before this don't have them: they use today's tempo, and the last note counts as a quarter note.
- `link` on a note is how it was played from the note before: `'legato'` (a hammer-on or pull-off) or `'slide'` (only saved when set).
- `rhythm` is whether the Rhythm switch was on when the riff was recorded. Riffs from before this don't have it and are drawn with rhythm on.
- `meter` is the time signature, like `"7/8"`. Riffs from before this don't have it and are 4/4.
- `written: true` means it was written by hand in New Tab (only saved when true).
- `name` is the name you gave it with Rename, or an uploaded file's name. Without one, the riff shows its `label` (when it was made).
- `autoTempo: true` means Riff Boi worked out `bpm` itself. It's only saved when true, and typing a new tempo sets it to `false`.
- `confidence` is how sure Riff Boi was about the riff (the score and each part from 0 to 1, rounded to 2 decimals) plus the hint, or `null` if there was nothing to judge. Riffs saved before the confidence bar don't have it.

**`riffboi.settings`**: `{ "bpm": 120, "autoTempo": false, "meter": "4/4", "rhythm": true }`, the tempo, the Auto detect tempo switch, the time signature and the rhythm switch (Show note lengths).

**`riffboi.inputDeviceId`**: which audio input you picked.

| Data | Where it lives | How it changes | When you leave and come back |
|---|---|---|---|
| Saved riffs | localStorage | Added when you tap Stop | Still there, in the same browser on the same device |
| Chosen input | localStorage | Changed with the picker | Still selected, or falls back to the default if unplugged |
| The riff being recorded | JavaScript memory only | Grows as you play | Lost if you close the tab before Stop |

## File Structure
```
beginners-paradise/          # the project folder = the GitHub repo
├── index.html               # the page: all four screens + links to CSS/JS
├── css/
│   └── style.css            # black/red metal look, colors as variables, mobile-first
├── js/
│   ├── app.js               # starts the app, switches screens, wires up buttons
│   ├── audio.js             # mic/interface input, input list, listening loop, Pitchy
│   ├── notes.js             # frequency → note, "is this a new note?" logic
│   ├── tab.js               # position rule (string + fret) and drawing the tab
│   ├── confidence.js        # how sure Riff Boi is about a riff (the confidence bar)
│   ├── rhythm.js            # note starts → beats and note values at your tempo
│   ├── tabsvg.js            # draws the tab picture (Songsterr style)
│   ├── editor.js            # New Tab: turns a tab written by hand into a riff
│   ├── playback.js          # plays a tab back with a plucked-string sound
│   ├── upload.js            # reads a recording (mp3, wav...) into a riff, like listening live
│   ├── scale.js             # which key and scale a riff sounds like
│   ├── share.js             # packs a riff into a link, and checks links it's given
│   └── storage.js           # save/load riffs and the chosen input (localStorage)
├── manifest.webmanifest     # (polish) home-screen app name, colors, icon
├── icons/                   # (polish) app icon for "Add to Home Screen"
├── README.md                # what Riff Boi is, how to run it, tech used, AI disclosure
├── .gitignore               # keeps learner-profile.md and .env files out of git
├── CLAUDE.md                # instructions for Claude in this project
└── devpost/                 # planning docs + learning log
```

## External Services and Dependencies
- **Pitchy (via jsDelivr CDN):** loaded in the browser as a JavaScript module. Main calls:
  - `PitchDetector.forFloat32Array(bufferSize)` creates the detector once.
  - `detector.findPitch(samples, sampleRate)` returns `[frequencyHz, clarity]`, called for each slice.
  - No key and no cost. It needs internet the first time the page loads.
- **GitHub + Vercel** *(changed during the build, from GitHub Pages)*: the repo is public at https://github.com/riff-boi/riff-boi, and Vercel's free plan puts it live at https://riffboi.com every time `main` changes on GitHub. No keys.
- **No API keys or secrets anywhere** in this project.

## Important Failure Modes
- **Mic permission denied / input won't open** → the "Can't hear your guitar" message on the Recording screen.
- **The phone starts or pauses the sound system** (iPhones) → Riff Boi asks it to start again; `?debug` shows its state and the mic's numbers on screen, to find out why a phone can't hear.
- **Noisy or distorted signal gives wrong or extra notes** → only high-clarity readings count. The clarity and volume limits are easy-to-change numbers, and a clean tone through the interface is recommended for the demo.
- **Saved input unplugged** → fall back to the default input.
- **Pitchy fails to load from the CDN** → the app shows an error message; the fix is copying the library into `js/vendor/`.
- **Stop with nothing caught** → nothing saved; "No notes caught. Nothing saved".

## What Was Simplified and Why
- **One web app** instead of a native phone app: mobile-first design + GitHub Pages + "Add to Home Screen" gets close to the app feel. A true app would need Xcode or React Native setup and app store steps.
- **localStorage** instead of a database or cloud sync: single user, one device, no accounts. Cloud saving would need a server, logins and more.
- **Pitchy** instead of writing pitch detection from scratch: the math is a project on its own. We still write the note-start logic, which is the Riff Boi-specific part.
- **Simple position rule** instead of editing positions or using a camera (learner decisions in `prd.md > Product Decisions` and `scope.md > Explicitly Cut`).
- **Standard tuning only**: drop tunings would need a tuning setting (later).
- ~~No rhythm in the tab~~ *(rhythm was added during the build)*: note values come from a tempo you set. ~~Riff Boi doesn't work out the tempo by itself, and the time signature is always 4/4.~~ *(both added after the build: Auto tempo and the time signature)*

## Decisions and Open Issues

**Learner decisions (made here):**
- **Web app first**, mobile-first design. The learner pictured a mobile app but agreed to start on the web.
- **Input picker in the app now, on the home screen.** The learner chose to build it now rather than later, for better precision through the audio interface. This adds a small setup element to the PRD's no-setup idea; it's softened by remembering the choice. (Updates `prd.md > Screens and Layout`.)
- **Stack accepted:** plain HTML/CSS/JS + Web Audio + Pitchy + localStorage + GitHub Pages.

**Implementation details derived from those (agent, for the learner to check at review):**
- The clarity/volume limits (≈0.9) and the ~5-second "can't hear" timeout are starting values, tuned during testing.
- **A riff with no notes isn't saved.** This fills a gap the PRD didn't cover.
- Heading font picked from a short list during the build.

**The learner's open question: "how the precision of the app will be"**
- **Explained:** precision depends on (1) clean pitch readings (the clarity score, interface vs. amp mic, distortion), (2) telling where one note ends and the next starts (the hardest part), (3) playing speed (fast technical runs will be hardest), and (4) standard tuning.
- **Agreed investigation during the build:** once live note-to-tab works, the learner plays a short, known riff (about 8–12 notes) three ways: slow + clean through the interface, faster + clean, then with distortion. For each, count correct notes, missed notes and extra notes, then compare against the position rule. Record the results in `devpost/learning-log.md`, tune the limits and test again.

**Still open (don't block the build):**
- ~~Heading font choice~~ — picked by the learner during the build: **UnifrakturCook** (blackletter), for the logo and screen titles, in normal capitals (blackletter is hard to read in ALL CAPS).
- Tuning settings, rhythm, editing, power chords: later, per `prd.md > Deferred From the POC`.
