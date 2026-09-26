# Riff Boi

**"I play a riff and the tabs just show up."**

Riff Boi listens to your guitar and writes the tab live, while you play. It's made for catching the riffs you find while improvising, so you don't have to stop and write them down by hand.

Built for [Beginner's Paradise – FirstCommit](https://firstcommit.devpost.com/) (2026).

## What it does

- **Live tab:** play single notes and each one appears on a six-line tab as you play.
- **Saves your riffs:** click Stop and the riff goes to your Latest Riffs list. It's still there when you come back.
- **Confidence bar:** shows how sure Riff Boi is about the tab, with a hint about what to fix (like background noise or an out-of-tune guitar).
- **Built-in tuner:** tune up before you play, so notes don't flip between two pitches.

## Run it on your computer

You need:
- **Chrome** (recommended) or another modern browser
- **Python 3**, for a tiny local web server (already on most Macs)
- a **microphone**, or an audio interface with your guitar plugged in
- an internet connection the first time the page loads (it downloads the pitch-detection library)

Steps:

1. Get the code:
   ```
   git clone https://github.com/KoderNinja/riff-boi.git
   cd riff-boi
   ```
   Or on GitHub, click **Code → Download ZIP**, unzip it, and open a terminal in that folder.
2. Start the local server:
   ```
   python3 -m http.server 8000
   ```
   On Windows, use `py -m http.server 8000` if `python3` isn't found.
3. Open **http://localhost:8000** in Chrome.
4. Click **New Riff**, allow the microphone, and play some single notes. Click **Stop** to save the riff.

Why a server? Browsers don't allow the microphone or JavaScript modules on a page opened straight from a file (`file://`), but they do on `localhost`.

No guitar nearby? A piano or keyboard app playing single notes should work too.

## How it works

1. The browser's **Web Audio API** listens to the mic 60 times a second.
2. **[Pitchy](https://github.com/ianprime0509/pitchy)** finds the pitch of each slice of sound, and how clear it is.
3. `js/notes.js` turns pitches into notes and decides when a *new* note starts (a pick, a pitch change, a hammer-on), while ignoring harmonics and background noise.
4. `js/tab.js` picks a string and fret for each note. The sound can't tell which string you played, so it picks the spot that needs the least hand movement.
5. `js/confidence.js` scores how clear, in tune, quiet and steady the notes were.
6. `js/storage.js` saves riffs in the browser's localStorage. No accounts and no server.

More detail: [`devpost/spec.md`](devpost/spec.md).

## Tech used

- HTML, CSS and JavaScript (ES modules, no framework)
- Web Audio API and `getUserMedia` (microphone input)
- [Pitchy](https://github.com/ianprime0509/pitchy) 4.1.0 (pitch detection), loaded from the jsDelivr CDN
- localStorage (saving riffs)
- Google Fonts: UnifrakturCook
- Node.js, for the test tools only

## Testing

With Node.js 18 or newer:

```
node tools/check.mjs    # 59 logic checks for notes, tab and confidence (no guitar needed)
node tools/score.mjs    # scoreboard on my own labeled guitar recordings
```

On my labeled recordings, Riff Boi gets **110 of 115 notes (96%)** and **83 of 83 strings** right.

## Limits

- Single notes only: chords and power chords aren't detected yet.
- Standard tuning only.
- The string and fret are a best guess, since the sound alone can't tell which string you played.
- A very soft first note can be missed.

## How it was made

The planning docs and my learning log are in [`devpost/`](devpost/): the scope, product requirements, technical spec, build checklist, and what I learned along the way.

## AI use

<!-- Colton: replace this with your own words: what Claude Code helped with, and what you decided and did yourself. -->
*Coming soon, in my own words.*

---

Made by [KoderNinja](https://github.com/KoderNinja).
