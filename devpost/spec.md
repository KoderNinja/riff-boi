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
- **On your phone:** use the GitHub Pages link (https). Phones only allow the mic on secure sites.
- **For the demo recording:** screen-record Chrome on the Mac (for example with QuickTime) while playing through the audio interface with a clean tone, plus a short clip of it on the phone if the Pages link is up.
- **Submission needs:** a public GitHub repo + README with these run steps + a 3–5 min demo video. The GitHub Pages link is a recommended extra.

## Look and Feel
From `prd.md > Look and Feel`: dark, "kinda metal looking," black and red.
- **Colors** (defined once as CSS variables in `style.css`):
  - background: near-black `#0b0b0b`
  - panels/cards: `#161616`
  - main red for buttons and highlights: `#d7141f`
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
The list of saved riffs, newest first. Each riff is a card with the date/time label, note count, confidence (if it was saved with one) and a mini tab of its first 12 notes. Tapping a card opens the Riff View. Shows "No riffs yet" when empty. Holds the **input picker** and the **New Riff** button.
PRD ref: `prd.md > Latest Riffs List`, `prd.md > States and Boundaries`.

### Input Picker (`audio.js` + home screen)
A dropdown listing audio inputs, e.g. "MacBook Microphone" or "Scarlett 2i2." The chosen input is saved in localStorage and reused for every new riff.
- **Catch:** browsers hide input *names* until mic permission has been granted once. Before that, the picker shows just "Default input." After the first recording, it fills in the real names.
- If the saved input is gone (e.g. the interface is unplugged), fall back to the default input.
Learner decision (added during spec, a change from the PRD's no-setup idea): see **Decisions and Open Issues**.

### Audio Listener (`audio.js`)
Opens the chosen input with `getUserMedia`, connects it to a Web Audio `AnalyserNode`, and about 60 times a second hands a slice of sound to Pitchy. It also measures volume (how loud the slice is) to help spot new notes. It stops everything cleanly when you tap Stop.
PRD ref: `prd.md > Starting a Riff`, `prd.md > Live Note-to-Tab`.

### Note Detector (`notes.js`)
Turns Pitchy's results into a list of notes:
- **Ignore unclear sound:** only accept readings with clarity ≥ about 0.9 and volume above a small threshold (both tunable numbers at the top of the file).
- **Frequency → note:** convert to the nearest note number, e.g. A2 = 110 Hz.
- **New note or the same one?** A new note starts when a clear pitch appears after quiet, when the pitch changes to a different note and stays for a few readings, or when the volume jumps sharply (picking the same note again). A held note stays one note.
- Only notes in guitar range (low E ≈ 82 Hz up to about the 22nd fret on the high E) are accepted.
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
Draws a saved riff's tab with the same drawing code as Recording, plus a back button.
PRD ref: `prd.md > Latest Riffs List` (tap to view).

### "Can't Hear Your Guitar" Message
Shown on the Recording screen when:
- mic permission is denied or the input fails to open, or
- no clear note is detected within about 5 seconds of starting.

It disappears as soon as a note is caught.
PRD ref: `prd.md > States and Boundaries`.

### Tuner *(added during the build)*
A screen opened from the home screen. It uses the same listener (`audio.js`) and frequency → note math (`notes.js`), and shows the nearest note plus how far off it is in cents (hundredths of a semitone), with an "in tune" state within a few cents.
PRD ref: `prd.md > Screens and Layout` (Tuner).

### Confidence Bar (`confidence.js`) *(added during the build)*
Under the tab on the Recording screen (live, updated 4 times a second) and in the Riff View (saved with the riff): a bar from 0 to 100% plus a one-line hint about the weakest part (e.g. "Lots of background noise", "Guitar may be out of tune. Try the tuner").
It combines four things Riff Boi can measure about the *sound*, each from 0 (bad) to 1 (good): **tone** (Pitchy's clarity), **tuning** (cents off, like the tuner), **background noise** (the quiet moments vs the notes) and **steadiness** (how often a note's first readings were really that note). Notes Riff Boi had to correct count against it. It can't know whether a string guess is right.
PRD ref: `prd.md > What We're Building` (confidence bar).

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
- `confidence` is how sure Riff Boi was about the riff (the score and each part from 0 to 1, rounded to 2 decimals) plus the hint, or `null` if there was nothing to judge. Riffs saved before the confidence bar don't have it.

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
- **GitHub + GitHub Pages:** a free account. Turn on Pages in the repo settings, deploying from the main branch, and the site goes live at `https://<username>.github.io/<repo>/`. No keys.
- **No API keys or secrets anywhere** in this project.

## Important Failure Modes
- **Mic permission denied / input won't open** → the "Can't hear your guitar" message on the Recording screen.
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
- **No rhythm in the tab**: note order only. Note times are saved so rhythm could be added later.

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
