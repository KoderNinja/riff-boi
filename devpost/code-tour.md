---
doc: code-tour
---

# Code tour

A plain-words walk through Riff Boi's code, in the order a note travels through it. It's for explaining my own project in the demo video. The numbers you can change live at the top of each file.

## The path of one note

1. You tap **New Riff**. `app.js` shows the Recording screen and asks `audio.js` to start listening.
2. `audio.js` opens the mic (or the audio interface). 60 times a second it takes the newest slice of sound (2048 samples, about 1/20 of a second) and asks Pitchy what pitch it is. Pitchy answers with a frequency in Hz and a clarity from 0 to 1 (how sure it is). `audio.js` also measures how loud the slice is.
3. `app.js` hands each reading to the note tracker in `notes.js`. The tracker decides whether a new note just started, whether the last note was really an octave lower, or whether it's being bent.
4. The riff so far goes through `cleanUpRiff` in `notes.js` (drops ghost notes and pitch glitches), then `placeNotes` in `tab.js` (picks a string and fret for every note).
5. `rhythm.js` turns each note's start time into beats and a note value at your tempo, and `tabsvg.js` draws the tab as a picture. The newest note is red.
6. You tap **Stop**. `confidence.js` scores how sure Riff Boi is, and `storage.js` saves the riff in the browser.

## The page: `index.html`, `css/style.css`, `manifest.webmanifest`

- All 5 screens (Home, Recording, Tuner, Saving, Riff View) are `<section>`s in one page. `app.js` shows one at a time by hiding the others.
- The colors are set once at the top of `style.css` (like `--red`) and used everywhere. The angled corners are `clip-path`, which cuts the corners off a box. The grain is a tiny SVG noise pattern repeated behind everything. It's built for phones first: one column, at most 480px wide.
- `manifest.webmanifest` and the `icons/` folder make "Add to Home Screen" open Riff Boi full-screen, with the blackletter R.

## `js/app.js`: the conductor

It wires up the buttons and switches screens. The important part is `handleReading`, which runs 60 times a second while you record:
- It saves the volume (for the confidence bar's background noise) and updates the REC timer.
- It feeds the reading to the note tracker, and adds, fixes or bends the last note depending on the answer.
- It redraws the tab only when something changed, not 60 times a second.
- After 5 seconds (300 readings) with no notes, it shows "Can't hear your guitar".
- It keeps track of when the last note's own pitch was last heard (`stillRinging`), so on Stop the last note ends there, not when you tapped Stop.

It also handles the tempo (40 to 240 BPM), the Auto switch, the time signature, the Rhythm switch and the input picker, all remembered between visits. On Stop, with Auto on, it asks `detectTempo` for the tempo and saves it with the riff. On a saved riff, typing a new tempo saves it and redraws the tab. With `?debug` in the address, it records every raw reading so you can save them as a file, and shows the mic's numbers on screen.

## `js/audio.js`: the ears

- `openInput` opens your input with the phone-call clean-up turned off (echo cancellation, noise suppression and auto volume). Those are made for voices and would wreck a guitar's sound. If your interface is unplugged, it opens the default input instead.
- `startListening` creates the browser's sound system (the `AudioContext`) right inside your tap, because browsers only let sound start from something you did. Then it opens the mic, loads Pitchy from the internet, connects mic → analyser, and starts a timer at 60 readings a second. iPhones often start the sound system paused anyway, so it asks it to start in the tap, again once everything is connected, and every time the phone pauses it.
- Why a fixed timer? `notes.js` counts readings ("hold for 3 readings"), so readings have to come at a steady rate on any phone or screen.
- The `session` number: if you tap Stop while the mic permission popup is still up, the late start knows to give up and let the mic go.
- The volume is the root mean square (RMS) of the slice: square every sample, average them, take the square root.

## `js/notes.js`: the brain

It turns readings into notes.

**One reading** (`readNote`): readings with a clarity under 0.8 or a volume under 0.01 are thrown away. The frequency becomes a note number: A4 = 440 Hz = MIDI 69, and each semitone up multiplies the frequency by the 12th root of 2. Anything outside the guitar's range (low E to the 22nd fret on the high e) is thrown away too.

**The note tracker** (`createNoteTracker`) follows the note's *name* (like F#) and works out the octave separately. With distortion, Pitchy often hears the octave above for a moment, and a guitar note's real pitch is its lowest one. A new note starts when:
- a note name is heard for 3 readings after quiet,
- the name changes and holds: 3 readings if you picked, 4 if you didn't (a hammer-on or pull-off),
- or you pick the same note again: the volume jumps (1.8 times louder than just before) to at least 75% of the note's loudest moment, and the pitch then holds for 7 readings.

It also says no to a few things:
- an unpicked jump that's exactly a harmonic of the ringing note (a fifth up, in any octave, or two octaves and a major third),
- and if the lower octave shows up twice right after a note starts, the note was a harmonic, so it gets fixed an octave down.

**Bends** (`followBend`): it follows the pitch with decimals, measured from the note's own pitch (the middle of its first 3 clear readings). A bend glides smoothly through the pitches in between. A hammer-on or slide jumps. Once the pitch settles (3 readings within 0.15 of a semitone), a glide that lands on a whole semitone is written `7b9`, a glide back is `7b9r7`, and a glide *down* from the picked pitch is a pre-bend, `7pb9r7`.

**The whole riff** (`cleanUpRiff`): a note much quieter than your typical note (under 35%) is noise, and a note that leaps 10+ semitones away from both neighbours gets moved back between them when one of Pitchy's typical mistakes explains it.

**Where the last note ends** (`stillRinging`): as long as its own pitch can still be heard, at least a little clearly, 2 readings in a row. Amp hiss can be loud, but it has no pitch.

## `js/tab.js`: the hand

The sound says which note, not which string. The same note can be played in up to 5 places.
- `positionsFor` lists every string and fret for a note (standard tuning, frets 0 to 22).
- The position rule imagines your hand covering 4 frets. Moving the hand costs 2 per fret, jumping across strings costs 1 per string, and walking along one string a fret at a time costs 0.5. The cheapest spot wins, and on a tie, the thicker string.
- `placeNotes` tries every place the first note could be, with every finger, and keeps the version of the whole riff with the least hand movement. That's how a pentatonic box at the 6th fret stays at the 6th fret.
- `tabToken` writes a note as tab text: `7`, `7b9`, `7b9r7` or `7pb9r7`.

## `js/rhythm.js` and `js/tabsvg.js`: the page of tab

- `rhythmOf` snaps each note's start to the nearest sixteenth note at your tempo. A note lasts until the next one starts, and it gets the longest standard value that fits (whole, dotted half, half, dotted quarter, quarter, dotted eighth, eighth, sixteenth).
- `meterOf` turns a time signature like "7/8" into its bar length in beats (the tempo always counts quarter notes, so 7/8 is 3½) and its beam groups (2+2+3). `barOf` says which bar a beat is in, and `groupOf` which beam group.
- `detectTempo` works out the tempo from when the notes started (Auto). It finds the longest steady pulse that every gap between notes fits, lets 1 note in 8 be a bit off, then picks the note value that puts the tempo from 80 up to 160 BPM. With under 4 notes or no steady beat, it says it can't tell (`null`).
- `tabSvg` draws it all as SVG, which is shapes written as text, so it stays sharp at any size: six string lines, the fret numbers on small dark patches, "TAB" and the time signature, bar lines with measure numbers, the tempo, bends as arrows labelled ½, full or 1½, and the rhythm underneath (stems, beams, flags and dots). With rhythm off, the notes are just evenly spaced.

## `js/confidence.js`: the honesty meter

It scores 4 things about the *sound*, each from 0 (bad) to 1 (good):
- **tone**: how clear Pitchy found each note (clarity 0.8 is bad, 0.97 is good),
- **tuning**: how far off each note was (35 cents is bad, 10 is good),
- **noise**: how much louder the notes are than the quiet moments (12 dB is bad, 30 dB is good),
- **steadiness**: how many of a note's first readings really were that note (20% is bad, 75% is good).

They're mixed 35% tone, 25% steadiness, 20% tuning, 20% noise. If Riff Boi had to correct notes, the score drops, by up to 30% if it corrected every one. The hint names the weakest part if it's under 70%. It can't know if a string guess is right.

## `js/editor.js`: writing a tab by hand

New Tab lets you write a tab note by note: a string, a fret and a note value. `writtenRiff` turns that into the same kind of riff Riff Boi saves when it hears you (each note starts where the one before ended, in seconds at your tempo), so drawing, saving and the Latest Riffs list all just work. `retime` changes a written tab's tempo but keeps its note values. `app.js` has the buttons: the string and note value rows, the fret box, Add note, Undo and Save.

## `js/playback.js`: hearing a tab

Play plays a tab back. `playbackPlan` works out when each note starts and how long it lasts, following the tab (its beats and note values at the riff's tempo). The sound is the Karplus-Strong trick (`pluckSamples`): a burst of noise, then each new sample is the average of the two from one loop back, so it smooths into a tone that fades like a real string. The loop's length sets the pitch, and `loopFor` speeds it up or slows it down a tiny bit so every note is exactly in tune. Bends glide the speed up and down (`pitchPoints`). Timers turn each note red as it's heard.

## `js/storage.js`: the notebook

Everything is saved in the browser's localStorage under 3 names: `riffboi.riffs` (the riffs), `riffboi.settings` (tempo and rhythm) and `riffboi.inputDeviceId` (your input). A riff keeps only what's needed to draw it again: each note's pitch, string, fret, time and bend, plus the confidence, the tempo, when the last note ended, whether rhythm was on, the time signature and whether the tempo was worked out. `riffTiming` reads those back, so a saved riff is always drawn the way it was recorded, `updateRiff` saves a change, like a tempo you typed or a new name, and `deleteRiff` removes a riff. Every save is wrapped in `try`, because some private windows block storage.

## `tools/`: the tests

- `check.mjs`: 147 checks with made-up readings, no guitar needed (plus two real recordings for where the last note ends). Run it after every change.
- `score.mjs`: the scoreboard. It replays my 8 real recordings and compares them to what I really played (the `.txt` answer files): 110 of 115 notes, and 83 of 83 on the right string.
- `replay.mjs`: replays one `?debug` recording through the current code, to compare before and after a change.

## Numbers worth knowing

| What | Number | Where |
|---|---|---|
| Readings per second | 60 | `audio.js` |
| Sound per reading | 2048 samples (about 1/20 s) | `audio.js` |
| Clear enough to be a note | clarity 0.8 (the tuner wants 0.9) | `notes.js` |
| Loud enough to be a note | volume 0.01 | `notes.js` |
| Readings to believe a new note | 3 (4 without a pick) | `notes.js` |
| A pick | 1.8 times louder than just before | `notes.js` |
| Ghost note | under 35% of your typical note | `notes.js` |
| Bend | moves 0.3, settles within 0.15, up to 3 semitones | `notes.js` |
| Hand box | 4 frets | `tab.js` |
| "Can't hear your guitar" | 5 seconds with no note | `app.js` |
| Tempo | 40 to 240 BPM, default 120 | `app.js` |
| Auto tempo guess | 80 up to 160 BPM when it can, needs 4 notes | `rhythm.js` |

## Check yourself

1. **Why does Riff Boi need a local server (or https) instead of double-clicking `index.html`?** Browsers block the mic and JavaScript modules on a page opened from a file, and phones only allow the mic on https.
2. **Why follow the note's name before its octave?** Distortion makes Pitchy hear the octave above for a moment, and a guitar note's real pitch is its lowest.
3. **How does Riff Boi tell a bend from a hammer-on?** A bend glides through the pitches in between. A hammer-on jumps.
4. **Why can't it know which string you played?** The same note can be played in several places, and they sound almost the same, so it picks the spot that needs the least hand movement.
5. **Why did my iPhone hear nothing?** It started the sound system paused, so Pitchy only got silence. Riff Boi now asks it to start.
6. **What does the confidence bar judge, and what can't it?** How clear, in tune, quiet and steady the sound was. Not whether the strings are right.
